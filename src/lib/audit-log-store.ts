"use client";

import { useCallback, useEffect, useState } from "react";
import type { AuditAction, AuditLogEntry } from "@/types";
import { createClient } from "@/lib/supabase/client";
import { invalidateQueries } from "@/lib/supabase/query-cache";
import { AUDIT_PAGE_SIZE, loadAuditPage } from "@/lib/audit-log-query";

export function useAuditLog() {
  const [page, setPage] = useState(0);
  const [query, updateQuery] = useState("");
  const [action, updateAction] = useState<"all" | AuditAction>("all");
  const [version, setVersion] = useState(0);
  const key = JSON.stringify([page, query, action, version]);
  const [result, setResult] = useState<{ key: string; audit: AuditLogEntry[]; totalCount: number | null; todayCount: number | null; matchingCount: number; error: string }>({
    key: "", audit: [], totalCount: null, todayCount: null, matchingCount: 0, error: "",
  });
  const refresh = useCallback(() => setVersion(value => value + 1), []);
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const data = await loadAuditPage(createClient(), { page, query, action });
        if (cancelled) return;
        const lastPage = Math.max(0, Math.ceil(data.matchingCount / AUDIT_PAGE_SIZE) - 1);
        if (page > lastPage) { setPage(lastPage); return; }
        setResult({ ...data, key, error: "" });
      } catch {
        if (!cancelled) setResult(previous => ({ ...previous, key, audit: [], error: "Could not load audit logs. Please try again." }));
      }
    }, 250);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [page, query, action, key]);
  useEffect(() => {
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, [refresh]);
  const setQuery = (value: string) => { updateQuery(value); setPage(0); };
  const setAction = (value: "all" | AuditAction) => { updateAction(value); setPage(0); };
  const clearLogs = async (ids: string[]) => {
    if (!ids.length) return;
    const uniqueIds = [...new Set(ids)];
    const { data, error } = await createClient().from("audit_log").delete().in("id", uniqueIds.map(Number)).select("id");
    if (error) throw new Error(error.message);
    invalidateQueries("people"); refresh();
    if (data?.length !== uniqueIds.length) {
      throw new Error("Some logs were not deleted. Refresh the list and verify your administrator session before trying again.");
    }
  };
  const loading = result.key !== key;
  const clearAllLogs = async () => {
    const client = createClient();
    // Match every primary key, independent of the current page and filters.
    const { error } = await client.from("audit_log").delete().not("id", "is", null);
    if (error) throw new Error(error.message);
    invalidateQueries("people");
    setPage(0);
    refresh();
    const { count, error: verifyError } = await client.from("audit_log").select("id", { count: "exact", head: true });
    if (verifyError) throw new Error("Could not verify that all logs were deleted. Please refresh and try again.");
    if (count !== 0) throw new Error("Some logs remain. Refresh the list and verify your administrator session before trying again.");
  };
  return { ...result, audit: loading ? [] : result.audit, loading, page, setPage, query, setQuery, action, setAction, refresh,
    clearLogs, clearAllLogs, deleteLog: (id: string) => clearLogs([id]) };
}
