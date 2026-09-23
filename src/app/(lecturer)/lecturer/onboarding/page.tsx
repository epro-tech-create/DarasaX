"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthAlert } from "@/components/auth/auth-alert";
import { AuthShell } from "@/components/auth/auth-shell";
import { AuthSubmitButton } from "@/components/auth/auth-submit-button";
import { Button } from "@/components/ui/button";
import { classStreams } from "@/data/mock";
import {
  LECTURER_MODULE_OPTIONS,
  type StreamCountChoice,
} from "@/data/lecturer-modules";
import {
  completeLecturerOnboarding,
  getLecturerEntryPath,
} from "@/lib/staff-auth";
import { cn } from "@/lib/utils";
import type { ClassStreamId } from "@/types";

type Step = "module" | "stream-count" | "streams";

export default function LecturerOnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("module");
  const [moduleIds, setModuleIds] = useState<string[]>([]);
  const [streamCount, setStreamCount] = useState<StreamCountChoice | null>(
    null,
  );
  const [streamIds, setStreamIds] = useState<ClassStreamId[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const requiredStreams = useMemo(() => {
    if (streamCount === 1) return 1;
    if (streamCount === 2) return 2;
    if (streamCount === "more") return 3;
    return 0;
  }, [streamCount]);

  const streamCountLabel =
    streamCount === 1
      ? "one stream"
      : streamCount === 2
        ? "two streams"
        : streamCount === "more"
          ? "three or more streams"
          : null;

  function toggleModule(id: string) {
    setModuleIds((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id],
    );
  }

  function pickStream(id: ClassStreamId) {
    setStreamIds((prev) => {
      if (prev.includes(id)) return prev.filter((s) => s !== id);
      if (streamCount === 1) return [id];
      if (streamCount === 2) {
        if (prev.length >= 2) return [prev[1], id];
        return [...prev, id];
      }
      // more: allow 3+
      return [...prev, id];
    });
  }

  function goNextFromModule() {
    setError("");
    if (moduleIds.length === 0) {
      setError("Select at least one module you teach.");
      return;
    }
    setStep("stream-count");
  }

  function goNextFromCount(choice: StreamCountChoice) {
    setStreamCount(choice);
    setStreamIds([]);
    setError("");
    setStep("streams");
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (moduleIds.length === 0) {
      setError("Select at least one module.");
      return;
    }
    if (!streamCount) {
      setError("Choose how many streams you teach.");
      return;
    }
    if (streamCount === 1 && streamIds.length !== 1) {
      setError("Pick the one stream you teach.");
      return;
    }
    if (streamCount === 2 && streamIds.length !== 2) {
      setError("Pick exactly two streams.");
      return;
    }
    if (streamCount === "more" && streamIds.length < 3) {
      setError("Pick at least three streams.");
      return;
    }

    setLoading(true);
    try {
      const session = await completeLecturerOnboarding({ streamIds, moduleIds });
      router.replace(getLecturerEntryPath(session));
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not save your teaching profile.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title={
        <>
          Set up your
          <br />
          teaching desk.
        </>
      }
      subtitle="Pick the module(s) you teach, then say whether you cover one stream or more."
    >
      <h1 className="font-heading text-xl font-semibold tracking-tight sm:text-lg">
        Lecturer onboarding
      </h1>
      <p className="mt-1 text-sm text-muted-foreground sm:text-xs">
        Step{" "}
        {step === "module" ? "1" : step === "stream-count" ? "2" : "3"} of 3 ·
        Module names are fixed for this programme.
      </p>

      {error ? (
        <div className="mt-4">
          <AuthAlert message={error} />
        </div>
      ) : null}

      {step === "module" ? (
        <div className="mt-5 space-y-4">
          <fieldset>
            <legend className="text-sm font-medium sm:text-xs">
              Which module(s) do you teach?
            </legend>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Choose one or more. Notes, topics, and assignments stay limited to
              these modules.
            </p>
            <div className="mt-2 max-h-64 space-y-1.5 overflow-y-auto rounded-xl border border-border p-2">
              {LECTURER_MODULE_OPTIONS.map((m) => {
                const on = moduleIds.includes(m.id);
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => toggleModule(m.id)}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-lg px-2 py-2.5 text-left text-[12px] transition",
                      on ? "bg-primary/12 text-primary" : "hover:bg-muted",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px]",
                        on
                          ? "border-primary bg-primary text-white"
                          : "border-border",
                      )}
                    >
                      {on ? "✓" : ""}
                    </span>
                    <span className="min-w-0">
                      <span className="block font-semibold">{m.name}</span>
                      <span className="text-[11px] text-muted-foreground">
                        {m.code}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="mt-1.5 text-[11px] text-muted-foreground">
              {moduleIds.length} selected
            </p>
          </fieldset>

          <AuthSubmitButton
            type="button"
            loading={false}
            onClick={goNextFromModule}
          >
            Next — streams
          </AuthSubmitButton>
        </div>
      ) : null}

      {step === "stream-count" ? (
        <div className="mt-5 space-y-4">
          <fieldset>
            <legend className="text-sm font-medium sm:text-xs">
              How many streams do you teach?
            </legend>
            <p className="mt-1 text-[11px] text-muted-foreground">
              If you teach the same module to more than one class, pick 2 or
              more.
            </p>
            <div className="mt-3 grid gap-2">
              {(
                [
                  { value: 1 as const, title: "One stream", hint: "A single class" },
                  {
                    value: 2 as const,
                    title: "Two streams",
                    hint: "Same module across two classes",
                  },
                  {
                    value: "more" as const,
                    title: "Three or more",
                    hint: "Multiple day / evening streams",
                  },
                ] as const
              ).map((opt) => (
                <button
                  key={String(opt.value)}
                  type="button"
                  onClick={() => goNextFromCount(opt.value)}
                  className="flex w-full flex-col rounded-xl border border-border px-3 py-3 text-left transition hover:border-primary/50 hover:bg-primary/5"
                >
                  <span className="text-[13px] font-semibold">{opt.title}</span>
                  <span className="text-[11px] text-muted-foreground">
                    {opt.hint}
                  </span>
                </button>
              ))}
            </div>
          </fieldset>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => {
              setError("");
              setStep("module");
            }}
          >
            Back
          </Button>
        </div>
      ) : null}

      {step === "streams" ? (
        <form className="mt-5 space-y-4" onSubmit={onSubmit} noValidate>
          <fieldset>
            <legend className="text-sm font-medium sm:text-xs">
              Select your {streamCountLabel}
            </legend>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {streamCount === 1
                ? "Tap the class you teach."
                : streamCount === 2
                  ? "Tap exactly two classes."
                  : "Tap at least three classes."}{" "}
              ({streamIds.length}
              {requiredStreams
                ? streamCount === "more"
                  ? ` / ${requiredStreams}+`
                  : ` / ${requiredStreams}`
                : ""}{" "}
              selected)
            </p>
            <div className="mt-2 grid gap-2">
              {classStreams.map((s) => {
                const on = streamIds.includes(s.id);
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => pickStream(s.id)}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-xl border px-3 py-2.5 text-left transition",
                      on
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/40",
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px]",
                        on
                          ? "border-primary bg-primary text-white"
                          : "border-border",
                      )}
                    >
                      {on ? "✓" : ""}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[13px] font-semibold">
                        {s.label}
                      </span>
                      <span className="block text-[11px] text-muted-foreground">
                        {s.description}
                        {s.isEvening ? " · Evening" : ""}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div className="flex flex-col gap-2">
            <AuthSubmitButton loading={loading} loadingText="Saving…">
              Finish setup
            </AuthSubmitButton>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => {
                setError("");
                setStep("stream-count");
              }}
            >
              Back
            </Button>
          </div>
        </form>
      ) : null}
    </AuthShell>
  );
}
