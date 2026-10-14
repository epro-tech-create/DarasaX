"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  CalendarDays,
  FileUp,
  Flag,
  GraduationCap,
  ScrollText,
  Users,
} from "lucide-react";
import { OverviewHeader, OverviewShortcut } from "@/components/dashboard/overview-ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StaffSection, StaffStatCard } from "@/components/staff/staff-ui";
import { StaffFadeItem, StaffStagger } from "@/components/staff/staff-motion";
import { useAdminPeopleStore } from "@/lib/admin-people-store";
import { useIssuesStore } from "@/lib/issues-store";
import { useStaffSession } from "@/lib/staff-auth";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function AdminOverviewPage() {
  const { students, classReps, audit } = useAdminPeopleStore();
  const { items: issues } = useIssuesStore();
  const { session } = useStaffSession();
  const openIssues = issues.filter((i) => i.status !== "resolved");
  const activeCrs = classReps.filter((c) => c.status === "active").length;
  const atRisk = students.filter((s) => s.risk !== "low").length;

  return (
    <div className="space-y-6 sm:space-y-7">
      <OverviewHeader
        label="Administration"
        title={`${greeting()}, ${session?.name ?? "Admin"}`}
        description="Manage your community, keep classes running, and see what needs attention."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button href="/admin/students" size="sm" variant="outline">
              Add student
            </Button>
            <Button href="/admin/class-reps" size="sm" variant="outline">
              Add CR
            </Button>
            <Button href="/admin/uploads" size="sm">
              <FileUp className="h-3.5 w-3.5" />
              Upload
            </Button>
          </div>
        }
      />

      <StaffStagger className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StaffFadeItem>
          <StaffStatCard
            label="Students"
            value={String(students.length)}
            hint={`${atRisk} need attention`}
            icon={Users}
          />
        </StaffFadeItem>
        <StaffFadeItem>
          <StaffStatCard
            label="Active CRs"
            value={String(activeCrs)}
            icon={GraduationCap}
            tone="success"
          />
        </StaffFadeItem>
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
            label="Audit events"
            value={String(audit.length)}
            icon={ScrollText}
          />
        </StaffFadeItem>
      </StaffStagger>

      <StaffStagger className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { href: "/admin/students", title: "Students", body: "Manage your student community", icon: Users },
          { href: "/admin/class-reps", title: "Class reps", body: "Manage class representatives", icon: GraduationCap },
          { href: "/admin/timetable", title: "Timetable", body: "Keep class schedules up to date", icon: CalendarDays },
          { href: "/admin/audit", title: "Audit logs", body: "Follow activity across your campus", icon: ScrollText },
        ].map((card) => (
          <StaffFadeItem key={card.href}>
            <OverviewShortcut href={card.href} title={card.title} description={card.body} icon={card.icon} />
          </StaffFadeItem>
        ))}
      </StaffStagger>

      <div className="grid gap-4 lg:grid-cols-2">
        <StaffSection
          title="Latest audit"
          action={
            <Link
              href="/admin/audit"
              className="inline-flex items-center gap-1 text-[11px] font-medium text-primary"
            >
              Full log <ArrowUpRight className="h-3 w-3" />
            </Link>
          }
        >
          <div className="space-y-2">
            {audit.length === 0 && <p className="rounded-xl bg-muted/40 px-4 py-8 text-center text-sm text-muted-foreground">No activity yet. New actions will appear here.</p>}
            {audit.slice(0, 5).map((row) => (
              <div
                key={row.id}
                className="rounded-xl border border-border/70 px-3 py-2.5"
              >
                <p className="text-[12px] font-semibold">{row.summary}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {row.actor} ·{" "}
                  {new Date(row.at).toLocaleString("en-GB", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            ))}
          </div>
        </StaffSection>

        <StaffSection
          title="Open issues"
          action={
            <Link
              href="/admin/issues"
              className="inline-flex items-center gap-1 text-[11px] font-medium text-primary"
            >
              Issues desk <ArrowUpRight className="h-3 w-3" />
            </Link>
          }
        >
          <div className="space-y-2">
            {openIssues.length === 0 && <p className="rounded-xl bg-success/5 px-4 py-8 text-center text-sm text-muted-foreground">All caught up. There are no open issues.</p>}
            {openIssues
              .slice(0, 5)
              .map((issue) => (
                <div
                  key={issue.id}
                  className="flex items-center justify-between gap-2 rounded-xl border border-border/70 px-3 py-2.5"
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
          </div>
        </StaffSection>
      </div>
    </div>
  );
}
