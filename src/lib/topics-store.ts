"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Database, ModuleTopicRow } from "@/types/database";
import type { StaffRole, Topic } from "@/types";

const PROGRESS_KEY = "darasax_topic_progress_v1";

function isConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

function readProgress(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, boolean>;
  } catch {
    return {};
  }
}

function writeProgress(map: Record<string, boolean>) {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(map));
}

function toTopic(row: ModuleTopicRow, completed: boolean): Topic {
  return {
    id: row.id,
    moduleId: row.module_id,
    number: row.number,
    title: row.title,
    durationMinutes: row.duration_minutes,
    completed,
    resourceIds: [],
    summary: row.summary ?? undefined,
  };
}

export type TopicDraft = {
  moduleId: string;
  number: number;
  title: string;
  durationMinutes: number;
  summary?: string;
  published?: boolean;
};

export type TopicUpdate = Partial<TopicDraft>;

export function useTopicsStore() {
  const [rows, setRows] = useState<ModuleTopicRow[]>([]);
  const [ready, setReady] = useState(false);
  const [progressTick, setProgressTick] = useState(0);

  const refresh = useCallback(async () => {
    try {
      if (!isConfigured()) {
        setRows([]);
        return;
      }
      const supabase = createClient();
      const { data, error } = await supabase
        .from("module_topics")
        .select("*")
        .order("module_id")
        .order("number");
      if (error) throw error;
      setRows(data ?? []);
    } catch {
      // Keep previous rows on transient failures.
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === PROGRESS_KEY) setProgressTick((n) => n + 1);
    };
    const onLocal = () => setProgressTick((n) => n + 1);
    window.addEventListener("storage", onStorage);
    window.addEventListener("darasax:topics", onLocal);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("darasax:topics", onLocal);
    };
  }, []);

  const progress = readProgress();
  // Re-read when progressTick changes (localStorage mutations).
  void progressTick;

  const topics: Topic[] = rows
    .filter((r) => r.published)
    .map((r) => toTopic(r, progress[r.id] ?? false))
    .sort((a, b) =>
      a.moduleId === b.moduleId
        ? a.number - b.number
        : a.moduleId.localeCompare(b.moduleId),
    );

  /** All rows for staff editors (includes unpublished). */
  const staffTopics: Topic[] = rows
    .map((r) => toTopic(r, progress[r.id] ?? false))
    .sort((a, b) =>
      a.moduleId === b.moduleId
        ? a.number - b.number
        : a.moduleId.localeCompare(b.moduleId),
    );

  const forModule = useCallback(
    (moduleId: string, opts?: { includeDrafts?: boolean }) => {
      const list = opts?.includeDrafts ? staffTopics : topics;
      return list.filter((t) => t.moduleId === moduleId);
    },
    [topics, staffTopics],
  );

  const setCompleted = useCallback((topicId: string, completed: boolean) => {
    const map = readProgress();
    map[topicId] = completed;
    writeProgress(map);
    setProgressTick((n) => n + 1);
    window.dispatchEvent(new Event("darasax:topics"));
  }, []);

  const createTopic = useCallback(
    async (
      input: TopicDraft & { createdBy: string; role: StaffRole },
    ) => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const id = `topic-${input.moduleId}-${input.number}-${Date.now()}`;
      const { data, error } = await supabase
        .from("module_topics")
        .insert({
          id,
          module_id: input.moduleId,
          number: input.number,
          title: input.title.trim(),
          duration_minutes: input.durationMinutes,
          summary: input.summary?.trim() || null,
          published: input.published ?? true,
          created_by: input.createdBy,
          created_by_id: user?.id ?? null,
          role: input.role,
        })
        .select("*")
        .single();
      if (error) throw error;
      setRows((prev) =>
        [...prev.filter((r) => r.id !== data.id), data].sort(
          (a, b) =>
            a.module_id.localeCompare(b.module_id) || a.number - b.number,
        ),
      );
      return data;
    },
    [],
  );

  const updateTopic = useCallback(async (id: string, patch: TopicUpdate) => {
    const supabase = createClient();
    const dbPatch: Database["public"]["Tables"]["module_topics"]["Update"] = {};
    if (patch.moduleId !== undefined) dbPatch.module_id = patch.moduleId;
    if (patch.number !== undefined) dbPatch.number = patch.number;
    if (patch.title !== undefined) dbPatch.title = patch.title.trim();
    if (patch.durationMinutes !== undefined) {
      dbPatch.duration_minutes = patch.durationMinutes;
    }
    if (patch.summary !== undefined) {
      dbPatch.summary = patch.summary.trim() || null;
    }
    if (patch.published !== undefined) dbPatch.published = patch.published;
    const { data, error } = await supabase
      .from("module_topics")
      .update(dbPatch)
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    setRows((prev) => prev.map((r) => (r.id === id ? data : r)));
    return data;
  }, []);

  const deleteTopic = useCallback(async (id: string) => {
    const supabase = createClient();
    const { error } = await supabase.from("module_topics").delete().eq("id", id);
    if (error) throw error;
    setRows((prev) => prev.filter((r) => r.id !== id));
  }, []);

  return {
    rows,
    topics,
    staffTopics,
    ready,
    refresh,
    forModule,
    setCompleted,
    createTopic,
    updateTopic,
    deleteTopic,
  };
}
