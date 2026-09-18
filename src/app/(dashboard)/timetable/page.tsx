"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarDays,
  Clock,
  MapPin,
  UserRound,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { getModule, timetable } from "@/data/mock";
import { getNextClass } from "@/lib/academic";
import { cn, formatTime } from "@/lib/utils";

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const dayFull = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const weekDays = [1, 2, 3, 4, 5];

function durationLabel(start: string, end: string) {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const mins = eh * 60 + em - (sh * 60 + sm);
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export default function TimetablePage() {
  const [view, setView] = useState<"today" | "week">("week");
  const today = new Date().getDay();
  const next = getNextClass();

  const todayEntries = useMemo(
    () =>
      timetable
        .filter((t) => t.day === today)
        .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [today],
  );

  const weekCount = useMemo(
    () => timetable.filter((t) => weekDays.includes(t.day)).length,
    [],
  );

  return (
    <div className="space-y-5">
      <PageHeader
        title="Timetable"
        description="Your week at a glance — always know what is next."
        actions={
          <div className="inline-flex rounded-xl border border-border bg-card p-0.5">
            {(["today", "week"] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setView(item)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-[11px] font-medium capitalize transition",
                  view === item
                    ? "btn-gradient shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {item}
              </button>
            ))}
          </div>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="surface rounded-2xl p-3.5">
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            Classes today
          </p>
          <p className="mt-1 font-heading text-xl font-semibold">
            {todayEntries.length}
          </p>
        </div>
        <div className="surface rounded-2xl p-3.5">
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            This week
          </p>
          <p className="mt-1 font-heading text-xl font-semibold">{weekCount}</p>
        </div>
        <div className="surface rounded-2xl p-3.5">
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            Next up
          </p>
          <p className="mt-1 truncate font-heading text-[15px] font-semibold">
            {next ? next.module.code : "—"}
          </p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {view === "today" ? (
          <motion.div
            key="today"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-heading text-[15px] font-semibold">
                {dayFull[today]}
              </h3>
              <p className="text-[11px] text-muted-foreground">
                {todayEntries.length} session
                {todayEntries.length === 1 ? "" : "s"}
              </p>
            </div>

            {todayEntries.length === 0 ? (
              <div className="surface rounded-[20px] px-5 py-10 text-center">
                <CalendarDays className="mx-auto h-8 w-8 text-muted-foreground/50" />
                <p className="mt-3 text-[13px] font-medium">No classes today</p>
                <p className="mt-1 text-[12px] text-muted-foreground">
                  Enjoy the free time — or switch to week view.
                </p>
              </div>
            ) : (
              <div className="relative space-y-0 pl-2">
                <div className="absolute bottom-3 left-[19px] top-3 w-px bg-border" />
                {todayEntries.map((entry, index) => {
                  const module = getModule(entry.moduleId);
                  const isNext = next?.entry.id === entry.id;
                  return (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="relative flex gap-3 pb-4 last:pb-0"
                    >
                      <div
                        className={cn(
                          "relative z-10 mt-4 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 bg-background",
                          isNext ? "border-primary" : "border-border",
                        )}
                      >
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{
                            backgroundColor: module?.accent ?? "#1E88E5",
                          }}
                        />
                      </div>
                      <div
                        className={cn(
                          "surface min-w-0 flex-1 rounded-2xl p-3.5 transition",
                          isNext && "ring-2 ring-primary/35",
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-[13px] font-semibold">
                              {module?.name}
                            </p>
                            <p className="mt-0.5 text-[11px] text-muted-foreground">
                              {module?.code} ·{" "}
                              {durationLabel(entry.startTime, entry.endTime)}
                            </p>
                          </div>
                          {isNext ? <Badge tone="primary">Next</Badge> : null}
                        </div>
                        <div className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatTime(entry.startTime)} —{" "}
                            {formatTime(entry.endTime)}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {entry.room}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <UserRound className="h-3 w-3" />
                            {entry.lecturer}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="week"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
          >
            {/* Mobile week list */}
            <div className="space-y-3 lg:hidden">
              {weekDays.map((day) => {
                const entries = timetable
                  .filter((t) => t.day === day)
                  .sort((a, b) => a.startTime.localeCompare(b.startTime));
                const isToday = day === today;
                return (
                  <div
                    key={day}
                    className={cn(
                      "surface rounded-2xl p-3.5",
                      isToday && "ring-1 ring-primary/30",
                    )}
                  >
                    <div className="mb-2.5 flex items-center justify-between">
                      <h3 className="font-heading text-[13px] font-semibold">
                        {dayFull[day]}
                      </h3>
                      {isToday ? <Badge tone="primary">Today</Badge> : null}
                    </div>
                    {entries.length === 0 ? (
                      <p className="text-[11px] text-muted-foreground">
                        No classes
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {entries.map((entry) => {
                          const module = getModule(entry.moduleId);
                          return (
                            <div
                              key={entry.id}
                              className="rounded-xl border border-border bg-background/60 px-3 py-2.5"
                              style={{
                                borderLeftWidth: 3,
                                borderLeftColor: module?.accent ?? "#1E88E5",
                              }}
                            >
                              <p className="text-[12px] font-semibold">
                                {module?.name}
                              </p>
                              <p className="mt-0.5 text-[10px] text-muted-foreground">
                                {formatTime(entry.startTime)} —{" "}
                                {formatTime(entry.endTime)} · {entry.room}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Desktop week grid */}
            <div className="surface hidden overflow-hidden rounded-[22px] lg:block">
              <div className="grid grid-cols-5 border-b border-border bg-muted/40">
                {weekDays.map((day) => {
                  const isToday = day === today;
                  return (
                    <div
                      key={day}
                      className={cn(
                        "border-r border-border px-3 py-3 text-center last:border-r-0",
                        isToday && "bg-primary/8",
                      )}
                    >
                      <p
                        className={cn(
                          "text-[11px] font-semibold uppercase tracking-wide",
                          isToday ? "text-primary" : "text-muted-foreground",
                        )}
                      >
                        {dayNames[day]}
                      </p>
                      {isToday ? (
                        <span className="mt-1 inline-block rounded-full bg-primary px-2 py-0.5 text-[9px] font-medium text-primary-foreground">
                          Today
                        </span>
                      ) : null}
                    </div>
                  );
                })}
              </div>
              <div className="grid min-h-[420px] grid-cols-5">
                {weekDays.map((day) => {
                  const entries = timetable
                    .filter((t) => t.day === day)
                    .sort((a, b) => a.startTime.localeCompare(b.startTime));
                  const isToday = day === today;
                  return (
                    <div
                      key={day}
                      className={cn(
                        "space-y-2 border-r border-border p-2.5 last:border-r-0",
                        isToday && "bg-primary/[0.03]",
                      )}
                    >
                      {entries.length === 0 ? (
                        <p className="px-1 py-6 text-center text-[10px] text-muted-foreground">
                          Free
                        </p>
                      ) : (
                        entries.map((entry) => {
                          const module = getModule(entry.moduleId);
                          const isNext = next?.entry.id === entry.id;
                          return (
                            <div
                              key={entry.id}
                              className={cn(
                                "group relative overflow-hidden rounded-xl p-2.5 text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md",
                                isNext &&
                                  "ring-2 ring-white/70 ring-offset-2 ring-offset-background",
                              )}
                              style={{
                                background: `linear-gradient(145deg, ${module?.accent ?? "#1E88E5"}, color-mix(in oklab, ${module?.accent ?? "#1E88E5"} 72%, #0B1B2B))`,
                              }}
                            >
                              <p className="text-[11px] font-semibold leading-snug">
                                {module?.name}
                              </p>
                              <p className="mt-1.5 text-[10px] text-white/90">
                                {formatTime(entry.startTime)} –{" "}
                                {formatTime(entry.endTime)}
                              </p>
                              <p className="mt-0.5 truncate text-[10px] text-white/75">
                                {entry.room}
                              </p>
                              {isNext ? (
                                <span className="absolute right-1.5 top-1.5 rounded-full bg-white/20 px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wide">
                                  Next
                                </span>
                              ) : null}
                            </div>
                          );
                        })
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
