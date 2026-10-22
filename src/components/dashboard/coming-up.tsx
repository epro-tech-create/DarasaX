"use client";

import { useTranslate } from "@/components/providers/language-provider";
import Link from "next/link";
import { useEffect, useState } from "react";
import { CalendarDays, CheckCircle2, ChevronRight, ClipboardList } from "lucide-react";
import { useStudentProfile } from "@/components/providers/student-profile-provider";
import { useAssignments } from "@/lib/assignment-progress-store";
import { useTimetableStore } from "@/lib/timetable-store";
import { getModule } from "@/data/mock";
import { formatTime } from "@/lib/utils";
import { tanzaniaDate, occurrenceTime, sessionActive } from "@/lib/timetable-dates";

export function ComingUp() {
  const translateUI = useTranslate();
  const { profile } = useStudentProfile();
  const { entries, ready: timetableReady } = useTimetableStore();
  const { items, ready: assignmentsReady } = useAssignments();
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    const update = () => setNow(new Date());
    const initial = setTimeout(update, 0);
    const timer = setInterval(update, 30000);
    return () => { clearTimeout(initial); clearInterval(timer); };
  }, []);
  const ready = timetableReady && assignmentsReady && now && profile;
  const classes = !ready ? [] : entries
    .filter((entry) => entry.streamId === profile.class_name && entry.sessionDate === tanzaniaDate(now) && sessionActive(entry))
    .map((entry) => {
      const time = (value: string) => {
        return occurrenceTime(entry.sessionDate!, value);
      };
      return { id: `class-${entry.id}`, title: getModule(entry.moduleId)?.name || "Class session", detail: `${formatTime(entry.startTime)} – ${formatTime(entry.endTime)} · ${entry.room} · ${entry.lecturer}`, time: time(entry.startTime), ends: time(entry.endTime), href: "/timetable", kind: "class" as const };
    }).filter((entry) => entry.ends > now.getTime());
  const deadlines = !ready ? [] : items.filter((item) => item.status !== "completed" && Number.isFinite(Date.parse(item.deadline)) && Date.parse(item.deadline) >= now.getTime())
    .map((item) => ({ id: `assignment-${item.id}`, title: item.title, detail: `Due ${new Date(item.deadline).toLocaleString(translateUI.locale, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}`, time: Date.parse(item.deadline), href: `/assignments/${item.id}`, kind: "assignment" as const }));
  const upcoming = [...classes, ...deadlines].sort((a, b) => a.time - b.time).slice(0, 4);

  return (
    <section className="surface rounded-[20px] p-4 sm:p-5" aria-labelledby="coming-up-title">
      <div className="mb-4 flex items-center gap-3">
        <span className="rounded-xl bg-primary/10 p-2 text-primary"><CalendarDays className="h-5 w-5" aria-hidden /></span>
        <div><h2 id="coming-up-title" className="text-base font-semibold">{translateUI("Coming up")}</h2><p className="text-xs text-muted-foreground">{translateUI("Today’s classes and your next deadlines")}</p></div>
      </div>
      {!ready ? <p role="status" className="py-6 text-sm text-muted-foreground">{translateUI("Loading your schedule…")}</p> : upcoming.length === 0 ? (
        <div className="rounded-2xl bg-muted/40 px-4 py-6 text-center"><CheckCircle2 className="mx-auto mb-2 h-6 w-6 text-primary" aria-hidden /><p className="text-sm font-medium">{translateUI("You’re all caught up")}</p><p className="mt-1 text-xs text-muted-foreground">{translateUI("No remaining classes today or upcoming deadlines.")}</p></div>
      ) : <ul className="divide-y divide-border/60">{upcoming.map((item) => {
        const Icon = item.kind === "class" ? CalendarDays : ClipboardList;
        return <li key={item.id}><Link href={item.href} className="focus-ring group flex items-center gap-3 rounded-xl py-3 transition-colors hover:bg-muted/40">
          <Icon className="h-4 w-4 shrink-0 text-primary" aria-hidden />
          <div className="min-w-0 flex-1"><p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{translateUI(item.kind === "class" ? "Today · Class" : "Assignment")}</p><p className="text-sm font-medium leading-snug">{item.title}</p><p className="mt-1 break-words text-xs leading-relaxed text-muted-foreground">{translateUI(item.detail)}</p></div>
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
        </Link></li>;
      })}</ul>}
      <div className="mt-4 grid grid-cols-2 gap-2 border-t border-border pt-4 text-center text-xs font-medium">
        <Link href="/timetable" className="focus-ring rounded-xl bg-muted/60 px-2 py-3 transition-colors hover:bg-primary/10">{translateUI("View timetable")}</Link>
        <Link href="/assignments" className="focus-ring rounded-xl bg-muted/60 px-2 py-3 transition-colors hover:bg-primary/10">{translateUI("View assignments")}</Link>
      </div>
    </section>
  );
}
