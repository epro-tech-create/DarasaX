"use client";

import { TopicsWorkspace } from "@/components/staff/topics-workspace";
import { useStaffSession } from "@/lib/staff-auth";

export default function LecturerTopicsPage() {
  const { session } = useStaffSession();
  return (
    <TopicsWorkspace
      role="lecturer"
      createdBy={session?.name ?? "Lecturer"}
    />
  );
}
