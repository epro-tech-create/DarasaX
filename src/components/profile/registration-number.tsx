"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getStudentAdmission, validRegistrationNumber } from "@/lib/auth/admission";
import { getAuthErrorMessage } from "@/lib/auth/errors";
import { useTranslate } from "@/components/providers/language-provider";
import { Button } from "@/components/ui/button";
export function RegistrationNumber({ userId }: {userId: string; className?: string | null}) {
  const t = useTranslate();
  const [number,setNumber] = useState("");
  const [registered,setRegistered] = useState<string | null>(null);
  const [loadedUserId,setLoadedUserId] = useState<string | null>(null);
  const ready = loadedUserId === userId;
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState("");
  const [message,setMessage] = useState("");
  useEffect(() => {
    let active = true;
    getStudentAdmission(createClient(),userId).then(a => {
      if(active) { setRegistered(a?.registration_number ?? null); setNumber(a?.registration_number ?? ""); setLoadedUserId(userId); }
    }).catch(() => { if(active) setError("Could not load registration number. Please refresh."); });
    return () => {active=false;};
  },[userId]);
  async function save(e: React.FormEvent) {
    e.preventDefault(); if(busy || !ready || number === registered) return;
    if(!validRegistrationNumber(number)) {setError("Registration number must contain numbers only.");return;}
    setBusy(true);setError("");setMessage("");
    try {
      const {error} = await createClient().rpc("update_my_registration_number",{reg_number:number});
      if(error) throw error;
      setRegistered(number);setMessage("Registration number saved.");
    } catch(error) {setError(getAuthErrorMessage(error));}
    finally {setBusy(false);}
  }
  return <section className="surface rounded-2xl p-5"><h2 className="font-heading font-semibold">{t("Registration number")}</h2>
    <form onSubmit={e => void save(e)} className="mt-3 space-y-3">
      <input aria-label={t("Registration number")} required inputMode="numeric" pattern="[0-9]+" maxLength={64} placeholder="240242400506" value={number} disabled={!ready || busy} onChange={e => {setNumber(e.target.value);setMessage("");setError("");}} className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm disabled:opacity-60" />
      <p className="text-xs text-muted-foreground">{t("Numbers only. Example: 240242400506")}</p>
      {error && <p role="alert" className="text-sm text-danger">{t(error)}</p>}
      {message && <p role="status" className="text-sm text-success">{t(message)}</p>}
      <Button disabled={!ready || busy || number === registered} type="submit">{t(busy ? "Saving..." : "Save registration number")}</Button>
    </form>
  </section>;
}
