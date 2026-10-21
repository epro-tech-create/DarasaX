"use client";

import { useTranslate } from "@/components/providers/language-provider";
import { RoleGuard } from "@/components/staff/role-guard";
import { StaffAuthGuard } from "@/components/staff/staff-auth-guard";
import { StaffShell } from "@/components/staff/staff-shell";
import { useStaffSession } from "@/lib/staff-auth";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const translateUI = useTranslate();
  const { session } = useStaffSession();

  return (
    <RoleGuard allow="admin">
      <StaffAuthGuard allow="admin">
        <StaffShell
          role="admin"
          userName={session?.name || "Admin"}
          userMeta={session?.email || "Programme operations"}
        >
          {translateUI(children)}
        </StaffShell>
      </StaffAuthGuard>
    </RoleGuard>
  );
}
