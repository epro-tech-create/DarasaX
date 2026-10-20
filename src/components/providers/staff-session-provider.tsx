"use client";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { StaffSessionContext } from "@/lib/staff-session-context";
import { fetchStaffSession, toSession, type StaffSession } from "@/lib/staff-auth";
import { createClient } from "@/lib/supabase/client";
import type { StaffProfile } from "@/types/database";

export function StaffSessionProvider({ initialProfile, children }: { initialProfile: StaffProfile; children: ReactNode }) {
  // The server has already verified this profile; do not fetch it again on mount.
  const [session, setSession] = useState<StaffSession | null>(() => toSession(initialProfile));
  const generation = useRef(0);
  const refresh = useCallback(async () => {
    const request = generation.current;
    const next = await fetchStaffSession();
    if (request === generation.current) setSession(next);
  }, []);
  useEffect(() => {
    const update = () => void refresh();
    window.addEventListener("focus", update);
    window.addEventListener("darasax:staff-session", update);
    const { data } = createClient().auth.onAuthStateChange(event => {
      if (event === "SIGNED_OUT") { generation.current++; setSession(null); }
    });
    return () => { window.removeEventListener("focus", update); window.removeEventListener("darasax:staff-session", update); data.subscription.unsubscribe(); };
  }, [refresh]);
  const value = useMemo(() => ({ session, ready: true, refresh }), [session, refresh]);
  return <StaffSessionContext.Provider value={value}>{children}</StaffSessionContext.Provider>;
}
