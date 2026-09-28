import Link from "next/link";
import {
  BookOpen,
  ClipboardList,
  Clock,
  Flame,
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
}: {
  entry: TimetableEntry;
  module: Module;
  dayOffset?: number;
}) {
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
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
          backgroundSize: "22px 22px",
        }}
        aria-hidden
      />

      <div className="relative z-10 flex flex-col gap-7 p-5 sm:flex-row sm:items-end sm:justify-between sm:gap-8 sm:p-7">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70">
              Next class
            </p>
            <span className="h-1 w-1 rounded-full bg-white/40" aria-hidden />
            <p className="text-[12px] font-medium text-white/90">{startsLabel}</p>
          </div>

          <h2 className="mt-3 font-heading text-[1.65rem] font-semibold leading-[1.15] tracking-tight sm:text-[2rem]">
            {module.name}
          </h2>

          <ul className="mt-5 flex flex-col gap-2.5 text-[13px] text-white/90 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-5 sm:gap-y-2">
            <li className="inline-flex min-w-0 items-center gap-2">
              <Clock className="h-3.5 w-3.5 shrink-0 text-white/65" aria-hidden />
              <span className="truncate font-medium">
                {formatTime(entry.startTime)} — {formatTime(entry.endTime)}
              </span>
            </li>
            <li className="hidden h-3 w-px bg-white/25 sm:block" aria-hidden />
            <li className="inline-flex min-w-0 items-center gap-2">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-white/65" aria-hidden />
              <span className="truncate font-medium">{entry.room}</span>
            </li>
            <li className="hidden h-3 w-px bg-white/25 sm:block" aria-hidden />
            <li className="inline-flex min-w-0 items-center gap-2">
              <UserRound className="h-3.5 w-3.5 shrink-0 text-white/65" aria-hidden />
              <span className="truncate font-medium">{entry.lecturer}</span>
            </li>
          </ul>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2.5">
          <Button
            variant="secondary"
            className="h-10 bg-white px-4 text-sm font-semibold text-[#0a3d8f] shadow-none hover:bg-white/90"
            href={`/modules/${module.id}`}
          >
            View Module
          </Button>
          <Button
            variant="outline"
            className="h-10 border-white/35 bg-white/10 px-4 text-sm text-white backdrop-blur-sm hover:bg-white/20"
            href="/timetable"
          >
            View Timetable
          </Button>
        </div>
      </div>
    </section>
  );
}

const statIcons = {
  Assignments: ClipboardList,
  Exams: GraduationCap,
  Modules: BookOpen,
  "Study streak": Flame,
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
  const Icon = statIcons[label as keyof typeof statIcons] || BookOpen;

  const body = (
    <div className="flex items-start gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] text-muted-foreground">{label}</p>
        <p className="mt-0.5 font-heading text-[17px] font-semibold tracking-tight">
          {value}
        </p>
        {hint ? (
          <p className="mt-0.5 text-[10px] text-muted-foreground">{hint}</p>
        ) : null}
      </div>
    </div>
  );

  if (!href) {
    return <div className="surface rounded-[16px] p-3.5 sm:p-4">{body}</div>;
  }

  return (
    <Link
      href={href}
      className="surface block rounded-[16px] p-3.5 transition duration-200 hover:scale-[1.03] hover:border-primary hover:shadow-lg hover:shadow-primary/25 sm:p-4"
    >
      {body}
    </Link>
  );
}
