"use client";

import { useMemo, useState } from "react";
import { Archive, Download, Eye, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StaffSection } from "@/components/staff/staff-ui";
import { getModule, pastPapers } from "@/data/mock";
import {
  downloadMaterial,
  useMaterialsStore,
  viewMaterial,
} from "@/lib/materials-store";
import { downloadPastPaper, viewPastPaper } from "@/lib/download";
import type { MaterialUpload, PastPaper } from "@/types";

export function PastPapersBrowser({
  title = "Published past papers",
  description = "Library catalog plus papers uploaded by Admin or Class Rep.",
}: {
  title?: string;
  description?: string;
}) {
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const { published, ready } = useMaterialsStore();

  const staffPapers = useMemo(
    () => published.filter((u) => u.kind === "past_paper"),
    [published],
  );

  type Row =
    | { source: "upload"; item: MaterialUpload }
    | { source: "library"; item: PastPaper };

  const catalog: Row[] = useMemo(
    () => [
      ...staffPapers.map((item) => ({ source: "upload" as const, item })),
      ...pastPapers.map((item) => ({ source: "library" as const, item })),
    ],
    [staffPapers],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return catalog;
    return catalog.filter((row) => {
      const titleText = row.item.title;
      const module = row.item.moduleId ? getModule(row.item.moduleId) : null;
      const by =
        row.source === "upload" ? row.item.uploadedBy : "Library";
      return `${titleText} ${module?.name ?? ""} ${module?.code ?? ""} ${by}`
        .toLowerCase()
        .includes(q);
    });
  }, [catalog, query]);

  async function onView(row: Row) {
    const id = row.item.id;
    setBusyId(id);
    try {
      if (row.source === "upload") await viewMaterial(row.item);
      else viewPastPaper(row.item);
    } finally {
      setBusyId(null);
    }
  }

  async function onDownload(row: Row) {
    const id = row.item.id;
    setBusyId(id);
    try {
      if (row.source === "upload") await downloadMaterial(row.item);
      else downloadPastPaper(row.item);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search past papers…"
          className="h-10 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-[13px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </div>

      <StaffSection
        title={title}
        description={
          ready
            ? `${filtered.length} papers · ${staffPapers.length} staff uploads · ${description}`
            : "Loading…"
        }
      >
        <div className="space-y-2">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <Archive className="h-8 w-8 text-muted-foreground/50" />
              <p className="text-[12px] text-muted-foreground">No past papers found.</p>
            </div>
          ) : null}
          {filtered.map((row) => {
            const module = row.item.moduleId
              ? getModule(row.item.moduleId)
              : null;
            const year =
              row.source === "upload"
                ? new Date(row.item.createdAt).getFullYear()
                : row.item.year;
            const size = row.item.size;
            const uploadedBy =
              row.source === "upload" ? row.item.uploadedBy : "Library";
            const busy = busyId === row.item.id;
            return (
              <div
                key={`${row.source}-${row.item.id}`}
                className="flex flex-col gap-3 rounded-xl border border-border/70 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate text-[12px] font-semibold">
                    {row.item.title}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {module?.code ?? "General"} · {year} · {size} · {uploadedBy}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {row.source === "upload" ? (
                    <Badge tone="success">New upload</Badge>
                  ) : (
                    <Badge>Library</Badge>
                  )}
                  <Button
                    size="sm"
                    type="button"
                    variant="outline"
                    disabled={busy}
                    onClick={() => onView(row)}
                  >
                    <Eye className="h-3 w-3" />
                    View
                  </Button>
                  <Button
                    size="sm"
                    type="button"
                    variant="outline"
                    disabled={busy}
                    onClick={() => onDownload(row)}
                  >
                    <Download className="h-3 w-3" />
                    Download
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </StaffSection>
    </div>
  );
}
