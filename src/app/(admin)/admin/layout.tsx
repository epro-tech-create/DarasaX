import { requireStaff } from "@/lib/auth/require-staff";
import { StaffSessionProvider } from "@/components/providers/staff-session-provider";
import Workspace from "./workspace";

export default async function Layout({ children }: { children: React.ReactNode }) {
  const profile = await requireStaff("admin");
  return <StaffSessionProvider initialProfile={profile}><Workspace>{children}</Workspace></StaffSessionProvider>;
}
