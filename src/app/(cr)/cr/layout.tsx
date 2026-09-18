import { RoleGuard } from "@/components/staff/role-guard";
import { StaffShell } from "@/components/staff/staff-shell";
import { classRepUser } from "@/data/staff-mock";

export const dynamic = "force-dynamic";

export default function ClassRepLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard allow="class_rep">
      <StaffShell
        role="class_rep"
        userName={classRepUser.name}
        userMeta={`${classRepUser.streamId} · Port 3007`}
      >
        {children}
      </StaffShell>
    </RoleGuard>
  );
}
