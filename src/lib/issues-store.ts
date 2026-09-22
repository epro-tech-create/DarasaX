"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { IssueRow } from "@/types/database";
import type {
  ClassStreamId,
  IssueCategory,
  IssueSeverity,
  IssueStatus,
  StaffIssue,
} from "@/types";

function isConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

function toIssue(row: IssueRow): StaffIssue {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category as IssueCategory,
    severity: row.severity as IssueSeverity,
    status: row.status as IssueStatus,
    streamId: (row.stream_id as ClassStreamId | null) ?? undefined,
    moduleId: row.module_id ?? undefined,
    reportedBy: row.reported_by,
    assignee: row.assignee ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export type IssueInput = {
  title: string;
  description: string;
  category?: IssueCategory;
  severity?: IssueSeverity;
  streamId?: ClassStreamId | null;
  moduleId?: string;
  reportedBy: string;
  assignee?: string;
};

export function useIssuesStore() {
  const [items, setItems] = useState<StaffIssue[]>([]);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    try {
      if (!isConfigured()) {
        setItems([]);
        return;
      }
      const supabase = createClient();
      const { data, error } = await supabase
        .from("issues")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setItems((data ?? []).map(toIssue));
    } catch {
      // Keep previously loaded items on transient failures.
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const addIssue = useCallback(async (input: IssueInput) => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("issues")
      .insert({
        id: `iss-${Date.now()}`,
        title: input.title.trim(),
        description: input.description.trim(),
        category: input.category ?? "other",
        severity: input.severity ?? "medium",
        status: "open",
        stream_id: input.streamId ?? null,
        module_id: input.moduleId ?? null,
        reported_by: input.reportedBy,
        reported_by_id: user?.id ?? null,
        assignee: input.assignee ?? null,
      })
      .select("*")
      .single();
    if (error) throw error;
    const issue = toIssue(data);
    setItems((prev) => [issue, ...prev]);
    return issue;
  }, []);

  const setStatus = useCallback(async (id: string, status: IssueStatus) => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("issues")
      .update({ status })
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    const updated = toIssue(data);
    setItems((prev) => prev.map((i) => (i.id === id ? updated : i)));
    return updated;
  }, []);

  const deleteIssue = useCallback(async (id: string) => {
    const supabase = createClient();
    const { error } = await supabase.from("issues").delete().eq("id", id);
    if (error) throw error;
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const forStream = useCallback(
    (streamId: ClassStreamId) =>
      items.filter((i) => !i.streamId || i.streamId === streamId),
    [items],
  );

  return { items, ready, refresh, addIssue, setStatus, deleteIssue, forStream };
}
