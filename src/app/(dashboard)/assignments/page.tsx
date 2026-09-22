"use client";

import { useMemo, useState } from "react";
import { AssignmentCard } from "@/components/assignments/assignment-card";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { getModule, modules } from "@/data/mock";
import { useAssignments } from "@/lib/assignment-progress-store";
import { cn, daysUntil } from "@/lib/utils";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Filter,
  Flame,
  X,
} from "lucide-react";

const tabs = ["Upcoming", "Completed", "All"] as const;

export default function AssignmentsPage() {
  const [tab, setTab] = useState<(typeof tabs)[number]>("Upcoming");
  const [moduleFilter, setModuleFilter] = useState("all");
  const [priority, setPriority] = useState("all");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const { items: assignments } = useAssignments();

  const upcoming = assignments.filter((a) => a.status === "upcoming");
  const dueSoon = upcoming.filter((a) => {
    const d = daysUntil(a.deadline);
    return d >= 0 && d <= 3;
  }).length;
  const highPriority = upcoming.filter((a) => a.priority === "high").length;
  const completed = assignments.filter((a) => a.status === "completed").length;

  const filtered = useMemo(() => {
    return assignments
      .filter((a) => {
        if (tab === "Upcoming") return a.status === "upcoming";
        if (tab === "Completed") return a.status === "completed";
        return true;
      })
      .filter((a) => moduleFilter === "all" || a.moduleId === moduleFilter)
      .filter((a) => priority === "all" || a.priority === priority)
      .sort(
        (a, b) =>
          new Date(a.deadline).getTime() - new Date(b.deadline).getTime(),
      );
  }, [tab, moduleFilter, priority, assignments]);

  const activeFilterCount = [moduleFilter, priority].filter(
    (v) => v !== "all",
  ).length;

  function clearFilters() {
    setModuleFilter("all");
    setPriority("all");
  }

  return (
    <div>
      <PageHeader
        title="Assignments"
        description="Stay on top of deadlines, CATs, and coursework."
      />

      <div className="mb-4 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <div className="surface rounded-[14px] p-3">
          <p className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
            <ClipboardList className="h-3 w-3 text-primary" />
            Upcoming
          </p>
          <p className="mt-0.5 font-heading text-[15px] font-semibold">
            {upcoming.length}
          </p>
        </div>
        <div className="surface rounded-[14px] p-3">
          <p className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
            <AlertTriangle className="h-3 w-3 text-warning" />
            Due soon
          </p>
          <p className="mt-0.5 font-heading text-[15px] font-semibold text-warning">
            {dueSoon}
          </p>
        </div>
        <div className="surface rounded-[14px] p-3">
          <p className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
            <Flame className="h-3 w-3 text-danger" />
            High priority
          </p>
          <p className="mt-0.5 font-heading text-[15px] font-semibold text-danger">
            {highPriority}
          </p>
        </div>
        <div className="surface rounded-[14px] p-3">
          <p className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
            <CheckCircle2 className="h-3 w-3 text-success" />
            Completed
          </p>
          <p className="mt-0.5 font-heading text-[15px] font-semibold text-success">
            {completed}
          </p>
        </div>
      </div>

      <div className="mb-3 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1.5 overflow-x-auto pb-0.5">
          {tabs.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setTab(item)}
              className={cn(
                "shrink-0 rounded-full px-3 py-1.5 text-[11px] font-medium transition",
                tab === item
                  ? "btn-gradient shadow-sm shadow-primary/20"
                  : "bg-muted text-muted-foreground hover:text-foreground",
              )}
            >
              {item}
            </button>
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn(
            "h-8 shrink-0 gap-1.5 self-start sm:self-auto",
            filtersOpen && "border-primary text-primary",
          )}
          onClick={() => setFiltersOpen((v) => !v)}
        >
          <Filter className="h-3.5 w-3.5" />
          Filters
          {activeFilterCount > 0 ? (
            <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary/15 px-1 text-[10px] font-semibold text-primary">
              {activeFilterCount}
            </span>
          ) : null}
        </Button>
      </div>

      {filtersOpen ? (
        <div className="surface mb-4 rounded-[14px] p-3.5">
          <div className="mb-2.5 flex items-center justify-between gap-2">
            <p className="text-[12px] font-medium">Filter assignments</p>
            <div className="flex items-center gap-1">
              {activeFilterCount > 0 ? (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-7 text-[11px]"
                  onClick={clearFilters}
                >
                  Clear
                </Button>
              ) : null}
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                className="focus-ring inline-flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
                aria-label="Close filters"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          <div className="grid gap-2.5 sm:grid-cols-2">
            <label className="block space-y-1">
              <span className="text-[10px] font-medium text-muted-foreground">
                Module
              </span>
              <select
                value={moduleFilter}
                onChange={(e) => setModuleFilter(e.target.value)}
                className="focus-ring h-9 w-full rounded-[10px] border border-border bg-card px-2.5 text-[12px]"
              >
                <option value="all">All</option>
                {modules.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1">
              <span className="text-[10px] font-medium text-muted-foreground">
                Priority
              </span>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="focus-ring h-9 w-full rounded-[10px] border border-border bg-card px-2.5 text-[12px]"
              >
                <option value="all">All</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </label>
          </div>
        </div>
      ) : null}

      <p className="mb-2.5 text-[11px] text-muted-foreground">
        {filtered.length} assignment{filtered.length === 1 ? "" : "s"}
      </p>

      {filtered.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title={
            tab === "Upcoming"
              ? "Nothing upcoming"
              : tab === "Completed"
                ? "No completed work yet"
                : "No assignments yet"
          }
          description={
            tab === "Upcoming"
              ? "Mark work complete from an assignment page and it leaves Upcoming."
              : "When new coursework is posted, it will show up here."
          }
        />
      ) : (
        <div className="space-y-2.5">
          {filtered.map((assignment) => (
            <AssignmentCard
              key={assignment.id}
              assignment={assignment}
              module={getModule(assignment.moduleId)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
