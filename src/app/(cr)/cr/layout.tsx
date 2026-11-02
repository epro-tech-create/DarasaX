import { requireStaff } from "@/lib/auth/require-staff";
import { StaffSessionProvider } from "@/components/providers/staff-session-provider";
import Workspace from "./workspace";
import { MessagesProvider } from "@/components/messages/messages-provider";

export default async function Layout({ children }: { children: React.ReactNode }) {
  const profile = await requireStaff("class_rep");
  return <StaffSessionProvider initialProfile={profile}><MessagesProvider userId={profile.id}><Workspace>{children}</Workspace></MessagesProvider></StaffSessionProvider>;
}
