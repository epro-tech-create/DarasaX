"use client";

import { RoleGuard } from "@/components/staff/role-guard";
import { StaffAuthGuard } from "@/components/staff/staff-auth-guard";
import { StaffShell } from "@/components/staff/staff-shell";
import { useStaffSession } from "@/lib/staff-auth";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { session } = useStaffSession();

  return (
    <RoleGuard allow="admin">
      <StaffAuthGuard allow="admin">
        <StaffShell
          role="admin"
          userName={session?.name || "Admin"}
          userMeta={session?.email || "Programme operations"}
        >
          {children}
        </StaffShell>
      </StaffAuthGuard>
    </RoleGuard>
  );
}
