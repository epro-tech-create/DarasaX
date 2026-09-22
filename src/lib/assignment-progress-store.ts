"use client";

import { useCallback, useEffect, useState } from "react";
import type { Assignment, AssignmentStatus } from "@/types";
import { assignments as mockAssignments } from "@/data/mock";

const KEY = "darasax_assignment_status_v1";

type StatusMap = Record<string, AssignmentStatus>;

function readMap(): StatusMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    return JSON.parse(raw) as StatusMap;
  } catch {
    return {};
  }
}

function writeMap(map: StatusMap) {
  localStorage.setItem(KEY, JSON.stringify(map));
}

export function mergeAssignmentStatus(list: Assignment[]): Assignment[] {
  const map = readMap();
  return list.map((a) => {
    const override = map[a.id];
    if (!override) return a;
    return { ...a, status: override };
  });
}

export function useAssignments() {
  const [items, setItems] = useState<Assignment[]>(() =>
    typeof window === "undefined"
      ? mockAssignments
      : mergeAssignmentStatus(mockAssignments),
  );

  const refresh = useCallback(() => {
    setItems(mergeAssignmentStatus(mockAssignments));
  }, []);

  useEffect(() => {
    refresh();
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) refresh();
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("darasax:assignments", refresh);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("darasax:assignments", refresh);
    };
  }, [refresh]);

  const setStatus = useCallback((id: string, status: AssignmentStatus) => {
    const map = readMap();
    map[id] = status;
    writeMap(map);
    setItems(mergeAssignmentStatus(mockAssignments));
    window.dispatchEvent(new Event("darasax:assignments"));
  }, []);

  const markCompleted = useCallback(
    (id: string) => setStatus(id, "completed"),
    [setStatus],
  );

  return { items, refresh, setStatus, markCompleted };
}
