"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { useTranslate } from "@/components/providers/language-provider";
import { createClient } from "@/lib/supabase/client";
import { getStudentAdmission, validRegistrationNumber } from "@/lib/auth/admission";
import { getAuthErrorMessage } from "@/lib/auth/errors";
import { studentPostAuthPath } from "@/lib/auth/redirect";
import { getStaffProfile } from "@/lib/auth/staff-profile";
type Details={class_name:string;label:string;expires_at:string};
function JoinClassForm({code}: {code:string}) {
  const t=useTranslate(),router=useRouter();
  const [entered,setEntered]=useState(code),[number,setNumber]=useState("");
  const [details,setDetails]=useState<Details|null>(null),[userId,setUserId]=useState<string|null>(null);
  const [staff,setStaff]=useState(false),[locked,setLocked]=useState(false),[busy,setBusy]=useState(false),[loading,setLoading]=useState(true),[error,setError]=useState("");
  useEffect(()=>{
    let active=true;
    async function load(){
      try {
        const client=createClient();
        const [invitation,auth]=await Promise.all([code ? client.rpc("resolve_class_invitation",{invite_code:code}) : Promise.resolve({data:null,error:null}),client.auth.getUser()]);
        if(invitation.error)throw invitation.error;
        const user=auth.data.user;
        const [admission,staffProfile]=user ? await Promise.all([getStudentAdmission(client,user.id),getStaffProfile(client,user.id)]) : [null,null];
        if(!active)return;
        setDetails(invitation.data as Details|null);setUserId(user?.id??null);setStaff(!!staffProfile);
        setNumber(admission?.registration_number??"");setLocked(!!admission?.registration_number && admission.status==="approved");
        setError(code && !invitation.data ? "This invitation is invalid, expired or revoked." : "");
      }catch{if(active)setError("Could not load the class invitation. Please try again.");}
      finally{if(active)setLoading(false);}
    }
    void load();return()=>{active=false;};
  },[code]);
  async function join(e:React.FormEvent){
    e.preventDefault();if(busy || !userId || !details)return;
    if(!validRegistrationNumber(number)){setError("Registration number must contain numbers only.");return;}
    setBusy(true);setError("");
    try {
      const client=createClient();
      const {error}=await client.rpc("redeem_class_invitation",{invite_code:code,reg_number:number});
      if(error)throw error;
      const admission=await getStudentAdmission(client,userId);
      router.replace(studentPostAuthPath(true,null,admission));router.refresh();
    }catch(error){setError(getAuthErrorMessage(error));setBusy(false);}
  }
  const next=`/join?code=${encodeURIComponent(code)}`;
  return <main className="gradient-mesh min-h-screen px-4 py-8"><div className="mx-auto max-w-lg space-y-6"><div className="flex items-center justify-between gap-3"><Logo />{userId && <SignOutButton />}</div>
    <section className="surface space-y-4 rounded-3xl p-6"><h1 className="font-heading text-xl font-semibold">{t("Join your class")}</h1>
      {error && <p role="alert" className="text-sm text-danger">{t(error)}</p>}
      {loading ? <p>{t("Loading...")}</p> : !details ? <form onSubmit={e=>{e.preventDefault();router.replace(`/join?code=${encodeURIComponent(entered.trim())}`);}} className="space-y-3">
        <label className="block text-sm">{t("Invitation code")}<input required maxLength={64} value={entered} onChange={e=>setEntered(e.target.value)} className="mt-2 h-11 w-full rounded-xl border border-border bg-background px-3" /></label><Button type="submit">{t("Continue")}</Button>
      </form> : <>
        <p className="font-semibold text-primary">{details.label} · {details.class_name}</p>
        <p className="text-sm text-muted-foreground">{t("This invitation grants class approval after you sign in and enter your unique registration number.")}</p>
        {staff ? <p className="text-sm">{t("This invitation is for student accounts.")}</p> : !userId ? <div className="flex flex-wrap gap-3"><Button href={`/login?next=${encodeURIComponent(next)}`}>{t("Sign In")}</Button><Button variant="outline" href={`/signup?next=${encodeURIComponent(next)}`}>{t("Create account")}</Button></div> : <form onSubmit={e=>void join(e)} className="space-y-4">
          <label className="block text-sm">{t("Registration number")}<input required inputMode="numeric" pattern="[0-9]+" maxLength={64} readOnly={locked} value={number} placeholder="240242400506" onChange={e=>setNumber(e.target.value)} className="mt-2 h-11 w-full rounded-xl border border-border bg-background px-3" /></label>
          <p className="text-xs text-muted-foreground">{t("Numbers only. Example: 240242400506")}</p><Button disabled={busy} type="submit">{t(busy ? "Please wait..." : "Join class")}</Button>
        </form>}
      </>}
    </section></div></main>;
}

export function JoinClass() {
  const params=useSearchParams();
  const code=(params.get("code")??"").trim().toLowerCase();
  return <JoinClassForm key={code} code={code} />;
}
