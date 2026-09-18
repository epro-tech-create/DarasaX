"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { AuthAlert } from "@/components/auth/auth-alert";
import { AuthShell } from "@/components/auth/auth-shell";
import { AuthSubmitButton } from "@/components/auth/auth-submit-button";
import { OtpInput } from "@/components/auth/otp-input";
import { useResendCooldown } from "@/hooks/use-resend-cooldown";
import { getAuthErrorMessage } from "@/lib/auth/errors";
import { maskEmail, normalizeEmail } from "@/lib/auth/email";
import { AUTH_OTP_LENGTH } from "@/lib/auth/constants";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordVerifyPage() {
  const router = useRouter();
  const cooldown = useResendCooldown(60);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState(
    "If an account exists for this email, we've sent a verification code.",
  );
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem("darasax_recovery_email");
    if (!stored) {
      router.replace("/forgot-password");
      return;
    }
    setEmail(normalizeEmail(stored));
    cooldown.start(60);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  async function verify(token: string) {
    setError("");
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token,
        type: "email",
      });
      if (verifyError) throw verifyError;

      sessionStorage.setItem("darasax_recovery_verified", "1");
      router.replace("/reset-password");
    } catch (err) {
      setError(getAuthErrorMessage(err));
      setOtp("");
    } finally {
      setLoading(false);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (otp.length !== AUTH_OTP_LENGTH) {
      setError(`Enter the ${AUTH_OTP_LENGTH}-digit verification code.`);
      return;
    }
    await verify(otp);
  }

  async function onResend() {
    if (!cooldown.canResend || resending) return;
    setResending(true);
    setError("");
    try {
      const supabase = createClient();
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: false },
      });
      if (otpError) throw otpError;
      setInfo("A new verification code has been sent.");
      cooldown.start(60);
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setResending(false);
    }
  }

  return (
    <AuthShell
      title="Check your email"
      subtitle="Enter the recovery code to continue resetting your password."
    >
      <h1 className="font-heading text-xl font-semibold tracking-tight sm:text-[1.35rem]">
        Check your email
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        We&apos;ve sent a verification code to{" "}
        <span className="font-medium text-foreground">
          {email ? maskEmail(email) : "your email"}
        </span>
      </p>

      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
        {error ? <AuthAlert message={error} /> : null}
        {info ? <AuthAlert message={info} tone="info" /> : null}

        <OtpInput
          value={otp}
          length={AUTH_OTP_LENGTH}
          onChange={(v) => {
            setOtp(v);
            if (v.length === AUTH_OTP_LENGTH) void verify(v);
          }}
          disabled={loading}
          error={!!error}
          autoFocus
        />

        <AuthSubmitButton loading={loading} loadingText="Verifying...">
          Verify Code
        </AuthSubmitButton>

        <div className="text-center">
          <button
            type="button"
            onClick={onResend}
            disabled={!cooldown.canResend || resending}
            className="text-sm font-medium text-primary disabled:text-muted-foreground"
          >
            {resending ? "Sending code..." : cooldown.label}
          </button>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          <Link href="/forgot-password" className="font-medium text-primary">
            Use a different email
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
