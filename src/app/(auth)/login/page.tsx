"use client";
import { getStudentAdmission } from "@/lib/auth/admission";

import { useTranslate } from "@/components/providers/language-provider";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { AuthAlert } from "@/components/auth/auth-alert";
import { AuthShell } from "@/components/auth/auth-shell";
import { AuthSubmitButton } from "@/components/auth/auth-submit-button";
import { GoogleButton } from "@/components/auth/google-button";
import { GitHubButton } from "@/components/auth/github-button";
import { PasswordField } from "@/components/auth/password-field";
import { recordAudit } from "@/lib/audit-log";
import { getAuthErrorMessage } from "@/lib/auth/errors";
import { isValidEmail, normalizeEmail } from "@/lib/auth/email";
import { safeStudentReturnPath, studentPostAuthPath } from "@/lib/auth/redirect";
import { signInWithGoogle } from "@/lib/auth/oauth";
import {
  ensureProfile,
  getProfile,
} from "@/lib/auth/profile";
import { createClient } from "@/lib/supabase/client";
import { studentEnrollmentError } from "@/lib/auth/enrollment";
import { getStaffProfile } from "@/lib/auth/staff-profile";
import { APP_HOME, getAppRole } from "@/lib/app-role";
import { idleTimeoutMessage } from "@/lib/auth/idle-policy";
import { ADMIN_EMAIL_PATH } from "@/lib/auth/admin-security";
import {
  getLecturerEntryPath,
  loginStaff,
} from "@/lib/staff-auth";

