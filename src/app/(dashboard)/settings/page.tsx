"use client";

import { useTranslate } from "@/components/providers/language-provider";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/components/providers/theme-provider";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { AuthAlert } from "@/components/auth/auth-alert";
import { cn } from "@/lib/utils";
import { LanguageSettings } from "@/components/profile/language-settings";
import { createClient } from "@/lib/supabase/client";
import { getAuthErrorMessage } from "@/lib/auth/errors";

const sections = [
  {
    id: "account",
    title: "Account",
    description: "Email, password, and linked student identity.",
  },
  {
    id: "notifications",
    title: "Notifications",
    description: "Deadlines, new notes, timetable changes, and announcements.",
  },
  {
    id: "appearance",
    title: "Appearance",
    description: "Choose dark (default) or light theme.",
  },
  {
    id: "privacy",
    title: "Privacy",
    description: "Control what classmates and class reps can see.",
  },
  {
    id: "language",
    title: "Language",
    description: "Interface language preferences.",
  },
] as const;

export default function SettingsPage() {
  const translateUI = useTranslate();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(true);
  const [email, setEmail] = useState("");
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const supabase = createClient();
    void supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? "");
    });
  }, []);

  async function signOut() {
    setSigningOut(true);
    setError("");
    try {
      const supabase = createClient();
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) throw signOutError;
      router.replace("/login");
      router.refresh();
    } catch (err) {
      setError(getAuthErrorMessage(err));
      setSigningOut(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title={translateUI("Settings")}
        description={translateUI("Tune DarasaX to how you study.")}
      />

      {error ? (
        <div className="mb-4">
          <AuthAlert message={translateUI(error)} />
        </div>
      ) : null}

      <div className="space-y-4">
        {sections.map((section) => (
          <section key={section.id} className="surface rounded-[20px] p-5">
            <h2 className="font-heading text-lg font-semibold">{section.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {translateUI(section.description)}
            </p>

            {section.id === "appearance" && mounted ? (
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {(["dark", "light"] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setTheme(value)}
                    className={cn(
                      "rounded-2xl border px-3 py-3 text-sm font-medium capitalize",
                      theme === value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground",
                    )}
                  >
                    {translateUI(value)}
                  </button>
                ))}
              </div>
            ) : null}

            {section.id === "notifications" ? (
              <div className="mt-4 space-y-3">
                <label className="flex items-center justify-between gap-3 text-sm">
                  {translateUI("Email notifications")}<input
                    type="checkbox"
                    checked={emailNotifs}
                    onChange={(e) => setEmailNotifs(e.target.checked)}
                    className="h-4 w-4 accent-[var(--primary)]"
                  />
                </label>
                <label className="flex items-center justify-between gap-3 text-sm">
                  {translateUI("Push notifications")}<input
                    type="checkbox"
                    checked={pushNotifs}
                    onChange={(e) => setPushNotifs(e.target.checked)}
                    className="h-4 w-4 accent-[var(--primary)]"
                  />
                </label>
              </div>
            ) : null}

            {section.id === "language" ? (
              <div className="mt-4"><LanguageSettings /></div>
            ) : null}

            {section.id === "account" ? (
              <div className="mt-4 space-y-3 text-sm text-muted-foreground">
                <p>
                  {translateUI("Signed in as")}{" "}
                  <span className="font-medium text-foreground">
                    {translateUI(email || "…")}
                  </span>
                </p>
                <Button
                  variant="outline"
                  href="/forgot-password"
                  className="h-10"
                >
                  {translateUI("Change password")}</Button>
                <div>
                  <Button
                    variant="danger"
                    onClick={signOut}
                    disabled={signingOut}
                    className="h-10"
                  >
                    {translateUI(signingOut ? "Signing out..." : "Sign out")}
                  </Button>
                </div>
              </div>
            ) : null}

            {section.id === "privacy" ? (
              <p className="mt-4 text-sm text-muted-foreground">
                {translateUI("Your module progress is visible only to you by default.")}</p>
            ) : null}
          </section>
        ))}
      </div>
    </div>
  );
}
