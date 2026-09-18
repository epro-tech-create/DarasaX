"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { AuthAlert } from "@/components/auth/auth-alert";
import { AuthShell } from "@/components/auth/auth-shell";
import { AuthSubmitButton } from "@/components/auth/auth-submit-button";
import { getAuthErrorMessage } from "@/lib/auth/errors";
import { isValidEmail, normalizeEmail } from "@/lib/auth/email";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    const normalized = normalizeEmail(email);
    if (!isValidEmail(normalized)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      // OTP recovery without creating a new account
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: normalized,
        options: {
          shouldCreateUser: false,
        },
      });

      // Always continue with generic messaging when possible
      if (otpError) {
        const msg = otpError.message.toLowerCase();
        if (
          msg.includes("signups not allowed") ||
          msg.includes("user not found") ||
          msg.includes("unable to validate")
        ) {
          // Soft success path to avoid email enumeration
        } else if (!msg.includes("rate")) {
          // Still proceed for privacy unless hard rate-limit
          throw otpError;
        } else {
          throw otpError;
        }
      }

      sessionStorage.setItem("darasax_recovery_email", normalized);
      router.push("/forgot-password/verify");
    } catch (err) {
      // Privacy-preserving fallback: still route unless rate limited
      const msg = getAuthErrorMessage(err);
      if (msg.includes("Too many")) {
        setError(msg);
      } else {
        sessionStorage.setItem("darasax_recovery_email", normalizeEmail(email));
        router.push("/forgot-password/verify");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Forgot your password?"
      subtitle="Enter your email and we’ll send a verification code to reset it."
    >
      <h1 className="font-heading text-xl font-semibold tracking-tight sm:text-[1.35rem]">
        Forgot your password?
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Enter the email associated with your DarasaX account.
      </p>

      <form className="mt-6 space-y-3.5" onSubmit={onSubmit} noValidate>
        {error ? <AuthAlert message={error} /> : null}

        <label className="block text-sm font-medium">
          Email
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="focus-ring mt-1.5 h-11 w-full rounded-[12px] border border-border bg-card px-3.5 text-sm"
            placeholder="you@student.university.ac.tz"
          />
        </label>

        <AuthSubmitButton loading={loading} loadingText="Sending code...">
          Send Verification Code
        </AuthSubmitButton>
      </form>

      <p className="mt-5 text-center text-sm text-muted-foreground">
        Remembered it?{" "}
        <Link href="/login" className="font-medium text-primary">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
