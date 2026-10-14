"use client";

import Link from "next/link";
import { formatRelativeTime } from "@/lib/utils";
import { ArrowUpRight, FileUp, Flag, Users, BookOpen, ListOrdered, Megaphone } from "lucide-react";
import { OverviewHeader, OverviewShortcut } from "@/components/dashboard/overview-ui";
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
  const classUploads = uploads.filter((upload) => upload.streamId === streamId && upload.status === "published");

  return (
    <div className="space-y-6 sm:space-y-7">
      <OverviewHeader
        label="Class representative"
        title={`${greeting()}, ${displayName}`}
        description={`Keep ${streamId} connected with useful materials, clear notices, and an up-to-date timetable.`}
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

      <StaffStagger className="grid gap-3 sm:grid-cols-3">
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
            label="Class materials"
            value={String(classUploads.length)}
            icon={FileUp}
            tone="success"
          />
        </StaffFadeItem>
      </StaffStagger>

      <StaffStagger className="grid gap-3 sm:grid-cols-3">
        {[
          { href: "/cr/materials", title: "Class library", description: "Organize and share learning materials", icon: BookOpen },
          { href: "/cr/topics", title: "Module topics", description: "Keep your class outline organized", icon: ListOrdered },
          { href: "/cr/announcements", title: "Announcements", description: "Keep everyone in the loop", icon: Megaphone },
        ].map((item) => <StaffFadeItem key={item.href}><OverviewShortcut {...item} /></StaffFadeItem>)}
      </StaffStagger>

      <div className="grid items-start gap-5 xl:grid-cols-2">
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
            <p className="rounded-xl bg-success/5 px-4 py-10 text-center text-sm text-muted-foreground">
              No open issues.
            </p>
          ) : null}
        </div>
      </StaffSection>
        <StaffSection title="Recent class materials" description="Published files ready for your class."
          action={<Link href="/cr/materials" className="text-xs font-medium text-primary">View library</Link>}>
          <div className="space-y-2">
            {classUploads.slice(0, 4).map((item) => <Link key={item.id} href="/cr/materials"
              className="focus-ring flex items-center gap-3 rounded-xl border border-border/70 px-3 py-3 transition hover:border-primary/40">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><BookOpen className="h-4 w-4" /></span>
              <div className="min-w-0"><p className="truncate text-sm font-medium">{item.title}</p><p className="mt-1 text-xs text-muted-foreground">{item.size} / {formatRelativeTime(item.createdAt)}</p></div>
              <ArrowUpRight className="ml-auto h-4 w-4 shrink-0 text-muted-foreground" />
            </Link>)}
            {classUploads.length === 0 && <p className="rounded-xl bg-muted/40 px-4 py-10 text-center text-sm text-muted-foreground">Your next shared resource will appear here.</p>}
          </div>
        </StaffSection>
      </div>
    </div>
  );
}
