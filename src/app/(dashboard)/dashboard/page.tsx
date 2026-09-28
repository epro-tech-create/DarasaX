import { ExamCountdown } from "@/components/dashboard/exam-countdown";
import {
  DashboardModulesPreview,
  DashboardUpcoming,
} from "@/components/dashboard/live-sections";
import { DashboardLiveUpdates } from "@/components/dashboard/live-updates";
import { NextClassCard } from "@/components/dashboard/next-class-card";
import { DashboardStats } from "@/components/dashboard/dashboard-stats";
import { StudyActivity } from "@/components/dashboard/study-activity";
import { SemesterProgress } from "@/components/dashboard/semester-progress";
import { Button } from "@/components/ui/button";
import { currentUser } from "@/data/mock";
import { getNextClass } from "@/lib/academic";
import { formatDate, getGreeting } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_CLASS_STREAM, timetable as seedTimetable } from "@/data/mock";
import type { TimetableEntry } from "@/types";

function displayFirstName(name: string) {
  const cleaned = name.replace(/\s+/g, " ").trim();
  const parts = cleaned.split(" ");
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
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-heading text-xl font-semibold tracking-tight">
            Dashboard
          </h1>
          <p className="mt-1 text-[12px] text-muted-foreground sm:text-[13px]">
            {getGreeting()}, {firstName} — here&apos;s your semester at a
            glance.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <p className="rounded-full bg-muted/70 px-3 py-1.5 text-[11px] font-medium text-muted-foreground">
            {formatDate(new Date())}
          </p>
          <Button size="sm" href="/planner">
            Open planner
          </Button>
        </div>
      </div>

      {next ? (
        <NextClassCard
          entry={next.entry}
          module={next.module}
          dayOffset={next.dayOffset}
        />
      ) : null}

      <DashboardStats />

      <div className="grid gap-3 xl:grid-cols-2">
        <StudyActivity />
        <SemesterProgress />
      </div>

      <div className="grid items-start gap-3 xl:grid-cols-[1.25fr_0.75fr]">
        <DashboardUpcoming />
        <div className="space-y-3">
          <ExamCountdown />
        </div>
      </div>

      <DashboardModulesPreview />

      <DashboardLiveUpdates />
    </div>
  );
}
