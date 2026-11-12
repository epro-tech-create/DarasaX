"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useTranslate } from "@/components/providers/language-provider";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export function AccountEmailForm({ email }: { email: string }) {
  const t = useTranslate();
  const router = useRouter();
  const [address, setAddress] = useState(email);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const nextEmail = address.trim().toLowerCase();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving || !nextEmail || nextEmail === email.toLowerCase()) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const { data, error } = await createClient().auth.updateUser({ email: nextEmail }, {
        emailRedirectTo: new URL("/auth/callback", window.location.origin).href,
      });
      if (error) throw error;
      if (data.user.email === nextEmail) {
        setMessage("Email updated.");
        router.refresh();
      } else {
        setMessage("Check your current and new inboxes for confirmation links.");
      }
    } catch {
      setError("Could not request an email change. Check the address and try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="surface space-y-3 rounded-2xl p-5">
      <label className="block text-sm font-medium">
        {t("Email address")}
        <input type="email" required autoComplete="email" maxLength={254} value={address}
          onChange={(event) => setAddress(event.target.value)} disabled={saving}
          className="focus-ring mt-2 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm" />
      </label>
      <Button type="submit" size="sm" disabled={saving || !nextEmail || nextEmail === email.toLowerCase()}>
        {t(saving ? "Saving…" : "Change email")}
      </Button>
      {message && <p role="status" className="text-sm">{t(message)}</p>}
      {error && <p role="alert" className="text-sm text-danger">{t(error)}</p>}
    </form>
  );
}
