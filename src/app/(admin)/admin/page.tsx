"use client";

import {
  FileUp,
  GraduationCap,
  ScrollText,
  Users,
} from "lucide-react";
import { OverviewHeader } from "@/components/dashboard/overview-ui";
import { Button } from "@/components/ui/button";
import { StaffStatCard } from "@/components/staff/staff-ui";
import { StaffFadeItem, StaffStagger } from "@/components/staff/staff-motion";
import { useAdminPeopleStore } from "@/lib/admin-people-store";
import { useMaterialsStore } from "@/lib/materials-store";
import { useStaffSession } from "@/lib/staff-auth";

import { EngagementAnalytics } from "@/components/staff/engagement-analytics";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function AdminOverviewPage() {
  const { students, classReps, audit } = useAdminPeopleStore();
  const { published } = useMaterialsStore();
  const { session } = useStaffSession();
  const activeCrs = classReps.filter((c) => c.status === "active").length;

  return (
    <div className="space-y-6 sm:space-y-7">
      <OverviewHeader
        label="Administration"
        title={`${greeting()}, ${session?.name ?? "Admin"}`}
        description="Manage your community, keep classes running, and see what needs attention."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button href="/admin/students" size="sm" variant="outline">
              Add student
            </Button>
            <Button href="/admin/class-reps" size="sm" variant="outline">
              Add CR
            </Button>
            <Button href="/admin/materials" size="sm">
              <FileUp className="h-3.5 w-3.5" />
              Upload
            </Button>
          </div>
        }
      />

      <StaffStagger className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StaffFadeItem>
          <StaffStatCard
            label="Students"
            href="/admin/students"
            value={String(students.length)}
            icon={Users}
          />
        </StaffFadeItem>
        <StaffFadeItem>
          <StaffStatCard
            label="Active CRs"
            href="/admin/class-reps"
            value={String(activeCrs)}
            icon={GraduationCap}
            tone="success"
          />
        </StaffFadeItem>
        <StaffFadeItem>
          <StaffStatCard
            label="Published materials"
            href="/admin/materials"
            value={String(published.length)}
            icon={FileUp}
            tone="primary"
          />
        </StaffFadeItem>
        <StaffFadeItem>
          <StaffStatCard
            label="Audit events"
            href="/admin/audit"
            value={String(audit.length)}
            icon={ScrollText}
          />
        </StaffFadeItem>
      </StaffStagger>

      <EngagementAnalytics />
    </div>
  );
}
