import { ClassChat } from "@/components/messages/class-chat";
import { getStudentWorkspace } from "@/lib/auth/student-workspace";
import { redirect } from "next/navigation";

export default async function MessagesPage() {
  const { user, profile } = await getStudentWorkspace();
  if (!user || !profile) redirect("/login");
  return <ClassChat participant={{ id: user.id, className: profile.class_name, home: "/dashboard" }} />;
}
