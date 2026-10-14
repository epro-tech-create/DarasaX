"use client";

import { usePathname } from "next/navigation";
import { RoleGuard } from "@/components/staff/role-guard";
import { StaffAuthGuard } from "@/components/staff/staff-auth-guard";
import { StaffShell } from "@/components/staff/staff-shell";
import {
  LecturerGate,
  lecturerHomeOrBare,
} from "@/components/staff/lecturer-gate";
import { classStreams } from "@/data/mock";
import { useActiveLecturerStream } from "@/lib/lecturer-context";
import { useStaffSession } from "@/lib/staff-auth";

export default function LecturerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { session } = useStaffSession();
  const bare = lecturerHomeOrBare(pathname);
  const { activeStreamId } = useActiveLecturerStream(session?.streamIds ?? []);
  const activeLabel =
    classStreams.find((s) => s.id === activeStreamId)?.label ??
    activeStreamId ??
    null;

  return (
    <RoleGuard allow="lecturer">
      <StaffAuthGuard allow="lecturer">
        <LecturerGate>
          {bare ? (
            children
          ) : (
            <StaffShell
              role="lecturer"
              userName={session?.name || "Lecturer"}
              userMeta={
                activeLabel
                  ? `${session?.email || "Teaching desk"} · ${activeLabel}`
                  : session?.email || "Teaching desk"
              }
              streamIds={session?.streamIds}
              moduleIds={session?.moduleIds}
            >
              {children}
            </StaffShell>
          )}
        </LecturerGate>
      </StaffAuthGuard>
    </RoleGuard>
  );
}
