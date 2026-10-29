"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getLecturerEntryPath, useStaffSession } from "@/lib/staff-auth";

const BARE_PATHS = new Set(["/lecturer/onboarding", "/lecturer/select-class"]);

export function LecturerGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { session, ready } = useStaffSession();
  const needsOnboarding = !!session && (!session.onboardingCompleted || !session.streamIds.length);
  useEffect(() => {
    if (!ready || !session || session.role !== "lecturer") return;
    if (needsOnboarding && pathname !== "/lecturer/onboarding") router.replace("/lecturer/onboarding");
    else if (!needsOnboarding && BARE_PATHS.has(pathname)) router.replace("/lecturer");
  }, [ready, session, needsOnboarding, pathname, router]);
  if (!ready || !session || (needsOnboarding && pathname !== "/lecturer/onboarding")) {
    return <div className="flex min-h-screen items-center justify-center bg-background"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;
  }
  return <>{children}</>;
}
export function lecturerHomeOrBare(pathname: string) { return BARE_PATHS.has(pathname); }
export { getLecturerEntryPath };
