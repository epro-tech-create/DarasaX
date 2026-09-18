"use client";

import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function HorizontalStepper({
  steps,
  current,
}: {
  steps: string[];
  current: number;
}) {
  return (
    <div className="rounded-[18px] border border-border bg-card px-3 py-4 shadow-soft sm:px-5">
      <ol className="flex items-start justify-between gap-1">
        {steps.map((label, index) => {
          const done = index < current;
          const active = index === current;
          const upcoming = index > current;

          return (
            <li
              key={label}
              className="relative flex flex-1 flex-col items-center text-center"
            >
              {index < steps.length - 1 ? (
                <span
                  aria-hidden
                  className={cn(
                    "absolute left-[calc(50%+14px)] right-[calc(-50%+14px)] top-3.5 h-0.5",
                    index < current ? "bg-primary" : "bg-border",
                  )}
                />
              ) : null}

              <div className="relative z-10 flex flex-col items-center">
                {active ? (
                  <ChevronDown
                    className="absolute -top-3.5 h-3 w-3 text-muted-foreground"
                    aria-hidden
                  />
                ) : null}

                <span
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition duration-200",
                    (done || active) && "btn-gradient",
                    upcoming &&
                      "border-2 border-border bg-card text-muted-foreground",
                  )}
                >
                  {done ? <Check className="h-3.5 w-3.5" strokeWidth={2.75} /> : index + 1}
                </span>

                <span
                  className={cn(
                    "mt-1.5 max-w-[4.5rem] text-[9px] font-medium leading-tight sm:max-w-none sm:text-[11px]",
                    active || done ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {label}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
