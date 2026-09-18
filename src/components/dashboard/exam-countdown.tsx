"use client";

import { useEffect, useState } from "react";
import { CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  formatCountdownParts,
  getMsUntilSchoolOpen,
  getSchoolOpenDate,
} from "@/lib/school";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function ExamCountdown() {
  const [msLeft, setMsLeft] = useState(() => getMsUntilSchoolOpen());

  useEffect(() => {
    setMsLeft(getMsUntilSchoolOpen());
    const id = window.setInterval(() => {
      setMsLeft(getMsUntilSchoolOpen());
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  const { days, hours, minutes, seconds, totalSeconds } =
    formatCountdownParts(msLeft);
  const openDate = getSchoolOpenDate();
  const openLabel = openDate.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  if (totalSeconds <= 0) {
    return (
      <section className="surface relative overflow-hidden rounded-[22px] p-5">
        <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-primary/10 blur-2xl" />
        <h2 className="relative font-heading text-[15px] font-semibold">
          Exam countdown
        </h2>
        <p className="relative mt-3 font-heading text-xl font-semibold text-primary">
          School is open
        </p>
        <p className="relative mt-1 text-[12px] text-muted-foreground">
          Term started on {openLabel}. Keep your study blocks going.
        </p>
        <Button className="relative mt-5" href="/planner">
          Open Study Planner
        </Button>
      </section>
    );
  }

  return (
    <section className="surface relative overflow-hidden rounded-[22px] p-5">
      <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-primary/10 blur-2xl" />
      <div className="relative flex items-center gap-2 text-muted-foreground">
        <CalendarDays className="h-4 w-4 text-primary" />
        <h2 className="font-heading text-[15px] font-semibold text-foreground">
          Exam countdown
        </h2>
      </div>
      <p className="relative mt-3 font-heading text-3xl font-semibold tabular-nums text-primary">
        {days}
        <span className="ml-1.5 text-[13px] font-medium text-muted-foreground">
          days
        </span>
      </p>
      <div className="relative mt-3 grid grid-cols-3 gap-2">
        {[
          [hours, "hrs"],
          [minutes, "min"],
          [seconds, "sec"],
        ].map(([value, label]) => (
          <div
            key={String(label)}
            className="rounded-xl bg-muted/70 px-2 py-2 text-center"
          >
            <p className="font-heading text-base font-semibold tabular-nums">
              {pad(Number(value))}
            </p>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
              {label}
            </p>
          </div>
        ))}
      </div>
      <p className="relative mt-3 text-[12px] text-muted-foreground">
        School opens {openLabel}
      </p>
      <Button className="relative mt-5 w-full sm:w-auto" href="/planner">
        Open Study Planner
      </Button>
    </section>
  );
}
