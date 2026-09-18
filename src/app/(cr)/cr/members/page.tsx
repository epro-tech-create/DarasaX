import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { StaffSection, StaffStatCard } from "@/components/staff/staff-ui";
import {
  classRepUser,
  getStudentsForStream,
} from "@/data/staff-mock";
import { AlertTriangle, Users } from "lucide-react";

export default function ClassRepMembersPage() {
  const members = getStudentsForStream(classRepUser.streamId);
  const atRisk = members.filter((m) => m.risk !== "low");

  return (
    <div className="space-y-5">
      <PageHeader
        title="Class members"
        description={`Roster for ${classRepUser.streamId}.`}
      />

      <div className="grid gap-2.5 sm:grid-cols-2">
        <StaffStatCard
          label="Members"
          value={String(members.length)}
          icon={Users}
        />
        <StaffStatCard
          label="Need attention"
          value={String(atRisk.length)}
          hint="Low attendance or lagging work"
          icon={AlertTriangle}
          tone={atRisk.length ? "warning" : "success"}
        />
      </div>

      <StaffSection title="Roster">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-[12px]">
            <thead>
              <tr className="border-b border-border text-[10px] uppercase tracking-wide text-muted-foreground">
                <th className="pb-2 pr-3 font-medium">Student</th>
                <th className="pb-2 pr-3 font-medium">Attendance</th>
                <th className="pb-2 pr-3 font-medium">Assignments</th>
                <th className="pb-2 font-medium">Risk</th>
              </tr>
            </thead>
            <tbody>
              {members.map((s) => (
                <tr key={s.id} className="border-b border-border/60 last:border-0">
                  <td className="py-3 pr-3">
                    <p className="font-semibold">{s.name}</p>
                    <p className="text-[11px] text-muted-foreground">{s.email}</p>
                  </td>
                  <td className="py-3 pr-3 tabular-nums">{s.attendancePct}%</td>
                  <td className="py-3 pr-3 tabular-nums">
                    {s.assignmentsDone}/{s.assignmentsTotal}
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
