"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useTranslate } from "@/components/providers/language-provider";
import { signOutAndForget } from "@/lib/auth/sign-out";

export function AdminBrowserSecurity() {
  const t = useTranslate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function forget() {
    if (busy) return;
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/admin-security", { method: "POST", credentials: "same-origin", cache: "no-store", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "forget" }) });
      if (!response.ok) throw new Error();
      await signOutAndForget();
    } catch { setError("Could not forget this browser. Please try again."); setBusy(false); }
  }
  return <section className="surface space-y-3 rounded-2xl p-5"><h2 className="font-heading text-lg font-semibold">{t("Administrator email security")}</h2>
    <p className="text-sm text-muted-foreground">{t("New browsers require a password and email verification code. You can optionally trust a personal browser for 30 days.")}</p>
    <Button variant="outline" disabled={busy} onClick={() => void forget()}>{t(busy ? "Signing out..." : "Forget this browser and sign out")}</Button>
    {error && <p role="alert" className="text-sm text-danger">{t(error)}</p>}
  </section>;
}
