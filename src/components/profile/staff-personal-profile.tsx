"use client";

import { useTranslate } from "@/components/providers/language-provider";
import { useStaffSession } from "@/lib/staff-auth";
import { PageHeader } from "@/components/layout/page-header";
import { LanguageSettings } from "@/components/profile/language-settings";
import { ChangePasswordForm } from "@/components/auth/change-password-form";
import { RegistrationNumber } from "./registration-number";
import { AdminBrowserSecurity } from "./admin-browser-security";

export function StaffPersonalProfile() {
  const translateUI = useTranslate();
  const { session } = useStaffSession();
  return <div className="mx-auto max-w-3xl space-y-5">
    <PageHeader title={translateUI("Personal Profile")} description={translateUI("Manage your language and account security.")} />
    <section className="surface rounded-2xl p-5">
      <h2 className="font-heading text-lg font-semibold">{translateUI("Account")}</h2>
      <p className="mt-3 text-sm font-medium">{session?.name}</p>
      <p className="mt-1 break-all text-sm text-muted-foreground">{session?.email}</p>
    </section>
    {session?.role === "class_rep" && <RegistrationNumber key={session.id} userId={session.id} />}
    <LanguageSettings />
    <ChangePasswordForm />
    {session?.role === "admin" && <AdminBrowserSecurity />}
  </div>;
}
