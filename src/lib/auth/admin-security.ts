import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/** Called only after auth.getUser() has authenticated the request. */
export async function adminEmailVerified(client: SupabaseClient<Database>): Promise<boolean> {
  const { data, error } = await client.rpc("admin_email_verified");
  if (error) throw error;
  return data === true;
}

export const ADMIN_EMAIL_PATH = "/admin-verify-email";
