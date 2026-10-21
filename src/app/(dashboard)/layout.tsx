import { redirect } from "next/navigation";
import { getStudentAdmission } from "@/lib/auth/admission";
import { studentPostAuthPath } from "@/lib/auth/redirect";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth/profile";
import { StudentProfileProvider } from "@/components/providers/student-profile-provider";
import { RoleGuard } from "@/components/staff/role-guard";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const [profile, admission] = await Promise.all([getProfile(supabase, user.id), getStudentAdmission(supabase, user.id)]);
  const gate = studentPostAuthPath(Boolean(profile?.onboarding_completed), null, admission);
  if (gate !== "/dashboard") redirect(gate);
  return (
    <RoleGuard allow="student">
      <StudentProfileProvider initialProfile={profile}>
        <DashboardShell>{children}</DashboardShell>
      </StudentProfileProvider>
    </RoleGuard>
  );
}
