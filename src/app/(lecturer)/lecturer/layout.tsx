"use client";

import { RoleGuard } from "@/components/staff/role-guard";
import { StaffAuthGuard } from "@/components/staff/staff-auth-guard";
import { StaffShell } from "@/components/staff/staff-shell";
import { useStaffSession } from "@/lib/staff-auth";

export default function LecturerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session } = useStaffSession();

  return (
    <RoleGuard allow="lecturer">
      <StaffAuthGuard allow="lecturer">
        <StaffShell
          role="lecturer"
          userName={session?.name || "Lecturer"}
          userMeta={session?.email || "Teaching desk"}
        >
          {children}
        </StaffShell>
      </StaffAuthGuard>
    </RoleGuard>
  );
}
