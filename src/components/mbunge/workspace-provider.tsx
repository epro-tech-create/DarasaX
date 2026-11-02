"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { StaffSessionContext } from "@/lib/staff-session-context";
import type { StaffSession } from "@/lib/staff-auth";
import { createClient } from "@/lib/supabase/client";

/** Adapt verified student capabilities to existing CR editing components. */
export function MbungeWorkspaceProvider({ initialSession, children }: { initialSession: StaffSession; children: ReactNode }) {
  const [session, setSession] = useState<StaffSession | null>(initialSession);
  const router = useRouter();
  const refresh = useCallback(async () => {
    const { data, error } = await createClient().rpc("is_mbunge");
    if (error || data !== true) { setSession(null); router.replace("/dashboard"); router.refresh(); }
  }, [router]);
  useEffect(() => {
    const timer = setInterval(() => { if (document.visibilityState === "visible") void refresh(); }, 30000);
    window.addEventListener("focus", refresh);
    return () => { clearInterval(timer); window.removeEventListener("focus", refresh); };
  }, [refresh]);
  const value = useMemo(() => ({ session, ready: true, refresh }), [session, refresh]);
  return <StaffSessionContext.Provider value={value}>{session ? children : <p role="status">Checking your appointment…</p>}</StaffSessionContext.Provider>;
}
