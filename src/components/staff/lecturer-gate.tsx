"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  getLecturerEntryPath,
  useStaffSession,
} from "@/lib/staff-auth";
import {
  getActiveLecturerStream,
  setActiveLecturerStream,
} from "@/lib/lecturer-context";

const BARE_PATHS = new Set([
  "/lecturer/onboarding",
  "/lecturer/select-class",
]);

/**
 * Routes lecturers through onboarding and (when needed) class selection
 * before the teaching desk shell.
 */
export function LecturerGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { session, ready } = useStaffSession();

  useEffect(() => {
    if (!ready || !session || session.role !== "lecturer") return;

    const bare = BARE_PATHS.has(pathname);

    if (!session.onboardingCompleted || session.streamIds.length === 0) {
      if (pathname !== "/lecturer/onboarding") {
        router.replace("/lecturer/onboarding");
      }
      return;
    }

    if (session.streamIds.length === 1) {
      setActiveLecturerStream(session.streamIds[0]);
      if (bare) {
        router.replace("/lecturer");
      }
      return;
    }

    const active = getActiveLecturerStream();
    const hasActive = !!active && session.streamIds.includes(active);

    if (!hasActive && pathname !== "/lecturer/select-class") {
      router.replace("/lecturer/select-class");
      return;
    }

    if (hasActive && pathname === "/lecturer/select-class") {
      router.replace("/lecturer");
    }
  }, [pathname, ready, router, session]);

  if (!ready || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const needsOnboarding =
    !session.onboardingCompleted || session.streamIds.length === 0;
  const needsClassPick =
    session.onboardingCompleted &&
    session.streamIds.length > 1 &&
    !getActiveLecturerStream();

  if (needsOnboarding && pathname !== "/lecturer/onboarding") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (needsClassPick && pathname !== "/lecturer/select-class") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}

export function lecturerHomeOrBare(pathname: string) {
  return BARE_PATHS.has(pathname);
}

export { getLecturerEntryPath };
