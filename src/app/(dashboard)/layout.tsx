import { RoleGuard } from "@/components/staff/role-guard";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export const dynamic = "force-dynamic";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard allow="student">
      <DashboardShell>{children}</DashboardShell>
    </RoleGuard>
  );
}
