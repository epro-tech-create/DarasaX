"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
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
import { cn } from "@/lib/utils";

const STEPS = [
  "Select Institution",
  "Academic Year",
  "Select Semester",
  "Congratulations",
];

const UNIVERSITIES = [
  "Dar es Salaam Institute of Technology (DIT)",
  "University of Dar es Salaam (UDSM)",
  "Mzumbe University",
  "Ardhi University (ARU)",
  "Muhimbili University of Health and Allied Sciences (MUHAS)",
  "Sokoine University of Agriculture (SUA)",
  "Nelson Mandela African Institution of Science and Technology (NM-AIST)",
  "Open University of Tanzania (OUT)",
  "University of Dodoma (UDOM)",
  "Mbeya University of Science and Technology (MUST)",
  "Moshi Co-operative University (MoCU)",
  "Institute of Finance Management (IFM)",
  "College of Business Education (CBE)",
  "Tanzania Institute of Accountancy (TIA)",
  "Ruaha Catholic University (RUCU)",
  "St. Augustine University of Tanzania (SAUT)",
  "Tumaini University Dar es Salaam College (TUDARCo)",
  "Kampala International University in Tanzania (KIUT)",
  "Catholic University of Health and Allied Sciences (CUHAS)",
  "State University of Zanzibar (SUZA)",
  "Zanzibar University",
  "Jordan University College",
  "Mwenge Catholic University (MWECAU)",
  "University of Iringa",
  "Teofilo Kisanji University (TEKU)",
  "St. John's University of Tanzania",
  "Sebastian Kolowa Memorial University (SEKOMU)",
  "Institute of Social Work (ISW)",
  "Dar es Salaam University College of Education (DUCE)",
  "Mkwawa University College of Education (MUCE)",
];

const YEARS = [
  { value: 1, label: "Year 1", hint: "First year" },
  { value: 2, label: "Year 2", hint: "Second year" },
  { value: 3, label: "Year 3", hint: "Third year" },
  { value: 4, label: "Year 4", hint: "Final year" },
] as const;

const SEMESTERS = [
  { value: 1, label: "Semester 1", hint: "First half of the academic year" },
  { value: 2, label: "Semester 2", hint: "Second half of the academic year" },
] as const;

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [institution, setInstitution] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [year, setYear] = useState<(typeof YEARS)[number]["value"] | null>(null);
  const [semester, setSemester] = useState<(typeof SEMESTERS)[number]["value"] | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const filteredUniversities = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return UNIVERSITIES;
    return UNIVERSITIES.filter((name) => name.toLowerCase().includes(q));
  }, [search]);

  async function finish() {
    if (!institution || !year || !semester) return;
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
          year_of_study: year,
          semester,
          onboarding_completed: true,
        })
        .eq("id", user.id);

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
    if (step === 1 && !year) {
      setError("Please select your academic year.");
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
            Profile setup
          </p>
          <h1 className="mt-1 font-heading text-[15px] font-semibold tracking-tight">
            Complete your DarasaX profile
          </h1>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            A few quick details so we can personalize your semester workspace.
          </p>
        </div>

        <HorizontalStepper steps={STEPS} current={step} />

        <div className="surface mt-4 rounded-[20px] p-4 sm:p-6">
          {error ? (
            <div className="mb-4">
              <AuthAlert message={error} />
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
                  title="Congratulations!"
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
                        Select your institution
                      </h2>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        Choose the university or college you attend.
                      </p>

                      <div className="relative mt-4">
                        <button
                          type="button"
                          onClick={() => setDropdownOpen((o) => !o)}
                          className="focus-ring flex h-10 w-full items-center justify-between rounded-[10px] border border-border bg-background px-3 text-left text-sm"
                          aria-expanded={dropdownOpen}
                        >
                          <span
                            className={cn(
                              !institution && "text-muted-foreground",
                            )}
                          >
                            {institution || "Select university..."}
                          </span>
                          <ChevronDown
                            className={cn(
                              "h-4 w-4 text-muted-foreground transition",
                              dropdownOpen && "rotate-180",
                            )}
                          />
                        </button>

                        {dropdownOpen ? (
                          <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-[14px] border border-border bg-card shadow-soft">
                            <div className="border-b border-border p-2">
                              <input
                                autoFocus
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search universities..."
                                className="focus-ring h-10 w-full rounded-[10px] border border-border bg-background px-3 text-sm"
                              />
                            </div>
                            <ul className="max-h-56 overflow-y-auto p-1.5">
                              {filteredUniversities.map((name) => (
                                <li key={name}>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setInstitution(name);
                                      setDropdownOpen(false);
                                      setSearch("");
                                      setError("");
                                    }}
                                    className={cn(
                                      "w-full rounded-[10px] px-3 py-2.5 text-left text-sm transition hover:bg-muted",
                                      institution === name &&
                                        "bg-primary/10 text-primary",
                                    )}
                                  >
                                    {name}
                                  </button>
                                </li>
                              ))}
                              {filteredUniversities.length === 0 ? (
                                <li className="px-3 py-4 text-center text-sm text-muted-foreground">
                                  No universities found
                                </li>
                              ) : null}
                            </ul>
                          </div>
                        ) : null}
                      </div>
                    </div>
                    <InstitutionIllustration className="mx-auto h-40 w-full max-w-[260px] md:h-44" />
                  </div>
                ) : null}

                {step === 1 ? (
                  <div className="grid items-center gap-6 md:grid-cols-[1fr_0.9fr]">
                    <div>
                      <h2 className="font-heading text-[15px] font-semibold tracking-tight">
                        Academic year
                      </h2>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        Which year of study are you currently in?
                      </p>
                      <div className="mt-4 grid grid-cols-2 gap-2.5">
                        {YEARS.map((item) => (
                          <button
                            key={item.value}
                            type="button"
                            onClick={() => {
                              setYear(item.value);
                              setError("");
                            }}
                            className={cn(
                              "rounded-xl border px-3 py-3 text-left transition duration-200",
                              year === item.value
                                ? "border-primary btn-gradient shadow-[0_8px_22px_rgba(30,136,229,0.28)]"
                                : "border-border bg-background hover:bg-muted/60",
                            )}
                          >
                            <p className="text-sm font-semibold">{item.label}</p>
                            <p
                              className={cn(
                                "mt-0.5 text-[11px]",
                                year === item.value
                                  ? "text-primary-foreground/80"
                                  : "text-muted-foreground",
                              )}
                            >
                              {item.hint}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>
                    <YearIllustration className="mx-auto h-40 w-full max-w-[260px] md:h-44" />
                  </div>
                ) : null}

                {step === 2 ? (
                  <div className="grid items-center gap-6 md:grid-cols-[1fr_0.9fr]">
                    <div>
                      <h2 className="font-heading text-[15px] font-semibold tracking-tight">
                        Select semester
                      </h2>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        Pick the semester you are in right now.
                      </p>
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
                            <p className="text-sm font-semibold">{item.label}</p>
                            <p
                              className={cn(
                                "mt-0.5 text-xs",
                                semester === item.value
                                  ? "text-primary-foreground/80"
                                  : "text-muted-foreground",
                              )}
                            >
                              {item.hint}
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
                      Back
                    </button>
                  ) : (
                    <span />
                  )}
                  <Button
                    onClick={next}
                    disabled={loading}
                    className="h-9 min-w-28 text-sm"
                  >
                    {loading
                      ? "Saving..."
                      : step === 2
                        ? "Finish"
                        : "Next Step"}
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
