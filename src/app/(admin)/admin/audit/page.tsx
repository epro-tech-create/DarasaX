"use client";

import { useMemo, useState } from "react";
import { ScrollText, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StaffSection, StaffStatCard } from "@/components/staff/staff-ui";
import { useAdminPeopleStore } from "@/lib/admin-people-store";
import type { AuditAction } from "@/types";
import { cn } from "@/lib/utils";

const actionTone: Record<AuditAction, "default" | "primary" | "success" | "warning" | "danger" | "cyan"> = {
  login: "warning",
  upload: "primary",
  publish: "success",
  timetable_edit: "cyan",
  issue_update: "warning",
  student_add: "success",
  student_update: "default",
  student_delete: "danger",
  cr_add: "success",
  cr_update: "default",
  cr_delete: "danger",
  announcement: "primary",
  settings: "default",
  other: "default",
};

export default function AdminAuditPage() {
  const { audit, deleteLog, clearLogs } = useAdminPeopleStore();
  const [action, setAction] = useState<"all" | AuditAction>("all");
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const filtered = useMemo(() => {
    return audit.filter((row) => {
      const hay = `${row.summary} ${row.actor} ${row.detail ?? ""}`.toLowerCase();
      return (
        (action === "all" || row.action === action) &&
        (!query || hay.includes(query.toLowerCase()))
      );
    });
  }, [audit, action, query]);

  const todayCount = audit.filter((a) => {
    const d = new Date(a.at);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  }).length;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Audit logs"
        description="Track who changed what across uploads, users, timetable, and issues."
      />

      <div className="grid gap-2.5 sm:grid-cols-3">
        <StaffStatCard
          label="Events today"
          value={String(todayCount)}
          icon={ScrollText}
        />
        <StaffStatCard
          label="Total logged"
          value={String(audit.length)}
          icon={ScrollText}
          tone="success"
        />
        <StaffStatCard
          label="Showing"
          value={String(filtered.length)}
          icon={ScrollText}
        />
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search actor or action…"
          className="h-10 min-w-0 flex-1 rounded-xl border border-border bg-background px-3 text-[13px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
        <select
          value={action}
          onChange={(e) => setAction(e.target.value as "all" | AuditAction)}
          className="h-10 rounded-xl border border-border bg-background px-3 text-[13px]"
        >
          <option value="all">All actions</option>
          <option value="upload">Uploads</option>
          <option value="timetable_edit">Timetable</option>
          <option value="student_add">Student add</option>
          <option value="cr_add">CR add</option>
          <option value="issue_update">Issues</option>
          <option value="announcement">Announcements</option>
          <option value="publish">Topics</option>
          <option value="other">Deletes and student activity</option>
          <option value="login">Sign in</option>
        </select>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            if (filtered.length === 0) return;
            if (
              !window.confirm(
                `Delete ${filtered.length} audit event${filtered.length === 1 ? "" : "s"}?`,
              )
            ) {
              return;
            }
            setError("");
            void clearLogs(filtered.map((row) => row.id)).catch(() => {
              setError(
                "Could not delete logs. Run the latest Supabase migration, then try again.",
              );
            });
          }}
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete shown
        </Button>
      </div>
      {error ? (
        <p className="text-[12px] font-medium text-danger">{error}</p>
      ) : null}

      <StaffSection title="Activity trail" description="Newest first">
        <div className="relative space-y-0">
          <div className="absolute bottom-2 left-[11px] top-2 w-px bg-border" />
          {filtered.map((row) => (
            <div key={row.id} className="relative flex gap-3 pb-4 last:pb-0">
              <span
                className={cn(
                  "relative z-10 mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ring-4 ring-background",
                  row.role === "admin"
                    ? "bg-primary"
                    : row.role === "lecturer"
                      ? "bg-cyan"
                      : row.role === "class_rep"
                        ? "bg-warning"
                        : "bg-muted-foreground",
                )}
              />
              <div className="min-w-0 flex-1 rounded-xl border border-border/70 bg-muted/20 px-3 py-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={actionTone[row.action]}>
                    {row.action.replace("_", " ")}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(row.at).toLocaleString("en-GB", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="mt-1.5 text-[12px] font-semibold">{row.summary}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {row.actor}
                  {row.role ? ` · ${row.role.replace("_", " ")}` : ""}
                  {row.streamId ? ` · ${row.streamId}` : ""}
                  {row.detail ? ` · ${row.detail}` : ""}
                </p>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="mt-2"
                  disabled={busyId === row.id}
                  onClick={() => {
                    if (!window.confirm("Delete this audit event?")) return;
                    setBusyId(row.id);
                    setError("");
                    void deleteLog(row.id)
                      .catch(() => {
                        setError(
                          "Could not delete this log. Run the latest Supabase migration, then try again.",
                        );
                      })
                      .finally(() => setBusyId(null));
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </Button>
              </div>
            </div>
          ))}
          {filtered.length === 0 ? (
            <p className="py-8 text-center text-[12px] text-muted-foreground">
              No matching audit events.
            </p>
          ) : null}
        </div>
      </StaffSection>
    </div>
  );
}
