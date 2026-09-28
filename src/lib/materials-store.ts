"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { MaterialRow } from "@/types/database";
import type { MaterialUpload, UploadKind, ClassStreamId, StaffRole } from "@/types";

const BUCKET = "materials";
const SIGNED_URL_SECONDS = 60 * 60;

function isConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function toUpload(row: MaterialRow): MaterialUpload {
  return {
    id: row.id,
    title: row.title,
    kind: row.kind as UploadKind,
    moduleId: row.module_id ?? undefined,
    streamId: (row.stream_id as ClassStreamId | null) ?? undefined,
    status: row.status as MaterialUpload["status"],
    uploadedBy: row.uploaded_by,
    role: (row.role as StaffRole | null) ?? "admin",
    size: row.size_label ?? (row.size_bytes != null ? formatFileSize(row.size_bytes) : "—"),
    createdAt: row.created_at,
    downloads: row.downloads,
    fileUrl: row.file_url ?? undefined,
    filePath: row.file_path ?? undefined,
    fileName: row.file_name ?? undefined,
    mimeType: row.mime_type ?? undefined,
  };
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

function storagePath(streamId: string | null, id: string, fileName: string) {
  const safe = fileName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
  return `${streamId ?? "all"}/${id}/${safe}`;
}

export async function resolveMaterialObjectUrl(
  item: MaterialUpload,
  options?: { download?: boolean },
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
  try {
    const supabase = createClient();
    let filePath = item.filePath;
    let fileName = item.fileName;
    let mimeType = item.mimeType;

    if (!filePath) {
      const { data, error } = await supabase
        .from("materials")
        .select("file_path,file_name,mime_type")
        .eq("id", item.id)
        .maybeSingle();
      if (error || !data?.file_path) return null;
      filePath = data.file_path;
      fileName ??= data.file_name ?? undefined;
      mimeType ??= data.mime_type ?? undefined;
    }

    const resolvedFileName = fileName ?? `${slugify(item.title)}.bin`;
    const { data: signed, error: signError } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(
        filePath,
        SIGNED_URL_SECONDS,
        options?.download ? { download: resolvedFileName } : undefined,
      );
    if (signError || !signed) return null;
    return {
      url: signed.signedUrl,
      revoke: false,
      fileName: resolvedFileName,
      mimeType: mimeType ?? "application/octet-stream",
    };
  } catch {
    return null;
  }
}

export async function viewMaterial(item: MaterialUpload) {
  const previewWindow = window.open("about:blank", "_blank");
  if (!previewWindow) {
    window.alert("The preview was blocked. Allow pop-ups for DarasaX and try again.");
    return false;
  }

  previewWindow.opener = null;
  try {
    const resolved = await resolveMaterialObjectUrl(item);
    if (!resolved) {
      previewWindow.close();
      window.alert("This file is unavailable. Ask the uploader to attach it again.");
      return false;
    }
    previewWindow.location.replace(resolved.url);
    return true;
  } catch {
    previewWindow.close();
    window.alert("The file could not be opened. Check your connection and try again.");
    return false;
  }
}

export async function downloadMaterial(item: MaterialUpload) {
  const resolved = await resolveMaterialObjectUrl(item, { download: true });
  if (!resolved) {
    window.alert("This file is unavailable. Ask the uploader to attach it again.");
    return false;
  }
  const anchor = document.createElement("a");
  anchor.href = resolved.url;
  anchor.download = resolved.fileName;
  anchor.rel = "noopener noreferrer";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  try {
    const supabase = createClient();
    await supabase.rpc("increment_material_downloads", { mid: item.id });
  } catch {
    // Download counting is best-effort.
  }
  return true;
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
  const [items, setItems] = useState<MaterialUpload[]>([]);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    try {
      if (!isConfigured()) {
        setItems([]);
        return;
      }
      const supabase = createClient();
      const { data, error } = await supabase
        .from("materials")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setItems((data ?? []).map(toUpload));
    } catch {
      // Keep previously loaded items on transient failures.
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const publish = useCallback(async (input: PublishMaterialInput) => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const id = `up-${Date.now()}`;
    const streamId = input.streamId === "all" ? null : (input.streamId ?? null);
    const path = storagePath(streamId, id, input.file.name);

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, input.file, {
        contentType: input.file.type || "application/octet-stream",
        upsert: false,
      });
    if (uploadError) throw uploadError;

    const { data, error } = await supabase
      .from("materials")
      .insert({
        id,
        title: input.title.trim(),
        kind: input.kind,
        module_id: input.moduleId ?? null,
        stream_id: streamId,
        status: "published",
        uploaded_by: input.uploadedBy,
        uploaded_by_id: user?.id ?? null,
        role: input.role,
        file_path: path,
        file_name: input.file.name,
        mime_type: input.file.type || "application/octet-stream",
        size_bytes: input.file.size,
        size_label: formatFileSize(input.file.size),
        downloads: 0,
      })
      .select("*")
      .single();

    if (error) {
      await supabase.storage.from(BUCKET).remove([path]).catch(() => null);
      throw error;
    }
    const entry = toUpload(data);
    setItems((prev) => [entry, ...prev]);
    return entry;
  }, []);

  const updateItem = useCallback(async (id: string, patch: UpdateMaterialInput) => {
    const supabase = createClient();
    const { data: existing, error: fetchError } = await supabase
      .from("materials")
      .select("*")
      .eq("id", id)
      .single();
    if (fetchError) throw fetchError;

    let filePath = existing.file_path;
    let fileName = existing.file_name;
    let mimeType = existing.mime_type;
    let sizeBytes = existing.size_bytes;
    let sizeLabel = existing.size_label;
    let fileUrl = existing.file_url;

    if (patch.file) {
      const streamForPath =
        patch.streamId === undefined
          ? existing.stream_id
          : patch.streamId === "all" || patch.streamId === null
            ? null
            : patch.streamId;
      const nextPath = storagePath(streamForPath, id, patch.file.name);
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(nextPath, patch.file, {
          contentType: patch.file.type || "application/octet-stream",
          upsert: true,
        });
      if (uploadError) throw uploadError;
      if (filePath && filePath !== nextPath) {
        await supabase.storage.from(BUCKET).remove([filePath]).catch(() => null);
      }
      filePath = nextPath;
      fileName = patch.file.name;
      mimeType = patch.file.type || "application/octet-stream";
      sizeBytes = patch.file.size;
      sizeLabel = formatFileSize(patch.file.size);
      fileUrl = null;
    }

    const { data, error } = await supabase
      .from("materials")
      .update({
        title: patch.title?.trim() ?? existing.title,
        kind: patch.kind ?? existing.kind,
        module_id: patch.moduleId ?? existing.module_id,
        status: patch.status ?? existing.status,
        stream_id:
          patch.streamId === undefined
            ? existing.stream_id
            : patch.streamId === "all" || patch.streamId === null
              ? null
              : patch.streamId,
        file_path: filePath,
        file_url: fileUrl,
        file_name: fileName,
        mime_type: mimeType,
        size_bytes: sizeBytes,
        size_label: sizeLabel,
      })
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    const updated = toUpload(data);
    setItems((prev) => prev.map((i) => (i.id === id ? updated : i)));
    return updated;
  }, []);

  const deleteItem = useCallback(async (id: string) => {
    const supabase = createClient();
    const { data: existing } = await supabase
      .from("materials")
      .select("file_path")
      .eq("id", id)
      .maybeSingle();
    const { error } = await supabase.from("materials").delete().eq("id", id);
    if (error) throw error;
    if (existing?.file_path) {
      await supabase.storage.from(BUCKET).remove([existing.file_path]).catch(() => null);
    }
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const bumpDownloads = useCallback((id: string) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, downloads: i.downloads + 1 } : i)),
    );
  }, []);

  const published = items.filter((i) => i.status === "published");

  return {
    items,
    published,
    ready,
    refresh,
    publish,
    updateItem,
    deleteItem,
    bumpDownloads,
  };
}
