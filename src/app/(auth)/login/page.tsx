"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState } from "react";
import { AuthAlert } from "@/components/auth/auth-alert";
import { AuthShell } from "@/components/auth/auth-shell";
import { AuthSubmitButton } from "@/components/auth/auth-submit-button";
import { GoogleButton } from "@/components/auth/google-button";
import { PasswordField } from "@/components/auth/password-field";
import { getAuthErrorMessage } from "@/lib/auth/errors";
import { isValidEmail, normalizeEmail } from "@/lib/auth/email";
import { signInWithGoogle } from "@/lib/auth/oauth";
import {
  ensureProfile,
  getPostAuthRedirect,
} from "@/lib/auth/profile";
import { createClient } from "@/lib/supabase/client";
import { APP_HOME, getAppRole } from "@/lib/app-role";
import {
  getLecturerEntryPath,
  loginStaff,
  useStaffSession,
} from "@/lib/staff-auth";

function StudentLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    const err = searchParams.get("error");
    if (err) setError(err);
  }, [searchParams]);

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

      const profile = await ensureProfile(supabase, data.user);
      const dest = next && next.startsWith("/") ? next : getPostAuthRedirect(profile);
      router.replace(dest);
      router.refresh();
    } catch (err) {
      const msg = getAuthErrorMessage(err);
      if (msg.includes("verify your email")) {
        sessionStorage.setItem("darasax_verify_email", normalizeEmail(email));
        setInfo(msg);
        router.push("/verify-email");
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
      const redirectTo =
        next && next.startsWith("/")
          ? `${origin}/auth/callback?next=${encodeURIComponent(next)}`
          : `${origin}/auth/callback`;
      await signInWithGoogle(supabase, redirectTo);
    } catch (err) {
      setError(getAuthErrorMessage(err));
      setGoogleLoading(false);
    }
  }

  return (
    <>
      <h1 className="font-heading text-xl font-semibold tracking-tight sm:text-lg">
        Welcome back
      </h1>
      <p className="mt-1 text-sm text-muted-foreground sm:mt-0.5 sm:text-xs">
        Log in to continue your semester.
      </p>

      <form className="mt-5 space-y-3.5 sm:mt-4 sm:space-y-3" onSubmit={onSubmit} noValidate>
        {error ? <AuthAlert message={error} /> : null}
        {info ? <AuthAlert message={info} tone="info" /> : null}

        <label className="block text-sm font-medium sm:text-xs">
          Email
          <input
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
          label="Password"
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
        />

        <div className="flex justify-end">
          <Link href="/forgot-password" className="text-sm font-medium text-primary sm:text-xs">
            Forgot password?
          </Link>
        </div>

        <AuthSubmitButton loading={loading} loadingText="Signing in...">
          Sign In
        </AuthSubmitButton>
      </form>

      <div className="my-5 flex items-center gap-3 sm:my-4">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground sm:text-[11px]">OR</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <GoogleButton onClick={onGoogle} loading={googleLoading} />

      <p className="mt-5 text-center text-sm text-muted-foreground sm:mt-4 sm:text-xs">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-medium text-primary">
          Create account
        </Link>
      </p>
    </>
  );
}

function StaffLoginForm({
  role,
}: {
  role: "admin" | "class_rep" | "lecturer";
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next");
  const { session, ready } = useStaffSession();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!ready || !session) return;
    if (session.role === role) {
      const dest =
        role === "lecturer"
          ? getLecturerEntryPath(session)
          : next && next.startsWith("/")
            ? next
            : APP_HOME[role];
      router.replace(dest);
    }
  }, [next, ready, role, router, session]);

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
      const dest =
        role === "lecturer"
          ? getLecturerEntryPath(staffSession)
          : next && next.startsWith("/")
            ? next
            : APP_HOME[role];
      router.replace(dest);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed.");
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
      <h1 className="font-heading text-xl font-semibold tracking-tight sm:text-lg">
        {title}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground sm:mt-0.5 sm:text-xs">
        {blurb}
      </p>

      <form className="mt-5 space-y-3.5 sm:mt-4 sm:space-y-3" onSubmit={onSubmit} noValidate>
        {error ? <AuthAlert message={error} /> : null}

        <label className="block text-sm font-medium sm:text-xs">
          Email
          <input
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
          label="Password"
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
        />

        <AuthSubmitButton loading={loading} loadingText="Signing in...">
          Sign In
        </AuthSubmitButton>
      </form>

      {role === "admin" ? (
        <p className="mt-5 text-center text-sm text-muted-foreground sm:mt-4 sm:text-[11px]">
          No public registration. Contact the system owner for credentials.
        </p>
      ) : (
        <p className="mt-5 text-center text-sm text-muted-foreground sm:mt-4 sm:text-xs">
          {role === "lecturer" ? "New lecturer?" : "New class representative?"}{" "}
          <Link href="/register" className="font-medium text-primary">
            Create an account
          </Link>
        </p>
      )}
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
  const role = getAppRole();
  const staff =
    role === "admin" || role === "class_rep" || role === "lecturer";

  return (
    <AuthShell
      title={
        staff ? (
          role === "admin" ? (
            <>
              Admin desk,
              <br />
              secure access.
            </>
          ) : role === "lecturer" ? (
            <>
              Lecturer desk,
              <br />
              teach and publish.
            </>
          ) : (
            <>
              Class rep desk,
              <br />
              ready for your stream.
            </>
          )
        ) : (
          <>
            Your academic day,
            <br />
            finally clear.
          </>
        )
      }
      subtitle={
        staff
          ? role === "admin"
            ? "Sign in to manage students, class reps, timetable, and materials."
            : role === "lecturer"
              ? "Sign in to upload notes, assign work, and manage module topics."
              : "Sign in to upload materials, edit the timetable, and support your class."
          : "Modules, deadlines, notes and AI study help — ready when you open DarasaX."
      }
    >
      <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-muted" />}>
        <LoginRouter />
      </Suspense>
    </AuthShell>
  );
}
