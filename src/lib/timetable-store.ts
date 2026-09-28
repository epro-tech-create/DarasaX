"use client";

import { useCallback, useEffect, useState } from "react";
import { recordAudit } from "@/lib/audit-log";
import { createClient } from "@/lib/supabase/client";
import { cachedQuery, invalidateQueries } from "@/lib/supabase/query-cache";
import type { Database, TimetableRow } from "@/types/database";
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

export function useTimetableStore() {
  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    try {
      if (!isConfigured()) {
        setEntries([]);
        return;
      }
      const rows = await cachedQuery("timetable:all", async () => {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("timetable_entries")
          .select("*")
          .order("stream_id")
          .order("day")
          .order("start_time");
        if (error) throw error;
        return data ?? [];
      });
      setEntries(rows.map(toEntry));
    } catch {
      // Keep previously loaded entries on transient failures.
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const updateEntry = useCallback(
    async (id: string, patch: Partial<Omit<TimetableEntry, "id">>) => {
      const supabase = createClient();
      const dbPatch: Database["public"]["Tables"]["timetable_entries"]["Update"] = {};
      if (patch.streamId !== undefined) dbPatch.stream_id = patch.streamId;
      if (patch.moduleId !== undefined) dbPatch.module_id = patch.moduleId;
      if (patch.day !== undefined) dbPatch.day = patch.day;
      if (patch.startTime !== undefined) dbPatch.start_time = patch.startTime;
      if (patch.endTime !== undefined) dbPatch.end_time = patch.endTime;
      if (patch.room !== undefined) dbPatch.room = patch.room;
      if (patch.lecturer !== undefined) dbPatch.lecturer = patch.lecturer;
      const { data, error } = await supabase
        .from("timetable_entries")
        .update(dbPatch)
        .eq("id", id)
        .select("*")
        .single();
      if (error) throw error;
      const next = toEntry(data);
      invalidateQueries("timetable");
      setEntries((prev) => prev.map((e) => (e.id === id ? next : e)));
      await recordAudit({
        action: "timetable_edit",
        summary: `Updated timetable session ${next.startTime}–${next.endTime}`,
        detail: next.room,
        streamId: next.streamId,
      });
      return next;
    },
    [],
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
    setEntries((prev) => [...prev, entry]);
    await recordAudit({
      action: "timetable_edit",
      summary: `Added timetable session ${entry.startTime}–${entry.endTime}`,
      detail: entry.room,
      streamId: entry.streamId,
    });
    return entry;
  }, []);

  const deleteEntry = useCallback(async (id: string) => {
    const existing = entries.find((entry) => entry.id === id);
    const supabase = createClient();
    const { error } = await supabase
      .from("timetable_entries")
      .delete()
      .eq("id", id);
    if (error) throw error;
    invalidateQueries("timetable");
    setEntries((prev) => prev.filter((e) => e.id !== id));
    await recordAudit({
      action: "timetable_edit",
      summary: `Removed timetable session ${existing?.startTime ?? ""}`.trim(),
      streamId: existing?.streamId,
    });
  }, [entries]);

  const forStream = useCallback(
    (streamId: ClassStreamId) => entries.filter((e) => e.streamId === streamId),
    [entries],
  );

  return { entries, ready, refresh, updateEntry, addEntry, deleteEntry, forStream };
}
