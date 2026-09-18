"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getModule, missedSummary } from "@/data/mock";
import { CalendarDays, Sparkles } from "lucide-react";

export default function MissedPage() {
  const [date, setDate] = useState(missedSummary.date);

  return (
    <div>
      <PageHeader
        title="What Did I Miss?"
        description="Catch up on everything that happened while you were away."
      />

      <div className="surface mb-6 flex flex-col gap-4 rounded-[24px] p-5 sm:flex-row sm:items-end sm:justify-between">
        <label className="text-sm font-medium">
          Select a date
          <div className="relative mt-2">
            <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="focus-ring h-11 rounded-[12px] border border-border bg-background pl-10 pr-3"
            />
          </div>
        </label>
        <p className="font-heading text-lg font-semibold">
          You missed {missedSummary.classesMissed} classes.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {missedSummary.items.map((item) => {
          const module = getModule(item.moduleId);
          return (
            <article
              key={item.moduleId}
              className="surface overflow-hidden rounded-[24px]"
            >
              <div
                className="px-5 py-4 text-white"
                style={{ backgroundColor: module?.accent }}
              >
                <h2 className="font-heading text-base font-semibold">{module?.name}</h2>
              </div>
              <div className="space-y-3 p-5">
                {item.topic ? (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Topic covered
                    </p>
                    <p className="mt-1 font-medium">{item.topic}</p>
                  </div>
                ) : null}
                {item.newNotes ? (
                  <div className="flex items-center gap-2">
                    <Badge tone="cyan">{item.newNotes} notes</Badge>
                    <span className="text-sm text-muted-foreground">
                      New materials uploaded
                    </span>
                  </div>
                ) : null}
                {item.assignment ? (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Assignment
                    </p>
                    <p className="mt-1 font-medium">{item.assignment}</p>
                  </div>
                ) : null}
                {item.deadline ? (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Deadline
                    </p>
                    <p className="mt-1 font-medium">{item.deadline}</p>
                  </div>
                ) : null}
                {item.announcement ? (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Announcement
                    </p>
                    <p className="mt-1 font-medium">{item.announcement}</p>
                  </div>
                ) : null}
                <Button href={`/modules/${item.moduleId}`} className="mt-2">
                  Open module
                </Button>
              </div>
            </article>
          );
        })}
      </div>

      <div className="mt-8 rounded-[24px] bg-gradient-to-br from-primary to-cyan p-6 text-white sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-heading text-xl font-semibold">Catch Me Up</h2>
            <p className="mt-2 max-w-xl text-white/85">
              Ask DarasaX to summarize the missed topics, highlight deadlines, and
              build a short recovery plan.
            </p>
          </div>
          <Button
            href="/ask?intent=catch-up"
            className="bg-none bg-white text-primary hover:bg-white/90"
          >
            <Sparkles className="h-4 w-4" />
            Catch Me Up
          </Button>
        </div>
      </div>
    </div>
  );
}
