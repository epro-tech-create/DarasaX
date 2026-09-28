"use client";

import { useMemo } from "react";
import { StatCard } from "@/components/dashboard/next-class-card";
import { currentUser, modules } from "@/data/mock";
import { useAssignments } from "@/lib/assignment-progress-store";
import { useTopicProgress } from "@/lib/topic-progress-store";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
// Evaluated once at module load so render stays pure; due-soon is approximate.
const NOW_AT_LOAD = Date.now();

export function DashboardStats() {
  const { items } = useAssignments();
  const { topics } = useTopicProgress();

  const { pending, dueSoon } = useMemo(() => {
    const open = items.filter((a) => a.status !== "completed");
    return {
      pending: open.length,
      dueSoon: open.filter((a) => {
        const t = new Date(a.deadline).getTime();
        return Number.isFinite(t) && t <= NOW_AT_LOAD + WEEK_MS;
      }).length,
    };
  }, [items]);

  const { done, total, pct } = useMemo(() => {
    const doneCount = topics.filter((t) => t.completed).length;
    const totalCount = topics.length;
    return {
      done: doneCount,
      total: totalCount,
      pct: totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0,
    };
  }, [topics]);

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatCard
        label="Assignments"
        value={`${pending} pending`}
        hint={`${dueSoon} due within 7 days`}
        href="/assignments"
        highlight
      />
      <StatCard
        label="Topics"
        value={`${done}/${total}`}
        hint={`${pct}% of published topics`}
        href="/modules"
      />
      <StatCard
        label="Modules"
        value={`${modules.length}`}
        hint="Year 3 · Semester 1"
        href="/modules"
      />
      <StatCard
        label="Study streak"
        value={`${currentUser.studyStreak} days`}
        hint="Keep the momentum"
        href="/planner"
      />
    </div>
  );
}
