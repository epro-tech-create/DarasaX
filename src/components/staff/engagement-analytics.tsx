"use client";

import { useCallback, useEffect, useId, useState } from "react";
import { Download, Eye, FileUp, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useMaterialsStore } from "@/lib/materials-store";
import { StaffSection, StaffStatCard } from "@/components/staff/staff-ui";
import { Button } from "@/components/ui/button";

type Day = { date: string; active: number; opens: number };
type Summary = { days: Day[]; activeStudents: number; uniqueViewers: number };
const W = 700,
  H = 240,
  LEFT = 36,
  RIGHT = 12,
  TOP = 16,
  BOTTOM = 32;
function curve(values: number[], ceiling: number) {
  const x = (i: number) => LEFT + (i * (W - LEFT - RIGHT)) / 6;
  const y = (n: number) => TOP + (1 - n / ceiling) * (H - TOP - BOTTOM);
  return values.reduce((path, n, i) => {
    if (!i) return `M${x(i)},${y(n)}`;
    const mid = (x(i - 1) + x(i)) / 2;
    return `${path} C${mid},${y(values[i - 1])} ${mid},${y(n)} ${x(i)},${y(n)}`;
  }, "");
}
const dateLabel = (date: string) =>
  new Date(`${date}T12:00:00`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });

export function EngagementAnalytics() {
  const { items: materials, ready: materialsReady } = useMaterialsStore();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState(false);
  const [metric, setMetric] = useState<"active" | "opens">("active");
  const [selected, setSelected] = useState<number | null>(null);
  const fillId = useId();
  const refresh = useCallback(async () => {
    const { data, error } = await createClient().rpc("engagement_summary");
    if (error || !data) {
      setError(true);
      return;
    }
    setSummary(data as unknown as Summary);
    setError(false);
  }, []);
  useEffect(() => {
    const timer = setTimeout(() => void refresh(), 0);
    const onFocus = () => void refresh();
    window.addEventListener("focus", onFocus);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("focus", onFocus);
    };
  }, [refresh]);
  const current = summary?.days.slice(7) ?? [];
  const previous = summary?.days.slice(0, 7) ?? [];
  const max = Math.max(
    4,
    ...current.map((d) => d[metric]),
    ...previous.map((d) => d[metric]),
  );
  const ceiling = Math.ceil(max / 4) * 4;
  const values = current.map((d) => d[metric]);
  const line = curve(values, ceiling);
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
          label="Active students · 7 days"
          value={stat(summary?.activeStudents)}
          icon={Users}
        />
        <StaffStatCard
          label="Material opens · 7 days"
          value={stat(current.reduce((sum, d) => sum + d.opens, 0))}
          hint={summary ? `${summary.uniqueViewers} unique viewers` : undefined}
          icon={Eye}
        />
        <StaffStatCard
          label="Downloads · all time"
          value={
            materialsReady
              ? String(materials.reduce((sum, m) => sum + m.downloads, 0))
              : "—"
          }
          icon={Download}
        />
        <StaffStatCard
          label="Uploads · all time"
          value={materialsReady ? String(materials.length) : "—"}
          icon={FileUp}
        />
      </div>
      <StaffSection
        title="Student engagement"
        description="Last 7 days compared with the previous 7 · Tanzania time"
      >
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div
            className="flex gap-1 rounded-xl bg-muted/50 p-1"
            role="group"
            aria-label="Chart metric"
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
                {label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-success" />
              This period
            </span>
            <span className="flex items-center gap-2">
              <span className="w-4 border-t-2 border-dashed border-muted-foreground" />
              Previous period
            </span>
          </div>
        </div>
        {error ? (
          <div role="alert" className="py-10 text-center">
            <p className="mb-3 text-sm text-muted-foreground">
              Could not load engagement data.
            </p>
            <Button size="sm" variant="outline" onClick={() => void refresh()}>
              Try again
            </Button>
          </div>
        ) : !summary ? (
          <p
            role="status"
            className="py-16 text-center text-sm text-muted-foreground"
          >
            Loading activity…
          </p>
        ) : (
          <>
            <div className="relative">
              <svg
                viewBox={`0 0 ${W} ${H}`}
                className="h-auto min-h-40 w-full"
                role="img"
                aria-label={`${metric === "active" ? "Daily active students" : "Daily material opens"} over the last 7 days compared with the previous week`}
                onPointerMove={(event) => {
                  const box = event.currentTarget.getBoundingClientRect();
                  const local = ((event.clientX - box.left) / box.width) * W;
                  setSelected(
                    Math.max(
                      0,
                      Math.min(
                        6,
                        Math.round(((local - LEFT) / (W - LEFT - RIGHT)) * 6),
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
                      stopColor="var(--success)"
                      stopOpacity="0.22"
                    />
                    <stop
                      offset="100%"
                      stopColor="var(--success)"
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
                      {(ceiling * (4 - i)) / 4}
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
                  stroke="var(--success)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                {current.map((d, i) => (
                  <text
                    key={d.date}
                    x={LEFT + (i * (W - LEFT - RIGHT)) / 6}
                    y={H - 8}
                    fontSize="11"
                    textAnchor={i === 0 ? "start" : i === 6 ? "end" : "middle"}
                    fill="var(--muted-foreground)"
                  >
                    {dateLabel(d.date)}
                  </text>
                ))}
                {selected !== null && (
                  <line
                    x1={LEFT + (selected * (W - LEFT - RIGHT)) / 6}
                    x2={LEFT + (selected * (W - LEFT - RIGHT)) / 6}
                    y1={TOP}
                    y2={baseline}
                    stroke="var(--muted-foreground)"
                    strokeDasharray="3 4"
                  />
                )}
              </svg>
              {shown && selected !== null && (
                <div className="pointer-events-none absolute left-10 top-3 rounded-xl border border-border bg-card px-3 py-2 text-xs shadow-lg">
                  <p className="font-semibold">{dateLabel(shown.date)}</p>
                  <p className="mt-1">This period: {shown[metric]}</p>
                  <p className="text-muted-foreground">
                    Previous ({dateLabel(previous[selected].date)}):{" "}
                    {previous[selected][metric]}
                  </p>
                </div>
              )}
            </div>
            <div
              className="mt-2 flex justify-between gap-1"
              role="group"
              aria-label="Inspect daily values"
            >
              {current.map((d, i) => (
                <button
                  key={d.date}
                  onFocus={() => setSelected(i)}
                  onBlur={() => setSelected(null)}
                  onClick={() => setSelected(i)}
                  aria-label={`${dateLabel(d.date)}: ${d[metric]}, previous period ${previous[i][metric]}`}
                  className="focus-ring min-h-11 flex-1 rounded-lg text-[11px] text-muted-foreground hover:bg-muted/50"
                >
                  {d[metric]}
                </button>
              ))}
            </div>
            {currentTotal === 0 && (
              <p className="mt-3 text-sm text-muted-foreground">
                No activity recorded in this period. Tracking starts with this update; past activity is not estimated.
              </p>
            )}
          </>
        )}
        <p className="mt-4 border-t border-border pt-3 text-xs leading-relaxed text-muted-foreground">
          Active students counts each student once per day. Material opens
          counts requests to preview available files, with repeat clicks within 30 seconds
          ignored. Staff activity is excluded.
        </p>
      </StaffSection>
      <StaffSection title="Top materials">
        <div className="space-y-2">
          {materials.length === 0 && (
            <p className="py-4 text-sm text-muted-foreground">
              No materials yet.
            </p>
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
                  {m.downloads} downloads
                </span>
              </div>
            ))}
        </div>
      </StaffSection>
    </div>
  );
}
