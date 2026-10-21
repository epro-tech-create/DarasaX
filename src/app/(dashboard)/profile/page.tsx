"use client";

import { useTranslate } from "@/components/providers/language-provider";
import { ChangePasswordForm } from "@/components/auth/change-password-form";
import { RegistrationNumber } from "@/components/profile/registration-number";
import { LanguageSettings } from "@/components/profile/language-settings";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, GraduationCap, Save, UserRound } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Button } from "@/components/ui/button";
import { AuthAlert } from "@/components/auth/auth-alert";
import { useStudentProfile } from "@/components/providers/student-profile-provider";
import { createClient } from "@/lib/supabase/client";
import { classStreams } from "@/data/mock";
import { prepareAvatar } from "@/lib/auth/avatar";

const inputClass =
  "focus-ring mt-2 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm transition-colors disabled:opacity-60";

export default function ProfilePage() {
  const translateUI = useTranslate();
  const router = useRouter();
  const { profile, avatarUrl, updateProfile } = useStudentProfile();
  const [form, setForm] = useState(() => ({
    full_name: profile?.full_name ?? "",
    institution: profile?.institution ?? "",
    programme: profile?.programme ?? "",
    year_of_study: String(profile?.year_of_study ?? ""),
    semester: String(profile?.semester ?? ""),
    class_name: profile?.class_name ?? "",
  }));
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  if (!profile)
    return (
      <AuthAlert message={translateUI("We could not load your profile. Please refresh and try again.")} />
    );

  async function onSave(event: FormEvent) {
    event.preventDefault();
    if (!profile || saving) return;
    setError("");
    setSuccess("");
    if (form.full_name.trim().length < 2) {
      setError("Enter your full name.");
      return;
    }
    setSaving(true);
    const supabase = createClient();
    let uploadedPath: string | null = null;
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || user.id !== profile.id)
        throw new Error("Please sign in again before updating your profile.");
      let avatar = removePhoto ? null : profile.avatar_url;
      if (photo) {
        const image = await prepareAvatar(photo);
        uploadedPath = `${user.id}/${crypto.randomUUID()}.webp`;
        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(uploadedPath, image, {
            contentType: "image/webp",
            upsert: false,
          });
        if (uploadError)
          throw new Error(
            "Your photo could not be uploaded. Please try again.",
          );
        avatar = uploadedPath;
      }
      const { data, error: updateError } = await supabase
        .from("profiles")
        .update({
          full_name: form.full_name.trim(),
          avatar_url: avatar,
        })
        .eq("id", user.id)
        .select("*")
        .single();
      if (updateError)
        throw new Error("We could not save your profile. Please try again.");
      uploadedPath = null; // Database commit succeeded; never delete the new photo on cleanup failure.
      const oldAvatar = profile.avatar_url;
      updateProfile(data);
      setPhoto(null);
      setPreview(null);
      setRemovePhoto(false);
      setSuccess("Your profile has been updated.");
      if (oldAvatar?.startsWith(`${user.id}/`) && oldAvatar !== avatar) {
        await supabase.storage
          .from("avatars")
          .remove([oldAvatar])
          .catch(() => null);
      }
      router.refresh();
    } catch (err) {
      if (uploadedPath)
        await supabase.storage.from("avatars").remove([uploadedPath]);
      setError(
        err instanceof Error ? err.message : "Could not save your profile.",
      );
    } finally {
      setSaving(false);
    }
  }

  const change = (field: keyof typeof form, value: string) => {
    setSuccess("");
    setForm((previous) => ({ ...previous, [field]: value }));
  };
  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <PageHeader
        title={translateUI("Your profile")}
        description={translateUI("Make it yours. Keep your student details up to date.")}
      />
      {error && <AuthAlert message={translateUI(error)} />}
      {success && <AuthAlert message={translateUI(success)} tone="success" />}
      <form onSubmit={onSave} className="space-y-5">
        <fieldset disabled={saving} className="space-y-5 disabled:opacity-75">
          <section className="surface overflow-hidden rounded-2xl">
            <div className="h-16 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent sm:h-20" />
            <div className="flex flex-col gap-5 px-5 pb-6 sm:flex-row sm:items-start sm:px-7">
              <div className="-mt-8 flex shrink-0 flex-col items-start gap-3">
                <UserAvatar
                  name={form.full_name || "Student"}
                  src={removePhoto ? null : preview || avatarUrl}
                  size="lg"
                  className="h-24 w-24 ring-4 ring-card"
                />
                <label className="focus-within:ring-2 focus-within:ring-primary relative inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-border px-3 text-sm font-medium hover:bg-muted">
                  <Camera className="h-4 w-4" /> {translateUI(" Change photo")}<input
                    aria-label={translateUI("Choose profile picture")}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    disabled={saving}
                    className="absolute inset-0 w-full cursor-pointer opacity-0"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) {
                        setPhoto(file);
                        setPreview(URL.createObjectURL(file));
                        setRemovePhoto(false);
                        setError("");
                        setSuccess("");
                      }
                      event.target.value = "";
                    }}
                  />
                </label>
                {(photo || profile.avatar_url) && (
                  <button
                    type="button"
                    onClick={() => {
                      setPhoto(null);
                      setPreview(null);
                      setRemovePhoto(true);
                    }}
                    className="min-h-11 px-1 text-sm text-muted-foreground hover:text-foreground"
                  >
                    {translateUI("Remove photo")}</button>
                )}
              </div>
              <div className="min-w-0 pt-4">
                <h2 className="break-words text-xl font-semibold tracking-tight">
                  {profile.full_name || translateUI("Student")}
                </h2>
                <p className="mt-1 break-all text-sm text-muted-foreground">
                  {profile.email}
                </p>
              </div>
            </div>
          </section>
          <section className="surface rounded-2xl p-5 sm:p-7">
            <h2 className="flex items-center gap-2 text-base font-semibold">
              <UserRound className="h-4 w-4 text-primary" /> {translateUI(" Personal details")}</h2>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <label className="text-sm font-medium">
                {translateUI("Full name")}<input
                  required
                  maxLength={120}
                  autoComplete="name"
                  value={form.full_name}
                  onChange={(e) => change("full_name", e.target.value)}
                  className={inputClass}
                />
              </label>
              <label className="text-sm font-medium">
                {translateUI("Email address")}<input
                  type="email"
                  value={profile.email ?? ""}
                  readOnly
                  className={`${inputClass} bg-muted/40 text-muted-foreground`}
                />
              </label>
            </div>
          </section>
          <section className="surface rounded-2xl p-5 sm:p-7">
            <h2 className="flex items-center gap-2 text-base font-semibold">
              <GraduationCap className="h-4 w-4 text-primary" /> {translateUI(" Academic details")}</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {translateUI("Academic details are set during onboarding and locked. Contact your administrator to request a class change.")}</p>
            <fieldset
              disabled
              className="mt-5 grid gap-5 sm:grid-cols-2 opacity-75"
            >
              <label className="text-sm font-medium">
                {translateUI("Institution")}<input
                  required
                  maxLength={180}
                  value={profile.institution ?? ""}
                  onChange={(e) => change("institution", e.target.value)}
                  className={inputClass}
                />
              </label>
              <label className="text-sm font-medium">
                {translateUI("Programme")}<input
                  required
                  maxLength={180}
                  value={profile.programme ?? ""}
                  onChange={(e) => change("programme", e.target.value)}
                  className={inputClass}
                />
              </label>
              <label className="text-sm font-medium">
                {translateUI("Year of study")}<select
                  required
                  value={String(profile.year_of_study ?? "")}
                  onChange={(e) => change("year_of_study", e.target.value)}
                  className={inputClass}
                >
                  <option value="">{translateUI("Select year")}</option>
                  {[3].map((year) => (
                    <option key={year} value={year}>
                      {translateUI("Year ")}{translateUI(year)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-medium">
                {translateUI("Semester")}<select
                  required
                  value={String(profile.semester ?? "")}
                  onChange={(e) => change("semester", e.target.value)}
                  className={inputClass}
                >
                  <option value="">{translateUI("Select semester")}</option>
                  <option value="1">{translateUI("Semester 1")}</option>
                </select>
              </label>
              <label className="text-sm font-medium sm:col-span-2">
                {translateUI("Class")}<select
                  value={profile.class_name ?? ""}
                  onChange={(e) => change("class_name", e.target.value)}
                  className={inputClass}
                >
                  <option value="">{translateUI("Select class")}</option>
                  {form.class_name &&
                    !classStreams.some(
                      (stream) => stream.id === form.class_name,
                    ) && (
                      <option value={profile.class_name ?? ""}>
                        {form.class_name}
                      </option>
                    )}
                  {classStreams.map((stream) => (
                    <option key={stream.id} value={stream.id}>
                      {translateUI(stream.label)}
                      {translateUI(stream.isEvening ? " (Evening)" : "")}
                    </option>
                  ))}
                </select>
              </label>
            </fieldset>
          </section>
          <div className="flex justify-end">
            <Button type="submit" disabled={saving}>
              <Save className="h-4 w-4" />
              {translateUI(saving ? "Saving changes..." : "Save changes")}
            </Button>
          </div>
        </fieldset>
      </form>
      <RegistrationNumber userId={profile.id} className={profile.class_name} />
      <LanguageSettings />
      <ChangePasswordForm />
    </div>
  );
}
