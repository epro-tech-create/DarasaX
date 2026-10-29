"use client";

import { useCallback, useEffect, useState } from "react";
import { recordAudit } from "@/lib/audit-log";
import { createClient } from "@/lib/supabase/client";
import { cachedQuery, invalidateQueries } from "@/lib/supabase/query-cache";
import type { TimetableRow } from "@/types/database";
import { tanzaniaDate, addDateDays, weekStart, occurrenceEntry } from "@/lib/timetable-dates";
import type { ClassStreamId, TimetableEntry } from "@/types";

function isConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

function toEntry(row: TimetableRow): TimetableEntry {
  return {
    id: row.id,
    streamId: row.stream_id as ClassStreamId,
    moduleId: row.module_id,
    day: row.day,
    startTime: row.start_time,
    endTime: row.end_time,
    room: row.room,
    lecturer: row.lecturer,
  };
}

export type TimetableInput = {
  streamId: ClassStreamId;
  moduleId: string;
  day: number;
  startTime: string;
  endTime: string;
  room: string;
  lecturer: string;
};

export function useTimetableStore(range?: { from: string; to: string }) {
  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const from = range?.from ?? addDateDays(tanzaniaDate(), -28);
  const to = range?.to ?? addDateDays(tanzaniaDate(), 42);

  const refresh = useCallback(async () => {
    try {
      if (!isConfigured()) {
        setEntries([]);
        return;
      }
      const rows = await cachedQuery(`timetable:${from}:${to}`, async () => {
        const supabase = createClient();
        const rows: import("@/lib/timetable-dates").TimetableOccurrence[] = [];
        for (let offset = 0; ; offset += 1000) {
          const { data, error } = await supabase.rpc("get_timetable_occurrences", { range_start: from, range_end: to }).range(offset, offset + 999);
          if (error) throw error;
          rows.push(...(data ?? []));
          if (!data || data.length < 1000) return rows;
        }
      });
      setEntries(rows.map(occurrenceEntry));
      setError("");
    } catch {
      setError("Could not load the current schedule. Please refresh and try again.");
      // Keep previously loaded entries on transient failures.
    } finally {
      setReady(true);
    }
  }, [from, to]);

  useEffect(() => {
    const timer = setTimeout(() => void refresh(), 0);
    const onFocus = () => { invalidateQueries("timetable"); void refresh(); };
    window.addEventListener("focus", onFocus);
    window.addEventListener("darasax:timetable", onFocus);
    const poll = setInterval(() => { if (document.visibilityState === "visible") onFocus(); }, 60000);
    return () => { clearTimeout(timer); clearInterval(poll); window.removeEventListener("focus", onFocus); window.removeEventListener("darasax:timetable", onFocus); };
  }, [refresh]);

  const updateEntry = useCallback(
    async (id: string, patch: Partial<Omit<TimetableEntry, "id">>, change: { date: string; scope: "once" | "future"; newDate: string; status: "scheduled" | "postponed" | "cancelled"; reason: string; requestId: string }) => {
      const supabase = createClient();
      const { error } = await supabase.rpc("change_timetable_session", {
        entry_id: id.split("@")[0], occurrence_date: change.date, change_scope: change.scope,
        new_date: change.newDate, new_start: patch.startTime!, new_end: patch.endTime!,
        new_room: patch.room!, new_lecturer: patch.lecturer!, new_module: patch.moduleId!,
        change_status: change.status, change_reason: change.reason, request_id: change.requestId,
      });
      if (error) throw error;
      invalidateQueries("timetable");
      window.dispatchEvent(new Event("darasax:timetable"));
      await refresh();
    },
    [refresh],
  );

  const addEntry = useCallback(async (input: TimetableInput) => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("timetable_entries")
      .insert({
        id: `tt-${Date.now()}`,
        stream_id: input.streamId,
        module_id: input.moduleId,
        day: input.day,
        start_time: input.startTime,
        end_time: input.endTime,
        room: input.room.trim(),
        lecturer: input.lecturer.trim(),
        created_by: user?.id ?? null,
      })
      .select("*")
      .single();
    if (error) throw error;
    const entry = toEntry(data);
    invalidateQueries("timetable");
    window.dispatchEvent(new Event("darasax:timetable"));
      void refresh();
    await recordAudit({
      action: "timetable_edit",
      summary: `Added timetable session ${entry.startTime}–${entry.endTime}`,
      detail: entry.room,
      streamId: entry.streamId,
    });
    return entry;
  }, [refresh]);

  // Keep the dated history and use the same transaction that cancels queued
  // reminders. Direct deletion is intentionally forbidden by the database.
  const deleteEntry = useCallback(async (entry: TimetableEntry, change: { date: string; scope: "once" | "future"; reason: string; requestId: string }) => {
    await updateEntry(entry.seriesId ?? entry.id, entry, {
      ...change, newDate: change.date, status: "cancelled",
      reason: "",
    });
  }, [updateEntry]);

  const forStream = useCallback(
    (streamId: ClassStreamId) => entries.filter((e) => e.streamId === streamId && (!e.sessionDate || (e.sessionDate >= (range?.from ?? weekStart(tanzaniaDate())) && e.sessionDate <= (range?.to ?? addDateDays(weekStart(tanzaniaDate()), 6))))),
    [entries, range?.from, range?.to],
  );

  return { entries, ready, error, refresh, updateEntry, addEntry, deleteEntry, forStream };
}
