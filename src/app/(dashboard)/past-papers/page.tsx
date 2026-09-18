"use client";

import { useMemo, useState } from "react";
import { Archive, Download, Eye, Filter, Search, X } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { getModule, modules, pastPapers } from "@/data/mock";
import { downloadPastPaper, viewPastPaper } from "@/lib/download";
import { cn } from "@/lib/utils";

export default function PastPapersPage() {
  const [query, setQuery] = useState("");
  const [moduleId, setModuleId] = useState("all");
  const [type, setType] = useState("all");
  const [year, setYear] = useState("all");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const years = useMemo(
    () => Array.from(new Set(pastPapers.map((p) => p.year))).sort((a, b) => b - a),
    [],
  );

  const activeFilterCount = [moduleId, type, year].filter((v) => v !== "all").length;

  const filtered = useMemo(() => {
    return pastPapers.filter((p) => {
      const module = getModule(p.moduleId);
      const matchesQuery =
        !query ||
        p.title.toLowerCase().includes(query.toLowerCase()) ||
        module?.name.toLowerCase().includes(query.toLowerCase());
      return (
        matchesQuery &&
        (moduleId === "all" || p.moduleId === moduleId) &&
        (type === "all" || p.type === type) &&
        (year === "all" || String(p.year) === year)
      );
    });
  }, [query, moduleId, type, year]);

  function clearFilters() {
    setModuleId("all");
    setType("all");
    setYear("all");
  }

  return (
    <div>
      <PageHeader
        title="Past Papers"
        description="Find revision materials quickly."
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search papers..."
            className="focus-ring h-11 w-full rounded-[12px] border border-border bg-card pl-10 pr-3 text-sm"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          className={cn(
            "h-11 shrink-0 gap-2",
            filtersOpen && "border-primary text-primary",
          )}
          onClick={() => setFiltersOpen((v) => !v)}
        >
          <Filter className="h-4 w-4" />
          Filters
          {activeFilterCount > 0 ? (
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/15 px-1.5 text-[11px] font-semibold text-primary">
              {activeFilterCount}
            </span>
          ) : null}
        </Button>
      </div>

      {filtersOpen ? (
        <div className="surface mb-5 rounded-[16px] p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="text-[13px] font-medium">Filter papers</p>
            <div className="flex items-center gap-1">
              {activeFilterCount > 0 ? (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-8 text-[12px]"
                  onClick={clearFilters}
                >
                  Clear
                </Button>
              ) : null}
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                className="focus-ring inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Close filters"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="block space-y-1.5">
              <span className="text-[11px] font-medium text-muted-foreground">
                Module
              </span>
              <select
                value={moduleId}
                onChange={(e) => setModuleId(e.target.value)}
                className="focus-ring h-10 w-full rounded-[12px] border border-border bg-card px-3 text-sm"
              >
                <option value="all">All</option>
                {modules.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1.5">
              <span className="text-[11px] font-medium text-muted-foreground">
                Type
              </span>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="focus-ring h-10 w-full rounded-[12px] border border-border bg-card px-3 text-sm"
              >
                <option value="all">All</option>
                <option value="cat">CAT</option>
                <option value="test">Test</option>
                <option value="final">Final</option>
              </select>
            </label>
            <label className="block space-y-1.5">
              <span className="text-[11px] font-medium text-muted-foreground">
                Year
              </span>
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="focus-ring h-10 w-full rounded-[12px] border border-border bg-card px-3 text-sm"
              >
                <option value="all">All</option>
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      ) : null}

      <p className="mb-3 text-[12px] text-muted-foreground">
        {filtered.length} paper{filtered.length === 1 ? "" : "s"}
      </p>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Archive}
          title="No past papers"
          description="Try a different filter or check back after your class rep uploads more."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((paper) => {
            const module = getModule(paper.moduleId);
            return (
              <article
                key={paper.id}
                className="surface flex flex-col rounded-[18px] p-4 transition duration-200 hover:scale-[1.01] hover:border-primary hover:shadow-lg hover:shadow-primary/20 sm:p-5"
              >
                <div className="mb-3 flex flex-wrap gap-1.5">
                  <Badge tone="primary">{paper.type.toUpperCase()}</Badge>
                  <Badge>{paper.year}</Badge>
                  <Badge tone="cyan">PDF</Badge>
                </div>
                <h3 className="font-heading text-[15px] font-semibold tracking-tight">
                  {module?.name}
                </h3>
                <p className="mt-1 line-clamp-2 text-[12px] text-muted-foreground">
                  {paper.title}
                </p>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  {paper.size}
                </p>
                <div className="mt-auto flex flex-wrap gap-2 pt-4">
                  <Button
                    size="sm"
                    variant="outline"
                    type="button"
                    onClick={() => viewPastPaper(paper)}
                  >
                    <Eye className="h-4 w-4" />
                    View
                  </Button>
                  <Button
                    size="sm"
                    type="button"
                    onClick={() => downloadPastPaper(paper)}
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
