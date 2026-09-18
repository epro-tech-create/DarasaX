"use client";

import {
  Check,
  CircleUserRound,
  MailCheck,
  Sparkles,
  UserRoundPen,
} from "lucide-react";
import { cn } from "@/lib/utils";

const JOURNEY = [
  { id: "account", label: "Account", icon: CircleUserRound },
  { id: "verify", label: "Verify", icon: MailCheck },
  { id: "profile", label: "Profile", icon: UserRoundPen },
  { id: "ready", label: "Ready", icon: Sparkles },
] as const;

export type AuthJourneyStep = (typeof JOURNEY)[number]["id"];

export function AuthSteps({
  current,
  className,
}: {
  current: AuthJourneyStep;
  className?: string;
}) {
  const index = JOURNEY.findIndex((s) => s.id === current);

  return (
    <nav aria-label="Sign up progress" className={cn("mb-3", className)}>
      <ol className="grid grid-cols-4 gap-1">
        {JOURNEY.map((step, i) => {
          const Icon = step.icon;
          const done = i < index;
          const active = i === index;
          return (
            <li key={step.id} className="flex flex-col items-center gap-1 text-center">
              <div
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full border transition duration-200",
                  active &&
                    "border-primary btn-gradient shadow-[0_0_12px_rgba(30,136,229,0.3)]",
                  done && !active && "border-primary/50 bg-primary/15 text-primary",
                  !done && !active && "border-border bg-card text-muted-foreground",
                )}
              >
                {done && !active ? (
                  <Check className="h-3 w-3" strokeWidth={2.5} />
                ) : (
                  <Icon className="h-3 w-3" />
                )}
              </div>
              <span
                className={cn(
                  "text-[9px] font-medium tracking-wide",
                  active
                    ? "text-primary"
                    : done
                      ? "text-foreground/70"
                      : "text-muted-foreground",
                )}
              >
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
