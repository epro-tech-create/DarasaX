"use client";

import { useEffect, useState, type FormEvent } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { AuthAlert } from "@/components/auth/auth-alert";
import { AuthSubmitButton } from "@/components/auth/auth-submit-button";
import { OtpInput } from "@/components/auth/otp-input";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { useTranslate } from "@/components/providers/language-provider";
import { useResendCooldown } from "@/hooks/use-resend-cooldown";
import { AUTH_OTP_LENGTH } from "@/lib/auth/constants";
import { getCaptchaToken } from "@/lib/auth/captcha";

export default function AdminVerifyEmailPage() {
  const t = useTranslate();
  const [ready, setReady] = useState(false);
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [remember, setRemember] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [restart, setRestart] = useState(false);
  const cooldown = useResendCooldown(60);

  useEffect(() => {
    let active = true;
    void fetch("/api/admin-security", { cache: "no-store", credentials: "same-origin" }).then(async response => {
      if (!active) return;
      if (response.status === 401) { window.location.replace("/login"); return; }
      const data = await response.json();
      if (!active) return;
      if (!response.ok) throw new Error(data.error);
      if (data.verified) { window.location.replace("/admin"); return; }
      setEmail(data.email); setSent(data.pending); setReady(true);
    }).catch(() => { if (active) { setError("Could not verify account security. Please try again."); setReady(true); } });
    return () => { active = false; };
  }, []);

  async function submit(action: "start" | "verify") {
    if (busy || (action === "start" && sent && !cooldown.canResend)) return;
    setBusy(true); setError("");
    try {
      const captchaToken = action === "start" ? await getCaptchaToken() : undefined;
      const response = await fetch("/api/admin-security", { method: "POST", credentials: "same-origin", cache: "no-store", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, code, remember, captchaToken }) });
      const data = await response.json();
      if (!response.ok) { setRestart(data.restart === true); throw new Error(data.error); }
      if (data.verified) { window.location.replace("/admin"); return; }
      setSent(true); setEmail(data.email); setCode(""); cooldown.start(60);
    } catch (err) { setError(err instanceof Error ? err.message : "Could not verify account security. Please try again."); }
    finally { setBusy(false); }
  }

  function verify(event: FormEvent) { event.preventDefault(); if (code.length === AUTH_OTP_LENGTH) void submit("verify"); }
  return <AuthShell title={t("Administrator verification")} subtitle="Confirm your email before opening the administration workspace.">
    <h1 className="text-center font-heading text-xl font-semibold">{t("Verify this browser")}</h1>
    <p className="mt-2 text-center text-sm text-muted-foreground">{t("Your password was accepted. Verify your administrator email to continue.")}</p>
    {email && <p className="mt-2 text-center text-sm font-medium">{email}</p>}
    {error && <div className="mt-4"><AuthAlert message={t(error)} /></div>}
    {!ready ? <p className="mt-5 text-center text-sm" role="status">{t("Checking account security...")}</p> : restart ? <p className="mt-4 text-sm text-muted-foreground">{t("Sign out and sign in again to restart verification.")}</p> : !sent ? <div className="mt-5"><AuthSubmitButton loading={busy} loadingText={t("Sending code...")} onClick={() => void submit("start")}>{t("Continue securely")}</AuthSubmitButton><p className="mt-2 text-center text-xs text-muted-foreground">{t("An email code is required unless you previously trusted this browser.")}</p></div> : <form onSubmit={verify} className="mt-5 space-y-4">
      <p className="text-center text-sm text-muted-foreground">{t("Enter the verification code from your email.")}</p>
      <OtpInput value={code} onChange={setCode} length={AUTH_OTP_LENGTH} disabled={busy} error={Boolean(error)} autoFocus />
      <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={remember} onChange={event => setRemember(event.target.checked)} className="mt-1" />{t("Trust this browser for 30 days. Use only on your personal device.")}</label>
      <AuthSubmitButton loading={busy} loadingText={t("Verifying...")} disabled={code.length !== AUTH_OTP_LENGTH}>{t("Verify and continue")}</AuthSubmitButton>
      <button type="button" disabled={busy || !cooldown.canResend} onClick={() => void submit("start")} className="block w-full text-center text-sm text-primary disabled:text-muted-foreground">{t(cooldown.canResend ? "Resend code" : cooldown.label)}</button>
    </form>}
    <div className="mt-5 flex justify-center"><SignOutButton /></div>
  </AuthShell>;
}
