"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getStudentAdmission, validRegistrationNumber } from "@/lib/auth/admission";
import { getAuthErrorMessage } from "@/lib/auth/errors";
import { useTranslate } from "@/components/providers/language-provider";
import { Button } from "@/components/ui/button";
export function RegistrationNumber({ userId, className }: {userId: string; className: string | null}) {
  const t = useTranslate();
  const [number,setNumber] = useState("");
  const [registered,setRegistered] = useState<string | null>(null);
  const [ready,setReady] = useState(false);
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState("");
  useEffect(() => {
    let active = true;
    getStudentAdmission(createClient(),userId).then(a => {
      if(active) { setRegistered(a?.registration_number ?? null); setNumber(a?.registration_number ?? ""); setReady(true); }
    }).catch(() => { if(active) setError("Could not load registration number. Please refresh."); });
    return () => {active=false;};
  },[userId]);
  async function save(e: React.FormEvent) {
    e.preventDefault(); if(busy || registered || !className) return;
    if(!validRegistrationNumber(number)) {setError("Registration number must contain numbers only.");return;}
    setBusy(true);setError("");
    const {error} = await createClient().rpc("submit_student_registration",{reg_number:number,target_class:className});
    if(error) setError(getAuthErrorMessage(error)); else setRegistered(number);
    setBusy(false);
  }
  return <section className="surface rounded-2xl p-5"><h2 className="font-heading font-semibold">{t("Registration number")}</h2>
    <form onSubmit={e => void save(e)} className="mt-3 space-y-3">
      <input aria-label={t("Registration number")} required inputMode="numeric" pattern="[0-9]+" maxLength={64} placeholder="240242400506" value={number} disabled={!ready || !!registered || busy} onChange={e => setNumber(e.target.value)} className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm disabled:opacity-60" />
      <p className="text-xs text-muted-foreground">{t(registered ? "Contact your administrator to change your registration number." : "Numbers only. Example: 240242400506")}</p>
      {error && <p role="alert" className="text-sm text-danger">{t(error)}</p>}
      {!registered && <Button disabled={!ready || busy} type="submit">{t(busy ? "Saving..." : "Save registration number")}</Button>}
    </form>
  </section>;
}
