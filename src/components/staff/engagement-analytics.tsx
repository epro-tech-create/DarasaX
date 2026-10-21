"use client";

import { useTranslate } from "@/components/providers/language-provider";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Download, Eye, FileUp, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useMaterialsStore } from "@/lib/materials-store";
import { StaffSection, StaffStatCard } from "@/components/staff/staff-ui";
import { Button } from "@/components/ui/button";

type Day = { date: string; active: number; opens: number };
type Summary = { days: Day[]; activeStudents: number; uniqueViewers: number };
const H = 240,
  LEFT = 36,
  RIGHT = 12,
  TOP = 16,
  BOTTOM = 32;
function curve(values: number[], ceiling: number, W: number) {
  const x = (i: number) => LEFT + (i * (W - LEFT - RIGHT)) / Math.max(1, values.length - 1);
  const y = (n: number) => TOP + (1 - n / ceiling) * (H - TOP - BOTTOM);
  return values.reduce((path, n, i) => {
    if (!i) return `M${x(i)},${y(n)}`;
    const mid = (x(i - 1) + x(i)) / 2;
    return `${path} C${mid},${y(values[i - 1])} ${mid},${y(n)} ${x(i)},${y(n)}`;
  }, "");
}
const dateLabel = (date: string, locale: string) =>
  new Date(`${date}T12:00:00`).toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
  });

