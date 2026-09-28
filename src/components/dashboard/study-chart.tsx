"use client";

import { studySessions } from "@/data/mock";
import { cn } from "@/lib/utils";

const DAY_MS = 24 * 60 * 60 * 1000;
const W = 560;
const H = 220;
const PAD_X = 8;
const PAD_TOP = 22;
const PAD_BOTTOM = 34;

function atNoon(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12);
}

type DayPoint = {
  key: number;
  weekday: string;
  dayNum: number;
  minutes: number;
};

function buildSeries(): {
  days: DayPoint[];
  totalMinutes: number;
  sessionCount: number;
  rangeLabel: string;
} {
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
  const days: DayPoint[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start + i * DAY_MS);
    return {
      key: start + i * DAY_MS,
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
      days[idx].minutes += s.minutes;
      total += s.minutes;
    }
  }

  const fmt = (t: number) =>
    new Date(t).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
    });
  return {
    days,
    totalMinutes: total,
    sessionCount: parsed.length,
    rangeLabel: `${fmt(start)} – ${fmt(start + 6 * DAY_MS)}`,
  };
}

// Static planner data — computed once so render stays a pure function.
const SERIES = buildSeries();

function niceCeil(n: number) {
  if (n <= 0) return 30;
  const step = n <= 60 ? 30 : n <= 150 ? 60 : 120;
  return Math.ceil(n / step) * step;
}

export function StudyChart() {
  const { days, totalMinutes, sessionCount, rangeLabel } = SERIES;

  if (days.length === 0) {
    return (
      <section className="surface rounded-[20px] p-4 sm:p-5">
        <h2 className="font-heading text-[15px] font-semibold tracking-tight">
          Study activity
        </h2>
        <p className="mt-6 pb-6 text-center text-[12px] text-muted-foreground">
          Plan a session to start your activity graph.
        </p>
      </section>
    );
  }

  const max = niceCeil(Math.max(...days.map((d) => d.minutes)));
  const innerW = W - PAD_X * 2;
  const innerH = H - PAD_TOP - PAD_BOTTOM;
  const x = (i: number) => PAD_X + (innerW * i) / (days.length - 1);
  const y = (v: number) => PAD_TOP + innerH * (1 - v / max);

  const line = days
    .map((d, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(d.minutes).toFixed(1)}`)
    .join(" ");
  const area = `${line} L${x(days.length - 1).toFixed(1)},${(PAD_TOP + innerH).toFixed(1)} L${x(0).toFixed(1)},${(PAD_TOP + innerH).toFixed(1)} Z`;
  const gridVals = [0, max / 2, max];

  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;

  return (
    <section className="surface rounded-[20px] p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-heading text-[15px] font-semibold tracking-tight">
            Study activity
          </h2>
          <p className="mt-0.5 text-[12px] text-muted-foreground">
            {hours > 0 ? `${hours}h ` : ""}
            {mins}m planned · {sessionCount} sessions · {rangeLabel}
          </p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
          <span className="h-2 w-2 rounded-full bg-primary" />
          Minutes per day
        </span>
      </div>

      <div className="mt-3 text-primary">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-48 w-full sm:h-56"
          role="img"
          aria-label={`Study minutes per day, ${rangeLabel}`}
        >
          <defs>
            <linearGradient id="study-area-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0.35" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {gridVals.map((v) => (
            <g key={v}>
              <line
                x1={PAD_X}
                x2={W - PAD_X}
                y1={y(v)}
                y2={y(v)}
                strokeWidth="1"
                className="stroke-border"
                strokeDasharray={v === 0 ? "" : "3 4"}
              />
              <text
                x={W - PAD_X}
                y={y(v) - 4}
                textAnchor="end"
                className="fill-muted-foreground"
                fontSize="10"
              >
                {v}
              </text>
            </g>
          ))}

          <path d={area} fill="url(#study-area-fill)" />
          <path
            d={line}
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {days.map((d, i) => (
            <g key={d.key}>
              {d.minutes > 0 ? (
                <>
                  <circle
                    cx={x(i)}
                    cy={y(d.minutes)}
                    r="4"
                    strokeWidth="2"
                    stroke="currentColor"
                    className="fill-card"
                  />
                  <text
                    x={x(i)}
                    y={y(d.minutes) - 10}
                    textAnchor="middle"
                    fontSize="10"
                    fontWeight="600"
                    className={cn("fill-foreground tabular-nums")}
                  >
                    {d.minutes}
                  </text>
                </>
              ) : null}
              <text
                x={x(i)}
                y={H - 18}
                textAnchor="middle"
                fontSize="10"
                fontWeight="600"
                className="fill-muted-foreground"
              >
                {d.weekday}
              </text>
              <text
                x={x(i)}
                y={H - 5}
                textAnchor="middle"
                fontSize="10"
                className="fill-muted-foreground tabular-nums"
              >
                {d.dayNum}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </section>
  );
}
