"use client";
import { useEffect, useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { StaffSection } from "@/components/staff/staff-ui";
import { useTranslate } from "@/components/providers/language-provider";
import { createClient } from "@/lib/supabase/client";
type Invitation = {code:string;class_name:string;expires_at:string};
export function ClassInvitation() {
  const t = useTranslate();
  const qr=useRef<HTMLCanvasElement>(null);
  const [invite,setInvite] = useState<Invitation | null>(null);
  const [busy,setBusy] = useState(true);
  const [message,setMessage] = useState("");
  const [origin,setOrigin] = useState("https://www.darasax.com");
  useEffect(() => {
    let active=true;
    createClient().rpc("manage_class_invitation",{invite_action:"get"}).then(({data,error}) => {
      if(!active)return;
      if(error)setMessage("Could not load the class invitation. Please try again.");
      else setInvite(data as Invitation | null);
      setOrigin(window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" ? window.location.origin : "https://www.darasax.com");
      setBusy(false);
    });return () => {active=false;};
  },[]);
  async function manage(action:"create"|"revoke") {
    if(busy)return;setBusy(true);setMessage("");
    const {data,error}=await createClient().rpc("manage_class_invitation",{invite_action:action});
    if(error)setMessage("Could not update the class invitation. Please try again.");
    else setInvite(data as Invitation | null);
    setBusy(false);
  }
  const url = invite ? `${origin}/join?code=${invite.code}` : "";
  async function copy(value:string) {
    try {await navigator.clipboard.writeText(value);setMessage("Copied.");}
    catch {setMessage("Select and copy the invitation link below.");}
  }
  function downloadQR() {
    if(!qr.current || !invite)return;
    const link=document.createElement("a");
    link.download=`DarasaX-${invite.class_name}-invitation.png`;
    link.href=qr.current.toDataURL("image/png");link.click();
  }
  return <StaffSection title={t("Invite students")} description={t("Share a code or QR to admit students directly into your class. Invitations last 7 days.")}>
    {invite ? <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
      <div className="self-start rounded-xl bg-white p-3"><QRCodeCanvas ref={qr} value={url} size={144} marginSize={4} title={t("Class invitation QR code")} /></div>
      <div className="min-w-0 flex-1 space-y-3 text-sm"><p className="font-semibold">{invite.class_name}</p>
        <p className="text-muted-foreground">{t("Expires")}: {new Date(invite.expires_at).toLocaleString(t.locale,{timeZone:"Africa/Dar_es_Salaam"})}</p>
        <label className="block">{t("Invitation code")}<input readOnly value={invite.code} onFocus={e=>e.target.select()} className="mt-1 h-10 w-full rounded-xl border border-border bg-background px-3 font-mono text-xs" /></label>
        <label className="block">{t("Invitation link")}<input readOnly value={url} onFocus={e=>e.target.select()} className="mt-1 h-10 w-full rounded-xl border border-border bg-background px-3 text-xs" /></label>
        <div className="flex flex-wrap gap-2"><Button size="sm" onClick={()=>void copy(url)}>{t("Copy link")}</Button><Button size="sm" variant="outline" onClick={()=>void copy(invite.code)}>{t("Copy code")}</Button><Button size="sm" variant="outline" onClick={downloadQR}>{t("Download QR")}</Button>
          <Button size="sm" variant="outline" disabled={busy} onClick={()=>void manage("revoke")}>{t("Revoke invitation")}</Button>
          <Button size="sm" variant="outline" disabled={busy} onClick={()=>void manage("create")}>{t("Generate new invitation")}</Button></div>
      </div></div> : <Button disabled={busy} onClick={()=>void manage("create")}>{t(busy ? "Please wait..." : "Generate invitation")}</Button>}
    <p className="mt-3 text-xs text-muted-foreground">{t("Students must sign in and provide a unique registration number. A replacement invitation invalidates the previous code.")}</p>
    {message && <p role="status" className="mt-3 text-sm">{t(message)}</p>}
  </StaffSection>;
}
