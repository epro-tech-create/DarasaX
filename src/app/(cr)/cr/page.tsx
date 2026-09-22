"use client";

import Link from "next/link";
import { ArrowUpRight, FileUp, Flag, Users } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StaffSection, StaffStatCard } from "@/components/staff/staff-ui";
import { StaffFadeItem, StaffStagger } from "@/components/staff/staff-motion";
import { useAdminPeopleStore } from "@/lib/admin-people-store";
import { useIssuesStore } from "@/lib/issues-store";
import { useMaterialsStore } from "@/lib/materials-store";
import { useStaffSession } from "@/lib/staff-auth";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function ClassRepOverviewPage() {
  const { session } = useStaffSession();
  const streamId = session?.streamId ?? "BENG24COE-1";
  const displayName = session?.name ?? "Class Rep";
  const { studentsForStream } = useAdminPeopleStore();
  const { forStream } = useIssuesStore();
  const { items: uploads } = useMaterialsStore();
  const members = studentsForStream(streamId);
  const openIssues = forStream(streamId).filter(
    (i) => i.status !== "resolved",
  );
  const myUploads = uploads.filter((u) => u.role === "class_rep");

  return (
    <div className="space-y-5">
      <PageHeader
        size="lg"
        title={`${greeting()}, ${displayName}`}
        description={`Class Representative · ${streamId}`}
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

      <StaffStagger className="grid gap-2.5 sm:grid-cols-3">
        <StaffFadeItem>
          <StaffStatCard
            label="Open issues"
            value={String(openIssues.length)}
            icon={Flag}
            tone="warning"
          />
        </StaffFadeItem>
        <StaffFadeItem>
          <StaffStatCard
            label="Members"
            value={String(members.length)}
            icon={Users}
          />
        </StaffFadeItem>
        <StaffFadeItem>
          <StaffStatCard
            label="Your uploads"
            value={String(myUploads.length)}
            icon={FileUp}
            tone="success"
          />
        </StaffFadeItem>
      </StaffStagger>

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
