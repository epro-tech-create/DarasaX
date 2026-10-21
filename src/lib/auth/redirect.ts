const STUDENT_ROUTES = [
  "/dashboard", "/modules", "/assignments", "/timetable", "/past-papers",
  "/announcements", "/ask", "/missed", "/profile", "/settings",
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
    const shared = /^\/share\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(?:\/file)?$/i.test(path);
    if (path !== "/join" && !shared && !STUDENT_ROUTES.some((root) => path === root || path.startsWith(`${root}/`))) return null;
    return url.pathname + url.search + url.hash;
  } catch {
    return null;
  }
}

export function studentPostAuthPath(onboardingCompleted: boolean, next: string | null,
  admission?: { status: string; welcome_seen_at: string | null } | null): string {
  const safe = safeStudentReturnPath(next);
  // An invitation has its own authenticated, database-enforced admission flow.
  if (safe && new URL(safe,"https://darasax.invalid").pathname === "/join") return safe;
  const query = safe ? `?next=${encodeURIComponent(safe)}` : "";
  if (!onboardingCompleted) return `/onboarding${query}`;
  if (admission?.status !== "approved") return `/pending-approval${query}`;
  if (!admission.welcome_seen_at) return `/welcome${query}`;
  return safe ?? "/dashboard";
}
