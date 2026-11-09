import { forbidden, redirect } from "next/navigation";
import { studentPostAuthPath } from "@/lib/auth/redirect";
import { getStudentWorkspace } from "@/lib/auth/student-workspace";
import { studentEnrollmentError } from "@/lib/auth/enrollment";
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
  const { client, user, profile, admission } = await getStudentWorkspace();
  if (!user) redirect("/login");
  if (studentEnrollmentError(profile)) forbidden();
  const gate = studentPostAuthPath(Boolean(profile?.onboarding_completed), null, admission);
  if (gate !== "/dashboard") redirect(gate);
  const [isMbunge, classResult] = await Promise.all([
    hasMbungeAccess(),
    profile?.class_name
      ? client
          .from("academic_classes")
          .select("id,institution,programme,year,semester")
          .eq("id", profile.class_name)
          .eq("archived", false)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);
  if (classResult.error) throw classResult.error;
  const registeredClass = classResult.data;
  const eligible = Boolean(
    profile?.onboarding_completed &&
      profile.institution === "Dar es Salaam Institute of Technology (DIT)" &&
      profile.programme === "BENG24COE" &&
      profile.year_of_study === 3 &&
      profile.semester === 1 &&
      registeredClass &&
      registeredClass.institution === profile.institution &&
      registeredClass.programme === profile.programme &&
      registeredClass.year === profile.year_of_study &&
      registeredClass.semester === profile.semester,
  );
  if (!eligible) {
    redirect(studentPostAuthPath(false, "/dashboard", admission));
  }
  return (
    <RoleGuard allow="student">
      <StudentProfileProvider initialProfile={profile} initialMbunge={isMbunge}>
        <MessagesProvider userId={user.id}><DashboardShell>{children}</DashboardShell></MessagesProvider>
      </StudentProfileProvider>
    </RoleGuard>
  );
}
