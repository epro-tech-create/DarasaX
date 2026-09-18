"use client";

import { useCallback, useEffect, useState } from "react";
import { materialUploads as seedUploads } from "@/data/staff-mock";
import {
  deleteMaterialFile,
  formatFileSize,
  getMaterialFile,
  saveMaterialFile,
} from "@/lib/material-files";
import type { MaterialUpload, UploadKind, ClassStreamId, StaffRole } from "@/types";

const STORAGE_KEY = "darasax-materials-v2";

const seedWithFiles: MaterialUpload[] = seedUploads.map((item, index) => {
  const defaults = [
    "/past-papers/pp-1.pdf",
    "/past-papers/pp-2.pdf",
    "/assignments/schema-brief.pdf",
    "/assignments/presentation-rubric.pdf",
  ];
  const fileUrl = defaults[index % defaults.length];
  return {
    ...item,
    fileUrl,
    fileName: `${item.title.replace(/[^\w\s-]/g, "").slice(0, 40)}.pdf`,
    mimeType: "application/pdf",
  };
});

function readStore(): MaterialUpload[] {
  if (typeof window === "undefined") return seedWithFiles;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // migrate from v1 if present
      const legacy = localStorage.getItem("darasax-materials-v1");
      if (legacy) {
        const parsed = JSON.parse(legacy) as MaterialUpload[];
        if (Array.isArray(parsed)) {
          const migrated = parsed.map((item, index) => ({
            ...item,
            fileUrl:
              item.fileUrl ??
              seedWithFiles[index % seedWithFiles.length]?.fileUrl ??
              "/past-papers/pp-1.pdf",
            fileName: item.fileName ?? `${item.title}.pdf`,
            mimeType: item.mimeType ?? "application/pdf",
          }));
          writeStore(migrated);
          return migrated;
        }
      }
      return seedWithFiles;
    }
    const parsed = JSON.parse(raw) as MaterialUpload[];
    if (!Array.isArray(parsed)) return seedWithFiles;
    return parsed;
  } catch {
    return seedWithFiles;
  }
}

