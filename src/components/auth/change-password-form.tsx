"use client";

import { useTranslate } from "@/components/providers/language-provider";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { isPasswordStrongEnough, PASSWORD_REQUIREMENT, MIN_PASSWORD_LENGTH } from "@/lib/auth/password";

export function ChangePasswordForm() {
  const translateUI = useTranslate();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [current, setCurrent] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    if (!isPasswordStrongEnough(password)) {
      setMessage(PASSWORD_REQUIREMENT); return;
    }
    if (password !== confirmation) { setMessage("Passwords do not match."); return; }
    setBusy(true); setMessage("");
    try {
      const supabase = createClient();
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user?.email) throw new Error("Please sign in again.");
      const { error: verifyError } = await supabase.auth.signInWithPassword({ email: user.email, password: current });
      if (verifyError) throw new Error("Your current password is incorrect.");
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw new Error(updateError.message);
      setCurrent(""); setPassword(""); setConfirmation(""); setMessage("Password changed successfully.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not change password."); }
    finally { setBusy(false); }
  }
  const input = "mt-1 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm";
  return <section className="surface mt-6 rounded-2xl p-5">
    <h2 className="font-heading text-lg font-semibold">{translateUI("Change password")}</h2>
    <p className="mt-1 text-sm text-muted-foreground">{translateUI("Replace the temporary password provided by your administrator or class representative.")}</p>
    <form onSubmit={submit} className="mt-4 max-w-lg space-y-3">
      <label className="block text-sm">{translateUI("Current or temporary password")}<input required type="password" autoComplete="current-password" value={current} onChange={e => setCurrent(e.target.value)} className={input} /></label>
      <label className="block text-sm">{translateUI("New password")}<input required minLength={MIN_PASSWORD_LENGTH} type="password" autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} className={input} /></label>
      <label className="block text-sm">{translateUI("Confirm new password")}<input required minLength={MIN_PASSWORD_LENGTH} type="password" autoComplete="new-password" value={confirmation} onChange={e => setConfirmation(e.target.value)} className={input} /></label>
      {message && <p role="status" className="text-sm">{translateUI(message)}</p>}
      <Button type="submit" disabled={busy}>{translateUI(busy ? "Updating…" : "Change password")}</Button>
    </form>
  </section>;
}
