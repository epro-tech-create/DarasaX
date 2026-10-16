import "server-only";
import { cache } from "react";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
export type SharedMaterial = {
  id: string;
  title: string;
  kind: string;
  body: string | null;
  file_path: string;
  file_name: string | null;
  mime_type: string | null;
  size: string | null;
  module_id: string | null;
  created_at: string;
};
export function shareClient(token: string) {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { "x-material-share": token } },
    },
  );
}
export const getSharedMaterial = cache(
  async (token: string): Promise<SharedMaterial | null> => {
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        token,
      )
    )
      return null;
    const { data, error } = await shareClient(token).rpc(
      "get_shared_material",
      { share_token: token },
    );
    if (error || !data) return null;
    return data as unknown as SharedMaterial;
  },
);
