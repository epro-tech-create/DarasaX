"use client";

import { useMemo, useState } from "react";
import { LayoutGrid, List, Search } from "lucide-react";
import { ModuleCard } from "@/components/modules/module-card";
import { PageHeader } from "@/components/layout/page-header";
import { modules } from "@/data/mock";
import { cn } from "@/lib/utils";

type CategoryFilter = "all" | "fundamentals" | "core" | "elective";

export default function ModulesPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [view, setView] = useState<"grid" | "list">("grid");

  const filtered = useMemo(() => {
    return modules.filter((m) => {
      const matchesQuery =
        !query ||
        m.name.toLowerCase().includes(query.toLowerCase()) ||
        m.code.toLowerCase().includes(query.toLowerCase());
      const matchesCategory =
        category === "all" || m.category === category;
      return matchesQuery && matchesCategory;
    });
  }, [query, category]);

  const totalCredits = filtered.reduce((sum, m) => sum + (m.credits || 0), 0);

  return (
    <div>
      <PageHeader
        title="Modules"
        description="Year 3 · Semester 1 (Semester V) — DIT prospectus 2025/2026."
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search modules..."
            className="focus-ring h-9 w-full rounded-[10px] border border-border bg-card pl-10 pr-3 text-[12px] outline-none"
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as CategoryFilter)}
          className="focus-ring h-9 rounded-[10px] border border-border bg-card px-2.5 text-[12px]"
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

      <p className="mb-3 text-[11px] text-muted-foreground">
        {filtered.length} modules · {totalCredits} credits
      </p>

      <div
        className={cn(
          "grid gap-3",
          view === "grid" ? "gap-4 sm:grid-cols-2 xl:grid-cols-3" : "grid-cols-1",
        )}
      >
        {filtered.map((module) => (
          <ModuleCard
            key={module.id}
            module={module}
            compact={view === "list"}
          />
        ))}
      </div>
    </div>
  );
}
