"use client";

import { useCallback, useEffect, useState } from "react";
import { materialUploads as seedUploads } from "@/data/staff-mock";
import type { MaterialUpload, UploadKind, ClassStreamId, StaffRole } from "@/types";

const STORAGE_KEY = "darasax-materials-v1";

function readStore(): MaterialUpload[] {
  if (typeof window === "undefined") return seedUploads;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return seedUploads;
    const parsed = JSON.parse(raw) as MaterialUpload[];
    if (!Array.isArray(parsed)) return seedUploads;
    return parsed;
  } catch {
    return seedUploads;
  }
}

function writeStore(items: MaterialUpload[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("darasax:materials"));
}

export function useMaterialsStore() {
  const [items, setItems] = useState<MaterialUpload[]>(seedUploads);
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

  const publish = useCallback(
    (input: {
      title: string;
      kind: UploadKind;
      moduleId?: string;
      streamId?: ClassStreamId | "all";
      uploadedBy: string;
      role: StaffRole;
      size?: string;
    }) => {
      const entry: MaterialUpload = {
        id: `up-${Date.now()}`,
        title: input.title,
        kind: input.kind,
        moduleId: input.moduleId,
        streamId: input.streamId === "all" ? undefined : input.streamId,
        status: "published",
        uploadedBy: input.uploadedBy,
        role: input.role,
        size: input.size ?? "—",
        createdAt: new Date().toISOString(),
        downloads: 0,
      };
      setItems((prev) => {
        const next = [entry, ...prev];
        writeStore(next);
        return next;
      });
      return entry;
    },
    [],
  );

  const published = items.filter((i) => i.status === "published");

  return { items, published, ready, publish };
}
