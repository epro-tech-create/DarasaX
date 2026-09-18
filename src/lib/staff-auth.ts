"use client";

import { useCallback, useEffect, useState } from "react";
import type { StaffRole } from "@/types";

const SESSION_EVENT = "darasax:staff-session";

export type StaffSession = {
  role: StaffRole;
  email: string;
  name: string;
};

export async function loginStaff(input: {
  role: StaffRole;
  email: string;
  password: string;
}) {
  const res = await fetch("/api/staff/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = (await res.json()) as {
    ok?: boolean;
    error?: string;
    session?: StaffSession;
  };
  if (!res.ok || !data.ok || !data.session) {
    throw new Error(data.error || "Sign in failed.");
  }
  window.dispatchEvent(new Event(SESSION_EVENT));
  return data.session;
}

export async function registerClassRep(input: {
  name: string;
  email: string;
  password: string;
  streamId: string;
}) {
  const res = await fetch("/api/staff/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = (await res.json()) as {
    ok?: boolean;
    error?: string;
    session?: StaffSession;
  };
  if (!res.ok || !data.ok || !data.session) {
    throw new Error(data.error || "Registration failed.");
  }
  window.dispatchEvent(new Event(SESSION_EVENT));
  return data.session;
}

export async function logoutStaff() {
  await fetch("/api/staff/logout", { method: "POST" });
  window.dispatchEvent(new Event(SESSION_EVENT));
}

export async function fetchStaffSession(): Promise<StaffSession | null> {
  try {
    const res = await fetch("/api/staff/session", { cache: "no-store" });
    if (!res.ok) return null;
    const data = (await res.json()) as { session?: StaffSession | null };
    return data.session ?? null;
  } catch {
    return null;
  }
}

export function useStaffSession() {
  const [session, setSession] = useState<StaffSession | null>(null);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    const next = await fetchStaffSession();
    setSession(next);
    setReady(true);
  }, []);

  useEffect(() => {
    void refresh();
    const onFocus = () => void refresh();
    window.addEventListener(SESSION_EVENT, onFocus);
    window.addEventListener("focus", onFocus);
    return () => {
      window.removeEventListener(SESSION_EVENT, onFocus);
      window.removeEventListener("focus", onFocus);
    };
  }, [refresh]);

  return { session, ready, refresh };
}
