"use client";
import { useEffect, useState } from "react";
import { ExamCountdown } from "@/components/dashboard/exam-countdown";

export function CrCountdowns() {
  const [initialNow, setInitialNow] = useState<number | null>(null);
  useEffect(() => { const timer = setTimeout(() => setInitialNow(Date.now()), 0); return () => clearTimeout(timer); }, []);
  if (initialNow === null) return null;
  return <ExamCountdown initialNow={initialNow} />;
}
