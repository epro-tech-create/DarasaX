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

function LoginForm() {
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
      <h1 className="font-heading text-lg font-semibold tracking-tight">
        Welcome back
      </h1>
      <p className="mt-0.5 text-xs text-muted-foreground">
        Log in to continue your semester.
      </p>

      <form className="mt-4 space-y-3" onSubmit={onSubmit} noValidate>
        {error ? <AuthAlert message={error} /> : null}
        {info ? <AuthAlert message={info} tone="info" /> : null}

        <label className="block text-xs font-medium">
          Email
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="focus-ring mt-1 h-10 w-full rounded-[10px] border border-border bg-card px-3 text-sm"
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
          <Link href="/forgot-password" className="text-xs font-medium text-primary">
            Forgot password?
          </Link>
        </div>

        <AuthSubmitButton loading={loading} loadingText="Signing in...">
          Sign In
        </AuthSubmitButton>
      </form>

      <div className="my-4 flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="text-[11px] text-muted-foreground">OR</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <GoogleButton onClick={onGoogle} loading={googleLoading} />

      <p className="mt-4 text-center text-xs text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-medium text-primary">
          Create account
        </Link>
      </p>
    </>
  );
}

export default function LoginPage() {
  return (
    <AuthShell
      title={
        <>
          Your academic day,
          <br />
          finally clear.
        </>
      }
      subtitle="Modules, deadlines, notes and AI study help — ready when you open DarasaX."
    >
      <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-muted" />}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
