"use client";

import { useCallback, useEffect, useState } from "react";
import { timetable as seedTimetable } from "@/data/mock";
import type { ClassStreamId, TimetableEntry } from "@/types";

const STORAGE_KEY = "darasax-timetable-v1";

function readStore(): TimetableEntry[] {
  if (typeof window === "undefined") return seedTimetable;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return seedTimetable;
    const parsed = JSON.parse(raw) as TimetableEntry[];
    if (!Array.isArray(parsed)) return seedTimetable;
    return parsed;
  } catch {
    return seedTimetable;
  }
}

function writeStore(entries: TimetableEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  window.dispatchEvent(new Event("darasax:timetable"));
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
  const [entries, setEntries] = useState<TimetableEntry[]>(seedTimetable);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setEntries(readStore());
    setReady(true);
    const sync = () => setEntries(readStore());
    window.addEventListener("storage", sync);
    window.addEventListener("darasax:timetable", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("darasax:timetable", sync);
    };
  }, []);

  const updateEntry = useCallback(
    (id: string, patch: Partial<Omit<TimetableEntry, "id">>) => {
      setEntries((prev) => {
        const next = prev.map((e) => (e.id === id ? { ...e, ...patch } : e));
        writeStore(next);
        return next;
      });
    },
    [],
  );

  const addEntry = useCallback((input: TimetableInput) => {
    const entry: TimetableEntry = {
      id: `tt-${Date.now()}`,
      streamId: input.streamId,
      moduleId: input.moduleId,
      day: input.day,
      startTime: input.startTime,
      endTime: input.endTime,
      room: input.room.trim(),
      lecturer: input.lecturer.trim(),
    };
    setEntries((prev) => {
      const next = [...prev, entry];
      writeStore(next);
      return next;
    });
    return entry;
  }, []);

  const deleteEntry = useCallback((id: string) => {
    setEntries((prev) => {
      const next = prev.filter((e) => e.id !== id);
      writeStore(next);
      return next;
    });
  }, []);

  const forStream = useCallback(
    (streamId: ClassStreamId) => entries.filter((e) => e.streamId === streamId),
    [entries],
  );

  return { entries, ready, updateEntry, addEntry, deleteEntry, forStream };
}

export function getTimetableSnapshot(): TimetableEntry[] {
  return readStore();
}
