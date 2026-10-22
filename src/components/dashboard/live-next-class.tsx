"use client";
import { useEffect, useState } from "react";
import { useStudentProfile } from "@/components/providers/student-profile-provider";
import { useTimetableStore } from "@/lib/timetable-store";
import { getNextClass } from "@/lib/academic";
import { NextClassCard } from "@/components/dashboard/next-class-card";
import type { ClassStreamId } from "@/types";

export function LiveNextClass() {
  const { profile } = useStudentProfile();
  const { entries } = useTimetableStore();
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const timer = setInterval(() => setNow(new Date()), 30000); return () => clearInterval(timer); }, []);
  if (!profile?.class_name) return null;
  const next = getNextClass(now, profile.class_name as ClassStreamId, entries);
  return next ? <NextClassCard entry={next.entry} module={next.module} dayOffset={next.dayOffset} /> : null;
}
