"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  FileUp,
  Flag,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StaffSection, StaffStatCard } from "@/components/staff/staff-ui";
import {
  materialUploads,
  monitoredStudents,
  staffIssues,
} from "@/data/staff-mock";

export default function AdminOverviewPage() {
  const openIssues = staffIssues.filter((i) => i.status !== "resolved").length;
  const pendingUploads = materialUploads.filter((u) => u.status !== "published").length;
  const atRisk = monitoredStudents.filter((s) => s.risk !== "low").length;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Admin overview"
        description="Upload materials, fix timetable issues, and watch student risk."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button href="/admin/uploads" size="sm">
              <FileUp className="h-3.5 w-3.5" />
              Upload
            </Button>
            <Button href="/admin/timetable" size="sm" variant="outline">
              Edit timetable
            </Button>
          </div>
        }
      />

      <div className="grid gap-2.5 sm:grid-cols-3">
        <StaffStatCard
          label="Open issues"
          value={String(openIssues)}
          icon={Flag}
          tone="warning"
        />
        <StaffStatCard
          label="Pending uploads"
          value={String(pendingUploads)}
          icon={FileUp}
        />
        <StaffStatCard
          label="Students at risk"
          value={String(atRisk)}
          icon={Users}
          tone={atRisk ? "danger" : "success"}
        />
      </div>

      <StaffSection
        title="Priority issues"
        action={
          <Link
            href="/admin/issues"
            className="inline-flex items-center gap-1 text-[11px] font-medium text-primary"
          >
            All issues <ArrowUpRight className="h-3 w-3" />
          </Link>
        }
      >
        <div className="space-y-2">
          {staffIssues
            .filter((i) => i.status !== "resolved")
            .slice(0, 4)
            .map((issue) => (
              <div
                key={issue.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/70 px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-[12px] font-semibold">{issue.title}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {issue.streamId ?? "All streams"}
                  </p>
                </div>
                <Badge
                  tone={
                    issue.severity === "high"
                      ? "danger"
                      : issue.severity === "medium"
                        ? "warning"
                        : "default"
                  }
                >
                  {issue.severity}
                </Badge>
              </div>
            ))}
        </div>
      </StaffSection>
    </div>
  );
}
