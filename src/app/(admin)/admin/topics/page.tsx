"use client";

import { TopicsWorkspace } from "@/components/staff/topics-workspace";
import { useStaffSession } from "@/lib/staff-auth";

export default function AdminTopicsPage() {
  const { session } = useStaffSession();
  return (
    <TopicsWorkspace
      role="admin"
      createdBy={session?.name ?? "Admin"}
    />
  );
}
