"use client";

import { useTranslate } from "@/components/providers/language-provider";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { AuthAlert } from "@/components/auth/auth-alert";
import { AuthShell } from "@/components/auth/auth-shell";
import { AuthSubmitButton } from "@/components/auth/auth-submit-button";
import { PasswordField } from "@/components/auth/password-field";
import { Button } from "@/components/ui/button";
import { getAuthErrorMessage } from "@/lib/auth/errors";
import { isPasswordStrongEnough, PASSWORD_REQUIREMENT } from "@/lib/auth/password";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const translateUI = useTranslate();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [done, setDone] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const verified = sessionStorage.getItem("darasax_recovery_verified");
    const supabase = createClient();

    async function gate() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user || verified !== "1") {
        router.replace("/forgot-password");
        return;
      }
      setReady(true);
    }

    void gate();
  }, [router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!isPasswordStrongEnough(password)) {
      setError(PASSWORD_REQUIREMENT);
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });
      if (updateError) throw updateError;

      sessionStorage.removeItem("darasax_recovery_email");
      sessionStorage.removeItem("darasax_recovery_verified");
      await supabase.auth.signOut();
      setDone(true);
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function backToSignIn() {
    if (leaving) return;
    setLeaving(true);
    sessionStorage.removeItem("darasax_recovery_email");
    sessionStorage.removeItem("darasax_recovery_verified");

    try {
      const supabase = createClient();
      await supabase.auth.signOut({ scope: "local" });
    } finally {
      window.location.replace("/login");
    }
  }

  if (!ready && !done) {
    return (
      <AuthShell title={translateUI("Reset password")} subtitle="Preparing a secure reset session...">
        <div className="h-40 animate-pulse rounded-2xl bg-muted" />
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title={translateUI("Set a new password")}
      subtitle="Choose a strong password you haven’t used before."
    >
      {done ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <CheckCircle2 className="mx-auto h-12 w-12 text-success" />
          <h1 className="mt-4 font-heading text-xl font-semibold">
            {translateUI("Password changed successfully ✓")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {translateUI("Your DarasaX password has been updated.")}</p>
          <Button className="mt-8 h-11 w-full text-sm" href="/login">
            {translateUI("Continue to Sign In")}</Button>
        </motion.div>
      ) : (
        <>
          <h1 className="font-heading text-xl font-semibold tracking-tight">
            {translateUI("Reset password")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {translateUI("Enter and confirm your new password.")}</p>

          <form className="mt-6 space-y-3.5" onSubmit={onSubmit}>
            {error ? <AuthAlert message={translateUI(error)} /> : null}

            <PasswordField
              id="new-password"
              label={translateUI("New Password")}
              value={password}
              onChange={setPassword}
              autoComplete="new-password"
              showStrength
            />

            <PasswordField
              id="confirm-password"
              label={translateUI("Confirm New Password")}
              value={confirm}
              onChange={setConfirm}
              autoComplete="new-password"
              error={
                confirm && confirm !== password ? "Passwords do not match." : undefined
              }
            />

            <AuthSubmitButton loading={loading} loadingText={translateUI("Updating password...")}>
              {translateUI("Update Password")}</AuthSubmitButton>
          </form>

          <p className="mt-5 text-center text-xs text-muted-foreground">
            <button
              type="button"
              onClick={() => void backToSignIn()}
              disabled={leaving || loading}
              className="font-medium text-primary disabled:cursor-not-allowed disabled:opacity-60"
            >
              {translateUI(leaving ? "Returning to sign in..." : "Back to sign in")}
            </button>
          </p>
        </>
      )}
    </AuthShell>
  );
}
