"use client";

import { useMemo, useState } from "react";
import { Archive, Download, Eye, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StaffSection } from "@/components/staff/staff-ui";
import { getModule } from "@/data/mock";
import {
  downloadMaterial,
  useMaterialsStore,
  viewMaterial,
} from "@/lib/materials-store";
import type { MaterialUpload } from "@/types";

export function PastPapersBrowser({
  title = "Published past papers",
  description = "Only papers uploaded here. Students see the same list.",
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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return staffPapers;
    return staffPapers.filter((item) => {
      const module = item.moduleId ? getModule(item.moduleId) : null;
      return `${item.title} ${module?.name ?? ""} ${module?.code ?? ""} ${item.uploadedBy}`
        .toLowerCase()
        .includes(q);
    });
  }, [staffPapers, query]);

  async function onView(item: MaterialUpload) {
    setBusyId(item.id);
    try {
      await viewMaterial(item);
    } finally {
      setBusyId(null);
    }
  }

  async function onDownload(item: MaterialUpload) {
    setBusyId(item.id);
    try {
      await downloadMaterial(item);
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
            ? `${filtered.length} paper${filtered.length === 1 ? "" : "s"} · ${description}`
            : "Loading…"
        }
      >
        <div className="space-y-2">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <Archive className="h-8 w-8 text-muted-foreground/50" />
              <p className="text-[12px] text-muted-foreground">
                No past papers yet. Upload one from the Upload page.
              </p>
            </div>
          ) : null}
          {filtered.map((item) => {
            const module = item.moduleId ? getModule(item.moduleId) : null;
            const year = new Date(item.createdAt).getFullYear();
            const busy = busyId === item.id;
            return (
              <div
                key={item.id}
                className="flex flex-col gap-3 rounded-xl border border-border/70 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold">{item.title}</p>
                  <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                    {module ? `${module.code} · ${module.name}` : "No module"} ·{" "}
                    {item.uploadedBy} · {item.size}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge>{year}</Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    type="button"
                    disabled={busy}
                    onClick={() => void onView(item)}
                  >
                    <Eye className="h-3.5 w-3.5" />
                    View
                  </Button>
                  <Button
                    size="sm"
                    type="button"
                    disabled={busy}
                    onClick={() => void onDownload(item)}
                  >
                    <Download className="h-3.5 w-3.5" />
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
