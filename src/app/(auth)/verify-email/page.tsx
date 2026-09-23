"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { AuthAlert } from "@/components/auth/auth-alert";
import { AuthShell } from "@/components/auth/auth-shell";
import { AuthSteps } from "@/components/auth/auth-steps";
import { AuthSubmitButton } from "@/components/auth/auth-submit-button";
import { OtpInput } from "@/components/auth/otp-input";
import { WelcomeCelebration } from "@/components/auth/welcome-celebration";
import { useResendCooldown } from "@/hooks/use-resend-cooldown";
import { getAuthErrorMessage } from "@/lib/auth/errors";
import { maskEmail, normalizeEmail } from "@/lib/auth/email";
import {
  ensureProfile,
  getPostAuthRedirect,
} from "@/lib/auth/profile";
import { ensureStaffProfile } from "@/lib/auth/staff-profile";
import { APP_HOME, getAppRole } from "@/lib/app-role";
import { AUTH_OTP_LENGTH } from "@/lib/auth/constants";
import { createClient } from "@/lib/supabase/client";

export default function VerifyEmailPage() {
  const router = useRouter();
  const appRole = getAppRole();
  const staffRole =
    appRole === "admin" || appRole === "class_rep" || appRole === "lecturer"
      ? appRole
      : null;
  const cooldown = useResendCooldown(60);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [continueTo, setContinueTo] = useState("/onboarding");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [info, setInfo] = useState("");

  useEffect(() => {
    const stored = sessionStorage.getItem("darasax_verify_email");
    if (!stored) {
      router.replace(
        staffRole === "class_rep" || staffRole === "lecturer"
          ? "/register"
          : staffRole
            ? "/login"
            : "/signup",
      );
      return;
    }
    setEmail(normalizeEmail(stored));
    cooldown.start(60);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  async function verify(token: string) {
    setError("");
    setInfo("");
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token,
        type: "signup",
      });

      if (verifyError) {
        const retry = await supabase.auth.verifyOtp({
          email,
          token,
          type: "email",
        });
        if (retry.error) throw verifyError;
        if (!retry.data.user) throw new Error("No user");
        if (staffRole) {
          await ensureStaffProfile(supabase, retry.data.user, { role: staffRole });
        } else {
          await ensureProfile(supabase, retry.data.user);
        }
      } else if (data.user) {
        if (staffRole) {
          await ensureStaffProfile(supabase, data.user, { role: staffRole });
        } else {
          await ensureProfile(supabase, data.user);
        }
      }

      sessionStorage.removeItem("darasax_verify_email");
      sessionStorage.removeItem("darasax_verify_name");

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No user");
      if (staffRole) {
        await ensureStaffProfile(supabase, user, { role: staffRole });
        setSuccess(true);
        setContinueTo(APP_HOME[staffRole]);
        return;
      }
      const profile = await ensureProfile(supabase, user);
      setSuccess(true);
      setContinueTo(getPostAuthRedirect(profile));
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
    setInfo("");
    try {
      const supabase = createClient();
      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email,
      });
      if (resendError) throw resendError;
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
      title="Verify your email"
      subtitle="Enter the code we sent so we can activate your DarasaX account."
    >
      {success ? (
        <>
          <AuthSteps current="verify" />
          <WelcomeCelebration
            title="Email verified"
            subtitle={
              staffRole
                ? "Great — your staff account is active."
                : "Great — your account is active. Next, set up your academic profile."
            }
            ctaLabel={staffRole ? "Continue to desk" : "Continue to profile"}
            onContinue={() => {
              router.replace(continueTo);
              router.refresh();
            }}
          />
        </>
      ) : (
        <>
          <AuthSteps current="verify" />
          <h1 className="font-heading text-[15px] font-semibold tracking-tight">
            Verify your email
          </h1>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            We sent a verification code to{" "}
            <span className="font-medium text-foreground">
              {email ? maskEmail(email) : "your email"}
            </span>
          </p>

          <form className="mt-3 space-y-2.5" onSubmit={onSubmit}>
            {error ? <AuthAlert message={error} /> : null}
            {info ? <AuthAlert message={info} tone="success" /> : null}

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
              Verify Email
            </AuthSubmitButton>

            <div className="text-center">
              <button
                type="button"
                onClick={onResend}
                disabled={!cooldown.canResend || resending}
                className="text-[12px] font-medium text-primary disabled:text-muted-foreground"
              >
                {resending ? "Sending code..." : cooldown.label}
              </button>
            </div>

            <p className="text-center text-[11px] text-muted-foreground">
              Wrong email?{" "}
              <Link
                href={
                  staffRole === "class_rep" || staffRole === "lecturer"
                    ? "/register"
                    : staffRole
                      ? "/login"
                      : "/signup"
                }
                className="font-medium text-primary"
              >
                Go back
              </Link>
            </p>
          </form>
        </>
      )}
    </AuthShell>
  );
}
