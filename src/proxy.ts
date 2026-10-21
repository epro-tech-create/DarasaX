import { getStudentAdmission } from "@/lib/auth/admission";
import { studentPostAuthPath, safeStudentReturnPath } from "@/lib/auth/redirect";
import { studentEnrollmentError } from "@/lib/auth/enrollment";
import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { getProfile } from "@/lib/auth/profile";
import { getStaffProfile } from "@/lib/auth/staff-profile";
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

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/auth/signout") return NextResponse.next();
  // Share pages and file handlers enforce authentication, approval and class scope themselves.
  if (pathname.startsWith("/share/")) return NextResponse.next();
  // This endpoint verifies the session and database permissions itself.
  if (pathname === "/api/material-files") return NextResponse.next();
  if (pathname === "/api/students/export") return NextResponse.next();
  if (pathname === "/api/site-visits") return NextResponse.next();
  if (/^\/(assignments|past-papers)\/[^/]+\.[a-z0-9]+$/i.test(pathname))
    return new NextResponse("Use the private class library to access files.", {
      status: 403,
    });
  const portal = roleFromHost(request.headers.get("host")) ?? getAppRole();
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
  try {
    staff = user ? await getStaffProfile(supabase, user.id) : null;
  } catch {
    return new NextResponse(
      "Account access could not be verified. Please try again.",
      { status: 503 },
    );
  }
  const active = staff?.status === "active";
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
    return redirect(`/login?next=${encodeURIComponent(pathname)}`);
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
    const [profile, admission] = await Promise.all([getProfile(supabase, user.id), getStudentAdmission(supabase, user.id)]);
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

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
