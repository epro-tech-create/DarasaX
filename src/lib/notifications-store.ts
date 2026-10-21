"use client";

import { createContext, createElement, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import type { NotificationItem, NotificationType } from "@/types";

const UPDATE_EVENT = "darasax:notifications";
type Inbox = { userId: string | null; items: NotificationItem[]; unreadCount: number; ready: boolean; error: string };
const emptyInbox: Inbox = { userId: null, items: [], unreadCount: 0, ready: false, error: "" };

/** An authenticated inbox; no shared browser reads or historical-content reconstruction. */
function useNotificationInbox(initialUserId: string | null) {
  const [inbox, setInbox] = useState<Inbox>(emptyInbox);
  useEffect(() => {
    const supabase = createClient();
    let disposed = false;
    let generation = 0;
    // Comes from the authenticated server layout. RLS remains the authority for
    // every read/write; no extra Auth round trip is needed for each poll.
    let userId = initialUserId;
    const refresh = async () => {
      const request = ++generation;
      try {
        if (!userId) { if (!disposed && request === generation) setInbox({ ...emptyInbox, ready: true }); return; }
        const recipient = userId;
        const [list, unread] = await Promise.all([
          supabase.from("notifications").select("*").eq("recipient_id", recipient).order("created_at", { ascending: false }).limit(100),
          supabase.from("notifications").select("id", { count: "exact", head: true }).eq("recipient_id", recipient).is("read_at", null),
        ]);
        if (list.error || unread.error) throw list.error || unread.error;
        if (!disposed && request === generation) setInbox({
          userId: recipient, ready: true, error: "", unreadCount: unread.count ?? 0,
          items: (list.data ?? []).map((row) => ({ id: row.id, title: row.title, body: row.body,
            type: row.type as NotificationType, createdAt: row.created_at, read: row.read_at !== null, href: row.href })),
        });
      } catch {
        if (!disposed && request === generation) setInbox((previous) => ({ ...previous, ready: true, error: "Notifications could not be loaded. Please try again." }));
      }
    };
    const schedule = () => void refresh();
    const initial = setTimeout(schedule, 0);
    const poll = setInterval(() => { if (document.visibilityState === "visible") schedule(); }, 30000);
    let authTimer: ReturnType<typeof setTimeout>;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const nextUserId = session?.user.id ?? null;
      if (event === "SIGNED_OUT" || (event === "SIGNED_IN" && nextUserId !== userId)) {
        userId = event === "SIGNED_OUT" ? null : nextUserId;
        generation++;
        setInbox(emptyInbox);
        clearTimeout(authTimer);
        authTimer = setTimeout(schedule, 0);
      }
    });
    window.addEventListener(UPDATE_EVENT, schedule);
    window.addEventListener("focus", schedule);
    return () => {
      disposed = true; generation++;
      clearTimeout(initial); clearTimeout(authTimer); clearInterval(poll); subscription.unsubscribe();
      window.removeEventListener(UPDATE_EVENT, schedule); window.removeEventListener("focus", schedule);
    };
  }, [initialUserId]);

  const refresh = useCallback(() => window.dispatchEvent(new Event(UPDATE_EVENT)), []);
  const markRead = useCallback(async (id: string) => {
    if (!inbox.userId) return;
    const { error } = await createClient().from("notifications").update({ read_at: new Date().toISOString() })
      .eq("recipient_id", inbox.userId).eq("id", id).is("read_at", null);
    if (error) { setInbox((previous) => ({ ...previous, error: "Could not mark this notification read. Please try again." })); return; }
    refresh();
  }, [inbox.userId, refresh]);
  const markAllRead = useCallback(async () => {
    if (!inbox.userId) return;
    const cutoff = new Date().toISOString();
    const { error } = await createClient().from("notifications").update({ read_at: cutoff })
      .eq("recipient_id", inbox.userId).is("read_at", null).lte("created_at", cutoff);
    if (error) { setInbox((previous) => ({ ...previous, error: "Could not mark notifications read. Please try again." })); return; }
    refresh();
  }, [inbox.userId, refresh]);
  return { ...inbox, markRead, markAllRead, refresh };
}

const NotificationsContext = createContext<ReturnType<typeof useNotificationInbox> | null>(null);

/** One inbox/poller per workspace, shared by desktop/mobile badges and panels. */
export function NotificationsProvider({ userId, children }: { userId: string | null; children: ReactNode }) {
  const inbox = useNotificationInbox(userId);
  return createElement(NotificationsContext.Provider, { value: inbox }, children);
}

export function useNotifications() {
  const inbox = useContext(NotificationsContext);
  if (!inbox) throw new Error("NotificationsProvider is required");
  return inbox;
}
