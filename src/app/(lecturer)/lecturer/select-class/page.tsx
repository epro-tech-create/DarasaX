"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { AuthSubmitButton } from "@/components/auth/auth-submit-button";
import { classStreams } from "@/data/mock";
import { setActiveLecturerStream } from "@/lib/lecturer-context";
import { useStaffSession } from "@/lib/staff-auth";
import { cn } from "@/lib/utils";
import type { ClassStreamId } from "@/types";

export default function LecturerSelectClassPage() {
  const router = useRouter();
  const { session } = useStaffSession();
  const options = useMemo(() => {
    const ids = session?.streamIds ?? [];
    return classStreams.filter((s) => ids.includes(s.id));
  }, [session?.streamIds]);

  const [selected, setSelected] = useState<ClassStreamId | null>(null);

  function continueToDesk() {
    const id = selected ?? options[0]?.id;
    if (!id) return;
    setActiveLecturerStream(id);
    router.replace("/lecturer");
    router.refresh();
  }

  return (
    <AuthShell
      title={
        <>
          Which class
          <br />
          are you teaching?
        </>
      }
      subtitle="You teach more than one stream. Pick the class desk to open for this session."
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        Lecturer setup · Step 2 of 2
      </p>
      <h1 className="mt-1 font-heading text-xl font-semibold tracking-tight">
        Choose a class
      </h1>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground sm:text-[13px]">
        Uploads and topics in this session target the class you select. You can
        switch later from the header.
      </p>

      <div className="mt-5 space-y-2" role="radiogroup" aria-label="Choose a class">
        {options.map((s) => {
          const on = selected === s.id;
          return (
            <button
              key={s.id}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => setSelected(s.id)}
              className={cn(
                "focus-ring flex w-full items-start gap-3 rounded-2xl border px-3.5 py-3.5 text-left transition",
                on
                  ? "border-primary bg-primary/[0.07] shadow-sm shadow-primary/10"
                  : "border-border bg-card hover:border-primary/40 hover:shadow-sm",
              )}
            >
              <span
                className={cn(
                  "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold transition",
                  on
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-transparent",
                )}
                aria-hidden
              >
                ✓
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-semibold">{s.label}</span>
                <span className="mt-0.5 block text-[11px] text-muted-foreground">
                  {s.description ?? s.id}
                  {s.isEvening ? " · Evening" : ""}
                </span>
              </span>
            </button>
          );
        })}
        {options.length === 0 ? (
          <p className="rounded-xl border border-warning/30 bg-warning/10 px-3 py-2.5 text-[12px] text-warning">
            No classes on your profile. Complete onboarding first.
          </p>
        ) : null}
      </div>

      <div className="mt-5">
        <AuthSubmitButton
          type="button"
          loading={false}
          onClick={continueToDesk}
          disabled={options.length === 0 || (!selected && options.length > 1)}
        >
          Enter teaching desk
        </AuthSubmitButton>
        <p className="mt-2 text-center text-[11px] text-muted-foreground">
          {options.length > 1 && !selected
            ? "Select a class above to continue."
            : "Your desk opens with this class active."}
        </p>
      </div>
    </AuthShell>
  );
}
