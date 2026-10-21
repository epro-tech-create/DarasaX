"use client";
import { useState } from "react";
import { LogOut, Loader2 } from "lucide-react";
import { useTranslate } from "@/components/providers/language-provider";
import { signOutAndForget } from "@/lib/auth/sign-out";
export function SignOutButton() {
  const t = useTranslate();
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState("");
  async function exit() {
    if (busy) return;
    setBusy(true);setError("");
    try { await signOutAndForget(); } catch {setError("Could not sign out. Please try again.");setBusy(false);}
  }
  return <div className="relative shrink-0"><button type="button" disabled={busy} onClick={() => void exit()} className="focus-ring inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-border bg-card px-2.5 text-xs font-medium hover:bg-muted disabled:opacity-60">
    {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <LogOut className="h-4 w-4" aria-hidden />}
    {t(busy ? "Signing out..." : "Sign out")}
  </button>{error && <p role="alert" className="absolute right-0 top-full z-50 mt-2 w-60 rounded-xl border border-border bg-card p-3 text-xs text-danger shadow-lg">{t(error)}</p>}</div>;
}
