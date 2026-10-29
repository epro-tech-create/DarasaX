import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/** Verification already returns an authenticated user; avoid another Auth read. */
export async function verifySignupEmail(client: SupabaseClient<Database>, email: string, token: string): Promise<User> {
  const result = await client.auth.verifyOtp({ email, token, type: "signup" });
  if (!result.error) {
    if (!result.data.user) throw new Error("No user");
    return result.data.user;
  }
  const retry = await client.auth.verifyOtp({ email, token, type: "email" });
  if (retry.error) throw result.error;
  if (!retry.data.user) throw new Error("No user");
  return retry.data.user;
}
