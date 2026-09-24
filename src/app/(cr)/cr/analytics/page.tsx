"use client";

import { PageHeader } from "@/components/layout/page-header";
import { StaffSection, StaffStatCard } from "@/components/staff/staff-ui";
import { weeklyAnalytics } from "@/data/staff-mock";
import { useAdminPeopleStore } from "@/lib/admin-people-store";
import { useIssuesStore } from "@/lib/issues-store";
import { useMaterialsStore } from "@/lib/materials-store";
import { useStaffSession } from "@/lib/staff-auth";
import { Download, Eye, FileUp, Flag } from "lucide-react";

export default function ClassRepAnalyticsPage() {
  const { session } = useStaffSession();
  const streamId = session?.streamId ?? "BENG24COE-1";
  const { studentsForStream } = useAdminPeopleStore();
  const { forStream } = useIssuesStore();
  const { items } = useMaterialsStore();
  const members = studentsForStream(streamId);
  const uploads = items.filter((u) => u.role === "class_rep");
  const issues = forStream(streamId);
  const downloads = uploads.reduce((a, u) => a + u.downloads, 0);
  const max = Math.max(...weeklyAnalytics.map((d) => d.views));

  return (
    <div className="space-y-5">
      <PageHeader
        title="Class insights"
        description={`Engagement and ops snapshot for ${streamId}.`}
      />

      <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
        <StaffStatCard label="Members" value={String(members.length)} icon={Eye} />
        <StaffStatCard
          label="Your downloads"
          value={String(downloads)}
          icon={Download}
          tone="success"
        />
        <StaffStatCard label="Uploads" value={String(uploads.length)} icon={FileUp} />
        <StaffStatCard
          label="Issues"
          value={String(issues.length)}
          icon={Flag}
          tone="warning"
        />
      </div>

      <StaffSection title="Week engagement (programme trend)">
        <div className="flex h-44 items-end gap-2">
          {weeklyAnalytics.map((day) => (
            <div key={day.label} className="flex flex-1 flex-col items-center gap-1.5">
              <div
                className="w-full rounded-t-lg bg-primary/80"
                style={{ height: `${Math.max((day.views / max) * 100, 8)}%` }}
              />
              <span className="text-[10px] text-muted-foreground">{day.label}</span>
            </div>
          ))}
        </div>
      </StaffSection>

      <div className="grid gap-4 lg:grid-cols-2">
        <StaffSection title="Top class materials">
          <div className="space-y-2">
            {[...uploads]
              .sort((a, b) => b.downloads - a.downloads)
              .map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between gap-2 rounded-xl bg-muted/30 px-3 py-2"
                >
                  <p className="truncate text-[12px] font-medium">{u.title}</p>
                  <span className="shrink-0 tabular-nums text-[11px] text-muted-foreground">
                    {u.downloads}
                  </span>
                </div>
              ))}
          </div>
        </StaffSection>

        <StaffSection title="Risk mix">
          <div className="space-y-3">
            {(["low", "medium", "high"] as const).map((level) => {
              const count = members.filter((s) => s.risk === level).length;
              const pct = members.length
                ? Math.round((count / members.length) * 100)
                : 0;
              return (
                <div key={level}>
                  <div className="mb-1 flex justify-between text-[11px]">
                    <span className="capitalize text-muted-foreground">{level}</span>
                    <span className="tabular-nums">
                      {count} · {pct}%
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className={
                        level === "high"
                          ? "h-full bg-danger"
                          : level === "medium"
                            ? "h-full bg-warning"
                            : "h-full bg-success"
                      }
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </StaffSection>
      </div>
    </div>
  );
}
