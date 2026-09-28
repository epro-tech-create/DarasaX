"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ChevronRight } from "lucide-react";
import { DeadlineBadge } from "@/components/assignments/assignment-card";
import { ModuleCard } from "@/components/modules/module-card";
import { Button } from "@/components/ui/button";
import { getModule, modules } from "@/data/mock";
import { useAssignments } from "@/lib/assignment-progress-store";
import { useMaterialsStore } from "@/lib/materials-store";
import { enrichModules } from "@/lib/module-stats";
import { useTopicProgress } from "@/lib/topic-progress-store";

export function DashboardUpcoming() {
  const { items } = useAssignments();
  const upcoming = useMemo(
    () =>
      items
        .filter((a) => a.status !== "completed")
        .sort(
          (a, b) =>
            new Date(a.deadline).getTime() - new Date(b.deadline).getTime(),
        )
        .slice(0, 4),
    [items],
  );

  const pendingCount = items.filter((a) => a.status === "upcoming").length;

  return (
    <section className="surface flex h-full flex-col rounded-[20px] p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-heading text-[15px] font-semibold tracking-tight">
            Upcoming assignments
          </h2>
          <p className="mt-0.5 text-[12px] text-muted-foreground">
            {pendingCount} pending · completed work stays off this list
          </p>
        </div>
        <Button variant="ghost" size="sm" href="/assignments">
          View all
        </Button>
      </div>
      <div className="mt-3 flex-1 space-y-1.5">
        {upcoming.length === 0 ? (
          <div className="rounded-[14px] bg-muted/50 px-4 py-8 text-center text-[12px] text-muted-foreground">
            No upcoming assignments. Nice work.
          </div>
        ) : (
          upcoming.map((item) => {
            const module = getModule(item.moduleId);
            return (
              <Link
                key={item.id}
                href={`/assignments/${item.id}`}
                className="group flex items-center justify-between gap-3 rounded-[14px] border border-border/60 px-3.5 py-3 transition hover:border-primary/40 hover:bg-muted/40"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className="h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[11px] font-bold text-white hidden sm:inline-flex"
                    style={{ backgroundColor: module?.accent || "#1D4ED8" }}
                  >
                    {module?.code.slice(0, 2) || "DX"}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-medium group-hover:text-primary">
                      {item.title}
                    </p>
                    <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                      {module?.name}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <DeadlineBadge deadline={item.deadline} />
                  <ChevronRight className="hidden h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary sm:block" />
                </div>
              </Link>
            );
          })
        )}
      </div>
    </section>
  );
}

export function DashboardModulesPreview() {
  const { published } = useMaterialsStore();
  const { topics } = useTopicProgress();
  const enriched = useMemo(
    () => enrichModules(modules, published, topics).slice(0, 6),
    [published, topics],
  );

  return (
    <section>
      <div className="mb-3.5 flex items-center justify-between">
        <div className="min-w-0">
          <h2 className="font-heading text-[15px] font-semibold tracking-tight">
            Your modules
          </h2>
          <p className="mt-0.5 text-[12px] text-muted-foreground">
            Jump back into a course
          </p>
        </div>
        <Button variant="ghost" size="sm" href="/modules">
          See all
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {enriched.map((module) => (
          <ModuleCard key={module.id} module={module} />
        ))}
      </div>
    </section>
  );
}
