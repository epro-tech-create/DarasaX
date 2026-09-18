import { RoleGuard } from "@/components/staff/role-guard";
import { StaffShell } from "@/components/staff/staff-shell";
import { adminUser } from "@/data/staff-mock";

export const dynamic = "force-dynamic";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allow="admin">
      <StaffShell
        role="admin"
        userName={adminUser.name}
        userMeta="Programme operations · Port 3006"
      >
        {children}
      </StaffShell>
    </RoleGuard>
  );
}
