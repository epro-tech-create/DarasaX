"use client";

import { useTranslate } from "@/components/providers/language-provider";
import { useMemo, useState, type ReactNode } from "react";
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
import { DEFAULT_CLASS_STREAM, getModule } from "@/data/mock";
import { getNextClass } from "@/lib/academic";
import { useTimetableStore } from "@/lib/timetable-store";
import { useClassRegistry } from "@/lib/class-registry";
import { cn, formatTime } from "@/lib/utils";
import type { ClassStreamId, TimetableEntry } from "@/types";
import { addDateDays, dateDay, tanzaniaDate, weekStart } from "@/lib/timetable-dates";
import { Button } from "@/components/ui/button";
import { NoLessonsTodayButton } from "@/components/timetable/no-lessons-today-button";

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

function blockStyle(entry: TimetableEntry, startHour = GRID_START) {
  const start = toMinutes(entry.startTime);
  const end = toMinutes(entry.endTime);
  const gridStart = startHour * 60;
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
  const translateUI = useTranslate();
  const courseModule = getModule(entry.moduleId);
  const accent = courseModule?.accent ?? "#1E88E5";

  return (
    <div
      className={cn(
        "group relative h-full overflow-hidden rounded-xl border border-border/70 bg-card/90 backdrop-blur-sm transition",
        "hover:border-primary/40 hover:shadow-[0_8px_24px_-12px_rgba(30,136,229,0.45)]",
        isNext && "border-primary/50 ring-1 ring-primary/30",
      )}
      style={{
        backgroundImage: `linear-gradient(135deg, color-mix(in oklab, ${accent} 18%, transparent), transparent 70%)`,
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
            {courseModule?.name}
          </p>
          {isNext ? (
            <span className="shrink-0 rounded-md bg-primary/15 px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wide text-primary">
              {translateUI("Next")}</span>
          ) : null}
        </div>
        <p
          className={cn(
            "mt-0.5 font-medium tabular-nums text-muted-foreground",
            compact ? "text-[9px]" : "text-[10px]",
          )}
        >
          {translateUI(formatTime(entry.startTime))} – {translateUI(formatTime(entry.endTime))}
        </p>
        {!compact ? (
          <p className="mt-auto truncate pt-1 text-[10px] text-muted-foreground">
            {entry.room}
            {translateUI(courseModule?.code ? ` · ${courseModule.code}` : "")}
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

export function TimetableView({ initialStream = DEFAULT_CLASS_STREAM, lockedStream, onEdit, actions }: { initialStream?: ClassStreamId; lockedStream?: ClassStreamId; onEdit?: (entry: TimetableEntry) => void; actions?: ReactNode }) {
  const translateUI = useTranslate();
  const [view, setView] = useState<"today" | "week">("week");
  const [selectedDate, setSelectedDate] = useState(tanzaniaDate);
  const fromDate = weekStart(selectedDate);
  const toDate = addDateDays(fromDate, 4);
  const [browsingStream, setBrowsingStream] = useState<ClassStreamId | null>(
    null,
  );
  const { streams: classStreams } = useClassRegistry();
  const streamId =
    lockedStream ?? browsingStream ?? initialStream;
  const today = dateDay(selectedDate);
  const actualToday = tanzaniaDate();
  const isCurrentWeek = weekStart(actualToday) === fromDate;
  const selectedStream = classStreams.find((s) => s.id === streamId) ?? {
    id: streamId,
    label: streamId,
    description: "Class timetable",
    isEvening: false,
  };
  const { forStream, entries: allEntries, error: scheduleError } = useTimetableStore({ from: fromDate, to: toDate });
  const next = getNextClass(new Date(), streamId, allEntries);

  const streamTimetable = useMemo(
    () => forStream(streamId).filter(entry => entry.status !== "cancelled" && entry.status !== "postponed"),
    [forStream, streamId],
  );

  const todayEntries = useMemo(
    () =>
      streamTimetable
        .filter((t) => t.sessionDate === selectedDate)
        .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [streamTimetable, selectedDate],
  );

  const weekEntries = useMemo(
    () =>
      streamTimetable.filter((t) =>
        weekDays.includes(t.day as (typeof weekDays)[number]),
      ),
    [streamTimetable],
  );
  const gridStart = Math.min(GRID_START, ...weekEntries.map(entry => Math.floor(toMinutes(entry.startTime) / 60)));
  const gridEnd = Math.max(GRID_END, ...weekEntries.map(entry => Math.ceil(toMinutes(entry.endTime) / 60)));
  const hours = Array.from({ length: gridEnd - gridStart }, (_, index) => gridStart + index);

  const nowMinutes = useMemo(() => {
    const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Dar_es_Salaam", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date()).split(":").map(Number);
    return parts[0] * 60 + parts[1];
  }, []);

  const isWeekday = isCurrentWeek;
  const showNowLine =
    isWeekday && nowMinutes >= gridStart * 60 && nowMinutes <= gridEnd * 60;
  const nowTop = ((nowMinutes - gridStart * 60) / 60) * HOUR_HEIGHT;
  const gridHeight = hours.length * HOUR_HEIGHT;

  return (
    <div className="space-y-5">
      <PageHeader
        title={translateUI("Timetable")}
        description={translateUI(lockedStream ? "Your class schedule. Select a session to edit it." : "Pick your stream to load the right weekly schedule.")}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {actions}
            {onEdit && <NoLessonsTodayButton key={streamId} streamId={streamId} />}
            <div className="inline-flex rounded-xl border border-border/80 bg-muted/40 p-0.5">
            {(["today", "week"] as const).map((item) => (
              <button
                key={item === "today" ? "Day" : "Week"}
                type="button"
                onClick={() => setView(item)}
                className={cn(
                  "rounded-lg px-3.5 py-1.5 text-[11px] font-medium capitalize transition",
                  view === item
                    ? "btn-gradient shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {item === "today" ? "Day" : "Week"}
              </button>
            ))}
            </div>
          </div>
        }
      />
      <div className="surface flex flex-wrap items-center gap-3 rounded-2xl p-3">
        <label className="text-xs font-medium">Date (Tanzania)<input type="date" aria-label="Timetable date" value={selectedDate} onChange={e => { if (e.target.value) setSelectedDate(e.target.value); }} className="ml-2 h-10 rounded-xl border border-border bg-background px-2" /></label>
        <Button size="sm" variant="outline" onClick={() => setSelectedDate(addDateDays(selectedDate, -7))}>Previous week</Button>
        <Button size="sm" variant="outline" onClick={() => setSelectedDate(tanzaniaDate())}>Today</Button>
        <Button size="sm" variant="outline" onClick={() => setSelectedDate(addDateDays(selectedDate, 7))}>Next week</Button>
        <p className="text-xs text-muted-foreground">{fromDate} – {toDate} · EAT</p>
      </div>
      {scheduleError ? <p role="alert" className="text-sm text-danger">{scheduleError}</p> : null}

      <div className="surface flex flex-col gap-3 rounded-2xl p-3.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
            {translateUI("Class stream")}</p>
          <p className="mt-0.5 font-heading text-[14px] font-semibold">
            {translateUI(selectedStream.label)}
          </p>
          <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            {selectedStream.isEvening ? (
              <Moon className="h-3 w-3 text-primary" />
            ) : (
              <Sun className="h-3 w-3 text-primary" />
            )}
            {translateUI(selectedStream.description)}
          </p>
        </div>
        <label className="flex w-full flex-col gap-1 sm:w-auto sm:min-w-[240px]">
          <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            {translateUI("Select stream")}</span>
          <select
            value={streamId}
            disabled={Boolean(lockedStream)}
            onChange={(event) =>
              setBrowsingStream(event.target.value as ClassStreamId)
            }
            aria-label={translateUI("View class timetable")}
            className="h-10 w-full rounded-xl border border-border bg-background px-3 text-[13px] font-medium outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            {classStreams.map((stream) => (
              <option key={stream.id} value={stream.id}>
                {translateUI(stream.label)}
                {translateUI(stream.isEvening ? " (Evening)" : "")}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-2.5 sm:grid-cols-3">
        {[
          {
            label: "Classes on selected date",
            value: String(todayEntries.length),
            hint: dayFull[today],
            icon: CalendarDays,
          },
          {
            label: "Selected week",
            value: String(weekEntries.length),
            hint: selectedStream.isEvening
              ? translateUI("Evening sessions")
              : translateUI("Weekly sessions"),
            icon: Clock3,
          },
          {
            label: "Next up",
            value: next
              ? (getModule(next.entry.moduleId)?.code ?? "—")
              : translateUI("Free"),
            hint: next
              ? `${formatTime(next.entry.startTime)} · ${next.entry.room}`
              : translateUI("Nothing scheduled"),
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
                  {translateUI(stat.label)}
                </p>
                <p className="mt-1 truncate font-heading text-xl font-semibold tracking-tight">
                  {translateUI(stat.value)}
                </p>
                <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                  {translateUI(stat.hint)}
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
                {translateUI(dayFull[today])}
              </h3>
              <p className="text-[11px] text-muted-foreground">
                {translateUI(`${todayEntries.length} session${todayEntries.length === 1 ? "" : "s"}`)} · {translateUI(selectedStream.label)}
              </p>
            </div>

            {todayEntries.length === 0 ? (
              <div className="surface rounded-[20px] px-5 py-12 text-center">
                <CalendarDays className="mx-auto h-8 w-8 text-muted-foreground/45" />
                <p className="mt-3 text-[13px] font-medium">{translateUI("No classes on this date")}</p>
                <p className="mt-1 text-[12px] text-muted-foreground">
                  {translateUI("Nothing scheduled for ")}{translateUI(selectedStream.label)} {translateUI(" today.")}</p>
              </div>
            ) : (
              <div className="relative space-y-0 pl-1">
                <div className="absolute bottom-4 left-[17px] top-4 w-px bg-border" />
                {todayEntries.map((entry, index) => {
                  const courseModule = getModule(entry.moduleId);
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
                            backgroundColor: courseModule?.accent ?? "#1E88E5",
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
                              {courseModule?.name}
                            </p>
                            <p className="mt-0.5 text-[11px] text-muted-foreground">
                              {translateUI(courseModule?.code)} ·{" "}
                              {translateUI(durationLabel(entry.startTime, entry.endTime))}
                            </p>
                          </div>
                          {onEdit && <button type="button" className="focus-ring rounded-lg px-2 py-1 text-xs font-semibold text-primary" onClick={() => onEdit(entry)}>{translateUI("Edit")}</button>}
                          {isNext ? <Badge tone="primary">{translateUI("Next")}</Badge> : null}
                        </div>
                        <div className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <Clock3 className="h-3 w-3" />
                            {translateUI(formatTime(entry.startTime))} —{" "}
                            {translateUI(formatTime(entry.endTime))}
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
                const isToday = isCurrentWeek && day === dateDay(actualToday);
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
                          {translateUI(dayFull[day])}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {translateUI(`${entries.length} class${entries.length === 1 ? "" : "es"}`)}
                        </p>
                      </div>
                      {isToday ? <Badge tone="primary">{translateUI("Today")}</Badge> : null}
                    </div>
                    {entries.length === 0 ? (
                      <p className="px-3.5 py-6 text-center text-[11px] text-muted-foreground">
                        {translateUI("Free day")}</p>
                    ) : (
                      <div className="divide-y divide-border/60">
                        {entries.map((entry) => {
                          const courseModule = getModule(entry.moduleId);
                          const accent = courseModule?.accent ?? "#1E88E5";
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
                                  {courseModule?.name}
                                </p>
                                <p className="mt-0.5 text-[11px] tabular-nums text-muted-foreground">
                                  {translateUI(formatTime(entry.startTime))} –{" "}
                                  {translateUI(formatTime(entry.endTime))} · {entry.room}
                                </p>
                              </div>
                              {onEdit ? <Button type="button" size="sm" variant="outline" onClick={() => onEdit(entry)}>Edit session</Button> : null}
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
                    {translateUI("Weekly schedule")}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {String(gridStart).padStart(2, "0")}:00 – {String(gridEnd).padStart(2, "0")}:00 · {translateUI(weekEntries.length)} {translateUI(" sessions ·")}{" "}
                    {translateUI(selectedStream.label)}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-primary" />
                    {translateUI("Today")}</span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-0.5 w-4 rounded-full bg-rose-400" />
                    {translateUI("Now")}</span>
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
                    const isToday = isCurrentWeek && day === dateDay(actualToday);
                    const count = weekEntries.filter(
                      (e) => e.day === day,
                    ).length;
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
                          {translateUI(dayNames[day])}
                        </p>
                        <p className="mt-0.5 text-[10px] text-muted-foreground">
                          {translateUI(`${count} class${count === 1 ? "" : "es"}`)}
                        </p>
                        {isToday ? (
                          <span className="mt-1.5 inline-flex rounded-full bg-primary px-2 py-0.5 text-[9px] font-semibold text-primary-foreground">
                            {translateUI("Today")}</span>
                        ) : null}
                      </div>
                    );
                  })}

                  <div className="sticky left-0 z-10 border-r border-border/70 bg-background/95 backdrop-blur">
                    <div className="relative" style={{ height: gridHeight }}>
                      {hours.map((hour) => {
                        const isFirst = hour === gridStart;
                        return (
                          <div
                            key={hour}
                            className="absolute right-0 left-0 flex justify-end pr-2"
                            style={{ top: (hour - gridStart) * HOUR_HEIGHT }}
                          >
                            <span
                              className={cn(
                                "text-[10px] font-medium tabular-nums text-muted-foreground",
                                isFirst ? "mt-1" : "-translate-y-1/2",
                              )}
                            >
                              {translateUI(String(hour).padStart(2, "0"))}:00
                            </span>
                          </div>
                        );
                      })}
                      <div className="absolute right-0 bottom-0 left-0 flex justify-end pr-2 pb-1">
                        <span className="text-[10px] font-medium tabular-nums text-muted-foreground">
                          {String(gridEnd).padStart(2, "0")}:00
                        </span>
                      </div>
                    </div>
                  </div>

                  {weekDays.map((day) => {
                    const entries = weekEntries.filter((t) => t.day === day);
                    const isToday = isCurrentWeek && day === dateDay(actualToday);
                    return (
                      <div
                        key={day}
                        className={cn(
                          "relative border-r border-border/60 last:border-r-0",
                          isToday && "bg-primary/[0.03]",
                        )}
                      >
                        <div
                          className="relative"
                          style={{ height: gridHeight }}
                        >
                          {hours.map((hour) => (
                            <div
                              key={hour}
                              className="absolute inset-x-0 border-t border-border/40"
                              style={{
                                top: (hour - gridStart) * HOUR_HEIGHT,
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
                            const { top, height } = blockStyle(entry, gridStart);
                            return (
                              <div
                                key={entry.id}
                                className="absolute inset-x-1.5 z-10"
                                style={{ top, height }}
                              >
                                {onEdit ? <button type="button" className="focus-ring block h-full w-full rounded-xl text-left" aria-label={`Edit ${getModule(entry.moduleId)?.name ?? translateUI("session")} ${entry.startTime}`} onClick={() => onEdit(entry)}>
                                  <ClassBlock entry={entry} isNext={next?.entry.id === entry.id} compact={height < 56} />
                                </button> : <ClassBlock entry={entry} isNext={next?.entry.id === entry.id} compact={height < 56} />}
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
