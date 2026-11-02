import Link from "next/link";
import { redirect } from "next/navigation";
import { hasMbungeAccess } from "@/lib/auth/mbunge";
import { getStudentWorkspace } from "@/lib/auth/student-workspace";
import { MbungeWorkspaceProvider } from "@/components/mbunge/workspace-provider";

export default async function MbungeLayout({ children }: { children: React.ReactNode }) {
  if (!await hasMbungeAccess()) redirect("/dashboard");
  const { user, profile } = await getStudentWorkspace();
  if (!user || !profile) redirect("/login");
  return <MbungeWorkspaceProvider initialSession={{ id: user.id, name: profile.full_name || "Student", email: user.email || "", role: "class_rep", isMbunge: true, streamId: profile.class_name, streamIds: [], moduleIds: [], onboardingCompleted: true }}>
    <div className="space-y-5">
      <nav aria-label="Mbunge tools" className="flex flex-wrap gap-2">{[{ href: "/mbunge/announcements", label: "Announcements" }, { href: "/mbunge/students", label: "Student list" }, { href: "/mbunge/timetable", label: "Timetable" }, { href: "/mbunge/materials", label: "Class library" }].map(item => <Link className="focus-ring rounded-xl border border-border bg-card px-3 py-2 text-xs font-medium hover:border-primary hover:text-primary" key={item.href} href={item.href}>{item.label}</Link>)}</nav>
      {children}
    </div>
  </MbungeWorkspaceProvider>;
}
