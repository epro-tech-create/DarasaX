"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getModule,
  modules,
  studySessions,
  topics,
} from "@/data/mock";
import {
  formatCountdownParts,
  getMsUntilSchoolOpen,
  getSchoolOpenDate,
} from "@/lib/school";
import { cn } from "@/lib/utils";
import {
  CalendarDays,
  CheckCircle2,
  Circle,
  Clock3,
  Flame,
  Plus,
  Target,
  Timer,
  X,
} from "lucide-react";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function formatSessionDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function localISODate(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function PlannerPage() {
  const today = localISODate();
  const weekEnd = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 6);
    return localISODate(d);
  })();

  const [sessions, setSessions] = useState(studySessions);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    moduleId: modules[0]?.id || "",
    topicId: "",
    title: "",
    date: today,
    durationMinutes: 60,
    goal: "",
  });
  const [msLeft, setMsLeft] = useState(() => getMsUntilSchoolOpen());

  useEffect(() => {
    const id = window.setInterval(() => setMsLeft(getMsUntilSchoolOpen()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const todaysPlan = sessions
    .filter((s) => s.date === today)
    .sort((a, b) => Number(a.completed) - Number(b.completed));
  const thisWeek = sessions
    .filter((s) => s.date > today && s.date <= weekEnd)
    .sort((a, b) => a.date.localeCompare(b.date));
  const completed = sessions.filter((s) => s.completed);
  const todayMinutes = todaysPlan.reduce((sum, s) => sum + s.durationMinutes, 0);
  const weekMinutes = sessions
    .filter((s) => s.date >= today && s.date <= weekEnd)
    .reduce((sum, s) => sum + s.durationMinutes, 0);
  const todayDone = todaysPlan.filter((s) => s.completed).length;

  const moduleTopics = useMemo(
    () => topics.filter((t) => t.moduleId === form.moduleId),
    [form.moduleId],
  );

  const { days, hours, minutes, seconds } = formatCountdownParts(msLeft);
  const openLabel = getSchoolOpenDate().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });

  function toggleComplete(id: string) {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, completed: !s.completed } : s)),
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Study Planner"
        description="Plan focused sessions around your modules and exams."
        actions={
          <Button size="sm" onClick={() => setShowForm((v) => !v)}>
            <Plus className="h-3.5 w-3.5" />
            Add session
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <div className="surface rounded-[14px] p-3">
          <p className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
            <Target className="h-3 w-3 text-primary" />
            Today
          </p>
          <p className="mt-0.5 font-heading text-[15px] font-semibold">
            {todaysPlan.length}
            <span className="ml-1 text-[11px] font-medium text-muted-foreground">
              sessions
            </span>
          </p>
        </div>
        <div className="surface rounded-[14px] p-3">
          <p className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
            <Timer className="h-3 w-3 text-cyan" />
            Focus time
          </p>
          <p className="mt-0.5 font-heading text-[15px] font-semibold">
            {todayMinutes}
            <span className="ml-1 text-[11px] font-medium text-muted-foreground">
              min
            </span>
          </p>
        </div>
        <div className="surface rounded-[14px] p-3">
          <p className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
            <Flame className="h-3 w-3 text-warning" />
            This week
          </p>
          <p className="mt-0.5 font-heading text-[15px] font-semibold">
            {Math.round(weekMinutes / 60)}
            <span className="ml-1 text-[11px] font-medium text-muted-foreground">
              hrs
            </span>
          </p>
        </div>
        <div className="surface rounded-[14px] p-3">
          <p className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
            <CheckCircle2 className="h-3 w-3 text-success" />
            Done today
          </p>
          <p className="mt-0.5 font-heading text-[15px] font-semibold text-success">
            {todayDone}/{todaysPlan.length || 0}
          </p>
        </div>
      </div>

      {showForm ? (
        <form
          className="surface relative overflow-hidden rounded-[16px] p-4"
          onSubmit={(e) => {
            e.preventDefault();
            setSessions((prev) => [
              {
                id: `ss-${Date.now()}`,
                moduleId: form.moduleId,
                topicId: form.topicId || undefined,
                title: form.title || "Study session",
                date: form.date,
                durationMinutes: Number(form.durationMinutes),
                completed: false,
                goal: form.goal || undefined,
              },
              ...prev,
            ]);
            setShowForm(false);
            setForm((f) => ({
              ...f,
              title: "",
              topicId: "",
              goal: "",
              date: today,
            }));
          }}
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <div>
              <p className="text-[13px] font-semibold">New study session</p>
              <p className="text-[11px] text-muted-foreground">
                Block time for a module and set a clear goal.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="focus-ring inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
              aria-label="Close form"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid gap-2.5 sm:grid-cols-2">
            <label className="block space-y-1 text-[11px] font-medium text-muted-foreground">
              Module
              <select
                className="focus-ring h-9 w-full rounded-[10px] border border-border bg-card px-2.5 text-[12px] text-foreground"
                value={form.moduleId}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    moduleId: e.target.value,
                    topicId: "",
                  }))
                }
              >
                {modules.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1 text-[11px] font-medium text-muted-foreground">
              Topic
              <select
                className="focus-ring h-9 w-full rounded-[10px] border border-border bg-card px-2.5 text-[12px] text-foreground"
                value={form.topicId}
                onChange={(e) =>
                  setForm((f) => ({ ...f, topicId: e.target.value }))
                }
              >
                <option value="">Optional</option>
                {moduleTopics.map((t) => (
                  <option key={t.id} value={t.id}>
                    Topic {t.number}: {t.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1 text-[11px] font-medium text-muted-foreground sm:col-span-2">
              Title
              <input
                className="focus-ring h-9 w-full rounded-[10px] border border-border bg-card px-2.5 text-[12px] text-foreground"
                value={form.title}
                onChange={(e) =>
                  setForm((f) => ({ ...f, title: e.target.value }))
                }
                placeholder="Routing Protocols deep dive"
              />
            </label>
            <label className="block space-y-1 text-[11px] font-medium text-muted-foreground">
              Date
              <input
                type="date"
                className="focus-ring h-9 w-full rounded-[10px] border border-border bg-card px-2.5 text-[12px] text-foreground"
                value={form.date}
                onChange={(e) =>
                  setForm((f) => ({ ...f, date: e.target.value }))
                }
              />
            </label>
            <label className="block space-y-1 text-[11px] font-medium text-muted-foreground">
              Duration (min)
              <input
                type="number"
                min={15}
                className="focus-ring h-9 w-full rounded-[10px] border border-border bg-card px-2.5 text-[12px] text-foreground"
                value={form.durationMinutes}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    durationMinutes: Number(e.target.value),
                  }))
                }
              />
            </label>
            <label className="block space-y-1 text-[11px] font-medium text-muted-foreground sm:col-span-2">
              Goal
              <input
                className="focus-ring h-9 w-full rounded-[10px] border border-border bg-card px-2.5 text-[12px] text-foreground"
                value={form.goal}
                onChange={(e) =>
                  setForm((f) => ({ ...f, goal: e.target.value }))
                }
                placeholder="Finish Topic 06 notes"
              />
            </label>
          </div>
          <div className="mt-3 flex gap-2">
            <Button type="submit" size="sm">
              Create session
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
        <section className="space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-heading text-[13px] font-semibold">
              Today&apos;s plan
            </h2>
            <p className="text-[11px] text-muted-foreground">
              {formatSessionDate(today)}
            </p>
          </div>

          {todaysPlan.length === 0 ? (
            <div className="surface rounded-[16px] px-4 py-8 text-center">
              <p className="text-[13px] font-medium">No sessions today</p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Add a focused block to protect your study streak.
              </p>
              <Button
                size="sm"
                className="mt-3"
                onClick={() => setShowForm(true)}
              >
                <Plus className="h-3.5 w-3.5" />
                Add session
              </Button>
            </div>
          ) : (
            todaysPlan.map((session) => {
              const module = getModule(session.moduleId);
              return (
                <div
                  key={session.id}
                  className={cn(
                    "surface group relative overflow-hidden rounded-[16px] p-3.5 transition duration-200",
                    "hover:border-primary hover:shadow-lg hover:shadow-primary/15",
                    session.completed && "opacity-80",
                  )}
                >
                  {module ? (
                    <span
                      aria-hidden
                      className="absolute inset-y-0 left-0 w-1"
                      style={{ backgroundColor: module.accent }}
                    />
                  ) : null}
                  <div className="flex items-start gap-3 pl-1.5">
                    <button
                      type="button"
                      onClick={() => toggleComplete(session.id)}
                      className="mt-0.5 text-muted-foreground transition hover:text-primary"
                      aria-label={
                        session.completed
                          ? "Mark incomplete"
                          : "Mark complete"
                      }
                    >
                      {session.completed ? (
                        <CheckCircle2 className="h-5 w-5 text-success" />
                      ) : (
                        <Circle className="h-5 w-5" />
                      )}
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p
                          className={cn(
                            "text-[13px] font-semibold tracking-tight",
                            session.completed &&
                              "text-muted-foreground line-through",
                          )}
                        >
                          {session.title}
                        </p>
                        {session.completed ? (
                          <Badge tone="success">Done</Badge>
                        ) : null}
                      </div>
                      <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
                        <span>{module?.name}</span>
                        <span className="inline-flex items-center gap-1">
                          <Clock3 className="h-3 w-3" />
                          {session.durationMinutes} min
                        </span>
                      </p>
                      {session.goal ? (
                        <p className="mt-2 rounded-xl bg-muted/70 px-2.5 py-1.5 text-[11px] text-muted-foreground">
                          <span className="font-medium text-foreground/80">
                            Goal:{" "}
                          </span>
                          {session.goal}
                        </p>
                      ) : null}
                    </div>
                    <Button
                      size="sm"
                      variant={session.completed ? "secondary" : "outline"}
                      onClick={() => toggleComplete(session.id)}
                    >
                      {session.completed ? "Undo" : "Complete"}
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </section>

        <aside className="space-y-3">
          <section className="gradient-primary relative overflow-hidden rounded-[18px] p-4 text-white shadow-lg shadow-primary/20">
            <div className="absolute -right-6 -top-8 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
            <div className="relative flex items-center gap-2 text-white/80">
              <CalendarDays className="h-3.5 w-3.5" />
              <p className="text-[11px] font-medium uppercase tracking-[0.12em]">
                School opens
              </p>
            </div>
            <p className="relative mt-2 font-heading text-3xl font-semibold tabular-nums">
              {days}
              <span className="ml-1 text-[12px] font-medium text-white/75">
                days
              </span>
            </p>
            <div className="relative mt-3 grid grid-cols-3 gap-1.5">
              {[
                [hours, "hrs"],
                [minutes, "min"],
                [seconds, "sec"],
              ].map(([value, label]) => (
                <div
                  key={String(label)}
                  className="rounded-xl bg-white/15 px-2 py-1.5 text-center backdrop-blur-sm"
                >
                  <p className="font-heading text-[13px] font-semibold tabular-nums">
                    {pad(Number(value))}
                  </p>
                  <p className="text-[9px] uppercase tracking-wide text-white/70">
                    {label}
                  </p>
                </div>
              ))}
            </div>
            <p className="relative mt-3 text-[11px] text-white/80">
              Target date {openLabel} — protect your study blocks.
            </p>
          </section>

          <section className="surface rounded-[16px] p-3.5">
            <h2 className="mb-2.5 font-heading text-[13px] font-semibold">
              Coming up
            </h2>
            {thisWeek.length === 0 ? (
              <p className="text-[11px] text-muted-foreground">
                Nothing scheduled for the rest of the week.
              </p>
            ) : (
              <div className="space-y-2">
                {thisWeek.map((session) => {
                  const module = getModule(session.moduleId);
                  return (
                    <div
                      key={session.id}
                      className="flex items-center gap-2.5 rounded-xl bg-muted/50 px-2.5 py-2"
                    >
                      <span
                        className="h-8 w-1 shrink-0 rounded-full"
                        style={{
                          backgroundColor: module?.accent || "#1E88E5",
                        }}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[12px] font-medium">
                          {session.title}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {formatSessionDate(session.date)} ·{" "}
                          {session.durationMinutes} min
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </aside>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section>
          <h2 className="mb-2.5 font-heading text-[13px] font-semibold">
            Module progress
          </h2>
          <div className="space-y-2">
            {modules.slice(0, 5).map((module) => (
              <div
                key={module.id}
                className="surface rounded-[14px] p-3 transition hover:border-primary/40"
              >
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <p className="truncate text-[12px] font-medium">
                    {module.name}
                  </p>
                  <span
                    className="text-[11px] font-semibold tabular-nums"
                    style={{ color: module.accent }}
                  >
                    {module.progress}%
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${module.progress}%`,
                      backgroundColor: module.accent,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-2.5 font-heading text-[13px] font-semibold">
            Completed sessions
          </h2>
          {completed.length === 0 ? (
            <div className="surface rounded-[14px] px-4 py-6 text-center text-[11px] text-muted-foreground">
              Finish a session to build your streak.
            </div>
          ) : (
            <div className="space-y-2">
              {completed.map((session) => {
                const module = getModule(session.moduleId);
                return (
                  <div
                    key={session.id}
                    className="flex items-center justify-between gap-3 rounded-[14px] bg-muted/50 px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[12px] font-medium">
                        {session.title}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {module?.name} · {formatSessionDate(session.date)}
                      </p>
                    </div>
                    <Badge tone="success">Done</Badge>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
