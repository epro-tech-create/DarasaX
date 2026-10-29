"use client";
import { useEffect, useState } from "react";
import { useStudentProfile } from "@/components/providers/student-profile-provider";
import { useTimetableStore } from "@/lib/timetable-store";
import { getNextClass } from "@/lib/academic";
import { NextClassCard } from "@/components/dashboard/next-class-card";
import type { ClassStreamId, TimetableEntry } from "@/types";
import { useTranslate } from "@/components/providers/language-provider";

export function LiveNextClass({ initialEntries, initialLoaded, initialNow }: {
  initialEntries: TimetableEntry[]; initialLoaded: boolean; initialNow: number;
}) {
  const t = useTranslate();
  const { profile } = useStudentProfile();
  const { entries, ready, error } = useTimetableStore();
  const [now, setNow] = useState(() => new Date(initialNow));
  useEffect(() => { const timer = setInterval(() => setNow(new Date()), 30000); return () => clearInterval(timer); }, []);
  if (!profile?.class_name) return null;
  const next = getNextClass(now, profile.class_name as ClassStreamId, ready && !error ? entries : initialEntries);
  if (next) return <NextClassCard entry={next.entry} module={next.module} dayOffset={next.dayOffset} initialNow={initialNow} />;
  return <section className="surface flex min-h-[260px] items-center justify-center rounded-[22px] p-6 sm:min-h-[200px]" aria-busy={!initialLoaded && !ready}>
    <p role="status" className="text-sm text-muted-foreground">{t(error && !initialLoaded ? error : !initialLoaded && !ready ? "Loading your schedule…" : "No upcoming classes scheduled.")}</p>
  </section>;
}
