"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { modules } from "@/data/mock";
import { useMaterialsStore } from "@/lib/materials-store";
import { enrichModules } from "@/lib/module-stats";
import { useTopicProgress } from "@/lib/topic-progress-store";

const RADIUS = 34;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function SemesterProgress() {
  const { published } = useMaterialsStore();
  const { topics } = useTopicProgress();

  const { pct, done, total, top } = useMemo(() => {
    const enriched = enrichModules(modules, published, topics);
    const doneCount = enriched.reduce((s, m) => s + m.topicsCompleted, 0);
    const totalCount = enriched.reduce((s, m) => s + m.topicsTotal, 0);
    return {
      pct: totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0,
      done: doneCount,
      total: totalCount,
      top: [...enriched].sort((a, b) => b.progress - a.progress).slice(0, 3),
    };
  }, [published, topics]);

  return (
    <section className="surface flex h-full flex-col rounded-[20px] p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-heading text-[15px] font-semibold tracking-tight">
            Semester progress
          </h2>
          <p className="mt-0.5 text-[12px] text-muted-foreground">
            {total > 0
              ? `${done} of ${total} topics complete`
              : "Topics appear once staff publish them"}
          </p>
        </div>
        <Button variant="ghost" size="sm" href="/modules">
          Modules
        </Button>
      </div>

      <div className="mt-4 flex items-center gap-4">
        <div className="relative h-[88px] w-[88px] shrink-0">
          <svg viewBox="0 0 88 88" className="h-full w-full -rotate-90">
            <circle
              cx="44"
              cy="44"
              r={RADIUS}
              fill="none"
              strokeWidth="9"
              className="stroke-muted"
            />
            <circle
              cx="44"
              cy="44"
              r={RADIUS}
              fill="none"
              strokeWidth="9"
              strokeLinecap="round"
              className="stroke-primary transition-all"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={CIRCUMFERENCE - (CIRCUMFERENCE * pct) / 100}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center font-heading text-base font-semibold tabular-nums">
            {pct}%
          </span>
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          {top.map((m) => (
            <div key={m.id} className="min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="flex min-w-0 items-center gap-1.5 truncate text-[12px] font-medium">
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: m.accent }}
                  />
                  <span className="truncate">{m.name}</span>
                </p>
                <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
                  {m.progress}%
                </span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${m.progress}%`,
                    backgroundColor: m.accent,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
