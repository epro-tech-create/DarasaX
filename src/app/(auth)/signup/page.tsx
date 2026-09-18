"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { AuthAlert } from "@/components/auth/auth-alert";
import { AuthShell } from "@/components/auth/auth-shell";
import { AuthSteps } from "@/components/auth/auth-steps";
import { AuthSubmitButton } from "@/components/auth/auth-submit-button";
import { GoogleButton } from "@/components/auth/google-button";
import { PasswordField } from "@/components/auth/password-field";
import { getAuthErrorMessage } from "@/lib/auth/errors";
import { isValidEmail, normalizeEmail } from "@/lib/auth/email";
import { signInWithGoogle } from "@/lib/auth/oauth";
import { isPasswordStrongEnough } from "@/lib/auth/password";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
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
          emailRedirectTo: `${origin}/auth/callback`,
        },
      });
      if (signUpError) throw signUpError;

      if (data.user && (data.user.identities?.length ?? 0) === 0) {
        setError("An account with this email already exists. Try signing in.");
        return;
      }

      if (data.session) {
        router.replace("/onboarding");
        router.refresh();
        return;
      }

      sessionStorage.setItem("darasax_verify_email", normalized);
      sessionStorage.setItem("darasax_verify_name", name);
      router.push("/verify-email");
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
        `${window.location.origin}/auth/callback`,
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
          Create your
          <br />
          academic home.
        </>
      }
      subtitle="Sign up in minutes, join your class, and keep every module organized from day one."
    >
      <AuthSteps current="account" />
      <h1 className="font-heading text-xl font-semibold tracking-tight sm:text-[15px]">
        Create account
      </h1>
      <p className="mt-1 text-sm text-muted-foreground sm:mt-0.5 sm:text-[11px]">
        Start with your student details.
      </p>

      <form className="mt-5 space-y-3.5 sm:mt-3 sm:space-y-2.5" onSubmit={onSubmit} noValidate>
        {error ? <AuthAlert message={error} /> : null}

        <label className="block text-sm font-medium sm:text-[11px]">
          Full Name
          <input
            required
            autoComplete="name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="focus-ring mt-1.5 h-11 w-full rounded-[10px] border border-border bg-card px-3 text-[15px] sm:mt-1 sm:h-9 sm:rounded-[9px] sm:px-2.5 sm:text-[13px]"
            placeholder="Ezekiel Mwamba"
          />
        </label>

        <label className="block text-sm font-medium sm:text-[11px]">
          Email
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="focus-ring mt-1.5 h-11 w-full rounded-[10px] border border-border bg-card px-3 text-[15px] sm:mt-1 sm:h-9 sm:rounded-[9px] sm:px-2.5 sm:text-[13px]"
            placeholder="you@student.university.ac.tz"
          />
        </label>

        <PasswordField
          id="signup-password"
          label="Password"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          showStrength
        />

        <PasswordField
          id="signup-confirm"
          label="Confirm Password"
          value={confirm}
          onChange={setConfirm}
          autoComplete="new-password"
          error={confirm && confirm !== password ? "Passwords do not match." : undefined}
        />

        <AuthSubmitButton loading={loading} loadingText="Creating account...">
          Create Account
        </AuthSubmitButton>
      </form>

      <div className="my-5 flex items-center gap-3 sm:my-3">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground sm:text-[10px]">OR</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <GoogleButton onClick={onGoogle} loading={googleLoading} />

      <p className="mt-5 text-center text-sm text-muted-foreground sm:mt-3 sm:text-[11px]">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
