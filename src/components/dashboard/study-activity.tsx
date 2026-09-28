"use client";

import { Button } from "@/components/ui/button";
import { studySessions } from "@/data/mock";
import { cn } from "@/lib/utils";

const DAY_MS = 24 * 60 * 60 * 1000;

function atNoon(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12);
}

function buildWeek() {
  const parsed = studySessions
    .map((s) => ({
      day: atNoon(new Date(`${s.date}T12:00:00`)).getTime(),
      minutes: s.durationMinutes,
    }))
    .filter((s) => Number.isFinite(s.day))
    .sort((a, b) => a.day - b.day);

  if (parsed.length === 0) {
    return { days: [], totalMinutes: 0, sessionCount: 0, rangeLabel: "" };
  }

  const start = parsed[0].day;
  const buckets = Array.from({ length: 7 }, (_, i) => {
    const day = start + i * DAY_MS;
    const d = new Date(day);
    return {
      key: day,
      weekday: d
        .toLocaleDateString("en-GB", { weekday: "narrow" })
        .toUpperCase(),
      dayNum: d.getDate(),
      minutes: 0,
    };
  });

  let total = 0;
  for (const s of parsed) {
    const idx = Math.round((s.day - start) / DAY_MS);
    if (idx >= 0 && idx < 7) {
      buckets[idx].minutes += s.minutes;
      total += s.minutes;
    }
  }

  const first = new Date(start);
  const last = new Date(start + 6 * DAY_MS);
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  return {
    days: buckets,
    totalMinutes: total,
    sessionCount: parsed.length,
    rangeLabel: `${fmt(first)} – ${fmt(last)}`,
  };
}

// Static planner data — computed once so render stays a pure function.
const WEEK = buildWeek();

export function StudyActivity() {
  const { days, totalMinutes, sessionCount, rangeLabel } = WEEK;

  const max = Math.max(0, ...days.map((d) => d.minutes));
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;

  return (
    <section className="surface flex h-full flex-col rounded-[20px] p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-heading text-[15px] font-semibold tracking-tight">
            Study activity
          </h2>
          <p className="mt-0.5 text-[12px] text-muted-foreground">
            {rangeLabel
              ? `${hours > 0 ? `${hours}h ` : ""}${mins}m planned · ${sessionCount} sessions`
              : "No sessions planned yet"}
          </p>
        </div>
        <Button variant="ghost" size="sm" href="/planner">
          Planner
        </Button>
      </div>

      {days.length === 0 ? (
        <p className="py-10 text-center text-[12px] text-muted-foreground">
          Plan a session to start your activity chart.
        </p>
      ) : (
        <>
          <div className="mt-4 flex h-36 items-stretch gap-2 sm:gap-2.5">
            {days.map((d) => {
              const isMax = d.minutes > 0 && d.minutes === max;
              return (
                <div
                  key={d.key}
                  className="flex min-w-0 flex-1 flex-col items-center"
                >
                  <span
                    className={cn(
                      "flex h-4 items-end text-[10px] font-semibold tabular-nums",
                      isMax ? "text-primary" : "text-muted-foreground",
                    )}
                  >
                    {d.minutes > 0 ? d.minutes : ""}
                  </span>
                  <div className="flex w-full flex-1 items-end rounded-full bg-muted/70 px-1 py-1">
                    <div
                      className={cn(
                        "w-full rounded-full transition-all",
                        isMax ? "bg-primary" : "bg-primary/25",
                      )}
                      style={{
                        height: `${max > 0 ? Math.max(6, Math.round((d.minutes / max) * 100)) : 0}%`,
                      }}
                    />
                  </div>
                  <span className="mt-1.5 text-[10px] font-semibold text-muted-foreground">
                    {d.weekday}
                  </span>
                  <span className="-mt-0.5 text-[10px] tabular-nums text-muted-foreground/70">
                    {d.dayNum}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-[11px] text-muted-foreground">{rangeLabel}</p>
        </>
      )}
    </section>
  );
}
