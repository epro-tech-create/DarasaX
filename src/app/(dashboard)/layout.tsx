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
  const profile = user ? await getProfile(supabase, user.id) : null;
  return (
    <RoleGuard allow="student">
      <StudentProfileProvider initialProfile={profile}>
        <DashboardShell>{children}</DashboardShell>
      </StudentProfileProvider>
    </RoleGuard>
  );
}
