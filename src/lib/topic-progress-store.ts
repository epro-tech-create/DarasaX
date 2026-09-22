"use client";

import { useCallback, useEffect, useState } from "react";
import type { Topic } from "@/types";
import { topics as mockTopics } from "@/data/mock";

const KEY = "darasax_topic_progress_v1";

type ProgressMap = Record<string, boolean>;

function readMap(): ProgressMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    return JSON.parse(raw) as ProgressMap;
  } catch {
    return {};
  }
}

function writeMap(map: ProgressMap) {
  localStorage.setItem(KEY, JSON.stringify(map));
}

/** Seed from mock once, then respect user toggles. */
function mergedTopics(): Topic[] {
  const map = readMap();
  const seeded = { ...map };
  let dirty = false;
  for (const t of mockTopics) {
    if (seeded[t.id] === undefined) {
      seeded[t.id] = t.completed;
      dirty = true;
    }
  }
  if (dirty && typeof window !== "undefined") writeMap(seeded);
  return mockTopics.map((t) => ({
    ...t,
    completed: seeded[t.id] ?? t.completed,
  }));
}

export function getTopicsProgressForModule(moduleId: string): Topic[] {
  return mergedTopics().filter((t) => t.moduleId === moduleId);
}

export function useTopicProgress() {
  const [topics, setTopics] = useState<Topic[]>(() =>
    typeof window === "undefined" ? mockTopics : mergedTopics(),
  );

  const refresh = useCallback(() => {
    setTopics(mergedTopics());
  }, []);

  useEffect(() => {
    refresh();
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) refresh();
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("darasax:topics", refresh);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("darasax:topics", refresh);
    };
  }, [refresh]);

  const setCompleted = useCallback((topicId: string, completed: boolean) => {
    const map = readMap();
    map[topicId] = completed;
    writeMap(map);
    setTopics(mergedTopics());
    window.dispatchEvent(new Event("darasax:topics"));
  }, []);

  const forModule = useCallback(
    (moduleId: string) => topics.filter((t) => t.moduleId === moduleId),
    [topics],
  );

  return { topics, forModule, setCompleted, refresh };
}
