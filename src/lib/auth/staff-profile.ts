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

async function syncProfileContact(
  supabase: Client,
  existing: StaffProfile,
  user: User,
  fullName?: string | null,
): Promise<StaffProfile> {
  const email = user.email?.trim() || existing.email;
  const name =
    fullName?.trim() ||
    (user.user_metadata?.full_name as string | undefined)?.trim() ||
    (user.user_metadata?.name as string | undefined)?.trim() ||
    existing.full_name;

  const needsEmail = Boolean(email && email !== existing.email);
  const needsName = Boolean(name && name !== existing.full_name);
  if (!needsEmail && !needsName) return existing;

  const { data, error } = await supabase
    .from("staff_profiles")
    .update({
      ...(needsEmail ? { email } : {}),
      ...(needsName ? { full_name: name } : {}),
    })
    .eq("id", user.id)
    .select("*")
    .maybeSingle();

  if (error || !data) return { ...existing, email: email ?? existing.email, full_name: name ?? existing.full_name };
  return data;
}

/**
 * Ensure a staff_profiles row exists for a Supabase Auth user.
 * The DB trigger (handle_new_staff) creates it from signup metadata;
 * this is the fallback for races or dashboard-created users.
 * Always keeps email / name aligned with Auth.
 */
export async function ensureStaffProfile(
  supabase: Client,
  user: User,
  fallback?: { role?: StaffRole; streamId?: string | null; fullName?: string },
): Promise<StaffProfile | null> {
  const existing = await getStaffProfile(supabase, user.id);
  if (existing) {
    return syncProfileContact(supabase, existing, user, fallback?.fullName);
  }

  const meta = user.user_metadata ?? {};
  const role = (meta.role as StaffRole | undefined) ?? fallback?.role;
  if (role !== "admin" && role !== "class_rep" && role !== "lecturer") {
    return null;
  }

  const streamId =
    (meta.stream_id as string | undefined) ?? fallback?.streamId ?? null;
  const fullName =
    (meta.full_name as string | undefined) ??
    (meta.name as string | undefined) ??
    fallback?.fullName ??
    null;
  const email = user.email?.trim() || null;

  const { data, error } = await supabase
    .from("staff_profiles")
    .upsert(
      {
        id: user.id,
        role,
        email,
        full_name: fullName,
        stream_id: role === "class_rep" ? streamId : null,
        stream_ids: role === "class_rep" && streamId ? [streamId] : [],
        module_ids: [],
        onboarding_completed: role === "admin" || role === "class_rep",
        status: "active",
      },
      { onConflict: "id" },
    )
    .select("*")
    .single();

  if (error) {
    const again = await getStaffProfile(supabase, user.id);
    if (again) {
      return syncProfileContact(supabase, again, user, fullName);
    }
    throw error;
  }
  return data;
}
