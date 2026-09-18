import Image from "next/image";
import Link from "next/link";
import {
  BookOpen,
  CalendarDays,
  ClipboardList,
  Clock,
  Flame,
  GraduationCap,
  MapPin,
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
  const startsLabel =
    mins > 60 * 24
      ? `Starts in ${Math.ceil(mins / (60 * 24))} days`
      : mins > 0
        ? `Starts in ${mins} minutes`
        : mins > -120
          ? "Happening now"
          : "Coming up";

  return (
    <section className="relative overflow-hidden rounded-[22px] text-white shadow-lg shadow-primary/20">
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

      <div className="relative z-10 flex min-h-[168px] flex-col justify-between gap-5 p-5 sm:min-h-[188px] sm:max-w-[58%] sm:p-6">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-white/75">
            Next class
          </p>
          <h2 className="mt-1.5 font-heading text-xl font-semibold tracking-tight sm:text-2xl">
            {module.name}
          </h2>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-[12px] text-white/90">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              {formatTime(entry.startTime)} — {formatTime(entry.endTime)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              {entry.room}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5 shrink-0" />
              {entry.lecturer}
            </span>
          </div>
          <p className="mt-3 inline-flex rounded-full bg-white/15 px-2.5 py-1 text-[12px] font-semibold backdrop-blur-sm">
            {startsLabel}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            className="h-9 bg-none bg-white text-[12px] text-primary hover:bg-white/90"
            href={`/modules/${module.id}`}
          >
            View Module
          </Button>
          <Button
            variant="outline"
            className="h-9 border-white/45 bg-white/10 text-[12px] text-white hover:bg-white/20"
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
