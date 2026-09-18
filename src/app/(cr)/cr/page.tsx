"use client";

import Link from "next/link";
import { ArrowUpRight, FileUp, Flag, Users } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StaffSection, StaffStatCard } from "@/components/staff/staff-ui";
import {
  classRepUser,
  getIssuesForStream,
  getStudentsForStream,
  getUploadsForRole,
} from "@/data/staff-mock";

export default function ClassRepOverviewPage() {
  const streamId = classRepUser.streamId;
  const members = getStudentsForStream(streamId);
  const openIssues = getIssuesForStream(streamId).filter(
    (i) => i.status !== "resolved",
  );
  const uploads = getUploadsForRole("class_rep");

  return (
    <div className="space-y-5">
      <PageHeader
        title="Class desk"
        description={`Keep ${streamId} supplied and clear blockers.`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button href="/cr/uploads" size="sm">
              <FileUp className="h-3.5 w-3.5" />
              Upload
            </Button>
            <Button href="/cr/timetable" size="sm" variant="outline">
              Edit timetable
            </Button>
          </div>
        }
      />

      <div className="grid gap-2.5 sm:grid-cols-3">
        <StaffStatCard
          label="Open issues"
          value={String(openIssues.length)}
          icon={Flag}
          tone="warning"
        />
        <StaffStatCard label="Members" value={String(members.length)} icon={Users} />
        <StaffStatCard
          label="Your uploads"
          value={String(uploads.length)}
          icon={FileUp}
          tone="success"
        />
      </div>

      <StaffSection
        title="Needs attention"
        action={
          <Link
            href="/cr/issues"
            className="inline-flex items-center gap-1 text-[11px] font-medium text-primary"
          >
            Issues <ArrowUpRight className="h-3 w-3" />
          </Link>
        }
      >
        <div className="space-y-2">
          {openIssues.slice(0, 4).map((issue) => (
            <div
              key={issue.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/70 px-3 py-2.5"
            >
              <p className="truncate text-[12px] font-semibold">{issue.title}</p>
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
          {openIssues.length === 0 ? (
            <p className="py-6 text-center text-[12px] text-muted-foreground">
              No open issues.
            </p>
          ) : null}
        </div>
      </StaffSection>
    </div>
  );
}
