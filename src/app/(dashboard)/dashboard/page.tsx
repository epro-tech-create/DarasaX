import Link from "next/link";
import {
  Archive,
  CalendarClock,
  ChevronRight,
  ClipboardList,
  FileText,
} from "lucide-react";
import { ModuleCard } from "@/components/modules/module-card";
import { ExamCountdown } from "@/components/dashboard/exam-countdown";
import { NextClassCard, StatCard } from "@/components/dashboard/next-class-card";
import { DeadlineBadge } from "@/components/assignments/assignment-card";
import { Button } from "@/components/ui/button";
import {
  assignments,
  currentUser,
  getModule,
  modules,
  updateFeed,
} from "@/data/mock";
import { getNextClass } from "@/lib/academic";
import { formatCountdownParts, getMsUntilSchoolOpen } from "@/lib/school";
import { formatDate, getGreeting } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_CLASS_STREAM, timetable as seedTimetable } from "@/data/mock";
import type { TimetableEntry } from "@/types";

const feedIcons = {
  FileText,
  CalendarClock,
  ClipboardList,
  Archive,
};

function displayFirstName(name: string) {
  const cleaned = name.replace(/\s+/g, " ").trim();
  const parts = cleaned.split(" ");
  // Avoid "Ezekiel Ezekiel" style duplicates in the greeting
  if (parts.length >= 2 && parts[0].toLowerCase() === parts[1].toLowerCase()) {
    return parts[0];
  }
  return parts[0] || cleaned;
}

export default async function DashboardPage() {
  let liveTimetable: TimetableEntry[] = seedTimetable;
  try {
    if (
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      const supabase = await createClient();
      const { data } = await supabase
        .from("timetable_entries")
        .select("*")
        .order("day")
        .order("start_time");
      if (data && data.length > 0) {
        liveTimetable = data.map((row) => ({
          id: row.id,
          streamId: row.stream_id as TimetableEntry["streamId"],
          moduleId: row.module_id,
          day: row.day,
          startTime: row.start_time,
          endTime: row.end_time,
          room: row.room,
          lecturer: row.lecturer,
        }));
      }
    }
  } catch {
    // Fall back to bundled timetable
  }
  const next = getNextClass(new Date(), DEFAULT_CLASS_STREAM, liveTimetable);
  const upcoming = assignments
    .filter((a) => a.status !== "completed")
    .sort(
      (a, b) =>
        new Date(a.deadline).getTime() - new Date(b.deadline).getTime(),
    )
    .slice(0, 4);

  const examDays = formatCountdownParts(getMsUntilSchoolOpen()).days;

  let displayName = currentUser.name;
  try {
    if (
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .maybeSingle();
        displayName =
          profile?.full_name ||
          (user.user_metadata?.full_name as string | undefined) ||
          user.email?.split("@")[0] ||
          displayName;
      }
    }
  } catch {
    // Keep mock greeting if auth/env is unavailable
  }

  const firstName = displayFirstName(displayName);

  return (
    <div className="space-y-7">
      <div className="flex flex-col gap-1.5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-xl font-semibold tracking-tight sm:text-2xl">
            {getGreeting()}, {firstName} 👋
          </h1>
          <p className="mt-1 text-[12px] text-muted-foreground sm:text-[13px]">
            Ready to continue your semester?
          </p>
        </div>
        <p className="rounded-full bg-muted/70 px-3 py-1 text-[11px] font-medium text-muted-foreground">
          {formatDate(new Date())}
        </p>
      </div>

      {next ? (
        <NextClassCard
          entry={next.entry}
          module={next.module}
          dayOffset={next.dayOffset}
        />
      ) : null}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Assignments"
          value={`${assignments.filter((a) => a.status === "upcoming").length} pending`}
          href="/assignments"
        />
        <StatCard
          label="Exams"
          value={`${examDays} days`}
          hint="Until school opens"
          href="/planner"
        />
        <StatCard label="Modules" value={`${modules.length}`} href="/modules" />
        <StatCard
          label="Study streak"
          value={`${currentUser.studyStreak} days`}
          href="/planner"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <section>
          <div className="mb-3.5 flex items-center justify-between">
            <h2 className="font-heading text-[15px] font-semibold">Upcoming</h2>
            <Button variant="ghost" size="sm" href="/assignments">
              View all
            </Button>
          </div>
          <div className="space-y-2.5">
            {upcoming.map((item) => {
              const module = getModule(item.moduleId);
              return (
                <Link
                  key={item.id}
                  href={`/assignments/${item.id}`}
                  className="surface group flex items-center justify-between gap-4 rounded-[16px] p-3.5 transition hover:border-primary/30 hover:shadow-md hover:shadow-primary/10 sm:p-4"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className="hidden h-9 w-1.5 shrink-0 rounded-full sm:block"
                      style={{ backgroundColor: module?.accent || "#1E88E5" }}
                    />
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium group-hover:text-primary">
                        {item.title}
                      </p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {module?.name}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <DeadlineBadge deadline={item.deadline} />
                    <ChevronRight className="hidden h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary sm:block" />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <ExamCountdown />
      </div>

      <section>
        <div className="mb-3.5 flex items-center justify-between">
          <h2 className="font-heading text-[15px] font-semibold">Your modules</h2>
          <Button variant="ghost" size="sm" href="/modules">
            See all
          </Button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {modules.slice(0, 6).map((module) => (
            <ModuleCard key={module.id} module={module} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3.5 font-heading text-[15px] font-semibold">
          Latest updates
        </h2>
        <div className="surface divide-y divide-border overflow-hidden rounded-[20px]">
          {updateFeed.map((item) => {
            const Icon =
              feedIcons[item.icon as keyof typeof feedIcons] || FileText;
            return (
              <div
                key={item.id}
                className="flex items-start gap-3 px-4 py-3.5 transition hover:bg-muted/40 sm:px-5 sm:py-4"
              >
                <span className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-[13px] font-medium">{item.title}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {item.category} ·{" "}
                    {new Date(item.createdAt).toLocaleString("en-GB", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
