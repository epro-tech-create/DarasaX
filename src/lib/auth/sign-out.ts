"use client";
import { createClient } from "@/lib/supabase/client";
import { invalidateQueries } from "@/lib/supabase/query-cache";
export async function signOutAndForget(destination: "/login" | "/login?expired=1" = "/login") {
  const response = await fetch("/auth/signout",{method:"POST",credentials:"same-origin",cache:"no-store"});
  if (!response.ok) throw new Error("Could not sign out. Please try again.");
  try { await createClient().auth.signOut({scope:"local"}); } catch { /* Server already expired the session cookies. */ }
  const prefix = `sb-${new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname.split(".")[0]}-auth-token`;
  for (const name of ["localStorage","sessionStorage"] as const) {
    try {
      const storage=window[name];
      for (const key of Object.keys(storage)) if (key.startsWith(prefix) || key.startsWith("darasax_verify_") || key === "darasax_last_active_at" || key === "darasax_lecturer_active_stream" || key === "darasax_topic_progress_v2") storage.removeItem(key);
    } catch { /* Storage may be disabled. */ }
  }
  invalidateQueries("");
  window.dispatchEvent(new Event("darasax:staff-session"));
  // Discard Next's router cache and all account-specific component state.
  window.location.replace(destination);
}
