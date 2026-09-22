import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { getProfile } from "@/lib/auth/profile";
import { getStaffProfile } from "@/lib/auth/staff-profile";
import {
  APP_HOME,
  forbiddenRedirect,
  getAppRole,
  pathAllowedForRole,
} from "@/lib/app-role";

const AUTH_ROUTES = new Set([
  "/login",
  "/signup",
  "/register",
  "/verify-email",
  "/forgot-password",
  "/forgot-password/verify",
  "/reset-password",
]);

function isAuthPath(pathname: string) {
  if (AUTH_ROUTES.has(pathname)) return true;
  if (pathname.startsWith("/forgot-password")) return true;
  if (pathname.startsWith("/auth/")) return true;
  return false;
}

function isStudentProtected(pathname: string) {
  const roots = [
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
  return roots.some((root) => pathname === root || pathname.startsWith(`${root}/`));
}

function isStaffProtected(pathname: string, role: "admin" | "class_rep") {
  const root = role === "admin" ? "/admin" : "/cr";
  return pathname === root || pathname.startsWith(`${root}/`);
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const appRole = getAppRole();

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Hard role isolation — always on, even without Supabase.
  if (!pathAllowedForRole(pathname, appRole)) {
    const url = request.nextUrl.clone();
    url.pathname = forbiddenRedirect(appRole);
    url.search = "";
    const res = NextResponse.redirect(url);
    res.headers.set("x-darasax-role", appRole);
    res.headers.set("x-darasax-denied", pathname);
    return res;
  }

  const hasEnv =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Staff apps: gate protected routes with the Supabase staff session.
  if (appRole === "admin" || appRole === "class_rep") {
    if (!hasEnv) {
      const res = NextResponse.next();
      res.headers.set("x-darasax-role", appRole);
      return res;
    }
    const { supabase, user, supabaseResponse } =
      await updateSession(request);
    const staffProfile = user
      ? await getStaffProfile(supabase, user.id).catch(() => null)
      : null;
    const staffAuthed =
      !!user &&
      !!staffProfile &&
      staffProfile.role === appRole &&
      staffProfile.status === "active";

    if (pathname === "/" || pathname === "") {
      const url = request.nextUrl.clone();
      url.pathname = staffAuthed ? APP_HOME[appRole] : "/login";
      return NextResponse.redirect(url);
    }

    if (isStaffProtected(pathname, appRole) && !staffAuthed) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }

    if (
      staffAuthed &&
      (pathname === "/login" || pathname === "/register")
    ) {
      const url = request.nextUrl.clone();
      url.pathname = APP_HOME[appRole];
      url.search = "";
      return NextResponse.redirect(url);
    }

    const res = supabaseResponse;
    res.headers.set("x-darasax-role", appRole);
    return res;
  }

  if (!hasEnv) {
    const res = NextResponse.next();
    res.headers.set("x-darasax-role", appRole);
    return res;
  }

  const { supabase, user, supabaseResponse } = await updateSession(request);
  supabaseResponse.headers.set("x-darasax-role", appRole);

  const needsAuth = isStudentProtected(pathname);

  if (needsAuth && !user) {
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

  if (appRole === "student" && user && pathname === "/onboarding") {
    const profile = await getProfile(supabase, user.id).catch(() => null);
    if (profile?.onboarding_completed) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  if (
    appRole === "student" &&
    user &&
    needsAuth &&
    pathname !== "/onboarding" &&
    !isAuthPath(pathname)
  ) {
    const profile = await getProfile(supabase, user.id).catch(() => null);
    if (profile && !profile.onboarding_completed) {
      const url = request.nextUrl.clone();
      url.pathname = "/onboarding";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
