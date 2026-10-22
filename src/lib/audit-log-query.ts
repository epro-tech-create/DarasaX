import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { AuditAction, AuditLogEntry } from "@/types";

export const AUDIT_PAGE_SIZE = 50;

export function tanzaniaDayBounds(now = new Date()) {
  const date = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Dar_es_Salaam", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  const start = new Date(`${date}T00:00:00+03:00`);
  return { start: start.toISOString(), end: new Date(start.getTime() + 86400000).toISOString() };
}

export function auditSearchFilter(query: string) {
  // Quote PostgREST values; search punctuation and LIKE wildcards literally.
  const literal = query.trim().slice(0, 200).replace(/[\\%_]/g, "\\$&");
  const value = `"%${literal.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}%"`;
  return ["actor", "summary", "detail", "action"].map(field => `${field}.ilike.${value}`).join(",");
}

export async function loadAuditPage(client: SupabaseClient<Database>, { page, query, action, now = new Date() }: {
  page: number; query: string; action: "all" | AuditAction; now?: Date;
}) {
  const { start, end } = tanzaniaDayBounds(now);
  let list = client.from("audit_log").select("*", { count: "exact" });
  if (action !== "all") list = list.eq("action", action);
  if (query.trim()) list = list.or(auditSearchFilter(query));
  const offset = Math.max(0, page) * AUDIT_PAGE_SIZE;
  const [rows, total, today] = await Promise.all([
    list.order("at", { ascending: false }).order("id", { ascending: false }).range(offset, offset + AUDIT_PAGE_SIZE - 1),
    client.from("audit_log").select("id", { count: "exact", head: true }),
    client.from("audit_log").select("id", { count: "exact", head: true }).gte("at", start).lt("at", end),
  ]);
  for (const result of [rows, total, today]) if (result.error) throw result.error;
  const audit: AuditLogEntry[] = (rows.data ?? []).map(row => ({ id: String(row.id), at: row.at,
    actor: row.actor, role: row.role as AuditLogEntry["role"], action: row.action as AuditAction,
    summary: row.summary, detail: row.detail ?? undefined, streamId: row.stream_id ?? undefined }));
  return { audit, totalCount: total.count ?? 0, todayCount: today.count ?? 0, matchingCount: rows.count ?? 0 };
}
