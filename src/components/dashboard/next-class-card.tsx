"use client";
import { useTranslate } from "@/components/providers/language-provider";
import Image from "next/image";
import Link from "next/link";
import {
  BookOpen,
  ClipboardList,
  CalendarDays,
  Clock,
  GraduationCap,
  MapPin,
  UserRound,
} from "lucide-react";
import type { Module, TimetableEntry } from "@/types";
import { Button } from "@/components/ui/button";
import { formatTime, minutesUntil } from "@/lib/utils";

export function NextClassCard({
  entry,
  module,
  dayOffset = 0,
  moduleHref,
  timetableHref = "/timetable",
  moduleLabel = "View Module",
}: {
  entry: TimetableEntry;
  module: Module;
  dayOffset?: number;
  moduleHref?: string;
  timetableHref?: string;
  moduleLabel?: string;
}) {
  const translateUI = useTranslate();
  const mins = minutesUntil(entry.startTime, dayOffset);
  const days = Math.floor(mins / (60 * 24));
  const hours = Math.floor((mins % (60 * 24)) / 60);
  const remainingMinutes = mins % 60;
  const startsLabel =
    mins >= 60 * 24
      ? `Starts in ${days} ${days === 1 ? "day" : "days"}${hours ? ` ${hours} hr` : ""}`
      : mins >= 60
        ? `Starts in ${hours} hr${remainingMinutes ? ` ${remainingMinutes} min` : ""}`
        : mins > 0
          ? `Starts in ${mins} min`
          : mins > -120
            ? "Happening now"
            : "Coming up";

  return (
    <section className="relative overflow-hidden rounded-[22px] bg-[#1565C0] text-white">
      <Image
        src="/next-class-students.jpg"
        alt={""}
        fill
        priority
        sizes="(max-width: 1280px) 100vw, 1152px"
        className="object-cover object-center"
      />
      <div
        className="absolute inset-0 bg-gradient-to-r from-[#0B1B2B]/95 via-[#0B1B2B]/70 to-[#1565C0]/30"
        aria-hidden
      />
      <div
        className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#0B1B2B]/60 to-transparent"
        aria-hidden
      />

      <div className="relative z-10 flex flex-col gap-5 p-4 sm:flex-row sm:items-end sm:justify-between sm:gap-8 sm:p-7">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 sm:justify-start">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] sm:text-[11px] text-white/70">
              {translateUI("Next class")}</p>
            <span className="hidden h-1 w-1 rounded-full bg-white/40 sm:block" aria-hidden />
            <p className="text-[10px] font-medium text-white/80 sm:text-[12px]">{translateUI(startsLabel)}</p>
          </div>

          <h2 className="mt-3 font-heading text-xl font-semibold leading-snug tracking-tight sm:text-[2rem] sm:leading-[1.15]">
            {module.name}
          </h2>

          <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-white/90 sm:mt-5 sm:flex-row sm:text-[13px] sm:flex-wrap sm:items-center sm:gap-x-5 sm:gap-y-2">
            <li className="inline-flex min-w-0 items-center gap-2">
              <Clock className="h-3.5 w-3.5 shrink-0 text-white/65" aria-hidden />
              <span className="truncate font-medium">
                {translateUI(formatTime(entry.startTime))} — {translateUI(formatTime(entry.endTime))}
              </span>
            </li>
            <li className="hidden h-3 w-px bg-white/25 sm:block" aria-hidden />
            <li className="inline-flex min-w-0 items-center gap-2">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-white/65" aria-hidden />
              <span className="truncate font-medium">{entry.room}</span>
            </li>
            <li className="hidden h-3 w-px bg-white/25 sm:block" aria-hidden />
            <li className="inline-flex w-full min-w-0 items-center gap-2 sm:w-auto">
              <UserRound className="h-3.5 w-3.5 shrink-0 text-white/65" aria-hidden />
              <span className="truncate font-medium">{entry.lecturer}</span>
            </li>
          </ul>
        </div>

        <div className="grid shrink-0 grid-cols-2 gap-2 border-t border-white/15 pt-4 sm:flex sm:flex-wrap sm:gap-2.5 sm:border-0 sm:pt-0">
          <Button
            variant="secondary"
            className="h-11 min-w-0 bg-white px-3 text-xs font-semibold sm:h-10 sm:px-4 sm:text-sm text-[#0a3d8f] shadow-none hover:bg-white/90"
            href={moduleHref ?? `/modules/${module.id}`}
          >
            {translateUI(moduleLabel)}
          </Button>
          <Button
            variant="outline"
            className="h-11 min-w-0 border-white/25 bg-transparent px-3 text-xs text-white sm:h-10 sm:bg-white/10 sm:px-4 sm:text-sm backdrop-blur-sm hover:bg-white/20"
            href={timetableHref}
          >
            {translateUI("View Timetable")}</Button>
        </div>
      </div>
    </section>
  );
}

const statIcons = {
  Assignments: ClipboardList,
  Exams: GraduationCap,
  "School opening": CalendarDays,
  "Exam countdown": GraduationCap,
  Modules: BookOpen,
} as const;

export function StatCard({
  label,
  value,
  hint,
  href,
}: {
  label: string;
  value: string;
  hint?: string;
  href?: string;
}) {
  const translateUI = useTranslate();
  const Icon = statIcons[label as keyof typeof statIcons] || BookOpen;

  const body = (
    <div className="flex items-start gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted-foreground">{translateUI(label)}</p>
        <p className="mt-1 font-heading text-xl font-semibold tracking-tight">
          {translateUI(value)}
        </p>
        {hint ? (
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{translateUI(hint)}</p>
        ) : null}
      </div>
    </div>
  );

  if (!href) {
    return <div className="surface rounded-[16px] p-3.5 sm:p-4">{translateUI(body)}</div>;
  }

  return (
    <Link
      href={href}
      className="surface block rounded-[16px] p-3.5 transition duration-200 focus-ring motion-safe:hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 sm:p-4"
    >
      {translateUI(body)}
    </Link>
  );
}
