import { OverviewHeader } from "@/components/dashboard/overview-ui";
import { StudentGreeting } from "@/components/dashboard/student-greeting";
import { ExamCountdown, AcademicCountdownStatCard } from "@/components/dashboard/exam-countdown";
import { ComingUp } from "@/components/dashboard/coming-up";
import {
  StatCard,
} from "@/components/dashboard/next-class-card";
import { DashboardAssignmentStatCard } from "@/components/dashboard/assignment-stat-card";
import { StudyChart } from "@/components/dashboard/study-chart";
import { modules } from "@/data/mock";
import { LiveNextClass } from "@/components/dashboard/live-next-class";
import { getGreeting } from "@/lib/utils";

export default async function DashboardPage() {
  const now = new Date();
  const initialNow = now.getTime();

  return (
    <div className="space-y-6 sm:space-y-7">
      <OverviewHeader title={<StudentGreeting greeting={getGreeting()} />} />

      <LiveNextClass />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <DashboardAssignmentStatCard />
        <AcademicCountdownStatCard initialNow={initialNow} />
        <StatCard label="Modules" value={`${modules.length}`} href="/modules" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <ComingUp />
        <StudyChart />
      </div>

      <ExamCountdown initialNow={initialNow} />
    </div>
  );
}
