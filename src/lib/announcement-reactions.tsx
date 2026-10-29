"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";

export const REACTION_OPTIONS = [
  { emoji: "👍", label: "Like" }, { emoji: "❤️", label: "Love" },
  { emoji: "😂", label: "Laugh" }, { emoji: "😮", label: "Surprised" },
  { emoji: "😢", label: "Sad" }, { emoji: "🙏", label: "Thanks" },
] as const;
export type ReactionEmoji = typeof REACTION_OPTIONS[number]["emoji"];
export type ReactionSummary = { material_id: string; emoji: string; reaction_count: number; reacted_by_me: boolean };
type ReactionsContext = {
  rows: ReactionSummary[]; ready: boolean; failed: boolean; busy: Set<string>; errors: Record<string, string>;
  refresh: () => Promise<void>; react: (id: string, emoji: ReactionEmoji | null) => Promise<void>;
};
const Context = createContext<ReactionsContext | null>(null);

/** One batch read for the feed, rather than a request for every card. */
export function AnnouncementReactionsProvider({ announcementIds, children }: { announcementIds: string[]; children: ReactNode }) {
  const key = JSON.stringify([...new Set(announcementIds)].sort());
  const [snapshot, setSnapshot] = useState<{ key: string; rows: ReactionSummary[] }>({ key: "", rows: [] });
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const submitting = useRef(new Set<string>());
  const generation = useRef(0);
  const refresh = useCallback(async () => {
    const request = ++generation.current;
    const ids: string[] = JSON.parse(key);
    try {
      const rows: ReactionSummary[] = [];
      for (let offset = 0; offset < ids.length; offset += 200) {
        const { data, error } = await createClient().rpc("get_announcement_reactions", { announcement_ids: ids.slice(offset, offset + 200) });
        if (error) throw error;
        rows.push(...(data ?? []));
      }
      if (request === generation.current) { setSnapshot({ key, rows }); setFailed(false); }
    } catch { if (request === generation.current) setFailed(true); }
  }, [key]);
  useEffect(() => {
    const update = () => { if (document.visibilityState === "visible") void refresh(); };
    void refresh();
    const poll = setInterval(update, 30000);
    window.addEventListener("focus", update);
    return () => { generation.current++; clearInterval(poll); window.removeEventListener("focus", update); };
  }, [refresh]);

  const react = useCallback(async (id: string, emoji: ReactionEmoji | null) => {
    if (submitting.current.has(id)) return;
    submitting.current.add(id); setBusy(new Set(submitting.current));
    setErrors(previous => ({ ...previous, [id]: "" }));
    try {
      const { error } = await createClient().rpc("set_announcement_reaction", { announcement_id: id, reaction_emoji: emoji });
      if (error) throw error;
      await refresh();
    } catch { setErrors(previous => ({ ...previous, [id]: "Could not save your reaction. Please try again." })); }
    finally { submitting.current.delete(id); setBusy(new Set(submitting.current)); }
  }, [refresh]);
  return <Context.Provider value={{ rows: snapshot.key === key ? snapshot.rows : [], ready: snapshot.key === key, failed, busy, errors, refresh, react }}>{children}</Context.Provider>;
}

export function useAnnouncementReactions() { return useContext(Context); }
