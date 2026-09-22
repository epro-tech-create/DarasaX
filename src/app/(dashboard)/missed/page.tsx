"use client";

import { useMemo, useState } from "react";
import {
  BookOpen,
  CalendarDays,
  Clock,
  FileText,
  MapPin,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  DEFAULT_CLASS_STREAM,
  getModule,
  timetable as seedTimetable,
} from "@/data/mock";
import { useAssignments } from "@/lib/assignment-progress-store";
import { useMaterialsStore } from "@/lib/materials-store";
import { buildMissedSummary } from "@/lib/missed-day";
import { useTimetableStore } from "@/lib/timetable-store";
import { useTopicProgress } from "@/lib/topic-progress-store";
import { formatDate } from "@/lib/utils";

function todayIso() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function MissedPage() {
  const [date, setDate] = useState(todayIso);
  const { entries, ready: timetableReady } = useTimetableStore();
  const { published, ready: materialsReady } = useMaterialsStore();
  const { items: assignments } = useAssignments();
  const { topics } = useTopicProgress();

  const timetable = entries.length > 0 ? entries : seedTimetable;

  const summary = useMemo(
    () =>
      buildMissedSummary({
        date,
        streamId: DEFAULT_CLASS_STREAM,
        timetable,
        materials: published,
        assignments,
        topics,
      }),
    [date, timetable, published, assignments, topics],
  );

  const loading = !timetableReady || !materialsReady;

  return (
    <div>
      <PageHeader
        title="What Did I Miss?"
        description="See which classes ran that day, new uploads, and deadlines to catch up on."
      />

      <div className="surface mb-6 flex flex-col gap-4 rounded-[20px] p-4 sm:flex-row sm:items-end sm:justify-between sm:p-5">
        <label className="block text-[12px] font-medium">
          Select a date
          <div className="relative mt-2">
            <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="focus-ring h-11 w-full min-w-[11rem] rounded-[12px] border border-border bg-background pl-10 pr-3 text-[13px] sm:w-auto"
            />
          </div>
        </label>
        <div className="sm:text-right">
          <p className="text-[11px] text-muted-foreground">
            {formatDate(date)} · stream {DEFAULT_CLASS_STREAM}
          </p>
          <p className="mt-1 font-heading text-lg font-semibold">
            {loading
              ? "Loading schedule…"
              : summary.classesMissed === 0
                ? "No classes scheduled"
                : `You had ${summary.classesMissed} class${summary.classesMissed === 1 ? "" : "es"}`}
          </p>
        </div>
      </div>

      {summary.classesMissed === 0 && !loading ? (
        <EmptyState
          icon={CalendarDays}
          title="No sessions that day"
          description="Pick a weekday with timetable entries, or ask your CR to publish the schedule."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {summary.items.map((item) => {
            const module = getModule(item.moduleId);
            return (
              <article
                key={`${item.moduleId}-${item.startTime ?? ""}`}
                className="surface overflow-hidden rounded-[20px]"
              >
                <div
                  className="flex items-start justify-between gap-3 px-5 py-4 text-white"
                  style={{ backgroundColor: module?.accent ?? "#1E88E5" }}
                >
                  <div className="min-w-0">
                    <h2 className="font-heading text-[15px] font-semibold leading-snug">
                      {module?.name ?? "Module"}
                    </h2>
                    <p className="mt-1 text-[11px] text-white/80">
                      {module?.code}
                      {item.room ? ` · ${item.room}` : ""}
                    </p>
                  </div>
                  {item.startTime && item.endTime ? (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-medium">
                      <Clock className="h-3 w-3" />
                      {item.startTime}–{item.endTime}
                    </span>
                  ) : null}
                </div>

                <div className="space-y-3.5 p-5">
                  {item.topic ? (
                    <div className="flex gap-3">
                      <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <div>
                        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                          Focus topic
                        </p>
                        <p className="mt-0.5 text-[13px] font-medium">{item.topic}</p>
                      </div>
                    </div>
                  ) : null}

                  <div className="flex flex-wrap items-center gap-2">
                    {item.newNotes > 0 ? (
                      <>
                        <Badge tone="cyan">
                          {item.newNotes} new upload
                          {item.newNotes === 1 ? "" : "s"}
                        </Badge>
                        <span className="text-[12px] text-muted-foreground">
                          Notes or slides around this date
                        </span>
                      </>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground">
                        <FileText className="h-3.5 w-3.5" />
                        No new notes yet for this module
                      </span>
                    )}
                  </div>

                  {item.assignment ? (
                    <div>
                      <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                        Open assignment
                      </p>
                      <p className="mt-0.5 text-[13px] font-medium">{item.assignment}</p>
                      {item.deadline ? (
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          Due {item.deadline}
                        </p>
                      ) : null}
                    </div>
                  ) : null}

                  {item.announcement ? (
                    <div>
                      <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                        Announcement
                      </p>
                      <p className="mt-0.5 text-[13px] font-medium">
                        {item.announcement}
                      </p>
                    </div>
                  ) : null}

                  {item.room ? (
                    <p className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" />
                      {item.room}
                    </p>
                  ) : null}

                  <Button href={`/modules/${item.moduleId}`} className="mt-1">
                    Open module
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <div className="mt-8 surface rounded-[20px] p-5 sm:p-6">
        <h2 className="font-heading text-lg font-semibold">Catch up</h2>
        <p className="mt-2 max-w-xl text-[13px] text-muted-foreground">
          Open each module’s Notes tab for staff uploads, then mark topics done
          so your progress stays accurate.
        </p>
        <Button href="/modules" className="mt-4">
          Browse modules
        </Button>
      </div>
    </div>
  );
}
