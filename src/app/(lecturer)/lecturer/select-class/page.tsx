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
      <h1 className="font-heading text-xl font-semibold tracking-tight sm:text-lg">
        Choose a class
      </h1>
      <p className="mt-1 text-sm text-muted-foreground sm:text-xs">
        Uploads and topics in this session target the class you select. You can
        switch later from the header.
      </p>

      <div className="mt-5 space-y-2">
        {options.map((s) => {
          const on = selected === s.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setSelected(s.id)}
              className={cn(
                "flex w-full flex-col rounded-xl border px-3 py-3 text-left transition",
                on
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/40",
              )}
            >
              <span className="text-[13px] font-semibold">{s.label}</span>
              <span className="text-[11px] text-muted-foreground">
                {s.id}
                {s.isEvening ? " · Evening" : ""}
              </span>
            </button>
          );
        })}
        {options.length === 0 ? (
          <p className="text-[12px] text-muted-foreground">
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
      </div>
    </AuthShell>
  );
}
