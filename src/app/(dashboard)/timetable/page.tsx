"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarDays,
  Clock3,
  MapPin,
  Moon,
  Sparkles,
  Sun,
  UserRound,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import {
  classStreams,
  DEFAULT_CLASS_STREAM,
  getModule,
} from "@/data/mock";
import { getNextClass } from "@/lib/academic";
import { useTimetableStore } from "@/lib/timetable-store";
import { cn, formatTime } from "@/lib/utils";
import type { ClassStreamId, TimetableEntry } from "@/types";

const STREAM_STORAGE_KEY = "darasax-class-stream";

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
const weekDays = [1, 2, 3, 4, 5] as const;

const GRID_START = 7; // 07:00
const GRID_END = 21; // 21:00
const HOUR_HEIGHT = 64; // px per hour

function toMinutes(time: string) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function durationLabel(start: string, end: string) {
  const mins = toMinutes(end) - toMinutes(start);
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

function blockStyle(entry: TimetableEntry) {
  const start = toMinutes(entry.startTime);
  const end = toMinutes(entry.endTime);
  const gridStart = GRID_START * 60;
  const top = ((start - gridStart) / 60) * HOUR_HEIGHT;
  const height = Math.max(((end - start) / 60) * HOUR_HEIGHT - 4, 36);
  return { top, height };
}

function ClassBlock({
  entry,
  isNext,
  compact = false,
}: {
  entry: TimetableEntry;
  isNext?: boolean;
  compact?: boolean;
}) {
  const module = getModule(entry.moduleId);
  const accent = module?.accent ?? "#1E88E5";

  return (
    <div
      className={cn(
        "group relative h-full overflow-hidden rounded-xl border border-border/70 bg-card/90 backdrop-blur-sm transition",
        "hover:border-primary/40 hover:shadow-[0_8px_24px_-12px_rgba(30,136,229,0.45)]",
        isNext && "border-primary/50 ring-1 ring-primary/30",
      )}
      style={{
        backgroundColor: `color-mix(in oklab, ${accent} 12%, transparent)`,
      }}
    >
      <span
        className="absolute inset-y-0 left-0 w-[3px]"
        style={{ backgroundColor: accent }}
      />
      <div
        className={cn(
          "flex h-full flex-col pl-3 pr-2",
          compact ? "py-1.5" : "py-2",
        )}
      >
        <div className="flex items-start justify-between gap-1">
          <p
            className={cn(
              "font-semibold leading-snug text-foreground",
              compact ? "line-clamp-2 text-[10px]" : "line-clamp-2 text-[12px]",
            )}
          >
            {module?.name}
          </p>
          {isNext ? (
            <span className="shrink-0 rounded-md bg-primary/15 px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wide text-primary">
              Next
            </span>
          ) : null}
        </div>
        <p
          className={cn(
            "mt-0.5 font-medium tabular-nums text-muted-foreground",
            compact ? "text-[9px]" : "text-[10px]",
          )}
        >
          {formatTime(entry.startTime)} – {formatTime(entry.endTime)}
        </p>
        {!compact ? (
          <p className="mt-auto truncate pt-1 text-[10px] text-muted-foreground">
            {entry.room}
            {module?.code ? ` · ${module.code}` : ""}
          </p>
        ) : (
          <p className="mt-auto truncate text-[9px] text-muted-foreground">
            {entry.room}
          </p>
        )}
      </div>
    </div>
  );
}

export default function TimetablePage() {
  const [view, setView] = useState<"today" | "week">("week");
  const [streamId, setStreamId] = useState<ClassStreamId>(DEFAULT_CLASS_STREAM);
  const [streamReady, setStreamReady] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STREAM_STORAGE_KEY);
      if (classStreams.some((s) => s.id === saved)) {
        setStreamId(saved as ClassStreamId);
      }
    } catch {
      /* ignore */
    }
    setStreamReady(true);
  }, []);

  useEffect(() => {
    if (!streamReady) return;
    try {
      localStorage.setItem(STREAM_STORAGE_KEY, streamId);
    } catch {
      /* ignore */
    }
  }, [streamId, streamReady]);

  const today = new Date().getDay();
  const selectedStream =
    classStreams.find((s) => s.id === streamId) ?? classStreams[0];
  const { forStream, entries: allEntries } = useTimetableStore();
  const next = getNextClass(new Date(), streamId, allEntries);
  const hours = useMemo(
    () =>
      Array.from({ length: GRID_END - GRID_START }, (_, i) => GRID_START + i),
    [],
  );

  const streamTimetable = useMemo(
    () => forStream(streamId),
    [forStream, streamId],
  );

  const todayEntries = useMemo(
    () =>
      streamTimetable
        .filter((t) => t.day === today)
        .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [streamTimetable, today],
  );

  const weekEntries = useMemo(
    () =>
      streamTimetable.filter((t) =>
        weekDays.includes(t.day as 1 | 2 | 3 | 4 | 5),
      ),
    [streamTimetable],
  );

  const nowMinutes = useMemo(() => {
    const n = new Date();
    return n.getHours() * 60 + n.getMinutes();
  }, []);

  const isWeekday = weekDays.includes(today as 1 | 2 | 3 | 4 | 5);
  const showNowLine =
    isWeekday &&
    nowMinutes >= GRID_START * 60 &&
    nowMinutes <= GRID_END * 60;
  const nowTop = ((nowMinutes - GRID_START * 60) / 60) * HOUR_HEIGHT;
  const gridHeight = hours.length * HOUR_HEIGHT;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Timetable"
        description="Pick your stream to load the right weekly schedule."
        actions={
          <div className="inline-flex rounded-xl border border-border/80 bg-muted/40 p-0.5">
            {(["today", "week"] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setView(item)}
                className={cn(
                  "rounded-lg px-3.5 py-1.5 text-[11px] font-medium capitalize transition",
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

      <div className="surface flex flex-col gap-3 rounded-2xl p-3.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
            Class stream
          </p>
          <p className="mt-0.5 font-heading text-[14px] font-semibold">
            {selectedStream.label}
          </p>
          <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            {selectedStream.isEvening ? (
              <Moon className="h-3 w-3 text-primary" />
            ) : (
              <Sun className="h-3 w-3 text-primary" />
            )}
            {selectedStream.description}
          </p>
        </div>
        <label className="flex w-full flex-col gap-1 sm:w-auto sm:min-w-[240px]">
          <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            Select stream
          </span>
          <select
            value={streamId}
            onChange={(e) => setStreamId(e.target.value as ClassStreamId)}
            className="h-10 w-full rounded-xl border border-border bg-background px-3 text-[13px] font-medium outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            {classStreams.map((stream) => (
              <option key={stream.id} value={stream.id}>
                {stream.label}
                {stream.isEvening ? " (Evening)" : ""}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-2.5 sm:grid-cols-3">
        {[
          {
            label: "Classes today",
            value: String(todayEntries.length),
            hint: dayFull[today],
            icon: CalendarDays,
          },
          {
            label: "This week",
            value: String(weekEntries.length),
            hint: selectedStream.isEvening
              ? "Evening sessions"
              : "Mon – Fri sessions",
            icon: Clock3,
          },
          {
            label: "Next up",
            value: next ? (getModule(next.entry.moduleId)?.code ?? "—") : "Free",
            hint: next
              ? `${formatTime(next.entry.startTime)} · ${next.entry.room}`
              : "Nothing scheduled",
            icon: Sparkles,
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="surface relative overflow-hidden rounded-2xl p-3.5"
          >
            <div className="pointer-events-none absolute -right-4 -top-6 h-20 w-20 rounded-full bg-primary/10 blur-2xl" />
            <div className="relative flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                  {stat.label}
                </p>
                <p className="mt-1 truncate font-heading text-xl font-semibold tracking-tight">
                  {stat.value}
                </p>
                <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                  {stat.hint}
                </p>
              </div>
              <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <stat.icon className="h-3.5 w-3.5" />
              </span>
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {view === "today" ? (
          <motion.div
            key={`today-${streamId}`}
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
                {todayEntries.length === 1 ? "" : "s"} · {selectedStream.label}
              </p>
            </div>

            {todayEntries.length === 0 ? (
              <div className="surface rounded-[20px] px-5 py-12 text-center">
                <CalendarDays className="mx-auto h-8 w-8 text-muted-foreground/45" />
                <p className="mt-3 text-[13px] font-medium">No classes today</p>
                <p className="mt-1 text-[12px] text-muted-foreground">
                  Nothing scheduled for {selectedStream.label} today.
                </p>
              </div>
            ) : (
              <div className="relative space-y-0 pl-1">
                <div className="absolute bottom-4 left-[17px] top-4 w-px bg-border" />
                {todayEntries.map((entry, index) => {
                  const module = getModule(entry.moduleId);
                  const isNext = next?.entry.id === entry.id;
                  return (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.04 }}
                      className="relative flex gap-3 pb-3.5 last:pb-0"
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
                          isNext && "ring-1 ring-primary/40",
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
                            <Clock3 className="h-3 w-3" />
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
            key={`week-${streamId}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className="space-y-3"
          >
            <div className="space-y-3 lg:hidden">
              {weekDays.map((day) => {
                const entries = weekEntries
                  .filter((t) => t.day === day)
                  .sort((a, b) => a.startTime.localeCompare(b.startTime));
                const isToday = day === today;
                return (
                  <section
                    key={day}
                    className={cn(
                      "surface overflow-hidden rounded-2xl",
                      isToday && "ring-1 ring-primary/35",
                    )}
                  >
                    <div className="flex items-center justify-between border-b border-border/70 bg-muted/30 px-3.5 py-2.5">
                      <div>
                        <p className="font-heading text-[13px] font-semibold">
                          {dayFull[day]}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {entries.length} class
                          {entries.length === 1 ? "" : "es"}
                        </p>
                      </div>
                      {isToday ? <Badge tone="primary">Today</Badge> : null}
                    </div>
                    {entries.length === 0 ? (
                      <p className="px-3.5 py-6 text-center text-[11px] text-muted-foreground">
                        Free day
                      </p>
                    ) : (
                      <div className="divide-y divide-border/60">
                        {entries.map((entry) => {
                          const module = getModule(entry.moduleId);
                          const accent = module?.accent ?? "#1E88E5";
                          return (
                            <div
                              key={entry.id}
                              className="flex gap-3 px-3.5 py-3"
                            >
                              <span
                                className="mt-0.5 h-10 w-1 shrink-0 rounded-full"
                                style={{ backgroundColor: accent }}
                              />
                              <div className="min-w-0 flex-1">
                                <p className="text-[12px] font-semibold">
                                  {module?.name}
                                </p>
                                <p className="mt-0.5 text-[11px] tabular-nums text-muted-foreground">
                                  {formatTime(entry.startTime)} –{" "}
                                  {formatTime(entry.endTime)} · {entry.room}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </section>
                );
              })}
            </div>

            <div className="surface hidden overflow-hidden rounded-[20px] lg:block">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 bg-muted/25 px-4 py-3">
                <div>
                  <p className="font-heading text-[13px] font-semibold">
                    Weekly schedule
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    07:00 – 21:00 · {weekEntries.length} sessions ·{" "}
                    {selectedStream.label}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-primary" />
                    Today
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-0.5 w-4 rounded-full bg-rose-400" />
                    Now
                  </span>
                </div>
              </div>

              <div className="max-h-[min(78vh,920px)] overflow-auto">
                <div
                  className="grid min-w-[900px]"
                  style={{
                    gridTemplateColumns: `72px repeat(${weekDays.length}, minmax(0, 1fr))`,
                  }}
                >
                  <div className="sticky left-0 top-0 z-30 border-b border-r border-border/70 bg-background/95 px-2 py-3 backdrop-blur" />
                  {weekDays.map((day) => {
                    const isToday = day === today;
                    const count = weekEntries.filter((e) => e.day === day).length;
                    return (
                      <div
                        key={day}
                        className={cn(
                          "sticky top-0 z-20 border-b border-r border-border/70 bg-background/95 px-3 py-3 text-center backdrop-blur last:border-r-0",
                          isToday && "bg-primary/[0.07]",
                        )}
                      >
                        <p
                          className={cn(
                            "text-[11px] font-semibold uppercase tracking-[0.1em]",
                            isToday ? "text-primary" : "text-muted-foreground",
                          )}
                        >
                          {dayNames[day]}
                        </p>
                        <p className="mt-0.5 text-[10px] text-muted-foreground">
                          {count} class{count === 1 ? "" : "es"}
                        </p>
                        {isToday ? (
                          <span className="mt-1.5 inline-flex rounded-full bg-primary px-2 py-0.5 text-[9px] font-semibold text-primary-foreground">
                            Today
                          </span>
                        ) : null}
                      </div>
                    );
                  })}

                  <div className="sticky left-0 z-10 border-r border-border/70 bg-background/95 backdrop-blur">
                    <div className="relative" style={{ height: gridHeight }}>
                      {hours.map((hour) => {
                        const isFirst = hour === GRID_START;
                        return (
                          <div
                            key={hour}
                            className="absolute right-0 left-0 flex justify-end pr-2"
                            style={{ top: (hour - GRID_START) * HOUR_HEIGHT }}
                          >
                            <span
                              className={cn(
                                "text-[10px] font-medium tabular-nums text-muted-foreground",
                                isFirst ? "mt-1" : "-translate-y-1/2",
                              )}
                            >
                              {String(hour).padStart(2, "0")}:00
                            </span>
                          </div>
                        );
                      })}
                      <div className="absolute right-0 bottom-0 left-0 flex justify-end pr-2 pb-1">
                        <span className="text-[10px] font-medium tabular-nums text-muted-foreground">
                          21:00
                        </span>
                      </div>
                    </div>
                  </div>

                  {weekDays.map((day) => {
                    const entries = weekEntries.filter((t) => t.day === day);
                    const isToday = day === today;
                    return (
                      <div
                        key={day}
                        className={cn(
                          "relative border-r border-border/60 last:border-r-0",
                          isToday && "bg-primary/[0.03]",
                        )}
                      >
                        <div className="relative" style={{ height: gridHeight }}>
                          {hours.map((hour) => (
                            <div
                              key={hour}
                              className="absolute inset-x-0 border-t border-border/40"
                              style={{
                                top: (hour - GRID_START) * HOUR_HEIGHT,
                                height: HOUR_HEIGHT,
                              }}
                            >
                              <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-border/25" />
                            </div>
                          ))}
                          <div className="absolute inset-x-0 bottom-0 border-t border-border/40" />

                          {isToday && showNowLine ? (
                            <div
                              className="pointer-events-none absolute inset-x-1 z-20 flex items-center"
                              style={{ top: nowTop }}
                            >
                              <span className="h-2 w-2 shrink-0 -translate-x-0.5 rounded-full bg-rose-400 shadow-[0_0_0_3px_rgba(251,113,133,0.25)]" />
                              <span className="h-px flex-1 bg-rose-400/80" />
                            </div>
                          ) : null}

                          {entries.map((entry) => {
                            const { top, height } = blockStyle(entry);
                            return (
                              <div
                                key={entry.id}
                                className="absolute inset-x-1.5 z-10"
                                style={{ top, height }}
                              >
                                <ClassBlock
                                  entry={entry}
                                  isNext={next?.entry.id === entry.id}
                                  compact={height < 56}
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
