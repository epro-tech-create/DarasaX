import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getStaffProfile } from "./staff-profile";
import type { StaffRole } from "@/types";
import { adminEmailVerified, ADMIN_EMAIL_PATH } from "./admin-security";

/** Recheck membership on the server before rendering privileged workspace content. */
export const requireStaff = cache(async (role: StaffRole) => {
  const supabase = await createClient();
  const identity = role === "admin"
    ? await supabase.auth.getClaims().then(({ data, error }) => error ? null : data?.claims?.sub)
    : await supabase.auth.getUser().then(({ data, error }) => error ? null : data.user?.id);
  if (!identity) redirect("/login");
  // Administrator verification also checks the current session in auth.sessions.
  const [profile, verified] = await Promise.all([
    getStaffProfile(supabase, identity),
    role === "admin" ? adminEmailVerified(supabase) : true,
  ]);
  if (!profile || profile.status !== "active" || profile.role !== role) {
    redirect("/login?error=This%20account%20does%20not%20have%20workspace%20access");
  }
  if (!verified) redirect(ADMIN_EMAIL_PATH);
  return profile;
});
