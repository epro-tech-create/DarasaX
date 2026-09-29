"use client";

import { useMemo } from "react";
import { useMaterialsStore } from "@/lib/materials-store";
import { cn } from "@/lib/utils";
import type { MaterialUpload } from "@/types";

const DAY_MS = 24 * 60 * 60 * 1000;
const W = 560;
const H = 220;
const PAD_X = 8;
const PAD_TOP = 22;
const PAD_BOTTOM = 34;

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function kindLabel(kind: MaterialUpload["kind"]) {
  if (kind === "past_paper") return "past paper";
  if (kind === "notes") return "note";
  return kind.replace("_", " ");
}

function buildWeek(items: MaterialUpload[]) {
  const today = startOfDay(new Date());
  const start = today - 6 * DAY_MS;
  const days = Array.from({ length: 7 }, (_, i) => {
    const time = start + i * DAY_MS;
    const date = new Date(time);
    return {
      key: time,
      weekday: date.toLocaleDateString("en-GB", { weekday: "narrow" }).toUpperCase(),
      dayNum: date.getDate(),
      count: 0,
    };
  });

  for (const item of items) {
    if (item.status !== "published") continue;
    const day = startOfDay(new Date(item.createdAt));
    const idx = Math.round((day - start) / DAY_MS);
    if (idx >= 0 && idx < 7) days[idx].count += 1;
  }

  const fmt = (time: number) =>
    new Date(time).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

  return {
    days,
    total: days.reduce((sum, day) => sum + day.count, 0),
    rangeLabel: `${fmt(start)} – ${fmt(today)}`,
  };
}

function niceCeil(n: number) {
  if (n <= 4) return 4;
  const step = n <= 10 ? 2 : 5;
  return Math.ceil(n / step) * step;
}

export function StudyChart() {
  const { published, ready } = useMaterialsStore();
  const { days, total, rangeLabel } = useMemo(
    () => buildWeek(published),
    [published],
  );

  const max = niceCeil(Math.max(...days.map((d) => d.count), 1));
  const innerW = W - PAD_X * 2;
  const innerH = H - PAD_TOP - PAD_BOTTOM;
  const x = (i: number) => PAD_X + (innerW * i) / (days.length - 1);
  const y = (v: number) => PAD_TOP + innerH * (1 - v / max);
  const line = days
    .map((d, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(d.count).toFixed(1)}`)
    .join(" ");
  const area = `${line} L${x(days.length - 1).toFixed(1)},${(PAD_TOP + innerH).toFixed(1)} L${x(0).toFixed(1)},${(PAD_TOP + innerH).toFixed(1)} Z`;
  const gridVals = [0, max / 2, max];
  const latest = [...published].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )[0];

  return (
    <section className="surface rounded-[20px] p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-heading text-[15px] font-semibold tracking-tight">
            Class activity
          </h2>
          <p className="mt-0.5 text-[12px] text-muted-foreground">
            {ready
              ? `${total} new file${total === 1 ? "" : "s"} · last 7 days · ${rangeLabel}`
              : "Loading this week’s uploads…"}
          </p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
          <span className="h-2 w-2 rounded-full bg-primary" />
          Files per day
        </span>
      </div>

      <div className="mt-3 text-primary">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-48 w-full sm:h-56"
          role="img"
          aria-label={`New class files per day, ${rangeLabel}`}
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
              <circle
                cx={x(i)}
                cy={y(d.count)}
                r="4"
                strokeWidth="2"
                stroke="currentColor"
                className="fill-card"
              />
              <text
                x={x(i)}
                y={y(d.count) - 10}
                textAnchor="middle"
                fontSize="10"
                fontWeight="600"
                className={cn("fill-foreground tabular-nums")}
              >
                {d.count}
              </text>
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

      <p className="mt-1 text-[12px] text-muted-foreground">
        {latest
          ? `Latest: ${latest.title} · ${kindLabel(latest.kind)} · ${latest.uploadedBy}`
          : "Notes, past papers, and assignments appear here on the day they are published."}
      </p>
    </section>
  );
}
