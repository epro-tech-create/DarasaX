"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { countOtherTypists } from "@/lib/chat-typing";

export function useChatTyping(room: string, userId: string | undefined) {
  const [activity, setActivity] = useState({ room: "", userId: "", count: 0 });
  const updateRef = useRef<(typing: boolean) => void>(() => {});

  useEffect(() => {
    if (!room || !userId) return;
    const client = createClient();
    const channel = client.channel(`darasax:typing:${room}`, { config: { private: true, presence: { key: `${userId}:${crypto.randomUUID()}` } } });
    let disposed = false;
    let subscribed = false;
    let typing = false;
    let lastActivity = 0;
    let lastPublish = 0;
    let publishedTyping = false;
    let idle: ReturnType<typeof setTimeout> | undefined;
    const publish = (value: boolean) => {
      if (!subscribed || disposed) return;
      const now = Date.now();
      if (value === publishedTyping && (!value || now - lastPublish < 1500)) return;
      lastPublish = now; publishedTyping = value;
      void channel.track({ user_id: userId, typing: value, updated_at: now }).catch(() => {});
    };
    const update = (value: boolean) => {
      clearTimeout(idle);
      typing = value;
      if (value) lastActivity = Date.now();
      publish(value);
      if (value) idle = setTimeout(() => { typing = false; publish(false); }, 2500);
    };
    updateRef.current = update;
    const sync = () => {
      if (disposed) return;
      const count = subscribed ? countOtherTypists(channel.presenceState(), userId, Date.now()) : 0;
      setActivity(previous => previous.room === room && previous.userId === userId && previous.count === count ? previous : { room, userId, count });
    };
    channel.on("presence", { event: "sync" }, sync).subscribe(status => {
      if (disposed) return;
      subscribed = status === "SUBSCRIBED";
      if (subscribed) {
        // A reconnect must resend the current flag, not stale typing activity.
        publishedTyping = false; lastPublish = 0;
        if (typing && Date.now() - lastActivity < 2500) publish(true);
      }
      sync();
    });
    const expire = setInterval(sync, 1000);
    const stop = () => update(false);
    const visibility = () => { if (document.visibilityState !== "visible") stop(); };
    window.addEventListener("blur", stop);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      update(false); disposed = true; updateRef.current = () => {};
      clearTimeout(idle); clearInterval(expire);
      window.removeEventListener("blur", stop);
      document.removeEventListener("visibilitychange", visibility);
      void client.removeChannel(channel).catch(() => {});
    };
  }, [room, userId]);

  const updateTyping = useCallback((text: string) => updateRef.current(Boolean(text.trim())), []);
  const stopTyping = useCallback(() => updateRef.current(false), []);
  return { typingCount: activity.room === room && activity.userId === userId ? activity.count : 0, updateTyping, stopTyping };
}