export function EngagementAnalytics() {
  const translateUI = useTranslate();
  const { items: materials, ready: materialsReady } = useMaterialsStore();
  const [period, setPeriod] = useState<7 | 30>(7);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState(false);
  const [metric, setMetric] = useState<"active" | "opens">("active");
  const [selected, setSelected] = useState<number | null>(null);
  const fillId = useId();
  const chartReady = summary !== null;
  const chartRef = useRef<HTMLDivElement>(null);
  const [W, setWidth] = useState(700);
  useEffect(() => {
    const container = chartRef.current;
    if (!container) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(280, entry.contentRect.width)));
    observer.observe(container);
    return () => observer.disconnect();
  }, [chartReady]);
  const requestId = useRef(0);
  const refresh = useCallback(async () => {
    const request = ++requestId.current;
    const { data, error } = await createClient().rpc("engagement_summary", { period_days: period });
    if (request !== requestId.current) return;
    if (error || !data) {
      setError(true);
      return;
    }
    setSummary(data as unknown as Summary);
    setError(false);
  }, [period]);
  useEffect(() => {
    const timer = setTimeout(() => void refresh(), 0);
    const onFocus = () => void refresh();
    window.addEventListener("focus", onFocus);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("focus", onFocus);
    };
  }, [refresh]);
  const current = summary?.days.slice(period) ?? [];
  const previous = summary?.days.slice(0, period) ?? [];
  const max = Math.max(
    4,
    ...current.map((d) => d[metric]),
    ...previous.map((d) => d[metric]),
  );
  const ceiling = Math.ceil(max / 4) * 4;
  const values = current.map((d) => d[metric]);
  const line = curve(values, ceiling, W);
  const baseline = H - BOTTOM;
  const currentTotal =
    metric === "active"
      ? summary?.activeStudents
      : current.reduce((sum, d) => sum + d.opens, 0);
  const shown = selected === null ? null : current[selected];
  const stat = (value: number | undefined) =>
    summary ? String(value ?? 0) : "—";

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StaffStatCard
          label={translateUI("Active students · 7 days")}
          value={stat(summary?.activeStudents)}
          icon={Users}
        />
        <StaffStatCard
          label={translateUI("Material opens · 7 days")}
          value={stat(current.reduce((sum, d) => sum + d.opens, 0))}
          hint={translateUI(summary ? `${summary.uniqueViewers} unique viewers` : undefined)}
          icon={Eye}
        />
        <StaffStatCard
          label={translateUI("Downloads · all time")}
          value={
            materialsReady
              ? String(materials.reduce((sum, m) => sum + m.downloads, 0))
              : "—"
          }
          icon={Download}
        />
        <StaffStatCard
          label={translateUI("Uploads · all time")}
          value={materialsReady ? String(materials.length) : "—"}
          icon={FileUp}
        />
      </div>
      <StaffSection
        title={translateUI("Student engagement")}
        description={translateUI("Last 7 days compared with the previous 7 · Tanzania time")}
      >
        <label className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">{translateUI("Period")}<select aria-label={translateUI("Engagement period")} value={period} onChange={e => { requestId.current++; setPeriod(Number(e.target.value) as 7 | 30); setSummary(null); setSelected(null); }} className="focus-ring rounded-lg border border-border bg-card px-3 py-2 text-foreground"><option value={7}>{translateUI("Last 7 days")}</option><option value={30}>{translateUI("Last 30 days")}</option></select></label>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div
            className="flex gap-1 rounded-xl bg-muted/50 p-1"
            role="group"
            aria-label={translateUI("Chart metric")}
          >
            {(
              [
                ["active", "Active students"],
                ["opens", "Material opens"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                onClick={() => {
                  setMetric(key);
                  setSelected(null);
                }}
                aria-pressed={metric === key}
                className={`focus-ring rounded-lg px-3 py-2 text-xs font-medium transition ${metric === key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
              >
                {translateUI(label)}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary" />
              {translateUI("This period")}</span>
            <span className="flex items-center gap-2">
              <span className="w-4 border-t-2 border-dashed border-muted-foreground" />
              {translateUI("Previous period")}</span>
          </div>
        </div>
        {error ? (
          <div role="alert" className="py-10 text-center">
            <p className="mb-3 text-sm text-muted-foreground">
              {translateUI("Could not load engagement data.")}</p>
            <Button size="sm" variant="outline" onClick={() => void refresh()}>
              {translateUI("Try again")}</Button>
          </div>
        ) : !summary ? (
          <p
            role="status"
            className="py-16 text-center text-sm text-muted-foreground"
          >
            {translateUI("Loading activity…")}</p>
        ) : (
          <>
            <div className="relative" ref={chartRef}>
              <svg
                viewBox={`0 0 ${W} ${H}`}
                className="h-[200px] w-full sm:h-[240px] lg:h-[260px]"
                preserveAspectRatio="none"
                role="img"
                aria-label={translateUI(`${metric === "active" ? "Daily active students" : "Daily material opens"} over the last ${period} days compared with the previous period`)}
                onPointerMove={(event) => {
                  const box = event.currentTarget.getBoundingClientRect();
                  const local = ((event.clientX - box.left) / box.width) * W;
                  setSelected(
                    Math.max(
                      0,
                      Math.min(
                        period - 1,
                        Math.round(((local - LEFT) / (W - LEFT - RIGHT)) * (period - 1)),
                      ),
                    ),
                  );
                }}
                onPointerLeave={() => setSelected(null)}
              >
                <defs>
                  <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0%"
                      stopColor="var(--primary)"
                      stopOpacity="0.22"
                    />
                    <stop
                      offset="100%"
                      stopColor="var(--primary)"
                      stopOpacity="0.02"
                    />
                  </linearGradient>
                </defs>
                {[0, 1, 2, 3, 4].map((i) => (
                  <g key={i}>
                    <line
                      x1={LEFT}
                      x2={W - RIGHT}
                      y1={TOP + (i * (H - TOP - BOTTOM)) / 4}
                      y2={TOP + (i * (H - TOP - BOTTOM)) / 4}
                      stroke="var(--border)"
                    />
                    <text
                      x={LEFT - 8}
                      y={TOP + (i * (H - TOP - BOTTOM)) / 4 + 4}
                      textAnchor="end"
                      fill="var(--muted-foreground)"
                      fontSize="11"
                    >
                      {translateUI((ceiling * (4 - i)) / 4)}
                    </text>
                  </g>
                ))}
                <path
                  d={`${line} L${W - RIGHT},${baseline} L${LEFT},${baseline} Z`}
                  fill={`url(#${fillId})`}
                />
                <path
                  d={curve(
                    previous.map((d) => d[metric]),
                    ceiling,
                    W,
                  )}
                  fill="none"
                  stroke="var(--muted-foreground)"
                  strokeOpacity="0.7"
                  strokeWidth="2"
                  strokeDasharray="6 6"
                />
                <path
                  d={line}
                  fill="none"
                  stroke="var(--primary)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                {current.map((d, i) => (
                  ((period === 7 ? W > 500 || i % 3 === 0 : i % (W > 500 ? 5 : 10) === 0) || i === period - 1) && <text
                    key={d.date}
                    x={LEFT + (i * (W - LEFT - RIGHT)) / (period - 1)}
                    y={H - 8}
                    fontSize="11"
                    textAnchor={i === 0 ? "start" : i === period - 1 ? "end" : "middle"}
                    fill="var(--muted-foreground)"
                  >
                    {translateUI(dateLabel(d.date, translateUI.locale))}
                  </text>
                ))}
                {selected !== null && (
                  <line
                    x1={LEFT + (selected * (W - LEFT - RIGHT)) / (period - 1)}
                    x2={LEFT + (selected * (W - LEFT - RIGHT)) / (period - 1)}
                    y1={TOP}
                    y2={baseline}
                    stroke="var(--muted-foreground)"
                    strokeDasharray="3 4"
                  />
                )}
              </svg>
              {shown && selected !== null && (
                <div className="pointer-events-none absolute left-10 top-3 rounded-xl border border-border bg-card px-3 py-2 text-xs shadow-lg">
                  <p className="font-semibold">{translateUI(dateLabel(shown.date, translateUI.locale))}</p>
                  <p className="mt-1">{translateUI("This period: ")}{translateUI(shown[metric])}</p>
                  <p className="text-muted-foreground">
                    {translateUI("Previous (")}{translateUI(dateLabel(previous[selected].date, translateUI.locale))}):{" "}
                    {translateUI(previous[selected][metric])}
                  </p>
                </div>
              )}
            </div>
            <div
              className="mt-2 flex justify-between gap-1 overflow-x-auto"
              role="group"
              aria-label={translateUI("Inspect daily values")}
            >
              {current.map((d, i) => (
                <button
                  key={d.date}
                  onFocus={() => setSelected(i)}
                  onBlur={() => setSelected(null)}
                  onClick={() => setSelected(i)}
                  aria-label={translateUI(`${dateLabel(d.date, translateUI.locale)}: ${d[metric]}, previous period ${previous[i][metric]}`)}
                  className="focus-ring min-h-9 min-w-6 flex-1 rounded-lg text-[11px] text-muted-foreground hover:bg-muted/50"
                >
                  {translateUI(d[metric])}
                </button>
              ))}
            </div>
            {currentTotal === 0 && (
              <p className="mt-3 text-sm text-muted-foreground">
                {translateUI("No activity recorded in this period. Tracking starts with this update; past activity is not estimated.")}</p>
            )}
          </>
        )}
        <p className="mt-4 border-t border-border pt-3 text-xs leading-relaxed text-muted-foreground">
          {translateUI("Active students counts each student once per day. Material opens counts requests to preview available files, with repeat clicks within 30 seconds ignored. Staff activity is excluded.")}</p>
      </StaffSection>
      <StaffSection title={translateUI("Top materials")}>
        <div className="space-y-2">
          {materials.length === 0 && (
            <p className="py-4 text-sm text-muted-foreground">
              {translateUI("No materials yet.")}</p>
          )}
          {[...materials]
            .sort((a, b) => b.downloads - a.downloads)
            .slice(0, 5)
            .map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between gap-3 rounded-xl bg-muted/30 px-3 py-3"
              >
                <p className="truncate text-sm font-medium">{m.title}</p>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {translateUI(m.downloads)} {translateUI(" downloads")}</span>
              </div>
            ))}
        </div>
      </StaffSection>
    </div>
  );
}
