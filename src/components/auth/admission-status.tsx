"use client";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Clock3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";
import { LanguageSettings } from "@/components/profile/language-settings";
import { WelcomeCelebration } from "@/components/auth/welcome-celebration";
import { useTranslate } from "@/components/providers/language-provider";
import { createClient } from "@/lib/supabase/client";
import { safeStudentReturnPath } from "@/lib/auth/redirect";

export function AdmissionStatus({ status, registrationNumber, className }: {
  status: string; registrationNumber: string | null; className: string | null;
}) {
  const translateUI = useTranslate();
  const router = useRouter();
  const [refreshing, startRefresh] = useTransition();
  const [error, setError] = useState("");
  useEffect(() => {
    const timer = setInterval(() => { if (document.visibilityState === "visible") router.refresh(); }, 15000);
    return () => clearInterval(timer);
  }, [router]);
  async function signOut() {
    const { error } = await createClient().auth.signOut();
    if (error) { setError("Could not sign out. Please try again."); return; }
    router.replace("/login"); router.refresh();
  }
  return <main className="gradient-mesh min-h-screen px-4 py-8">
    <div className="mx-auto max-w-xl space-y-5"><Logo href="/" />
      <section className="surface rounded-3xl p-6 sm:p-8">
        <Clock3 className="h-9 w-9 text-primary" aria-hidden />
        <h1 className="mt-4 font-heading text-xl font-semibold">{translateUI(status === "pending" ? "Pending approval" : status === "rejected" ? "Registration not approved" : "Access suspended")}</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{translateUI(status === "pending"
          ? "Your registration is complete. Waiting for approval from your Class Representative or Administrator."
          : "Contact your Class Representative or Administrator about your access.")}</p>
        <dl className="mt-5 space-y-2 rounded-xl bg-muted/40 p-4 text-sm">
          <div><dt className="text-muted-foreground">{translateUI("Registration number")}</dt><dd className="break-all font-medium">{registrationNumber ?? "—"}</dd></div>
          <div><dt className="text-muted-foreground">{translateUI("Class")}</dt><dd className="font-medium">{className ?? "—"}</dd></div>
        </dl>
        {error && <p role="alert" className="mt-3 text-sm text-danger">{translateUI(error)}</p>}
        <div className="mt-5 flex flex-wrap gap-3">
          <Button disabled={refreshing} onClick={() => startRefresh(() => router.refresh())}>{translateUI(refreshing ? "Checking…" : "Check approval status")}</Button>
          <Button variant="outline" onClick={() => void signOut()}>{translateUI("Sign out")}</Button>
        </div>
      </section>
      <LanguageSettings />
    </div>
  </main>;
}

export function ApprovedWelcome({ next }: { next: string | null }) {
  const translateUI = useTranslate();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function enter() {
    if (busy) return;
    setBusy(true); setError("");
    const { error } = await createClient().rpc("acknowledge_student_welcome");
    if (error) { setError("Could not continue. Please try again."); setBusy(false); return; }
    router.replace(safeStudentReturnPath(next) ?? "/dashboard"); router.refresh();
  }
  return <main className="gradient-mesh min-h-screen px-4 py-8"><div className="mx-auto max-w-xl space-y-5">
    <Logo href="/" />
    <WelcomeCelebration title={translateUI("Congratulations!")} subtitle={translateUI("Your registration has been approved. Welcome to DarasaX.")}
      disabled={busy} ctaLabel={translateUI(busy ? "Please wait..." : "Enter dashboard")} onContinue={() => void enter()} />
    {error && <p role="alert" className="text-sm text-danger">{translateUI(error)}</p>}
  </div></main>;
}
