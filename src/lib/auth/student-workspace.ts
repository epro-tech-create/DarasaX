import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth/profile";
import { getStudentAdmission } from "@/lib/auth/admission";

// Shared only within a React server render, never between requests/accounts.
export const getStudentWorkspace = cache(async () => {
  const client = await createClient();
  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user) return { client, user: null, profile: null, admission: null };
  const [profile, admission] = await Promise.all([
    getProfile(client, user.id), getStudentAdmission(client, user.id),
  ]);
  return { client, user, profile, admission };
});
