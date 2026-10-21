import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getStaffProfile } from "@/lib/auth/staff-profile";
import { LecturerApprovalNotice } from "@/components/auth/lecturer-approval-notice";

export default async function LecturerApprovalPage() {
  const client = await createClient();
  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user) redirect("/login");
  const staff = await getStaffProfile(client, user.id);
  if (staff?.role === "lecturer" && staff.status === "active") redirect(staff.onboarding_completed ? "/lecturer" : "/lecturer/onboarding");
  const { data, error: statusError } = await client.rpc("lecturer_application_status");
  if (statusError) throw new Error("Could not load lecturer application.");
  const status = (data as { status?: string } | null)?.status;
  return <LecturerApprovalNotice status={status === "pending" || status === "rejected" ? status : "unavailable"} />;
}
