import { getStudentAdmission } from "@/lib/auth/admission";
import { randomBytes } from "node:crypto";
import { contentSecurityPolicy } from "@/lib/security-headers";
import { studentPostAuthPath, safeStudentReturnPath } from "@/lib/auth/redirect";
import { studentEnrollmentError } from "@/lib/auth/enrollment";
import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { getProfile } from "@/lib/auth/profile";
import { getStaffProfile } from "@/lib/auth/staff-profile";
import { adminEmailVerified, ADMIN_EMAIL_PATH } from "@/lib/auth/admin-security";
import {
  APP_HOME,
  forbiddenRedirect,
  getAppRole,
  pathAllowedForRole,
  roleFromHost,
} from "@/lib/app-role";

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
    "/pending-approval",
    "/welcome",
  ];
  return roots.some(
    (root) => pathname === root || pathname.startsWith(`${root}/`),
  );
}

async function authorizeRequest(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/sw.js" || pathname === "/manifest.webmanifest") return NextResponse.next();
  if (pathname === "/auth/signout") return NextResponse.next();
  // The callback exchanges and verifies its code and checks membership itself.
  // Reading the old session here adds latency before that exchange can even start.
  if (pathname === "/auth/callback") return NextResponse.next();
  // Share pages and file handlers enforce authentication, approval and class scope themselves.
  if (pathname.startsWith("/share/")) return NextResponse.next();
  // This endpoint verifies the session and database permissions itself.
  if (pathname === "/api/material-files") return NextResponse.next();
  if (pathname === "/api/students/export") return NextResponse.next();
  if (pathname === "/api/admin-security") return NextResponse.next();
  if (pathname === "/api/site-visits") return NextResponse.next();
  if (/^\/(assignments|past-papers)\/[^/]+\.[a-z0-9]+$/i.test(pathname))
    return new NextResponse("Use the private class library to access files.", {
      status: 403,
    });
  const portal = roleFromHost(request.headers.get("host")) ?? getAppRole();
  // Public metadata and the non-personalized landing page need no Auth reads.
  if (["/robots.txt", "/sitemap.xml", "/opengraph-image"].includes(pathname) || (portal === "student" && pathname === "/")) return NextResponse.next();
  // Static assets only: never exempt a protected path because it contains a dot.
  if (
    pathname.startsWith("/brand/") ||
    /^\/[^/]+\.(?:svg|png|jpg|jpeg|webp|ico)$/.test(pathname)
  ) {
    return NextResponse.next();
  }
  const crPath = pathname === "/cr" || pathname.startsWith("/cr/");
  const adminPath = pathname === "/admin" || pathname.startsWith("/admin/");
  const lecturerPath =
    pathname === "/lecturer" || pathname.startsWith("/lecturer/");
  const protectedPath =
    crPath || adminPath || lecturerPath || isStudentProtected(pathname);
  const hasEnv =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!hasEnv) {
    if (protectedPath || pathname.startsWith("/api/")) {
      return new NextResponse("Authentication is temporarily unavailable.", {
        status: 503,
      });
    }
    return NextResponse.next();
  }

  const { supabase, user, supabaseResponse } = await updateSession(request);
  const redirect = (destination: string) => {
    const url = new URL(destination, request.url);
    const response = NextResponse.redirect(url);
    for (const cookie of supabaseResponse.cookies.getAll())
      response.cookies.set(cookie);
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  };
  // Old CR deployments are entry links only; no cross-domain session transfer.
  if (portal === "class_rep") {
    return redirect("https://darasax.com/cr");
  }
  if (pathname === "/register") return redirect(portal === "lecturer" ? "/signup" : "/login");
  if (!pathAllowedForRole(pathname, portal))
    return redirect(forbiddenRedirect(portal));

  // A query failure must not turn staff into a student or grant access.
  let staff;
  let studentContext: Awaited<ReturnType<typeof getProfile>> | null = null;
  let studentAdmission: Awaited<ReturnType<typeof getStudentAdmission>> | null = null;
  const checkStudent = user && portal === "student" && (isStudentProtected(pathname) || pathname === "/login" || pathname === "/signup");
  try {
    if (user) {
      [staff, studentContext, studentAdmission] = await Promise.all([
        getStaffProfile(supabase, user.id),
        checkStudent ? getProfile(supabase, user.id) : null,
        checkStudent ? getStudentAdmission(supabase, user.id) : null,
      ]);
    } else staff = null;
  } catch {
    return new NextResponse(
      "Account access could not be verified. Please try again.",
      { status: 503 },
    );
  }
  const active = staff?.status === "active";
  if (portal === "lecturer" && user && staff?.role === "lecturer" && !active && (lecturerPath || pathname === "/login" || pathname === "/signup")) {
    const { data: application, error } = await supabase.rpc("lecturer_application_status");
    if (error) return new NextResponse("Account access could not be verified.", { status: 503 });
    const state = (application as { status?: string } | null)?.status;
    if (state === "pending" || state === "rejected") return redirect("/lecturer-approval");
  }
  if (portal === "admin" && pathname === ADMIN_EMAIL_PATH) {
    if (!user || !active || staff?.role !== "admin") return redirect("/login");
    supabaseResponse.headers.set("Cache-Control", "private, no-store");
    return supabaseResponse;
  }
  if (portal === "admin" && active && staff?.role === "admin" && (adminPath || pathname === "/login" || pathname === "/")) {
    try { if (!await adminEmailVerified(supabase)) return redirect(ADMIN_EMAIL_PATH); }
    catch { return new NextResponse("Account security could not be verified. Please try again.", { status: 503 }); }
  }
  // Verified users finish lecturer registration before entering the protected workspace.
  if (portal === "lecturer" && !staff && ["/signup", "/verify-email", "/login"].includes(pathname)) {
    supabaseResponse.headers.set("Cache-Control", "private, no-store");
    return supabaseResponse;
  }
  const requiredRole = crPath
    ? "class_rep"
    : adminPath
      ? "admin"
      : lecturerPath
        ? "lecturer"
        : null;
  if (requiredRole && (!user || !active || staff?.role !== requiredRole)) {
    if (!user) return redirect(`/login?next=${encodeURIComponent(pathname)}`);
    return new NextResponse("You do not have access to this workspace.", {
      status: 403,
    });
  }
  if (protectedPath && !user)
    return redirect(`/login?next=${encodeURIComponent(pathname + request.nextUrl.search)}`);
  if (portal !== "student") {
    if (
      user &&
      (!active || staff?.role !== portal) &&
      (protectedPath || pathname === "/login")
    ) {
      return new NextResponse(
        "This account is not authorized for this portal.",
        { status: 403 },
      );
    }
    if (pathname === "/" || (active && pathname === "/login"))
      return redirect(active ? APP_HOME[portal] : "/login");
    return supabaseResponse;
  }
  if (
    staff &&
    (!active || staff.role !== "class_rep") &&
    (protectedPath || pathname === "/login")
  ) {
    if (active && staff.role === "admin") return redirect("https://admin.darasax.com/login");
    return new NextResponse(
      "Use your assigned staff portal or contact your administrator.",
      { status: 403 },
    );
  }
  if (
    active &&
    staff?.role === "class_rep" &&
    (isStudentProtected(pathname) ||
      pathname === "/login" ||
      pathname === "/signup")
  ) {
    return redirect("/cr");
  }
  if (
    user &&
    !staff &&
    (isStudentProtected(pathname) ||
      pathname === "/login" ||
      pathname === "/signup")
  ) {
    const profile = studentContext;
    const admission = studentAdmission;
    const restriction = studentEnrollmentError(profile);
    if (restriction) return new NextResponse(restriction, { status: 403 });
    const { data: registeredClass } = profile?.class_name
      ? await supabase
          .from("academic_classes")
          .select("id,institution,programme,year,semester")
          .eq("id", profile.class_name)
          .eq("archived", false)
          .maybeSingle()
      : { data: null };
    const eligible =
      profile?.onboarding_completed &&
      profile.institution === "Dar es Salaam Institute of Technology (DIT)" &&
      profile.programme === "BENG24COE" &&
      profile.year_of_study === 3 &&
      profile.semester === 1 &&
      registeredClass &&
      registeredClass.institution === profile.institution &&
      registeredClass.programme === profile.programme &&
      registeredClass.year === profile.year_of_study &&
      registeredClass.semester === profile.semester;
    const home = studentPostAuthPath(Boolean(eligible), null, admission);
    const entry = ["/login", "/signup", "/onboarding", "/pending-approval", "/welcome"].includes(pathname);
    if (entry && pathname !== home) {
      return redirect(studentPostAuthPath(Boolean(eligible), request.nextUrl.searchParams.get("next"), admission));
    }
    if (!entry && home !== "/dashboard") {
      return redirect(studentPostAuthPath(Boolean(eligible), safeStudentReturnPath(pathname + request.nextUrl.search), admission));
    }
  }
  supabaseResponse.headers.set("Cache-Control", "private, no-store");
  return supabaseResponse;
}

export async function proxy(request: NextRequest) {
  const nonce = randomBytes(18).toString("base64");
  const policy = contentSecurityPolicy(nonce, process.env.NODE_ENV === "development");
  // Overwrite caller-supplied nonces. Next uses these forwarded headers to
  // nonce its own runtime and inline hydration scripts during dynamic rendering.
  request.headers.set("x-nonce", nonce);
  request.headers.set("Content-Security-Policy", policy);
  const response = await authorizeRequest(request);
  if (response.headers.get("x-middleware-next") === "1") {
    const forwarded = NextResponse.next({ request: { headers: request.headers } });
    forwarded.headers.forEach((value, key) => {
      if (key.startsWith("x-middleware-request-") || key === "x-middleware-override-headers") response.headers.set(key, value);
    });
  }
  if (request.nextUrl.pathname !== "/sw.js") response.headers.set("Content-Security-Policy", policy);
  // Nonce-bearing responses must not be shared between visitors or reused.
  if (!/\.(?:svg|png|jpg|jpeg|webp|ico|webmanifest|js)$/.test(request.nextUrl.pathname)) {
    response.headers.set("Cache-Control", "private, no-store");
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
