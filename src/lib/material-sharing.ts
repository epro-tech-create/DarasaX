import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getStaffProfile } from "@/lib/auth/staff-profile";
import { getProfile } from "@/lib/auth/profile";
import { getStudentAdmission } from "@/lib/auth/admission";
import { studentPostAuthPath } from "@/lib/auth/redirect";
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
export async function shareClient() { return createClient(); }
export async function requireSharedViewer(destination: string) {
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(destination)}`);
  const staff = await getStaffProfile(client, user.id);
  if (staff?.status === "active") return;
  if (staff) redirect("/login");
  const [profile, admission] = await Promise.all([getProfile(client, user.id), getStudentAdmission(client, user.id)]);
  const target = studentPostAuthPath(Boolean(profile?.onboarding_completed), destination, admission);
  if (target !== destination) redirect(target);
}
export const getSharedMaterial = cache(
  async (token: string): Promise<SharedMaterial | null> => {
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        token,
      )
    )
      return null;
    const { data, error } = await (await shareClient()).rpc(
      "get_shared_material",
      { share_token: token },
    );
    if (error || !data) return null;
    return data as unknown as SharedMaterial;
  },
);
