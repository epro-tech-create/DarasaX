"use client";

import { useTranslate } from "@/components/providers/language-provider";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { AuthAlert } from "@/components/auth/auth-alert";
import { HorizontalStepper } from "@/components/auth/horizontal-stepper";
import {
  InstitutionIllustration,
  SemesterIllustration,
  YearIllustration,
} from "@/components/auth/onboarding-illustrations";
import { WelcomeCelebration } from "@/components/auth/welcome-celebration";
import { getAuthErrorMessage } from "@/lib/auth/errors";
import { createClient } from "@/lib/supabase/client";
import {
  ACTIVE_INSTITUTION,
  activeCohort,
  useClassRegistry,
} from "@/lib/class-registry";
import { cn } from "@/lib/utils";

const STEPS = [
  "Select Institution",
  "Academic Year",
  "Select Semester",
  "Congratulations",
];

const YEARS = [3].map((value) => ({
  value,
  label: `Year ${value}`,
  hint: "Year of study",
}));
const SEMESTERS = [1].map((value) => ({
  value,
  label: `Semester ${value}`,
  hint: "Select your current semester",
}));

export default function OnboardingPage() {
  const translateUI = useTranslate();
  const router = useRouter();
  const {
    classes,
    ready: classesReady,
    error: classesError,
    refresh: refreshClasses,
  } = useClassRegistry();
  const [streamId, setStreamId] = useState("");
  const [step, setStep] = useState(0);
  const [institution, setInstitution] = useState("");
  const [year, setYear] = useState<(typeof YEARS)[number]["value"] | null>(
    null,
  );
  const [semester, setSemester] = useState<
    (typeof SEMESTERS)[number]["value"] | null
  >(null);
  const availableClasses = classes.filter(
    (c) => activeCohort(c) && c.institution === institution && c.year === year,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function finish() {
    const chosenClass = classes.find((c) => c.id === streamId);
    if (
      institution !== ACTIVE_INSTITUTION ||
      year !== 3 ||
      semester !== 1 ||
      !chosenClass ||
      !activeCohort(chosenClass)
    ) {
      setError(
        "Registration is currently open only for DIT, BENG24COE, Year 3, Semester 1. Other classes are not available yet.",
      );
      return;
    }
    setLoading(true);
    setError("");
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login");
        return;
      }

      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          institution,
          programme: chosenClass.programme,
          class_name: streamId,
          year_of_study: year,
          semester,
          onboarding_completed: true,
        })
        .eq("id", user.id)
        .select("id")
        .single();

      if (updateError) throw updateError;
      setStep(3);
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function next() {
    if (step === 0 && !institution) {
      setError("Please select your institution.");
      return;
    }
    if (step === 1 && (!year || !streamId)) {
      setError("Please select your year and class.");
      return;
    }
    if (step === 2) {
      if (!semester) {
        setError("Please select your semester.");
        return;
      }
      await finish();
      return;
    }
    setError("");
    setStep((s) => s + 1);
  }

  function back() {
    if (step > 0 && step < 3) {
      setError("");
      setStep((s) => s - 1);
    }
  }

  return (
    <div className="gradient-mesh min-h-screen font-sans">
      <header className="mx-auto flex w-full max-w-2xl items-center justify-between px-4 py-4">
        <Logo href="/" />
        <ThemeToggle />
      </header>

      <main className="mx-auto w-full max-w-2xl px-4 pb-10">
        <div className="mb-3 text-center sm:text-left">
          <p className="text-[9px] font-medium uppercase tracking-[0.14em] text-primary">
            {translateUI("Profile setup")}</p>
          <h1 className="mt-1 font-heading text-xl font-semibold tracking-tight">
            {translateUI("Complete your DarasaX profile")}</h1>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {translateUI("A few quick details so we can personalize your semester workspace.")}</p>
        </div>

        <HorizontalStepper steps={STEPS} current={step} />

        <div className="surface mt-4 rounded-[20px] p-4 sm:p-6">
          {error ? (
            <div className="mb-4">
              <AuthAlert message={translateUI(error)} />
            </div>
          ) : null}

          <AnimatePresence mode="wait">
            {step === 3 ? (
              <motion.div
                key="done"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <WelcomeCelebration
                  title={translateUI("Congratulations!")}
                  subtitle="Your academic profile is ready. Welcome to DarasaX."
                  ctaLabel="Enter dashboard"
                  onContinue={() => {
                    router.push("/dashboard");
                    router.refresh();
                  }}
                />
              </motion.div>
            ) : (
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22 }}
              >
                {step === 0 ? (
                  <div className="grid items-center gap-6 md:grid-cols-[1fr_0.9fr]">
                    <div>
                      <h2 className="font-heading text-[15px] font-semibold tracking-tight">
                        {translateUI("Select your institution")}</h2>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {translateUI("Choose the university or college you attend.")}</p>

                      <label className="mt-4 block text-sm font-medium">
                        {translateUI("Institution")}
                        <select required value={institution} onChange={event => { setInstitution(event.target.value); setStreamId(""); setError(""); }} className="focus-ring mt-2 h-11 w-full rounded-xl border border-border bg-background px-3">
                          <option value="">{translateUI("Select your institution")}</option>
                          <option value={ACTIVE_INSTITUTION}>DIT</option>
                        </select>
                      </label>
                    </div>
                    <InstitutionIllustration className="mx-auto h-40 w-full max-w-[260px] md:h-44" />
                  </div>
                ) : null}

                {step === 1 ? (
                  <div className="grid items-center gap-6 md:grid-cols-[1fr_0.9fr]">
                    <div>
                      <h2 className="font-heading text-[15px] font-semibold tracking-tight">
                        {translateUI("Academic year")}</h2>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {translateUI("Which year of study are you currently in?")}</p>
                      <div className="mt-4 grid max-w-sm grid-cols-1 gap-2.5">
                        {YEARS.map((item) => (
                          <button
                            key={item.value}
                            type="button"
                            onClick={() => {
                              setYear(item.value);
                              setStreamId("");
                              setError("");
                            }}
                            className={cn(
                              "rounded-xl border px-3 py-3 text-left transition duration-200",
                              year === item.value
                                ? "border-primary btn-gradient shadow-[0_8px_22px_rgba(30,136,229,0.28)]"
                                : "border-border bg-background hover:bg-muted/60",
                            )}
                          >
                            <p className="text-sm font-semibold">
                              {translateUI(item.label)}
                            </p>
                            <p
                              className={cn(
                                "mt-0.5 text-[11px]",
                                year === item.value
                                  ? "text-primary-foreground/80"
                                  : "text-muted-foreground",
                              )}
                            >
                              {translateUI(item.hint)}
                            </p>
                          </button>
                        ))}
                      </div>
                      <label className="mt-4 block text-sm font-medium">
                        {translateUI("Your class")}<select
                          disabled={!classesReady}
                          required
                          value={streamId}
                          onChange={(event) => setStreamId(event.target.value)}
                          className="focus-ring mt-2 h-11 w-full rounded-xl border border-border bg-background px-3"
                        >
                          <option value="">{translateUI("Choose your class")}</option>
                          {availableClasses.map((stream) => (
                            <option key={stream.id} value={stream.id}>
                              {translateUI(stream.label)}
                            </option>
                          ))}
                        </select>
                      </label>
                      {classesError ? (
                        <p role="alert" className="mt-2 text-xs text-danger">
                          {translateUI(classesError)}{" "}
                          <button
                            type="button"
                            onClick={() => void refreshClasses()}
                            className="underline"
                          >
                            {translateUI("Retry")}</button>
                        </p>
                      ) : classesReady &&
                        year &&
                        availableClasses.length === 0 ? (
                        <p className="mt-2 text-xs text-muted-foreground">
                          {translateUI("No classes are available for this institution and year yet.")}</p>
                      ) : null}
                    </div>
                    <YearIllustration className="mx-auto h-40 w-full max-w-[260px] md:h-44" />
                  </div>
                ) : null}

                {step === 2 ? (
                  <div className="grid items-center gap-6 md:grid-cols-[1fr_0.9fr]">
                    <div>
                      <h2 className="font-heading text-[15px] font-semibold tracking-tight">
                        {translateUI("Select semester")}</h2>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {translateUI("Pick the semester you are in right now.")}</p>
                      <div className="mt-4 grid gap-2.5">
                        {SEMESTERS.map((item) => (
                          <button
                            key={item.value}
                            type="button"
                            onClick={() => {
                              setSemester(item.value);
                              setError("");
                            }}
                            className={cn(
                              "rounded-xl border px-3 py-3.5 text-left transition duration-200",
                              semester === item.value
                                ? "border-primary btn-gradient shadow-[0_8px_22px_rgba(30,136,229,0.28)]"
                                : "border-border bg-background hover:bg-muted/60",
                            )}
                          >
                            <p className="text-sm font-semibold">
                              {translateUI(item.label)}
                            </p>
                            <p
                              className={cn(
                                "mt-0.5 text-xs",
                                semester === item.value
                                  ? "text-primary-foreground/80"
                                  : "text-muted-foreground",
                              )}
                            >
                              {translateUI(item.hint)}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>
                    <SemesterIllustration className="mx-auto h-40 w-full max-w-[260px] md:h-44" />
                  </div>
                ) : null}

                <div className="mt-6 flex items-center justify-between gap-3 border-t border-border pt-4">
                  {step > 0 ? (
                    <button
                      type="button"
                      onClick={back}
                      disabled={loading}
                      className="text-xs font-medium text-muted-foreground transition hover:text-foreground"
                    >
                      {translateUI("Back")}</button>
                  ) : (
                    <span />
                  )}
                  <Button
                    onClick={next}
                    disabled={loading}
                    className="h-9 min-w-28 text-sm"
                  >
                    {translateUI(loading
                      ? "Saving..."
                      : step === 2
                        ? "Finish"
                        : "Next Step")}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
