"use client";

import { useTranslate } from "@/components/providers/language-provider";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { AuthAlert } from "@/components/auth/auth-alert";
import { AuthShell } from "@/components/auth/auth-shell";
import { AuthSubmitButton } from "@/components/auth/auth-submit-button";
import { GoogleButton } from "@/components/auth/google-button";
import { PasswordField } from "@/components/auth/password-field";
import { getAuthErrorMessage } from "@/lib/auth/errors";
import { safeStudentReturnPath } from "@/lib/auth/redirect";
import { isValidEmail, normalizeEmail } from "@/lib/auth/email";
import { signInWithGoogle } from "@/lib/auth/oauth";
import { isPasswordStrongEnough } from "@/lib/auth/password";
import { createClient } from "@/lib/supabase/client";
import { getAppRole } from "@/lib/app-role";

function SignupForm() {
  const translateUI = useTranslate();
  const router = useRouter();
  const lecturer = getAppRole() === "lecturer";
  const next = safeStudentReturnPath(useSearchParams().get("next"));
  const nextQuery = next ? `?next=${encodeURIComponent(next)}` : "";
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    const name = fullName.trim();
    const normalized = normalizeEmail(email);

    if (name.length < 2) {
      setError("Please enter your full name.");
      return;
    }
    if (!isValidEmail(normalized)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!isPasswordStrongEnough(password)) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const origin = window.location.origin;
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: normalized,
        password,
        options: {
          data: { full_name: name },
          emailRedirectTo: `${origin}/auth/callback${nextQuery}`,
        },
      });
      if (signUpError) throw signUpError;

      if (data.user && (data.user.identities?.length ?? 0) === 0) {
        setError("An account with this email already exists. Try signing in.");
        return;
      }

      if (data.session) {
        if (lecturer) {
          const { error: registrationError } = await supabase.rpc("complete_lecturer_registration");
          if (registrationError) throw registrationError;
        }
        router.replace(lecturer ? "/lecturer/onboarding" : `/onboarding${nextQuery}`);
        router.refresh();
        return;
      }

      sessionStorage.setItem("darasax_verify_email", normalized);
      sessionStorage.setItem("darasax_verify_name", name);
      router.push(`/verify-email${nextQuery}`);
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function onGoogle() {
    setError("");
    setGoogleLoading(true);
    try {
      const supabase = createClient();
      await signInWithGoogle(
        supabase,
        `${window.location.origin}/auth/callback${nextQuery}`,
      );
    } catch (err) {
      setError(getAuthErrorMessage(err));
      setGoogleLoading(false);
    }
  }

  return (
    <AuthShell
      title={
        <>
          {translateUI("Create your")}<br />
          {translateUI("academic home.")}</>
      }
      subtitle="Sign up in minutes, join your class, and keep every module organized from day one."
    >
      <h1 className="text-center font-heading text-xl font-semibold tracking-tight">
        {translateUI(lecturer ? "Create lecturer account" : "Create account")}</h1>
      <p className="mt-1 text-center text-sm text-muted-foreground sm:mt-0.5 sm:text-[11px]">
        {translateUI(lecturer ? "Create your account and verify your email to start teaching." : "Start with your student details.")}</p>

      <form className="mt-5 space-y-3.5 sm:mt-3 sm:space-y-2.5" onSubmit={onSubmit} noValidate>
        {error ? <AuthAlert message={translateUI(error)} /> : null}

        <label className="block text-sm font-medium sm:text-[11px]">
          {translateUI("Full Name")}<input
            required
            autoComplete="name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="focus-ring mt-1.5 h-11 w-full rounded-[10px] border border-border bg-card px-3 text-[15px] sm:mt-1 sm:h-9 sm:rounded-[9px] sm:px-2.5 sm:text-[13px]"
            placeholder={translateUI("Ezekiel Mwamba")}
          />
        </label>

        <label className="block text-sm font-medium sm:text-[11px]">
          {translateUI("Email")}<input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="focus-ring mt-1.5 h-11 w-full rounded-[10px] border border-border bg-card px-3 text-[15px] sm:mt-1 sm:h-9 sm:rounded-[9px] sm:px-2.5 sm:text-[13px]"
            placeholder={translateUI("you@student.university.ac.tz")}
          />
        </label>

        <PasswordField
          id="signup-password"
          label={translateUI("Password")}
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          showStrength
        />

        <PasswordField
          id="signup-confirm"
          label={translateUI("Confirm Password")}
          value={confirm}
          onChange={setConfirm}
          autoComplete="new-password"
          error={confirm && confirm !== password ? "Passwords do not match." : undefined}
        />

        <AuthSubmitButton loading={loading} loadingText={translateUI("Creating account...")}>
          {translateUI("Create Account")}</AuthSubmitButton>
      </form>

      {!lecturer && <><div className="my-5 flex items-center gap-3 sm:my-3">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground sm:text-[10px]">{translateUI("OR")}</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <GoogleButton onClick={onGoogle} loading={googleLoading} /></>}

      <p className="mt-5 text-center text-sm text-muted-foreground sm:mt-3 sm:text-[11px]">
        {translateUI("Already have an account?")}{" "}
        <Link href={`/login${nextQuery}`} className="font-medium text-primary">
          {translateUI("Sign in")}</Link>
      </p>
    </AuthShell>
  );
}

export default function SignupPage() { return <Suspense><SignupForm /></Suspense>; }
