"use client";

import { TopicsWorkspace } from "@/components/staff/topics-workspace";
import { useStaffSession } from "@/lib/staff-auth";

export default function ClassRepTopicsPage() {
  const { session } = useStaffSession();
  return (
    <TopicsWorkspace
      role="class_rep"
      createdBy={session?.name ?? "Class Rep"}
    />
  );
}
