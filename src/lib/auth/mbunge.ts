import "server-only";
import { cache } from "react";
import { getStudentWorkspace } from "@/lib/auth/student-workspace";

export const hasMbungeAccess = cache(async () => {
  const { client, user } = await getStudentWorkspace();
  if (!user) return false;
  const { data, error } = await client.rpc("is_mbunge");
  return !error && data === true;
});
