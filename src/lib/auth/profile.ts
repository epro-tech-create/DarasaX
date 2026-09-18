import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Database, Profile } from "@/types/database";

type Client = SupabaseClient<Database>;

export async function getProfile(
  supabase: Client,
  userId: string,
): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function ensureProfile(
  supabase: Client,
  user: User,
): Promise<Profile> {
  const existing = await getProfile(supabase, user.id);
  if (existing) {
    // Fill missing avatar/name from OAuth metadata once, without overwriting edits.
    const meta = user.user_metadata ?? {};
    const patch: Database["public"]["Tables"]["profiles"]["Update"] = {};

    if (!existing.full_name && (meta.full_name || meta.name)) {
      patch.full_name = String(meta.full_name || meta.name);
    }
    if (!existing.avatar_url && meta.avatar_url) {
      patch.avatar_url = String(meta.avatar_url);
    }
    if (!existing.email && user.email) {
      patch.email = user.email;
    }

    if (Object.keys(patch).length > 0) {
      const { data, error } = await supabase
        .from("profiles")
        .update(patch)
        .eq("id", user.id)
        .select("*")
        .single();
      if (error) throw error;
      return data;
    }

    return existing;
  }

  const meta = user.user_metadata ?? {};
  const { data, error } = await supabase
    .from("profiles")
    .insert({
      id: user.id,
      email: user.email ?? null,
      full_name: (meta.full_name || meta.name || null) as string | null,
      avatar_url: (meta.avatar_url || meta.picture || null) as string | null,
      onboarding_completed: false,
    })
    .select("*")
    .single();

  if (error) {
    // Race: profile created by DB trigger
    const again = await getProfile(supabase, user.id);
    if (again) return again;
    throw error;
  }

  return data;
}

export function getPostAuthRedirect(profile: Profile | null): string {
  if (!profile || !profile.onboarding_completed) return "/onboarding";
  return "/dashboard";
}
