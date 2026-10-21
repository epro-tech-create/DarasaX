"use client";

import { useTranslate } from "@/components/providers/language-provider";
import { RoleGuard } from "@/components/staff/role-guard";
import { StaffAuthGuard } from "@/components/staff/staff-auth-guard";
import { StaffShell } from "@/components/staff/staff-shell";
import { useStaffSession } from "@/lib/staff-auth";

export default function ClassRepLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const translateUI = useTranslate();
  const { session } = useStaffSession();

  return (
    <RoleGuard allow="class_rep">
      <StaffAuthGuard allow="class_rep">
        <StaffShell
          role="class_rep"
          userName={session?.name || "Class Rep"}
          userMeta={session?.email || "Class desk"}
        >
          {translateUI(children)}
        </StaffShell>
      </StaffAuthGuard>
    </RoleGuard>
  );
}
