import { studentEnrollmentError } from "@/lib/auth/enrollment";
import { studentPostAuthPath } from "@/lib/auth/redirect";
import { getStaffProfile } from "@/lib/auth/staff-profile";
import { roleFromHost, getAppRole, APP_HOME } from "@/lib/app-role";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  ensureProfile,
} from "@/lib/auth/profile";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next");
  const errorDescription = searchParams.get("error_description");

  if (errorDescription) {
    const url = new URL("/login", origin);
    url.searchParams.set("error", "Authentication was cancelled or failed.");
    return NextResponse.redirect(url);
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const staff = await getStaffProfile(supabase, user.id);
        const portal = roleFromHost(new URL(request.url).host) ?? getAppRole();
        if (staff || portal !== "student") {
          const allowed = staff?.status === "active" &&
            staff.role === (portal === "student" ? "class_rep" : portal);
          if (!allowed) {
            await supabase.auth.signOut();
            return NextResponse.redirect(new URL("/login?error=Account%20not%20authorized%20for%20this%20portal", origin));
          }
          return NextResponse.redirect(new URL(APP_HOME[staff!.role], origin));
        }
        const profile = await ensureProfile(supabase, user);
        const restriction = studentEnrollmentError(profile);
        if (restriction) {
          await supabase.auth.signOut();
          const destination = new URL("/login", origin);
          destination.searchParams.set("error", restriction);
          return NextResponse.redirect(destination);
        }
        const dest =
          studentPostAuthPath(profile.onboarding_completed, next);
        return NextResponse.redirect(new URL(dest, origin));
      }
    }
  }

  const url = new URL("/login", origin);
  url.searchParams.set("error", "Something went wrong. Please try again.");
  return NextResponse.redirect(url);
}
