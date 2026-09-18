"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StaffSection } from "@/components/staff/staff-ui";
import { getModule } from "@/data/mock";
import { useMaterialsStore } from "@/lib/materials-store";

export default function AdminMaterialsPage() {
  const [query, setQuery] = useState("");
  const { items } = useMaterialsStore();

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const module = item.moduleId ? getModule(item.moduleId) : null;
      const hay = `${item.title} ${module?.name ?? ""} ${item.uploadedBy}`.toLowerCase();
      return !query || hay.includes(query.toLowerCase());
    });
  }, [items, query]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Library"
        description="Published files available to students."
        actions={
          <Button href="/admin/uploads" size="sm">
            Upload
          </Button>
        }
      />

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search library…"
          className="h-10 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-[13px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </div>

      <StaffSection title="Live materials" description={`${filtered.length} items`}>
        <div className="space-y-2">
          {filtered.map((item) => {
            const module = item.moduleId ? getModule(item.moduleId) : null;
            return (
              <div
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/70 px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-[12px] font-semibold">{item.title}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {module?.code ?? "General"} · {item.kind.replace("_", " ")} ·{" "}
                    {item.uploadedBy}
                  </p>
                </div>
                <Badge tone={item.status === "published" ? "success" : "warning"}>
                  {item.status}
                </Badge>
              </div>
            );
          })}
        </div>
      </StaffSection>
    </div>
  );
}
