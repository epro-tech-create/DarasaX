"use client";

import { StatCard } from "@/components/dashboard/next-class-card";
import { useAssignments } from "@/lib/assignment-progress-store";

export function DashboardAssignmentStatCard() {
  const { items } = useAssignments();
  const pending = items.filter((a) => a.status === "upcoming").length;
  return (
    <StatCard
      label="Assignments"
      value={`${pending} pending`}
      href="/assignments"
    />
  );
}