function StudentLoginForm() {
  const translateUI = useTranslate();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(() => searchParams.get("error") ?? "");
  const [info, setInfo] = useState(() => searchParams.get("expired") === "1" ? idleTimeoutMessage(getAppRole()) : "");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setInfo("");

    const normalized = normalizeEmail(email);
    if (!isValidEmail(normalized)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: normalized,
        password,
      });
      if (signInError) throw signInError;
      if (!data.user) throw new Error("No user");

      const [staff, savedProfile, admission] = await Promise.all([
        getStaffProfile(supabase, data.user.id),
        getProfile(supabase, data.user.id),
        getStudentAdmission(supabase, data.user.id),
      ]);
      if (staff) {
        if (staff.status === "active" && staff.role === "admin") {
          window.location.assign("https://admin.darasax.com/login");
          return;
        }
        if (staff.status !== "active" || staff.role !== "class_rep") {
          await supabase.auth.signOut();
          throw new Error("Use your assigned portal or contact your administrator.");
        }
        await recordAudit({ action: "login", summary: "Signed in" });
        router.replace("/cr");
        router.refresh();
        return;
      }
      const profile = savedProfile ?? await ensureProfile(supabase, data.user);
      const restriction = studentEnrollmentError(profile);
      if (restriction) { await supabase.auth.signOut(); setError(restriction); return; }
      await recordAudit({
        actor: profile?.full_name ?? normalized,
        role: "student",
        action: "login",
        summary: "Signed in",
      });
      const dest = studentPostAuthPath(profile.onboarding_completed, next, admission);
      router.replace(dest);
      router.refresh();
    } catch (err) {
      const msg = getAuthErrorMessage(err);
      if (msg.includes("verify your email")) {
        sessionStorage.setItem("darasax_verify_email", normalizeEmail(email));
        setInfo(msg);
        router.push(`/verify-email${safeStudentReturnPath(next) ? `?next=${encodeURIComponent(safeStudentReturnPath(next)!)}` : ""}`);
        return;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function onGoogle() {
    setError("");
    setGoogleLoading(true);
    try {
      const supabase = createClient();
      const origin = window.location.origin;
      const returnPath = safeStudentReturnPath(next);
      const redirectTo =
        returnPath
          ? `${origin}/auth/callback?next=${encodeURIComponent(returnPath)}`
          : `${origin}/auth/callback`;
      await signInWithGoogle(supabase, redirectTo);
    } catch (err) {
      setError(getAuthErrorMessage(err));
      setGoogleLoading(false);
    }
  }

  return (
    <>
      <h1 className="text-center font-heading text-xl font-semibold tracking-tight">
        {translateUI("Welcome back")}</h1>
      <p className="mt-1 text-center text-sm text-muted-foreground sm:mt-0.5 sm:text-xs">
        {translateUI("Log in to continue your semester.")}</p>

      <form className="mt-5 space-y-3.5 sm:mt-4 sm:space-y-3" onSubmit={onSubmit} noValidate>
        {error ? <AuthAlert message={translateUI(error)} /> : null}
        {info ? <AuthAlert message={translateUI(info)} tone="info" /> : null}

        <label className="block text-sm font-medium sm:text-xs">
          {translateUI("Email")}<input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="focus-ring mt-1.5 h-11 w-full rounded-[10px] border border-border bg-card px-3 text-[15px] sm:mt-1 sm:h-10 sm:text-sm"
          />
        </label>

        <PasswordField
          id="login-password"
          label={translateUI("Password")}
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
        />

        <div className="flex justify-end">
          <Link href="/forgot-password" className="text-sm font-medium text-primary sm:text-xs">
            {translateUI("Forgot password?")}</Link>
        </div>

        <AuthSubmitButton loading={loading} loadingText={translateUI("Signing in...")}>
          {translateUI("Sign In")}</AuthSubmitButton>
      </form>

      <div className="my-5 flex items-center gap-3 sm:my-4">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground sm:text-[11px]">{translateUI("OR")}</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <div className="space-y-3">
        <GoogleButton onClick={onGoogle} loading={googleLoading} />
        <GitHubButton next={next} disabled={loading || googleLoading} onError={setError} />
      </div>

      <p className="mt-5 text-center text-sm text-muted-foreground sm:mt-4 sm:text-xs">
        {translateUI("Don't have an account?")}{" "}
        <Link href={`/signup${safeStudentReturnPath(next) ? `?next=${encodeURIComponent(safeStudentReturnPath(next)!)}` : ""}`} className="font-medium text-primary">
          {translateUI("Create account")}</Link>
      </p>
    </>
  );
}

function StaffLoginForm({
  role,
}: {
  role: "admin" | "class_rep" | "lecturer";
}) {
  const translateUI = useTranslate();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(() => searchParams.get("error") ?? "");
  const [info] = useState(() => searchParams.get("expired") === "1" ? idleTimeoutMessage(getAppRole()) : "");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    const normalized = normalizeEmail(email);
    if (!isValidEmail(normalized)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);
    try {
      const staffSession = await loginStaff({
        role,
        email: normalized,
        password,
      });
      if (role !== "admin") await recordAudit({
        actor: staffSession.name,
        role: staffSession.role,
        action: "login",
        summary: "Signed in",
        streamId: staffSession.streamId,
      });
      const dest =
        role === "admin" ? ADMIN_EMAIL_PATH : role === "lecturer"
          ? getLecturerEntryPath(staffSession)
          : next && next.startsWith("/") && !next.startsWith("//")
            ? next
            : APP_HOME[role];
      router.replace(dest);
      router.refresh();
    } catch (err) {
      if (role === "lecturer" && err instanceof Error && err.message === "LECTURER_APPROVAL_REQUIRED") {
        router.replace("/lecturer-approval");
        return;
      }
      if (role === "lecturer" && err instanceof Error && err.message.toLowerCase().includes("email not confirmed")) {
        sessionStorage.setItem("darasax_verify_email", normalized);
        router.push("/verify-email");
        return;
      }
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  const title =
    role === "admin"
      ? "Admin sign in"
      : role === "lecturer"
        ? "Lecturer sign in"
        : "Class Rep sign in";
  const blurb =
    role === "admin"
      ? "Restricted access for programme administrators only."
      : role === "lecturer"
        ? "Sign in to publish notes, assignments, and topics to students."
        : "Sign in to manage your stream’s materials and timetable.";

  return (
    <>
      <h1 className="text-center font-heading text-xl font-semibold tracking-tight">
        {translateUI(title)}
      </h1>
      <p className="mt-1 text-center text-sm text-muted-foreground sm:mt-0.5 sm:text-xs">
        {translateUI(blurb)}
      </p>

      <form className="mt-5 space-y-3.5 sm:mt-4 sm:space-y-3" onSubmit={onSubmit} noValidate>
        {info ? <AuthAlert message={translateUI(info)} tone="info" /> : null}
        {error ? <AuthAlert message={translateUI(error)} /> : null}

        <label className="block text-sm font-medium sm:text-xs">
          {translateUI("Email")}<input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="focus-ring mt-1.5 h-11 w-full rounded-[10px] border border-border bg-card px-3 text-[15px] sm:mt-1 sm:h-10 sm:text-sm"
          />
        </label>

        <PasswordField
          id="staff-login-password"
          label={translateUI("Password")}
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
        />

        <AuthSubmitButton loading={loading} loadingText={translateUI("Signing in...")}>
          {translateUI("Sign In")}</AuthSubmitButton>
      </form>

      <div className="mt-4">
        <GitHubButton next={next} disabled={loading} onError={setError} />
      </div>
      <p className="mt-5 text-center text-sm text-muted-foreground">
        {role === "lecturer" || role === "admin" ? <>{translateUI(role === "admin" ? "Invited administrator?" : "New lecturer?")} <Link href="/signup" className="font-medium text-primary">{translateUI("Create account")}</Link></> : translateUI("Staff access is assigned by an administrator. Contact them for access.")}</p>
    </>
  );
}

function LoginRouter() {
  const role = getAppRole();
  if (role === "admin" || role === "class_rep" || role === "lecturer") {
    return <StaffLoginForm role={role} />;
  }
  return <StudentLoginForm />;
}

export default function LoginPage() {
  const translateUI = useTranslate();
  const role = getAppRole();
  const staff =
    role === "admin" || role === "class_rep" || role === "lecturer";

  return (
    <AuthShell
      title={
        staff ? (
          role === "admin" ? (
            <>
              {translateUI("Admin desk,")}<br />
              {translateUI("secure access.")}</>
          ) : role === "lecturer" ? (
            <>
              {translateUI("Lecturer desk,")}<br />
              {translateUI("teach and publish.")}</>
          ) : (
            <>
              {translateUI("Class rep desk,")}<br />
              {translateUI("ready for your stream.")}</>
          )
        ) : (
          <>
            {translateUI("Your academic day,")}<br />
            {translateUI("finally clear.")}</>
        )
      }
      subtitle={
        staff
          ? role === "admin"
            ? translateUI("Sign in to manage students, class reps, timetable, and materials.")
            : role === "lecturer"
              ? translateUI("Sign in to upload notes, assign work, and manage module topics.")
              : translateUI("Sign in to upload materials, edit the timetable, and support your class.")
          : translateUI("Modules, deadlines, notes and AI study help — ready when you open DarasaX.")
      }
    >
      <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-muted" />}>
        <LoginRouter />
      </Suspense>
    </AuthShell>
  );
}
