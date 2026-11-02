"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useStudentProfile } from "@/components/providers/student-profile-provider";
import { createClient } from "@/lib/supabase/client";

const Context = createContext<{ counts: Record<string, number>; refresh: () => Promise<void> } | null>(null);
export function MessagesProvider({ children }: { children: ReactNode }) {
  const { profile } = useStudentProfile();
  const [counts, setCounts] = useState<Record<string, number>>({});
  const userId = profile?.id;
  const refresh = useCallback(async () => {
    if (!userId) return;
    const { data, error } = await createClient().rpc("chat_unread_counts");
    if (!error && data && !Array.isArray(data) && typeof data === "object") {
      setCounts(Object.fromEntries(Object.entries(data).filter((entry): entry is [string, number] => typeof entry[1] === "number")));
    } else setCounts({});
  }, [userId]);
  useEffect(() => {
    let disposed = false;
    const update = () => { if (!disposed && document.visibilityState === "visible") void refresh(); };
    const timer = setTimeout(update, 0); const poll = setInterval(update, 15000);
    window.addEventListener("focus", update); window.addEventListener("darasax:chat", update);
    return () => { disposed = true; clearTimeout(timer); clearInterval(poll); window.removeEventListener("focus", update); window.removeEventListener("darasax:chat", update); };
  }, [refresh]);
  const value = useMemo(() => ({ counts, refresh }), [counts, refresh]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useMessageCounts() { return useContext(Context); }
