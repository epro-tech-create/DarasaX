"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { StaffSection, StaffStatCard } from "@/components/staff/staff-ui";
import { classStreams } from "@/data/mock";
import { monitoredStudents } from "@/data/staff-mock";
import { AlertTriangle, Users } from "lucide-react";

export default function AdminStudentsPage() {
  const [stream, setStream] = useState("all");
  const [risk, setRisk] = useState("all");

  const filtered = useMemo(() => {
    return monitoredStudents.filter(
      (s) =>
        (stream === "all" || s.streamId === stream) &&
        (risk === "all" || s.risk === risk),
    );
  }, [stream, risk]);

  const highRisk = monitoredStudents.filter((s) => s.risk === "high").length;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Student monitor"
        description="Track attendance, assignment completion, and at-risk learners across streams."
      />

      <div className="grid gap-2.5 sm:grid-cols-3">
        <StaffStatCard
          label="Students"
          value={String(monitoredStudents.length)}
          hint="All streams"
          icon={Users}
        />
        <StaffStatCard
          label="High risk"
          value={String(highRisk)}
          hint="Need outreach"
          icon={AlertTriangle}
          tone="danger"
        />
        <StaffStatCard
          label="Avg attendance"
          value={`${Math.round(
            monitoredStudents.reduce((a, s) => a + s.attendancePct, 0) /
              monitoredStudents.length,
          )}%`}
          hint="Programme-wide"
          icon={Users}
          tone="success"
        />
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <select
          value={stream}
          onChange={(e) => setStream(e.target.value)}
          className="h-10 rounded-xl border border-border bg-background px-3 text-[13px]"
        >
          <option value="all">All streams</option>
          {classStreams.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
        <select
          value={risk}
          onChange={(e) => setRisk(e.target.value)}
          className="h-10 rounded-xl border border-border bg-background px-3 text-[13px]"
        >
          <option value="all">All risk levels</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>

      <StaffSection title="Roster" description={`${filtered.length} students`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-[12px]">
            <thead>
              <tr className="border-b border-border text-[10px] uppercase tracking-wide text-muted-foreground">
                <th className="pb-2 pr-3 font-medium">Student</th>
                <th className="pb-2 pr-3 font-medium">Stream</th>
                <th className="pb-2 pr-3 font-medium">Attendance</th>
                <th className="pb-2 pr-3 font-medium">Assignments</th>
                <th className="pb-2 pr-3 font-medium">Last active</th>
                <th className="pb-2 font-medium">Risk</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} className="border-b border-border/60 last:border-0">
                  <td className="py-3 pr-3">
                    <p className="font-semibold">{s.name}</p>
                    <p className="text-[11px] text-muted-foreground">{s.email}</p>
                  </td>
                  <td className="py-3 pr-3 text-muted-foreground">{s.streamId}</td>
                  <td className="py-3 pr-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${s.attendancePct}%` }}
                        />
                      </div>
                      <span className="tabular-nums">{s.attendancePct}%</span>
                    </div>
                  </td>
                  <td className="py-3 pr-3 tabular-nums">
                    {s.assignmentsDone}/{s.assignmentsTotal}
                  </td>
                  <td className="py-3 pr-3 text-muted-foreground">
                    {new Date(s.lastActive).toLocaleString("en-GB", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="py-3">
                    <Badge
                      tone={
                        s.risk === "high"
                          ? "danger"
                          : s.risk === "medium"
                            ? "warning"
                            : "success"
                      }
                    >
                      {s.risk}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </StaffSection>
    </div>
  );
}
