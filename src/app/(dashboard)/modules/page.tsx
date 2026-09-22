"use client";

import { useMemo, useState } from "react";
import { LayoutGrid, List, Search } from "lucide-react";
import { ModuleCard } from "@/components/modules/module-card";
import { PageHeader } from "@/components/layout/page-header";
import { modules } from "@/data/mock";
import { useMaterialsStore } from "@/lib/materials-store";
import { enrichModules } from "@/lib/module-stats";
import { useTopicProgress } from "@/lib/topic-progress-store";
import { cn } from "@/lib/utils";

type CategoryFilter = "all" | "fundamentals" | "core" | "elective";

export default function ModulesPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [view, setView] = useState<"grid" | "list">("grid");
  const { published } = useMaterialsStore();
  const { topics } = useTopicProgress();

  const enriched = useMemo(
    () => enrichModules(modules, published, topics),
    [published, topics],
  );

  const filtered = useMemo(() => {
    return enriched.filter((m) => {
      const matchesQuery =
        !query ||
        m.name.toLowerCase().includes(query.toLowerCase()) ||
        m.code.toLowerCase().includes(query.toLowerCase());
      const matchesCategory = category === "all" || m.category === category;
      return matchesQuery && matchesCategory;
    });
  }, [query, category, enriched]);

  const totalCredits = filtered.reduce((sum, m) => sum + (m.credits || 0), 0);

  return (
    <div>
      <PageHeader
        title="Modules"
        description="Year 3 · Semester 1 (Semester V) — progress updates as you complete topics and staff upload notes."
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search modules..."
            className="focus-ring h-10 w-full rounded-[10px] border border-border bg-card pl-10 pr-3 text-sm outline-none"
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as CategoryFilter)}
          className="focus-ring h-10 rounded-[10px] border border-border bg-card px-3 text-sm"
        >
          <option value="all">All categories</option>
          <option value="fundamentals">Fundamentals</option>
          <option value="core">Core</option>
          <option value="elective">Elective</option>
        </select>
        <div className="inline-flex rounded-[10px] border border-border bg-card p-0.5">
          <button
            type="button"
            onClick={() => setView("grid")}
            className={cn(
              "rounded-lg p-1.5",
              view === "grid" ? "btn-gradient" : "text-muted-foreground",
            )}
            aria-label="Grid view"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setView("list")}
            className={cn(
              "rounded-lg p-1.5",
              view === "list" ? "btn-gradient" : "text-muted-foreground",
            )}
            aria-label="List view"
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      <p className="mb-4 text-sm text-muted-foreground">
        {filtered.length} modules · {totalCredits} credits
      </p>

      {view === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((module) => (
            <ModuleCard key={module.id} module={module} />
          ))}
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((module) => (
            <ModuleCard key={module.id} module={module} compact />
          ))}
        </div>
      )}
    </div>
  );
}
