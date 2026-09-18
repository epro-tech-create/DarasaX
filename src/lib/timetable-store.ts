"use client";

import { useCallback, useEffect, useState } from "react";
import { timetable as seedTimetable } from "@/data/mock";
import type { ClassStreamId, TimetableEntry } from "@/types";

const STORAGE_KEY = "darasax-timetable-v1";

function readStore(): TimetableEntry[] {
  if (typeof window === "undefined") return seedTimetable;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return seedTimetable;
    const parsed = JSON.parse(raw) as TimetableEntry[];
    if (!Array.isArray(parsed) || parsed.length === 0) return seedTimetable;
    return parsed;
  } catch {
    return seedTimetable;
  }
}

function writeStore(entries: TimetableEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  window.dispatchEvent(new Event("darasax:timetable"));
}

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
    (id: string, patch: Partial<Omit<TimetableEntry, "id" | "streamId">>) => {
      setEntries((prev) => {
        const next = prev.map((e) => (e.id === id ? { ...e, ...patch } : e));
        writeStore(next);
        return next;
      });
    },
    [],
  );

  const forStream = useCallback(
    (streamId: ClassStreamId) => entries.filter((e) => e.streamId === streamId),
    [entries],
  );

  return { entries, ready, updateEntry, forStream };
}

export function getTimetableSnapshot(): TimetableEntry[] {
  return readStore();
}
