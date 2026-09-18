"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useStaffSession } from "@/lib/staff-auth";
import type { StaffRole } from "@/types";

export function StaffAuthGuard({
  allow,
  children,
}: {
  allow: StaffRole;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { session, ready } = useStaffSession();

  useEffect(() => {
    if (!ready) return;
    if (!session || session.role !== allow) {
      const next = encodeURIComponent(pathname || "/");
      router.replace(`/login?next=${next}`);
    }
  }, [allow, pathname, ready, router, session]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!session || session.role !== allow) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <p className="text-[13px] text-muted-foreground">Redirecting to login…</p>
      </div>
    );
  }

  return <>{children}</>;
}
