"use client";

import { useTranslate } from "@/components/providers/language-provider";
import { useState } from "react";
import { ScrollText, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StaffSection, StaffStatCard } from "@/components/staff/staff-ui";
import { useAuditLog } from "@/lib/audit-log-store";
import { AUDIT_PAGE_SIZE } from "@/lib/audit-log-query";
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
  const translateUI = useTranslate();
  const { audit: filtered, totalCount, todayCount, matchingCount, page, setPage, query, setQuery, action, setAction,
    loading, error: loadError, refresh, deleteLog, clearLogs, clearAllLogs } = useAuditLog();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  return (
    <div className="space-y-5">
      <PageHeader
        title={translateUI("Audit logs")}
        description={translateUI("Track who changed what across uploads, users, and timetable.")}
      />

      <div className="grid gap-2.5 sm:grid-cols-3">
        <StaffStatCard
          label={translateUI("Events today")}
          value={todayCount === null ? "…" : String(todayCount)}
          icon={ScrollText}
        />
        <StaffStatCard
          label={translateUI("Total logged")}
          value={totalCount === null ? "…" : String(totalCount)}
          icon={ScrollText}
          tone="success"
        />
        <StaffStatCard
          label={translateUI("Matching events")}
          value={loading ? "…" : String(matchingCount)}
          icon={ScrollText}
        />
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <input
          value={query}
          aria-label={translateUI("Search audit logs")}
          maxLength={200}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={translateUI("Search actor or action…")}
          className="h-10 min-w-0 flex-1 rounded-xl border border-border bg-background px-3 text-[13px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
        <select
          value={action}
          aria-label={translateUI("Filter audit action")}
          onChange={(e) => setAction(e.target.value as "all" | AuditAction)}
          className="h-10 rounded-xl border border-border bg-background px-3 text-[13px]"
        >
          <option value="all">{translateUI("All actions")}</option>
          <option value="upload">{translateUI("Uploads")}</option>
          <option value="timetable_edit">{translateUI("Timetable")}</option>
          <option value="student_add">{translateUI("Student add")}</option>
          <option value="cr_add">{translateUI("CR add")}</option>
          <option value="announcement">{translateUI("Announcements")}</option>
          <option value="publish">{translateUI("Topics")}</option>
          <option value="other">{translateUI("Deletes and student activity")}</option>
          <option value="login">{translateUI("Sign in")}</option>
        </select>
        <Button type="button" variant="outline" disabled={loading || busyId !== null} onClick={refresh}>{translateUI("Refresh")}</Button>
        <Button
          type="button"
          variant="outline"
          disabled={loading || busyId !== null || filtered.length === 0}
          onClick={() => {
            if (filtered.length === 0) return;
            if (
              !window.confirm(
                translateUI(`Delete ${filtered.length} audit event${filtered.length === 1 ? "" : "s"}?`),
              )
            ) {
              return;
            }
            setError("");
            setBusyId("all");
            void clearLogs(filtered.map((row) => row.id)).catch((err) => {
              setError(
                err instanceof Error ? err.message : "Could not delete logs. Please try again.",
              );
            }).finally(() => setBusyId(null));
          }}
        >
          <Trash2 className="h-3.5 w-3.5" />
          {translateUI("Delete shown")}</Button>
        <Button
          type="button"
          variant="danger"
          disabled={loading || !!loadError || busyId !== null || !totalCount}
          onClick={() => {
            if (!window.confirm(translateUI("Permanently delete all audit logs from all time, across every page and filter? This cannot be undone."))) return;
            setError("");
            setBusyId("delete-all");
            void clearAllLogs().catch((err) => {
              setError(err instanceof Error ? err.message : "Could not delete logs. Please try again.");
            }).finally(() => setBusyId(null));
          }}
        >
          <Trash2 className="h-3.5 w-3.5" />
          {translateUI(busyId === "delete-all" ? "Deleting all logs…" : "Delete all logs")}
        </Button>
      </div>
      {error ? (
        <p className="text-[12px] font-medium text-danger">{translateUI(error)}</p>
      ) : null}
      {loadError ? <div role="alert" className="flex items-center gap-3 text-sm text-danger"><p>{translateUI(loadError)}</p><Button variant="outline" onClick={refresh}>{translateUI("Try again")}</Button></div> : null}

      <StaffSection title={translateUI("Activity trail")} description={translateUI("All history · newest first · 50 per page")}>
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
                    {translateUI(row.action.replace("_", " "))}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">
                    {translateUI(new Date(row.at).toLocaleString(translateUI.locale, {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                      timeZone: "Africa/Dar_es_Salaam",
                    }))}
                  </span>
                </div>
                <p className="mt-1.5 text-[12px] font-semibold">{translateUI(row.summary)}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {translateUI(row.actor)}
                  {translateUI(row.role ? ` · ${row.role.replace("_", " ")}` : "")}
                  {translateUI(row.streamId ? ` · ${row.streamId}` : "")}
                  {translateUI(row.detail ? ` · ${row.detail}` : "")}
                </p>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="mt-2"
                  disabled={busyId !== null || loading}
                  onClick={() => {
                    if (!window.confirm(translateUI("Delete this audit event?"))) return;
                    setBusyId(row.id);
                    setError("");
                    void deleteLog(row.id)
                      .catch((err) => {
                        setError(
                          err instanceof Error ? err.message : "Could not delete this log. Please try again.",
                        );
                      })
                      .finally(() => setBusyId(null));
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  {translateUI("Delete")}</Button>
              </div>
            </div>
          ))}
          {loading ? <p role="status" className="py-8 text-center text-sm text-muted-foreground">{translateUI("Loading audit events…")}</p> : null}
          {!loading && !loadError && filtered.length === 0 ? (
            <p className="py-8 text-center text-[12px] text-muted-foreground">
              {translateUI("No matching audit events.")}</p>
          ) : null}
        </div>
      </StaffSection>
      <nav aria-label={translateUI("Audit log pages")} className="flex flex-wrap items-center justify-between gap-3">
        <p role="status" className="text-xs text-muted-foreground">{loading ? translateUI("Loading…") : translateUI(`Showing ${matchingCount ? page * AUDIT_PAGE_SIZE + 1 : 0}–${Math.min((page + 1) * AUDIT_PAGE_SIZE, matchingCount)} of ${matchingCount} events`)}</p>
        <div className="flex gap-2">
          <Button variant="outline" disabled={loading || !!loadError || busyId !== null || page === 0} onClick={() => setPage(value => value - 1)}>{translateUI("Previous")}</Button>
          <Button variant="outline" disabled={loading || !!loadError || busyId !== null || (page + 1) * AUDIT_PAGE_SIZE >= matchingCount} onClick={() => setPage(value => value + 1)}>{translateUI("Next")}</Button>
        </div>
      </nav>
    </div>
  );
}
