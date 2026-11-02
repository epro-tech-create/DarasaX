import { ClassChat } from "@/components/messages/class-chat";
import { requireStaff } from "@/lib/auth/require-staff";
export default async function Page() {
  const profile = await requireStaff("class_rep");
  return <ClassChat participant={{ id: profile.id, className: profile.stream_id, home: "/cr" }} />;
}
