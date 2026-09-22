"use client";

import { PageHeader } from "@/components/layout/page-header";
import { StaffSection, StaffStatCard } from "@/components/staff/staff-ui";
import { weeklyAnalytics } from "@/data/staff-mock";
import { useAdminPeopleStore } from "@/lib/admin-people-store";
import { useIssuesStore } from "@/lib/issues-store";
import { useMaterialsStore } from "@/lib/materials-store";
import { BarChart3, Download, Eye, Flag } from "lucide-react";

export default function AdminAnalyticsPage() {
  const { students } = useAdminPeopleStore();
  const { items: issues } = useIssuesStore();
  const { items: uploads } = useMaterialsStore();
  const max = Math.max(...weeklyAnalytics.map((d) => Math.max(d.views, d.uploads * 20)));
  const downloads = uploads.reduce((a, u) => a + u.downloads, 0);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Analytics"
        description="Programme-level view of engagement, content, and operational load."
      />

      <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
        <StaffStatCard
          label="Weekly views"
          value={String(weeklyAnalytics.reduce((a, d) => a + d.views, 0))}
          icon={Eye}
        />
        <StaffStatCard label="Downloads" value={String(downloads)} icon={Download} tone="success" />
        <StaffStatCard
          label="Uploads"
          value={String(weeklyAnalytics.reduce((a, d) => a + d.uploads, 0))}
          icon={BarChart3}
        />
        <StaffStatCard
          label="Issues logged"
          value={String(issues.length)}
          icon={Flag}
          tone="warning"
        />
      </div>

      <StaffSection title="7-day trend" description="Views (bars) vs uploads (dots scale)">
        <div className="flex h-52 items-end gap-3">
          {weeklyAnalytics.map((day) => (
            <div key={day.label} className="flex flex-1 flex-col items-center gap-2">
              <div className="relative flex h-40 w-full items-end justify-center">
                <div
                  className="w-[70%] rounded-t-xl bg-gradient-to-t from-[#1565C0] to-[#4FC3F7]"
                  style={{ height: `${(day.views / max) * 100}%` }}
                />
              </div>
              <div className="text-center">
                <p className="text-[10px] font-medium text-muted-foreground">{day.label}</p>
                <p className="text-[10px] tabular-nums text-muted-foreground">
                  {day.uploads} up · {day.issues} iss
                </p>
              </div>
            </div>
          ))}
        </div>
      </StaffSection>

      <div className="grid gap-4 lg:grid-cols-2">
        <StaffSection title="Risk distribution">
          <div className="space-y-3">
            {(["low", "medium", "high"] as const).map((level) => {
              const count = students.filter((s) => s.risk === level).length;
              const pct = students.length
                ? Math.round((count / students.length) * 100)
                : 0;
              return (
                <div key={level}>
                  <div className="mb-1 flex justify-between text-[11px]">
                    <span className="capitalize text-muted-foreground">{level} risk</span>
                    <span className="tabular-nums font-medium">
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

        <StaffSection title="Top materials">
          <div className="space-y-2">
            {[...uploads]
              .sort((a, b) => b.downloads - a.downloads)
              .slice(0, 5)
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
      </div>
    </div>
  );
}
