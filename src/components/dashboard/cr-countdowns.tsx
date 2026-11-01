"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ClipboardList } from "lucide-react";
import { ExamCountdown } from "@/components/dashboard/exam-countdown";
import { useTranslate } from "@/components/providers/language-provider";
import { formatCountdownParts } from "@/lib/school";
import type { MaterialUpload } from "@/types";

export function CrCountdowns({ assignments }: { assignments: MaterialUpload[] }) {
  const [initialNow, setInitialNow] = useState<number | null>(null);
  useEffect(() => { const timer = setTimeout(() => setInitialNow(Date.now()), 0); return () => clearTimeout(timer); }, []);
  if (initialNow === null) return null;
  return <div className="grid gap-4 sm:grid-cols-2"><ExamCountdown initialNow={initialNow} /><AssignmentCountdown assignments={assignments} initialNow={initialNow} /></div>;
}

function AssignmentCountdown({ assignments, initialNow }: { assignments: MaterialUpload[]; initialNow: number }) {
  const t = useTranslate();
  const [now, setNow] = useState(initialNow);
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, []);
  const upcoming = assignments.filter(item => item.kind === "assignment" && item.dueAt && Date.parse(item.dueAt) > now)
    .sort((a, b) => Date.parse(a.dueAt!) - Date.parse(b.dueAt!));
  const next = upcoming[0];
  const parts = formatCountdownParts(next ? Date.parse(next.dueAt!) - now : 0);
  return <section className="surface rounded-[22px] p-5">
    <h2 className="flex items-center gap-2 font-heading text-[15px] font-semibold"><ClipboardList className="h-4 w-4 text-primary" aria-hidden />{t("Assignment countdown")}</h2>
    {next ? <><p className="mt-3 break-words text-sm font-medium">{next.title}</p><p className="mt-3 font-heading text-3xl font-semibold tabular-nums text-primary">{parts.days}<span className="ml-1.5 text-[13px] font-medium text-muted-foreground">{t("days")}</span></p>
      <div className="mt-3 grid grid-cols-3 gap-2">{[[parts.hours, "hrs"], [parts.minutes, "min"], [parts.seconds, "sec"]].map(([value, label]) => <div key={label} className="rounded-xl bg-muted/70 px-2 py-2 text-center"><p className="font-heading text-base font-semibold tabular-nums">{String(value).padStart(2, "0")}</p><p className="text-[10px] uppercase tracking-wide text-muted-foreground">{t(label)}</p></div>)}</div>
      <p className="mt-3 text-xs text-muted-foreground">{t("Due")} {new Date(next.dueAt!).toLocaleString(t.locale, { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Dar_es_Salaam" })} · EAT</p></> : <p className="py-8 text-sm text-muted-foreground">{t("No upcoming assignment deadlines for your class.")}</p>}
    <Link href="/cr/assignments" className="focus-ring mt-4 inline-block rounded-lg text-xs font-semibold text-primary">{t("View assignments")}</Link>
  </section>;
}
