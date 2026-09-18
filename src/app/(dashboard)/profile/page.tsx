"use client";

import { FormEvent, useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Button } from "@/components/ui/button";
import { AuthAlert } from "@/components/auth/auth-alert";
import { StatCard } from "@/components/dashboard/next-class-card";
import { createClient } from "@/lib/supabase/client";
import { getAuthErrorMessage } from "@/lib/auth/errors";
import type { Profile } from "@/types/database";
import { currentUser } from "@/data/mock";

export default function ProfilePage() {
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    void (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();
      if (data) {
        setProfile(data);
        setName(data.full_name || "");
      }
    })();
  }, []);

  async function onSave(e: FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const supabase = createClient();
      const { data, error: updateError } = await supabase
        .from("profiles")
        .update({ full_name: name.trim() })
        .eq("id", profile.id)
        .select("*")
        .single();
      if (updateError) throw updateError;
      setProfile(data);
      setEditing(false);
      setSuccess("Profile updated.");
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  const displayName = profile?.full_name || name || "Student";
  const email = profile?.email || "";

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Profile"
        description="Your academic identity on DarasaX."
        actions={
          <Button variant="outline" onClick={() => setEditing((v) => !v)}>
            {editing ? "Cancel" : "Edit details"}
          </Button>
        }
      />

      {error ? (
        <div className="mb-4">
          <AuthAlert message={error} />
        </div>
      ) : null}
      {success ? (
        <div className="mb-4">
          <AuthAlert message={success} tone="success" />
        </div>
      ) : null}

      <div className="surface rounded-[24px] p-6">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <UserAvatar name={displayName} size="lg" />
          <div>
            <h2 className="font-heading text-xl font-semibold">{displayName}</h2>
            <p className="mt-1 text-muted-foreground">{email}</p>
          </div>
        </div>

        {editing ? (
          <form className="mt-6 grid gap-3 sm:grid-cols-2" onSubmit={onSave}>
            <label className="text-sm sm:col-span-2">
              Full name
              <input
                className="focus-ring mt-1 h-11 w-full rounded-[12px] border border-border bg-background px-3"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save changes"}
              </Button>
            </div>
          </form>
        ) : (
          <dl className="mt-8 grid gap-4 sm:grid-cols-2">
            {[
              ["Institution", profile?.institution || "—"],
              ["Programme", profile?.programme || "—"],
              [
                "Year",
                profile?.year_of_study ? `Year ${profile.year_of_study}` : "—",
              ],
              [
                "Semester",
                profile?.semester ? `Semester ${profile.semester}` : "—",
              ],
              ["Class", profile?.class_name || "—"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl bg-muted/50 px-4 py-3">
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                  {label}
                </dt>
                <dd className="mt-1 font-medium">{value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>

      <div className="mt-6 grid grid-cols-3 gap-3">
        <StatCard label="Modules joined" value={`${currentUser.modulesJoined}`} />
        <StatCard
          label="Resources viewed"
          value={`${currentUser.resourcesViewed}`}
        />
        <StatCard label="Study streak" value={`${currentUser.studyStreak} days`} />
      </div>
    </div>
  );
}