function writeStore(items: MaterialUpload[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("darasax:materials"));
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

export async function resolveMaterialObjectUrl(
  item: MaterialUpload,
): Promise<{ url: string; revoke: boolean; fileName: string; mimeType: string } | null> {
  if (item.fileUrl?.startsWith("http") || item.fileUrl?.startsWith("/")) {
    return {
      url: item.fileUrl,
      revoke: false,
      fileName: item.fileName ?? `${slugify(item.title)}.pdf`,
      mimeType: item.mimeType ?? "application/pdf",
    };
  }
  if (item.fileUrl?.startsWith("blob:") || item.fileUrl?.startsWith("data:")) {
    return {
      url: item.fileUrl,
      revoke: false,
      fileName: item.fileName ?? `${slugify(item.title)}.bin`,
      mimeType: item.mimeType ?? "application/octet-stream",
    };
  }
  const stored = await getMaterialFile(item.id);
  if (stored) {
    const url = URL.createObjectURL(stored.blob);
    return {
      url,
      revoke: true,
      fileName: stored.fileName || item.fileName || `${slugify(item.title)}.bin`,
      mimeType: stored.mimeType || item.mimeType || stored.blob.type,
    };
  }
  // Fallback preview document for items without an attached blob
  const content = [
    `# ${item.title}`,
    "",
    `Type: ${item.kind}`,
    `Uploaded by: ${item.uploadedBy}`,
    `Size: ${item.size}`,
    "",
    "This is a library placeholder. Re-upload the original file to enable full preview.",
  ].join("\n");
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  return {
    url: URL.createObjectURL(blob),
    revoke: true,
    fileName: `${slugify(item.title) || item.id}.txt`,
    mimeType: "text/plain",
  };
}

export async function viewMaterial(item: MaterialUpload) {
  const resolved = await resolveMaterialObjectUrl(item);
  if (!resolved) return;
  window.open(resolved.url, "_blank", "noopener,noreferrer");
  if (resolved.revoke) {
    window.setTimeout(() => URL.revokeObjectURL(resolved.url), 60_000);
  }
}

export async function downloadMaterial(item: MaterialUpload) {
  const resolved = await resolveMaterialObjectUrl(item);
  if (!resolved) return;
  const anchor = document.createElement("a");
  anchor.href = resolved.url;
  anchor.download = resolved.fileName;
  anchor.rel = "noopener noreferrer";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  if (resolved.revoke) {
    window.setTimeout(() => URL.revokeObjectURL(resolved.url), 2_000);
  }
}

export type PublishMaterialInput = {
  title: string;
  kind: UploadKind;
  moduleId?: string;
  streamId?: ClassStreamId | "all";
  uploadedBy: string;
  role: StaffRole;
  file: File;
};

export type UpdateMaterialInput = {
  title?: string;
  kind?: UploadKind;
  moduleId?: string;
  streamId?: ClassStreamId | "all" | null;
  status?: MaterialUpload["status"];
  file?: File | null;
};

export function useMaterialsStore() {
  const [items, setItems] = useState<MaterialUpload[]>(seedWithFiles);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setItems(readStore());
    setReady(true);
    const sync = () => setItems(readStore());
    window.addEventListener("storage", sync);
    window.addEventListener("darasax:materials", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("darasax:materials", sync);
    };
  }, []);

  const publish = useCallback(async (input: PublishMaterialInput) => {
    const id = `up-${Date.now()}`;
    await saveMaterialFile(id, input.file, input.file.name, input.file.type || "application/octet-stream");
    const entry: MaterialUpload = {
      id,
      title: input.title.trim(),
      kind: input.kind,
      moduleId: input.moduleId,
      streamId: input.streamId === "all" ? undefined : input.streamId,
      status: "published",
      uploadedBy: input.uploadedBy,
      role: input.role,
      size: formatFileSize(input.file.size),
      createdAt: new Date().toISOString(),
      downloads: 0,
      fileName: input.file.name,
      mimeType: input.file.type || "application/octet-stream",
    };
    const current = readStore();
    const next = [entry, ...current];
    writeStore(next);
    setItems(next);
    return entry;
  }, []);

  const updateItem = useCallback(async (id: string, patch: UpdateMaterialInput) => {
    const current = readStore();
    const existing = current.find((i) => i.id === id);
    if (!existing) return undefined;

    let fileName = existing.fileName;
    let mimeType = existing.mimeType;
    let size = existing.size;
    let fileUrl = existing.fileUrl;

    if (patch.file) {
      await saveMaterialFile(
        id,
        patch.file,
        patch.file.name,
        patch.file.type || "application/octet-stream",
      );
      fileName = patch.file.name;
      mimeType = patch.file.type || "application/octet-stream";
      size = formatFileSize(patch.file.size);
      fileUrl = undefined;
    }

    const updated: MaterialUpload = {
      ...existing,
      title: patch.title?.trim() ?? existing.title,
      kind: patch.kind ?? existing.kind,
      moduleId: patch.moduleId ?? existing.moduleId,
      status: patch.status ?? existing.status,
      streamId:
        patch.streamId === undefined
          ? existing.streamId
          : patch.streamId === "all" || patch.streamId === null
            ? undefined
            : patch.streamId,
      fileName,
      mimeType,
      size,
      fileUrl,
    };

    const next = current.map((i) => (i.id === id ? updated : i));
    writeStore(next);
    setItems(next);
    return updated;
  }, []);

  const deleteItem = useCallback(async (id: string) => {
    const current = readStore();
    const next = current.filter((i) => i.id !== id);
    writeStore(next);
    setItems(next);
    await deleteMaterialFile(id);
  }, []);

  const bumpDownloads = useCallback((id: string) => {
    const current = readStore();
    const next = current.map((i) =>
      i.id === id ? { ...i, downloads: i.downloads + 1 } : i,
    );
    writeStore(next);
    setItems(next);
  }, []);

  const published = items.filter((i) => i.status === "published");

  return {
    items,
    published,
    ready,
    publish,
    updateItem,
    deleteItem,
    bumpDownloads,
  };
}
