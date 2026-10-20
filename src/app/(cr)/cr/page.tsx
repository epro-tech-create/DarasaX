"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { NextClassCard } from "@/components/dashboard/next-class-card";
import { useTimetableStore } from "@/lib/timetable-store";
import { getNextClass } from "@/lib/academic";
import { formatRelativeTime } from "@/lib/utils";
import { ArrowUpRight, FileUp, Users, BookOpen, ListOrdered, Megaphone } from "lucide-react";
import { OverviewHeader } from "@/components/dashboard/overview-ui";
import { Button } from "@/components/ui/button";
import { StaffSection, StaffStatCard } from "@/components/staff/staff-ui";
import { StaffFadeItem, StaffStagger } from "@/components/staff/staff-motion";
import { useAdminPeopleStore } from "@/lib/admin-people-store";
import { useMaterialsStore, viewMaterial } from "@/lib/materials-store";
import { useStaffSession } from "@/lib/staff-auth";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function ClassRepOverviewPage() {
  const { session } = useStaffSession();
  const streamId = session?.streamId ?? "BENG24COE-1";
  const { entries: timetable } = useTimetableStore();
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const timer = setInterval(() => setNow(new Date()), 60000); return () => clearInterval(timer); }, []);
  const next = getNextClass(now, streamId, timetable);
  const displayName = session?.name ?? "Class Rep";
  const { studentsForStream } = useAdminPeopleStore({ rosterOnly: true });
  const { items: uploads } = useMaterialsStore();
  const members = studentsForStream(streamId);
  const classUploads = uploads.filter((upload) => upload.streamId === streamId && upload.status === "published");

  return (
    <div className="space-y-6 sm:space-y-7">
      <OverviewHeader
        label="Class representative"
        title={`${greeting()}, ${displayName}`}
        description={`Keep ${streamId} connected with useful materials, clear notices, and an up-to-date timetable.`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button href="/cr/materials" size="sm">
              <FileUp className="h-3.5 w-3.5" />
              Upload
            </Button>
            <Button href="/cr/timetable" size="sm" variant="outline">
              Edit timetable
            </Button>
          </div>
        }
      />

      {next && <NextClassCard entry={next.entry} module={next.module} dayOffset={next.dayOffset} moduleHref="/cr/topics" moduleLabel="Module topics" timetableHref="/cr/timetable" />}

      <StaffStagger className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StaffFadeItem>
          <StaffStatCard
            label="Members"
            href="/cr/members"
            value={String(members.length)}
            icon={Users}
          />
        </StaffFadeItem>
        <StaffFadeItem>
          <StaffStatCard
            label="Class materials"
            href="/cr/materials"
            value={String(classUploads.length)}
            icon={FileUp}
            tone="success"
          />
        </StaffFadeItem>
        <StaffFadeItem><StaffStatCard label="Module topics" value="Manage outline" icon={ListOrdered} href="/cr/topics" /></StaffFadeItem>
        <StaffFadeItem><StaffStatCard label="Announcements" value="Class updates" icon={Megaphone} href="/cr/announcements" /></StaffFadeItem>
      </StaffStagger>



      <div className="grid items-start gap-5">

        <StaffSection title="Recent class materials" description="Published files ready for your class."
          action={<Link href="/cr/materials" className="text-xs font-medium text-primary">View library</Link>}>
          <div className="space-y-2">
            {classUploads.slice(0, 4).map((item) => <button type="button" key={item.id} onClick={() => void viewMaterial(item)}
              className="focus-ring flex w-full items-center gap-3 rounded-xl border border-border/70 px-3 py-3 text-left transition hover:border-primary/40">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><BookOpen className="h-4 w-4" /></span>
              <div className="min-w-0"><p className="truncate text-sm font-medium">{item.title}</p><p className="mt-1 text-xs text-muted-foreground">{item.size} / {formatRelativeTime(item.createdAt)}</p></div>
              <ArrowUpRight className="ml-auto h-4 w-4 shrink-0 text-muted-foreground" />
            </button>)}
            {classUploads.length === 0 && <p className="rounded-xl bg-muted/40 px-4 py-10 text-center text-sm text-muted-foreground">Your next shared resource will appear here.</p>}
          </div>
        </StaffSection>
      </div>
    </div>
  );
}
