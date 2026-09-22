import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Database, StaffProfile } from "@/types/database";
import type { StaffRole } from "@/types";

type Client = SupabaseClient<Database>;

export async function getStaffProfile(
  supabase: Client,
  userId: string,
): Promise<StaffProfile | null> {
  const { data, error } = await supabase
    .from("staff_profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/**
 * Ensure a staff_profiles row exists for a Supabase Auth user.
 * The DB trigger (handle_new_staff) creates it from signup metadata;
 * this is the fallback for races or dashboard-created users.
 */
export async function ensureStaffProfile(
  supabase: Client,
  user: User,
  fallback?: { role?: StaffRole; streamId?: string | null; fullName?: string },
): Promise<StaffProfile | null> {
  const existing = await getStaffProfile(supabase, user.id);
  if (existing) return existing;

  const meta = user.user_metadata ?? {};
  const role = (meta.role as StaffRole | undefined) ?? fallback?.role;
  if (role !== "admin" && role !== "class_rep") return null;

  const streamId =
    (meta.stream_id as string | undefined) ?? fallback?.streamId ?? null;
  const fullName =
    (meta.full_name as string | undefined) ??
    (meta.name as string | undefined) ??
    fallback?.fullName ??
    null;

  const { data, error } = await supabase
    .from("staff_profiles")
    .upsert(
      {
        id: user.id,
        role,
        email: user.email ?? null,
        full_name: fullName,
        stream_id: role === "class_rep" ? streamId : null,
        status: "active",
      },
      { onConflict: "id" },
    )
    .select("*")
    .single();

  if (error) {
    const again = await getStaffProfile(supabase, user.id);
    if (again) return again;
    throw error;
  }
  return data;
}
