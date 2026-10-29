import type { SupabaseClient } from "@supabase/supabase-js";

export async function signInWithGoogle(
  supabase: SupabaseClient,
  redirectTo: string,
) {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      skipBrowserRedirect: true,
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

export async function signInWithGitHub(supabase: SupabaseClient, redirectTo: string) {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "github",
    options: { redirectTo, skipBrowserRedirect: true, scopes: "user:email" },
  });
  if (error) throw error;
  if (!data.url) throw new Error("GitHub sign-in did not return a redirect URL.");
  window.location.assign(data.url);
}
