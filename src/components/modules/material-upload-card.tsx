"use client";

import { useTranslate } from "@/components/providers/language-provider";
import { useState } from "react";
import {
  Download,
  Eye,
  FileText,
  Presentation,
  ScrollText,
} from "lucide-react";
import type { MaterialUpload } from "@/types";
import { MaterialShareButton } from "@/components/modules/material-share-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { downloadMaterial, viewMaterial } from "@/lib/materials-store";
import { formatRelativeTime } from "@/lib/utils";

const kindMeta: Record<
  string,
  { label: string; icon: typeof FileText; tone: "primary" | "cyan" | "default" }
> = {
  notes: { label: "Notes", icon: FileText, tone: "primary" },
  slides: { label: "Slides", icon: Presentation, tone: "cyan" },
  past_paper: { label: "Past paper", icon: ScrollText, tone: "primary" },
  assignment: { label: "Assignment", icon: FileText, tone: "default" },
  announcement: { label: "Announcement", icon: FileText, tone: "default" },
};

export function MaterialUploadCard({ item }: { item: MaterialUpload }) {
  const translateUI = useTranslate();
  const [downloading, setDownloading] = useState(false);
  async function handleDownload() {
    if (downloading) return;
    setDownloading(true);
    try {
      await downloadMaterial(item);
    } finally {
      setDownloading(false);
    }
  }
  const meta = kindMeta[item.kind] ?? kindMeta.notes;
  const Icon = meta.icon;

  return (
    <div className="surface flex flex-col gap-4 rounded-[18px] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <Badge tone={meta.tone}>{translateUI(meta.label)}</Badge>
            <span className="text-xs text-muted-foreground">{translateUI(item.size)}</span>
          </div>
          <h3 className="font-heading text-base font-semibold">{item.title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {translateUI("Uploaded ")}{translateUI(formatRelativeTime(item.createdAt))} · {item.uploadedBy}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          type="button"
          onClick={() => void viewMaterial(item)}
        >
          <Eye className="h-4 w-4" />
          {translateUI("View")}</Button>
        <Button
          size="sm"
          type="button"
          disabled={downloading}
          onClick={() => void handleDownload()}
        >
          <Download className="h-4 w-4" />
          {translateUI(downloading ? "Downloading…" : "Download")}
        </Button>
        {item.status === "published" &&
          ["notes", "slides", "assignment", "past_paper"].includes(
            item.kind,
          ) && <MaterialShareButton materialId={item.id} title={item.title} />}
      </div>
    </div>
  );
}
