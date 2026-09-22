"use client";

import { Moon, Sun, Users } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { classStreams } from "@/data/mock";
import { useAdminPeopleStore } from "@/lib/admin-people-store";
import { useIssuesStore } from "@/lib/issues-store";
import { useTimetableStore } from "@/lib/timetable-store";

export default function AdminStreamsPage() {
  const { studentsForStream } = useAdminPeopleStore();
  const { items: issues } = useIssuesStore();
  const { forStream } = useTimetableStore();
  return (
    <div className="space-y-5">
      <PageHeader
        title="Class streams"
        description="BENG24COE cohorts — day streams and the evening stream."
        actions={
          <Button href="/admin/timetable" size="sm" variant="outline">
            Manage timetables
          </Button>
        }
      />

      <div className="grid gap-3 md:grid-cols-2">
        {classStreams.map((stream) => {
          const students = studentsForStream(stream.id);
          const openIssues = issues.filter(
            (i) =>
              (i.streamId === stream.id || !i.streamId) &&
              i.status !== "resolved",
          );
          const sessions = forStream(stream.id).length;

          return (
            <div key={stream.id} className="surface relative overflow-hidden rounded-[20px] p-4">
              <div className="pointer-events-none absolute -right-6 -top-8 h-28 w-28 rounded-full bg-primary/10 blur-2xl" />
              <div className="relative flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary/12 text-primary">
                      {stream.isEvening ? (
                        <Moon className="h-4 w-4" />
                      ) : (
                        <Sun className="h-4 w-4" />
                      )}
                    </span>
                    <div>
                      <p className="font-heading text-[15px] font-semibold">{stream.label}</p>
                      <p className="text-[11px] text-muted-foreground">{stream.description}</p>
                    </div>
                  </div>
                </div>
                {stream.isEvening ? <Badge tone="cyan">Evening</Badge> : <Badge>Day</Badge>}
              </div>

              <div className="relative mt-4 grid grid-cols-3 gap-2">
                <div className="rounded-xl bg-muted/40 px-2.5 py-2">
                  <p className="text-[10px] text-muted-foreground">Students</p>
                  <p className="mt-0.5 font-heading text-[16px] font-semibold">{students.length}</p>
                </div>
                <div className="rounded-xl bg-muted/40 px-2.5 py-2">
                  <p className="text-[10px] text-muted-foreground">Sessions</p>
                  <p className="mt-0.5 font-heading text-[16px] font-semibold">{sessions}</p>
                </div>
                <div className="rounded-xl bg-muted/40 px-2.5 py-2">
                  <p className="text-[10px] text-muted-foreground">Open issues</p>
                  <p className="mt-0.5 font-heading text-[16px] font-semibold">{openIssues.length}</p>
                </div>
              </div>

              <div className="relative mt-3 flex items-center gap-2 text-[11px] text-muted-foreground">
                <Users className="h-3.5 w-3.5" />
                {students.length
                  ? students.map((s) => s.name.split(" ")[0]).join(", ")
                  : "No roster sample yet"}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
