import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getStaffProfile } from "./staff-profile";
import type { StaffRole } from "@/types";

/** Recheck membership on the server before rendering privileged workspace content. */
export async function requireStaff(role: StaffRole) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect("/login");
  const profile = await getStaffProfile(supabase, user.id);
  if (!profile || profile.status !== "active" || profile.role !== role) {
    redirect("/login?error=This%20account%20does%20not%20have%20workspace%20access");
  }
  return profile;
}
