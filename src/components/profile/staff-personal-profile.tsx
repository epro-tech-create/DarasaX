"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { invalidateQueries } from "@/lib/supabase/query-cache";
import { AccountEmailForm } from "./account-email-form";
import { useTranslate } from "@/components/providers/language-provider";
import { useStaffSession, type StaffSession } from "@/lib/staff-auth";
import { PageHeader } from "@/components/layout/page-header";
import { LanguageSettings } from "@/components/profile/language-settings";
import { ChangePasswordForm } from "@/components/auth/change-password-form";
import { RegistrationNumber } from "./registration-number";
import { AdminBrowserSecurity } from "./admin-browser-security";

export function StaffPersonalProfile() {
  const translateUI = useTranslate();
  const { session } = useStaffSession();
  return <div className="mx-auto max-w-3xl space-y-5">
    <PageHeader title={translateUI("Personal Profile")} description={translateUI("Manage your account details, language, and security.")} />
    {session && <StaffAccountForm key={session.id} session={session} />}
    {session && session.role !== "admin" && <AccountEmailForm key={session.email} email={session.email} />}
    {session?.role === "class_rep" && <RegistrationNumber key={session.id} userId={session.id} />}
    <LanguageSettings />
    <ChangePasswordForm />
    {session?.role === "admin" && <AdminBrowserSecurity />}
  </div>;
}

function StaffAccountForm({ session }: { session: StaffSession }) {
  const t = useTranslate();
  const { refresh } = useStaffSession();
  const [name, setName] = useState(session.name);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fullName = name.trim();
    if (saving || fullName.length < 2 || fullName === session.name) return;
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const { error } = await createClient().rpc("update_my_staff_name", { display_name: fullName });
      if (error) throw error;
      invalidateQueries("staff");
      await refresh();
      setSaved(true);
    } catch {
      setError("We could not save your profile. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="surface space-y-3 rounded-2xl p-5">
      <h2 className="font-heading text-lg font-semibold">{t("Account")}</h2>
      <label className="block text-sm font-medium">
        {t("Full name")}
        <input required minLength={2} maxLength={120} autoComplete="name" value={name}
          onChange={(event) => { setName(event.target.value); setSaved(false); }} disabled={saving}
          className="focus-ring mt-2 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm" />
      </label>
      {session.role === "admin" && <p className="break-all text-sm text-muted-foreground">{session.email}</p>}
      <Button type="submit" size="sm" disabled={saving || name.trim().length < 2 || name.trim() === session.name}>
        {t(saving ? "Saving…" : "Save name")}
      </Button>
      {saved && <p role="status" className="text-sm">{t("Your profile has been updated.")}</p>}
      {error && <p role="alert" className="text-sm text-danger">{t(error)}</p>}
    </form>
  );
}
