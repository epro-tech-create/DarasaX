import { createClient } from "@/lib/supabase/server";
import { LecturerApplications, type LecturerApplication } from "@/components/staff/lecturer-applications";
import { requireStaff } from "@/lib/auth/require-staff";

export default async function LecturerApplicationsPage() {
  await requireStaff("admin");
  const client = await createClient();
  const { data, error } = await client.rpc("list_lecturer_applications");
  if (error) throw new Error("Could not load lecturer applications.");
  return <LecturerApplications rows={(Array.isArray(data) ? data : []) as unknown as LecturerApplication[]} />;
}
