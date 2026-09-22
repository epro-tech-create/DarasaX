"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StaffSection, StaffStatCard } from "@/components/staff/staff-ui";
import { useIssuesStore } from "@/lib/issues-store";
import { CheckCircle2, Flag, Timer } from "lucide-react";
import type { IssueStatus } from "@/types";

export default function AdminIssuesPage() {
  const [status, setStatusFilter] = useState<"all" | IssueStatus>("all");
  const { items, setStatus } = useIssuesStore();

  const filtered = useMemo(
    () => items.filter((i) => status === "all" || i.status === status),
    [items, status],
  );

  function setIssueStatus(id: string, next: IssueStatus) {
    void setStatus(id, next).catch(() => null);
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Issues desk"
        description="Track materials gaps, timetable clashes, attendance disputes, and tech problems."
      />

      <div className="grid gap-2.5 sm:grid-cols-3">
        <StaffStatCard
          label="Open"
          value={String(items.filter((i) => i.status === "open").length)}
          icon={Flag}
          tone="warning"
        />
        <StaffStatCard
          label="In progress"
          value={String(items.filter((i) => i.status === "in_progress").length)}
          icon={Timer}
        />
        <StaffStatCard
          label="Resolved"
          value={String(items.filter((i) => i.status === "resolved").length)}
          icon={CheckCircle2}
          tone="success"
        />
      </div>

      <div className="inline-flex rounded-xl border border-border bg-muted/40 p-0.5">
        {(["all", "open", "in_progress", "resolved"] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatusFilter(s)}
            className={`rounded-lg px-3 py-1.5 text-[11px] font-medium capitalize ${
              status === s ? "btn-gradient" : "text-muted-foreground"
            }`}
          >
            {s.replace("_", " ")}
          </button>
        ))}
      </div>

      <StaffSection title="Queue" description={`${filtered.length} issues`}>
        <div className="space-y-2.5">
          {filtered.map((issue) => (
            <div
              key={issue.id}
              className="rounded-2xl border border-border/70 bg-muted/20 p-3.5"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold">{issue.title}</p>
                  <p className="mt-1 text-[12px] text-muted-foreground">{issue.description}</p>
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    {issue.streamId ?? "All"} · {issue.category} · reported by{" "}
                    {issue.reportedBy}
                    {issue.assignee ? ` · assigned ${issue.assignee}` : ""}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
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
                  <Badge tone="primary">{issue.status.replace("_", " ")}</Badge>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {issue.status !== "in_progress" ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIssueStatus(issue.id, "in_progress")}
                  >
                    Mark in progress
                  </Button>
                ) : null}
                {issue.status !== "resolved" ? (
                  <Button size="sm" onClick={() => setIssueStatus(issue.id, "resolved")}>
                    Resolve
                  </Button>
                ) : null}
                {issue.status === "resolved" ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIssueStatus(issue.id, "open")}
                  >
                    Reopen
                  </Button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </StaffSection>
    </div>
  );
}
