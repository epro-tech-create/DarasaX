"use client";

import { useCallback, useEffect, useState } from "react";
import { recordAudit } from "@/lib/audit-log";
import { createClient } from "@/lib/supabase/client";
import { cachedQuery, invalidateQueries } from "@/lib/supabase/query-cache";
import type { Database, ModuleTopicRow } from "@/types/database";
import type { StaffRole, Topic } from "@/types";

function isConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
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
    content: row.content ?? undefined,
    learningObjectives: row.learning_objectives ?? [],
  };
}

export type TopicDraft = {
  moduleId: string;
  number: number;
  title: string;
  durationMinutes: number;
  summary?: string;
  content?: string;
  learningObjectives?: string[];
  published?: boolean;
};

export type TopicUpdate = Partial<TopicDraft>;

export function useTopicsStore() {
  const [rows, setRows] = useState<ModuleTopicRow[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState<Record<string, boolean>>({});
  const [classCompletions, setClassCompletions] = useState<Database["public"]["Tables"]["class_topic_completion"]["Row"][]>([]);

  const refreshProgress = useCallback(async () => {
    const client = createClient();
    const [personal, classes] = await Promise.all([
      client.from("student_topic_progress").select("topic_id,completed"),
      client.from("class_topic_completion").select("class_id,topic_id"),
    ]);
    if (personal.error || classes.error) {
      setError("Topic progress could not be loaded. Please try again.");
      return;
    }
    setProgress(Object.fromEntries(personal.data.map((row) => [row.topic_id, row.completed])));
    setClassCompletions(classes.data);
  }, []);

  const refresh = useCallback(async () => {
    setReady(false);
    setError("");
    try {
      if (!isConfigured()) {
        setRows([]);
        return;
      }
      const rows = await cachedQuery("topics:all", async () => {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("module_topics")
          .select("*")
          .order("module_id")
          .order("number");
        if (error) throw error;
        return data ?? [];
      });
      setRows(rows);
      await refreshProgress();
    } catch {
      setError("Topics could not be loaded. Please try again.");
    } finally {
      setReady(true);
    }
  }, [refreshProgress]);

  useEffect(() => {
    const timer = setTimeout(() => void refresh(), 0);
    const onFocus = () => void refresh();
    window.addEventListener("focus", onFocus);
    return () => { clearTimeout(timer); window.removeEventListener("focus", onFocus); };
  }, [refresh]);

  useEffect(() => {
    const onProgress = () => void refreshProgress();
    window.addEventListener("darasax:topics", onProgress);
    return () => window.removeEventListener("darasax:topics", onProgress);
  }, [refreshProgress]);

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

  const setCompleted = useCallback(async (topicId: string, completed: boolean) => {
    setError("");
    try {
      const client = createClient();
      const { data: { user } } = await client.auth.getUser();
      if (!user) throw new Error("Sign in required");
      const { error } = await client.from("student_topic_progress").upsert({
        user_id: user.id,
        topic_id: topicId,
        completed,
      });
      if (error) throw error;
      setProgress((previous) => ({ ...previous, [topicId]: completed }));
      window.dispatchEvent(new Event("darasax:topics"));
    } catch {
      setError("Topic progress could not be saved. Please try again.");
    }
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
          content: input.content?.trim() || null,
          learning_objectives: input.learningObjectives ?? [],
          published: input.published ?? true,
          created_by: input.createdBy,
          created_by_id: user?.id ?? null,
          role: input.role,
        })
        .select("*")
        .single();
      if (error) throw error;
      invalidateQueries("topics");
      setRows((prev) =>
        [...prev.filter((r) => r.id !== data.id), data].sort(
          (a, b) =>
            a.module_id.localeCompare(b.module_id) || a.number - b.number,
        ),
      );
      await recordAudit({
        actor: input.createdBy,
        role: input.role,
        action: "publish",
        summary: `Added topic “${data.title}”`,
        detail: data.module_id,
      });
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
    if (patch.content !== undefined) dbPatch.content = patch.content.trim() || null;
    if (patch.learningObjectives !== undefined) dbPatch.learning_objectives = patch.learningObjectives;
    if (patch.published !== undefined) dbPatch.published = patch.published;
    const { data, error } = await supabase
      .from("module_topics")
      .update(dbPatch)
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    invalidateQueries("topics");
    setRows((prev) => prev.map((r) => (r.id === id ? data : r)));
    await recordAudit({
      actor: data.created_by ?? undefined,
      role: data.role ?? undefined,
      action: "publish",
      summary: `Updated topic “${data.title}”`,
      detail: data.module_id,
    });
    return data;
  }, []);

  const deleteTopic = useCallback(async (id: string) => {
    const existing = rows.find((row) => row.id === id);
    const supabase = createClient();
    const { error } = await supabase.from("module_topics").delete().eq("id", id);
    if (error) throw error;
    invalidateQueries("topics");
    setRows((prev) => prev.filter((r) => r.id !== id));
    await recordAudit({
      actor: existing?.created_by ?? undefined,
      role: existing?.role ?? undefined,
      action: "other",
      summary: `Deleted topic “${existing?.title ?? id}”`,
      detail: existing?.module_id,
    });
  }, [rows]);

  return {
    classCompletions,
    rows,
    topics,
    staffTopics,
    ready,
    error,
    refresh,
    forModule,
    setCompleted,
    createTopic,
    updateTopic,
    deleteTopic,
  };
}
