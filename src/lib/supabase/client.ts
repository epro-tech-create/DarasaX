import { createBrowserClient } from "@supabase/ssr";
import { invalidateQueries } from "./query-cache";
import type { Database } from "@/types/database";
import { captchaFetch } from "@/lib/auth/captcha";

let listening = false;

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (names must include NEXT_PUBLIC_).",
    );
  }
  const client = createBrowserClient<Database>(url, key, { global: { fetch: captchaFetch } });
  if (typeof window !== "undefined" && !listening) {
    listening = true;
    client.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") invalidateQueries("");
    });
  }
  return client;
}
