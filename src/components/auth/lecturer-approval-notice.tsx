"use client";
import { useRouter } from "next/navigation";
import { AuthShell } from "./auth-shell";
import { SignOutButton } from "./sign-out-button";
import { Button } from "@/components/ui/button";
import { useTranslate } from "@/components/providers/language-provider";

export function LecturerApprovalNotice({ status }: { status: "pending" | "rejected" | "unavailable" }) {
  const t = useTranslate();
  const router = useRouter();
  const title = status === "pending" ? "Awaiting administrator approval" : status === "rejected" ? "Application not approved" : "Lecturer access unavailable";
  return <AuthShell title={t("Lecturer registration")} subtitle="Your lecturer account needs administrator approval before workspace access.">
    <h1 className="text-center font-heading text-xl font-semibold">{t(title)}</h1>
    <p className="mt-4 text-center text-sm text-muted-foreground">{t(status === "pending" ? "Your email is verified. An administrator must approve your lecturer account before you can access classes, student details or materials." : "Contact your administrator about your lecturer account.")}</p>
    <div className="mt-6 flex flex-wrap justify-center gap-3"><Button variant="outline" onClick={() => router.refresh()}>{t("Check approval status")}</Button><SignOutButton /></div>
  </AuthShell>;
}
