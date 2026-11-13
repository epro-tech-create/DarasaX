import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth/profile";
import { getStudentAdmission } from "@/lib/auth/admission";

// Shared only within a React server render, never between requests/accounts.
export const getStudentWorkspace = cache(async () => {
  const client = await createClient();
  // The request proxy already validates the session JWT. getUser() would make
  // another Auth network request on every server-rendered student page and
  // can trigger concurrent refreshes when many pages open together.
  const { data, error } = await client.auth.getClaims();
  const userId = typeof data?.claims?.sub === "string" ? data.claims.sub : null;
  if (error || !userId) return { client, user: null, profile: null, admission: null };
  const [profile, admission] = await Promise.all([
    getProfile(client, userId), getStudentAdmission(client, userId),
  ]);
  return {
    client,
    user: { id: userId, email: typeof data?.claims?.email === "string" ? data.claims.email : "" },
    profile,
    admission,
  };
});
