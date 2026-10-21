"use client";

import { useState } from "react";
import { Languages } from "lucide-react";
import { useLanguage, useTranslate } from "@/components/providers/language-provider";
import type { Language } from "@/lib/i18n/translate";

export function LanguageSettings() {
  const { language, setLanguage } = useLanguage();
  const translateUI = useTranslate();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function change(next: Language) {
    setBusy(true); setMessage("");
    try { await setLanguage(next); setMessage("Language saved."); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Could not save your language. Please try again."); }
    finally { setBusy(false); }
  }
  return <section className="surface rounded-2xl p-5 sm:p-6">
    <h2 className="flex items-center gap-2 font-heading text-lg font-semibold"><Languages className="h-5 w-5 text-primary" aria-hidden />{translateUI("Language")}</h2>
    <p className="mt-1 text-sm text-muted-foreground">{translateUI("Choose the language used across DarasaX. Your preference is saved to your account.")}</p>
    <label className="mt-4 block max-w-sm text-sm font-medium">
      {translateUI("Interface language")}
      <select value={language} disabled={busy} onChange={event => void change(event.target.value as Language)} className="focus-ring mt-2 h-11 w-full rounded-xl border border-border bg-background px-3 disabled:opacity-60">
        <option value="en" lang="en">English</option>
        <option value="sw" lang="sw">Kiswahili</option>
      </select>
    </label>
    <p role="status" aria-live="polite" className="mt-3 text-sm text-muted-foreground">{busy ? translateUI("Saving…") : translateUI(message)}</p>
  </section>;
}
