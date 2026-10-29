import { getStudentAdmission } from "@/lib/auth/admission";
import { studentEnrollmentError } from "@/lib/auth/enrollment";
import { studentPostAuthPath } from "@/lib/auth/redirect";
import { getStaffProfile } from "@/lib/auth/staff-profile";
import { roleFromHost, getAppRole, APP_HOME } from "@/lib/app-role";
import { after, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminEmailVerified, ADMIN_EMAIL_PATH } from "@/lib/auth/admin-security";
import {
  ensureProfile,
  getProfile,
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
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // The code exchange authenticates this user; a second Auth request is redundant.
      const user = data.user;

      if (user) {
        const portal = roleFromHost(new URL(request.url).host) ?? getAppRole();
        if (portal === "lecturer") {
          const { error: registrationError } = await supabase.rpc("complete_lecturer_registration");
          if (registrationError) {
            await supabase.auth.signOut();
            return NextResponse.redirect(new URL("/login?error=Could%20not%20activate%20lecturer%20account", origin));
          }
        }
        const [staff, savedProfile, admission] = await Promise.all([
          getStaffProfile(supabase, user.id),
          portal === "student" ? getProfile(supabase, user.id) : null,
          portal === "student" ? getStudentAdmission(supabase, user.id) : null,
        ]);
        const recordSignIn = () => after(async () => {
          try {
            const { error } = await supabase.rpc("record_sign_in");
            if (error) console.warn("Sign-in log was not saved.");
          } catch { console.warn("Sign-in log was not saved."); }
        });
        if (portal === "student" && staff?.status === "active" && staff.role === "admin") {
          // Move to the fixed administrator origin; never transfer tokens in a URL.
          return NextResponse.redirect(new URL("https://admin.darasax.com/login"));
        }
        if (portal === "lecturer" && staff?.role === "lecturer" && staff.status !== "active") {
          const { data } = await supabase.rpc("lecturer_application_status");
          const status = (data as { status?: string } | null)?.status;
          if (status === "pending" || status === "rejected") return NextResponse.redirect(new URL("/lecturer-approval", origin));
        }
        if (staff || portal !== "student") {
          const allowed = staff?.status === "active" &&
            staff.role === (portal === "student" ? "class_rep" : portal);
          if (!allowed) {
            await supabase.auth.signOut();
            return NextResponse.redirect(new URL("/login?error=Account%20not%20authorized%20for%20this%20portal", origin));
          }
          if (staff?.role === "admin" && !await adminEmailVerified(supabase)) return NextResponse.redirect(new URL(ADMIN_EMAIL_PATH, origin));
          recordSignIn();
          return NextResponse.redirect(new URL(staff!.role === "lecturer" && !staff!.onboarding_completed ? "/lecturer/onboarding" : APP_HOME[staff!.role], origin));
        }
        const profile = await ensureProfile(supabase, user, savedProfile);
        const restriction = studentEnrollmentError(profile);
        if (restriction) {
          await supabase.auth.signOut();
          const destination = new URL("/login", origin);
          destination.searchParams.set("error", restriction);
          return NextResponse.redirect(destination);
        }
        recordSignIn();
        const dest =
          studentPostAuthPath(profile.onboarding_completed, next, admission);
        return NextResponse.redirect(new URL(dest, origin));
      }
    }
  }

  const url = new URL("/login", origin);
  url.searchParams.set("error", "Something went wrong. Please try again.");
  return NextResponse.redirect(url);
}
