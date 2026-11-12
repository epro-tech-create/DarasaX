"use client";

import { useTranslate } from "@/components/providers/language-provider";
import {
  FileUp,
  GraduationCap,
  ScrollText,
  Users,
} from "lucide-react";
import { OverviewHeader } from "@/components/dashboard/overview-ui";
import { Button } from "@/components/ui/button";
import { StaffStatCard } from "@/components/staff/staff-ui";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useStaffSession } from "@/lib/staff-auth";

import { EngagementAnalytics } from "@/components/staff/engagement-analytics";

type OverviewCounts = Record<"students" | "activeCrs" | "published" | "audit" | "downloads" | "uploads", number>;

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function AdminOverviewPage() {
  const translateUI = useTranslate();
  const [counts, setCounts] = useState<OverviewCounts | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    async function loadCounts() {
      const { data, error } = await createClient().rpc("admin_overview_counts").abortSignal(controller.signal);
      if (controller.signal.aborted) return;
      setFailed(Boolean(error || !data));
      if (!error && data) setCounts(data as OverviewCounts);
    }
    void loadCounts();
    const onFocus = () => void loadCounts();
    window.addEventListener("focus", onFocus);
    return () => { controller.abort(); window.removeEventListener("focus", onFocus); };
  }, []);
  const value = (key: keyof OverviewCounts) => counts ? String(counts[key]) : "—";
  const { session } = useStaffSession();


  return (
    <div className="space-y-6 sm:space-y-7">
      <OverviewHeader
        label={translateUI("Administration")}
        title={`${greeting()}, ${session?.name ?? translateUI("Admin")}`}
        description={translateUI("Manage your community, keep classes running, and see what needs attention.")}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button prefetch={false} href="/admin/students" size="sm" variant="outline">
              Add student
            </Button>
            <Button prefetch={false} href="/admin/class-reps" size="sm" variant="outline">
              Add CR
            </Button>
            <Button prefetch={false} href="/admin/materials" size="sm">
              <FileUp className="h-3.5 w-3.5" />
              Upload
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <StaffStatCard
            label={translateUI("Students")}
            prefetch={false} href="/admin/students"
            value={value("students")}
            icon={Users}
          />
          <StaffStatCard
            label={translateUI("Active CRs")}
            prefetch={false} href="/admin/class-reps"
            value={value("activeCrs")}
            icon={GraduationCap}
            tone="success"
          />
          <StaffStatCard
            label={translateUI("Published materials")}
            prefetch={false} href="/admin/materials"
            value={value("published")}
            icon={FileUp}
            tone="primary"
          />
          <StaffStatCard
            label={translateUI("Audit events")}
            prefetch={false} href="/admin/audit"
            value={value("audit")}
            icon={ScrollText}
          />
      </div>

      {failed && <p role="status" className="text-sm text-muted-foreground">{translateUI("Could not load dashboard totals.")}</p>}
      <EngagementAnalytics totals={counts} />
    </div>
  );
}
