"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

/** Idle limit. Any click, key, or scroll starts another 10 minutes. */
const IDLE_MS = 10 * 60 * 1000;
const KEY = "darasax_last_active_at";
const FRESH_LOGIN_MS = 20 * 1000;

function isFreshLogin(lastSignInAt: string | undefined) {
  if (!lastSignInAt) return false;
  const at = new Date(lastSignInAt).getTime();
  return Number.isFinite(at) && Date.now() - at < FRESH_LOGIN_MS;
}

async function endSession() {
  try {
    const supabase = createClient();
    await supabase.auth.signOut();
  } catch {
    // Still leave the page so a stale cookie cannot keep the desk open.
  }
  localStorage.removeItem(KEY);
  if (!window.location.pathname.startsWith("/login")) {
    window.location.assign("/login?expired=1");
  }
}

export function SessionTimeout() {
  useEffect(() => {
    let lastWrite = 0;

    async function check() {
      let session: { user: { last_sign_in_at?: string } } | null = null;
      try {
        const supabase = createClient();
        const { data } = await supabase.auth.getSession();
        session = data.session;
      } catch {
        return;
      }
      if (!session) return;

      const stamp = Number(localStorage.getItem(KEY) || 0);
      if (isFreshLogin(session.user.last_sign_in_at)) {
        localStorage.setItem(KEY, String(Date.now()));
        return;
      }
      if (!stamp || Date.now() - stamp > IDLE_MS) {
        await endSession();
      }
    }

    function onActivity() {
      const now = Date.now();
      const stamp = Number(localStorage.getItem(KEY) || 0);
      if (stamp && now - stamp > IDLE_MS) {
        void check();
        return;
      }
      if (now - lastWrite < 10_000) return;
      lastWrite = now;
      localStorage.setItem(KEY, String(now));
    }

    const onVisible = () => {
      if (document.visibilityState === "visible") void check();
    };
    void check();
    const timer = window.setInterval(() => void check(), 15_000);
    const events = ["pointerdown", "keydown", "scroll"] as const;
    events.forEach((event) =>
      window.addEventListener(event, onActivity, { passive: true }),
    );
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      window.clearInterval(timer);
      events.forEach((event) => window.removeEventListener(event, onActivity));
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return null;
}
