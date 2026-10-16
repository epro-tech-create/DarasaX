import { OverviewHeader } from "@/components/dashboard/overview-ui";
import { StudentGreeting } from "@/components/dashboard/student-greeting";
import { ExamCountdown } from "@/components/dashboard/exam-countdown";
import { ComingUp } from "@/components/dashboard/coming-up";
import { NextClassCard, StatCard } from "@/components/dashboard/next-class-card";
import { DashboardAssignmentStatCard } from "@/components/dashboard/assignment-stat-card";
import { StudyChart } from "@/components/dashboard/study-chart";
import { currentUser, modules } from "@/data/mock";
import { getNextClass } from "@/lib/academic";
import { formatCountdownParts, getMsUntilSchoolOpen } from "@/lib/school";
import { getGreeting } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_CLASS_STREAM } from "@/data/mock";
import type { TimetableEntry } from "@/types";

export default async function DashboardPage() {
  let liveTimetable: TimetableEntry[] = [];
  let studentStream = DEFAULT_CLASS_STREAM;
  try {
    if (
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) { const { data } = await supabase.from("profiles").select("class_name").eq("id", user.id).single(); studentStream = (data?.class_name ?? DEFAULT_CLASS_STREAM) as typeof DEFAULT_CLASS_STREAM; }
      const timetableRes = await supabase
          .from("timetable_entries")
          .select("*")
          .order("day")
          .order("start_time");
      if (timetableRes.data && timetableRes.data.length > 0) {
        liveTimetable = timetableRes.data.map((row) => ({
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
    // Fall back to bundled timetable and a generic greeting
  }
  const next = getNextClass(new Date(), studentStream, liveTimetable);
  const examDays = formatCountdownParts(getMsUntilSchoolOpen()).days;


  return (
    <div className="space-y-6 sm:space-y-7">
      <OverviewHeader label="Student workspace" title={<StudentGreeting greeting={getGreeting()} />}
        description="Your classes, coursework, and study plans at a glance." />

      {next ? (
        <NextClassCard
          entry={next.entry}
          module={next.module}
          dayOffset={next.dayOffset}
        />
      ) : null}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <DashboardAssignmentStatCard />
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
        <ComingUp />
        <StudyChart />
      </div>

      <ExamCountdown />
    </div>
  );
}
