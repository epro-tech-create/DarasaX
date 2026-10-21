"use client";

import { useTranslate } from "@/components/providers/language-provider";
import { StatCard } from "@/components/dashboard/next-class-card";
import { useAssignments } from "@/lib/assignment-progress-store";

export function DashboardAssignmentStatCard() {
  const translateUI = useTranslate();
  const { items } = useAssignments();
  const pending = items.filter((a) => a.status === "upcoming").length;
  return (
    <StatCard
      label={translateUI("Assignments")}
      value={`${pending} pending`}
      href="/assignments"
    />
  );
}
