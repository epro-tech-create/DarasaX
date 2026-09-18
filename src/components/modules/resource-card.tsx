"use client";

import { Download, Eye, Sparkles, FileText, Presentation, Link2, Video, HelpCircle } from "lucide-react";
import type { Resource } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { downloadResource, getResourceDownloadContent } from "@/lib/download";
import { formatRelativeTime } from "@/lib/utils";

const typeMeta = {
  pdf: { label: "PDF", icon: FileText },
  slides: { label: "Slides", icon: Presentation },
  video: { label: "Video", icon: Video },
  link: { label: "Link", icon: Link2 },
  notes: { label: "Notes", icon: FileText },
  questions: { label: "Questions", icon: HelpCircle },
};

export function ResourceCard({
  resource,
  showPreview = false,
}: {
  resource: Resource;
  showPreview?: boolean;
}) {
  const meta = typeMeta[resource.type];
  const Icon = meta.icon;
  const preview = showPreview ? getResourceDownloadContent(resource) : null;

  return (
    <div className="surface flex flex-col gap-4 rounded-[20px] p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <Badge tone="primary">{meta.label}</Badge>
              <span className="text-xs text-muted-foreground">{resource.size}</span>
            </div>
            <h3 className="font-heading text-base font-semibold">{resource.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Uploaded {formatRelativeTime(resource.uploadedAt)} · {resource.uploader}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {resource.url ? (
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => window.open(resource.url, "_blank", "noopener,noreferrer")}
            >
              <Eye className="h-4 w-4" />
              View
            </Button>
          ) : null}
          <Button
            variant="outline"
            size="sm"
            type="button"
            onClick={() => downloadResource(resource)}
          >
            <Download className="h-4 w-4" />
            Download
          </Button>
          <Button size="sm" href={`/ask?resource=${resource.id}`}>
            <Sparkles className="h-4 w-4" />
            Ask AI
          </Button>
        </div>
      </div>
      {preview ? (
        <div className="rounded-[14px] border border-border bg-muted/40 p-4">
          <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Preview
          </p>
          <pre className="max-h-48 overflow-auto whitespace-pre-wrap font-sans text-[12px] leading-relaxed text-foreground/90">
            {preview.slice(0, 900)}
            {preview.length > 900 ? "…" : ""}
          </pre>
        </div>
      ) : null}
    </div>
  );
}
