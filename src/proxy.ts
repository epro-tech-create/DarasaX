import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { getProfile } from "@/lib/auth/profile";

const AUTH_ROUTES = new Set([
  "/login",
  "/signup",
  "/verify-email",
  "/forgot-password",
  "/forgot-password/verify",
  "/reset-password",
]);

const PUBLIC_PREFIXES = ["/", "/auth/callback"];

function isPublicPath(pathname: string) {
  if (pathname === "/") return true;
  if (pathname.startsWith("/auth/")) return true;
  if (AUTH_ROUTES.has(pathname)) return true;
  if (pathname.startsWith("/forgot-password")) return true;
  return false;
}

function isProtectedPath(pathname: string) {
  const protectedRoots = [
    "/dashboard",
    "/modules",
    "/assignments",
    "/timetable",
    "/past-papers",
    "/announcements",
    "/planner",
    "/ask",
    "/missed",
    "/profile",
    "/settings",
    "/onboarding",
  ];
  return protectedRoots.some(
    (root) => pathname === root || pathname.startsWith(`${root}/`),
  );
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const hasEnv =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!hasEnv) {
    // Allow app to run without env during local UI work; protect nothing.
    return NextResponse.next();
  }

  const { supabase, user, supabaseResponse } = await updateSession(request);

  if (isProtectedPath(pathname) && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (user && (pathname === "/login" || pathname === "/signup")) {
    const profile = await getProfile(supabase, user.id).catch(() => null);
    const url = request.nextUrl.clone();
    url.pathname = profile?.onboarding_completed ? "/dashboard" : "/onboarding";
    return NextResponse.redirect(url);
  }

  if (user && pathname === "/onboarding") {
    const profile = await getProfile(supabase, user.id).catch(() => null);
    if (profile?.onboarding_completed) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  if (
    user &&
    isProtectedPath(pathname) &&
    pathname !== "/onboarding" &&
    !pathname.startsWith("/auth/")
  ) {
    const profile = await getProfile(supabase, user.id).catch(() => null);
    if (profile && !profile.onboarding_completed) {
      const url = request.nextUrl.clone();
      url.pathname = "/onboarding";
      return NextResponse.redirect(url);
    }
  }

  // Silence unused warning
  void isPublicPath;
  void PUBLIC_PREFIXES;

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
