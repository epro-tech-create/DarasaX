"use client";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { StaffSection, StaffStatCard } from "@/components/staff/staff-ui";
import { classRepUser } from "@/data/staff-mock";
import { useAdminPeopleStore } from "@/lib/admin-people-store";
import { Activity, UserCheck, UserX } from "lucide-react";

export default function ClassRepAttendancePage() {
  const { studentsForStream } = useAdminPeopleStore();
  const members = studentsForStream(classRepUser.streamId);
  const avg = Math.round(
    members.reduce((a, s) => a + s.attendancePct, 0) / Math.max(members.length, 1),
  );
  const low = members.filter((m) => m.attendancePct < 75);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Attendance"
        description="Spot patterns early and follow up before CATs."
      />

      <div className="grid gap-2.5 sm:grid-cols-3">
        <StaffStatCard label="Class average" value={`${avg}%`} icon={Activity} tone="success" />
        <StaffStatCard
          label="On track"
          value={String(members.filter((m) => m.attendancePct >= 75).length)}
          icon={UserCheck}
        />
        <StaffStatCard
          label="Below 75%"
          value={String(low.length)}
          icon={UserX}
          tone={low.length ? "danger" : "success"}
        />
      </div>

      <StaffSection title="Who needs a nudge">
        {low.length === 0 ? (
          <p className="py-8 text-center text-[12px] text-muted-foreground">
            Everyone is above 75% — keep it up.
          </p>
        ) : (
          <div className="space-y-2">
            {low.map((s) => (
              <div
                key={s.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/70 px-3 py-2.5"
              >
                <div>
                  <p className="text-[12px] font-semibold">{s.name}</p>
                  <p className="text-[11px] text-muted-foreground">{s.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="tabular-nums text-[12px] font-semibold">{s.attendancePct}%</span>
                  <Badge tone="danger">{s.risk}</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </StaffSection>

      <StaffSection title="Full attendance board">
        <div className="space-y-2">
          {[...members]
            .sort((a, b) => b.attendancePct - a.attendancePct)
            .map((s) => (
              <div key={s.id} className="flex items-center gap-3">
                <p className="w-28 shrink-0 truncate text-[12px] font-medium">{s.name}</p>
                <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-cyan"
                    style={{ width: `${s.attendancePct}%` }}
                  />
                </div>
                <span className="w-10 shrink-0 text-right tabular-nums text-[11px] text-muted-foreground">
                  {s.attendancePct}%
                </span>
              </div>
            ))}
        </div>
      </StaffSection>
    </div>
  );
}
