"use client";

import { useEffect, useState } from "react";
import { CalendarDays } from "lucide-react";
import { useTranslate } from "@/components/providers/language-provider";
import { StatCard } from "@/components/dashboard/next-class-card";
import { formatCountdownParts, getAcademicCountdown } from "@/lib/school";

function useAcademicCountdown(initialNow: number) {
  const [now, setNow] = useState(initialNow);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  return getAcademicCountdown(new Date(now));
}

export function AcademicCountdownStatCard({ initialNow }: { initialNow: number }) {
  const translateUI = useTranslate();
  const countdown = useAcademicCountdown(initialNow);
  const { days } = formatCountdownParts(countdown.remaining);
  return <StatCard
    label={countdown.phase === "opening" ? "School opening" : "Exam countdown"}
    value={countdown.reached ? translateUI("Started") : translateUI(`${days} days`)}
    hint={countdown.phase === "opening" ? "Until school opens" : "Test 1 · Week 7"}
    href="/timetable"
  />;
}

export function ExamCountdown({ initialNow }: { initialNow: number }) {
  const translateUI = useTranslate();
  const countdown = useAcademicCountdown(initialNow);
  const { days, hours, minutes, seconds } = formatCountdownParts(countdown.remaining);
  const targetLabel = countdown.target.toLocaleDateString(translateUI.locale, {
    day: "numeric", month: "long", year: "numeric", timeZone: "Africa/Dar_es_Salaam",
  });
  return <section className="surface relative overflow-hidden rounded-[22px] p-5">
    <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-primary/10 blur-2xl" />
    <div className="relative flex items-center gap-2 text-muted-foreground">
      <CalendarDays className="h-4 w-4 text-primary" aria-hidden />
      <h2 className="font-heading text-[15px] font-semibold text-foreground">
        {translateUI(countdown.phase === "opening" ? "School opening" : "Exam countdown")}
      </h2>
    </div>
    {countdown.reached ? <p className="relative mt-3 text-lg font-semibold text-primary">{translateUI("Test 1 period has started")}</p> : <>
      <p className="relative mt-3 font-heading text-3xl font-semibold tabular-nums text-primary">
        {days}<span className="ml-1.5 text-[13px] font-medium text-muted-foreground">{translateUI("days")}</span>
      </p>
      <div className="relative mt-3 grid grid-cols-3 gap-2">
        {[[hours, "hrs"], [minutes, "min"], [seconds, "sec"]].map(([value, label]) => <div key={label} className="rounded-xl bg-muted/70 px-2 py-2 text-center">
          <p className="font-heading text-base font-semibold tabular-nums">{String(value).padStart(2, "0")}</p>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{translateUI(label)}</p>
        </div>)}
      </div>
    </>}
    <p className="relative mt-3 text-[12px] text-muted-foreground">
      {translateUI(countdown.phase === "opening" ? "School opens" : "Test 1 starts")} {targetLabel}
      {countdown.phase === "test" && <span> · {translateUI("Week 7")}</span>}
    </p>
  </section>;
}
