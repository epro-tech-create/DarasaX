import { redirect } from "next/navigation";
import { studentPostAuthPath } from "@/lib/auth/redirect";
import { getStudentWorkspace } from "@/lib/auth/student-workspace";
import { StudentProfileProvider } from "@/components/providers/student-profile-provider";
import { RoleGuard } from "@/components/staff/role-guard";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { hasMbungeAccess } from "@/lib/auth/mbunge";
import { MessagesProvider } from "@/components/messages/messages-provider";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile, admission } = await getStudentWorkspace();
  if (!user) redirect("/login");
  const gate = studentPostAuthPath(Boolean(profile?.onboarding_completed), null, admission);
  if (gate !== "/dashboard") redirect(gate);
  const isMbunge = await hasMbungeAccess();
  return (
    <RoleGuard allow="student">
      <StudentProfileProvider initialProfile={profile} initialMbunge={isMbunge}>
        <MessagesProvider><DashboardShell>{children}</DashboardShell></MessagesProvider>
      </StudentProfileProvider>
    </RoleGuard>
  );
}
