import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth/profile";
import { getStudentAdmission } from "@/lib/auth/admission";
import { studentPostAuthPath } from "@/lib/auth/redirect";

export async function studentEntry(stage: "/pending-approval" | "/welcome", next: string | null) {
  const client = await createClient();
  const { data, error } = await client.auth.getClaims();
  const userId = typeof data?.claims?.sub === "string" ? data.claims.sub : null;
  if (error || !userId) redirect(`/login${next ? `?next=${encodeURIComponent(next)}` : ""}`);
  const [profile, admission] = await Promise.all([getProfile(client, userId), getStudentAdmission(client, userId)]);
  const destination = studentPostAuthPath(Boolean(profile?.onboarding_completed), next, admission);
  if (destination.split("?")[0] !== stage) redirect(destination);
  return { profile, admission };
}
