const STUDENT_ROUTES = [
  "/dashboard", "/modules", "/assignments", "/timetable", "/past-papers",
  "/announcements", "/planner", "/ask", "/missed", "/profile", "/settings",
];

/** Return URLs are untrusted input, never permission to enter a staff workspace. */
export function safeStudentReturnPath(next: string | null): string | null {
  if (!next || !next.startsWith("/") || next.startsWith("//") || (next.includes("\\") || [...next].some((character) => character.charCodeAt(0) <= 32))) return null;
  try {
    const base = "https://darasax.invalid";
    const url = new URL(next, base);
    if (url.origin !== base) return null;
    const path = decodeURIComponent(url.pathname);
    if (/[\\]/.test(path) || /%2f|%5c/i.test(url.pathname)) return null;
    if (!STUDENT_ROUTES.some((root) => path === root || path.startsWith(`${root}/`))) return null;
    return url.pathname + url.search + url.hash;
  } catch {
    return null;
  }
}

export function studentPostAuthPath(onboardingCompleted: boolean, next: string | null): string {
  if (!onboardingCompleted) return "/onboarding";
  return safeStudentReturnPath(next) ?? "/dashboard";
}
