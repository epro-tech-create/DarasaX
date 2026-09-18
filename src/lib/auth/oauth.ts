import type { SupabaseClient } from "@supabase/supabase-js";

export async function signInWithGoogle(
  supabase: SupabaseClient,
  redirectTo: string,
) {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      queryParams: {
        access_type: "online",
        prompt: "select_account",
      },
    },
  });

  if (error) throw error;

  if (data.url) {
    window.location.assign(data.url);
    return;
  }

  throw new Error("Google sign-in did not return a redirect URL.");
}
