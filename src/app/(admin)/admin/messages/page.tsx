import { ClassChat } from "@/components/messages/class-chat";
import { requireStaff } from "@/lib/auth/require-staff";
export default async function Page() {
  const profile = await requireStaff("admin");
  return <ClassChat participant={{ id: profile.id, className: null, home: "/admin" }} />;
}
