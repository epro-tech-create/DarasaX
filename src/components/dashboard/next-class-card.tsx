import Image from "next/image";
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
    <section className="relative overflow-hidden rounded-[22px] text-white">
      <Image
        src="/next-class-students.jpg"
        alt="African students studying in a university library"
        fill
        priority
        sizes="(max-width: 1280px) 100vw, 960px"
        className="pointer-events-none object-cover object-[72%_center] opacity-45 sm:object-[78%_center]"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0d47a1]/96 via-[#1565c0]/82 to-[#1e88e5]/40 sm:via-[#1565c0]/78 sm:to-[#1e88e5]/18" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0d47a1]/60 via-transparent to-[#0d47a1]/30" />

      <div className="relative z-10 flex min-h-[220px] flex-col justify-between gap-6 p-5 sm:min-h-[240px] sm:p-7">
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-2.5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/75">
              Next class
            </p>
            <p className="rounded-full border border-white/15 bg-white/15 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
              {startsLabel}
            </p>
          </div>
          <h2 className="mt-2 font-heading text-xl font-semibold leading-tight tracking-tight sm:text-2xl">
            {module.name}
          </h2>
          <dl className="mt-4 grid max-w-2xl gap-2 sm:grid-cols-3">
            <div className="flex min-w-0 items-center gap-2.5 rounded-xl border border-white/10 bg-[#082f6a]/35 px-3 py-2.5 backdrop-blur-sm">
              <Clock className="h-4 w-4 shrink-0 text-white/75" aria-hidden="true" />
              <div className="min-w-0">
                <dt className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/60">
                  Time
                </dt>
                <dd className="truncate text-sm font-semibold text-white">
                  {formatTime(entry.startTime)} — {formatTime(entry.endTime)}
                </dd>
              </div>
            </div>
            <div className="flex min-w-0 items-center gap-2.5 rounded-xl border border-white/10 bg-[#082f6a]/35 px-3 py-2.5 backdrop-blur-sm">
              <MapPin className="h-4 w-4 shrink-0 text-white/75" aria-hidden="true" />
              <div className="min-w-0">
                <dt className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/60">
                  Room
                </dt>
                <dd className="truncate text-sm font-semibold text-white">{entry.room}</dd>
              </div>
            </div>
            <div className="flex min-w-0 items-center gap-2.5 rounded-xl border border-white/10 bg-[#082f6a]/35 px-3 py-2.5 backdrop-blur-sm">
              <UserRound className="h-4 w-4 shrink-0 text-white/75" aria-hidden="true" />
              <div className="min-w-0">
                <dt className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/60">
                  Lecturer
                </dt>
                <dd className="truncate text-sm font-semibold text-white">
                  {entry.lecturer}
                </dd>
              </div>
            </div>
          </dl>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <Button
            variant="secondary"
            className="h-10 bg-white px-4 text-sm font-semibold text-[#0d47a1] shadow-none hover:bg-white/90"
            href={`/modules/${module.id}`}
          >
            View Module
          </Button>
          <Button
            variant="outline"
            className="h-10 border-white/40 bg-[#082f6a]/30 px-4 text-sm text-white hover:bg-white/15"
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
