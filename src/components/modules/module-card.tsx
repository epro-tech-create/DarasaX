"use client";
import { useTranslate } from "@/components/providers/language-provider";
import Link from "next/link";
import {
  AudioWaveform,
  Binary,
  Calculator,
  ChevronRight,
  CircuitBoard,
  Code2,
  Cpu,
  Database,
  Globe,
  Monitor,
  Network,
  Shield,
  type LucideIcon,
} from "lucide-react";
import type { Module } from "@/types";
import { cn } from "@/lib/utils";

const iconMap: Record<string, LucideIcon> = {
  Network,
  Database,
  Cpu,
  CircuitBoard,
  Monitor,
  Code2,
  Shield,
  Globe,
  Binary,
  Calculator,
  AudioWaveform,
};

export function ModuleCard({
  module,
  className,
  compact = false,
}: {
  module: Module;
  className?: string;
  compact?: boolean;
}) {
  const translateUI = useTranslate();
  const Icon = iconMap[module.icon] || BookFallback;

  if (compact) {
    return (
      <Link
        href={`/modules/${module.id}`}
        className={cn(
          "surface group grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 rounded-[16px] p-3.5 transition duration-200",
          "hover:border-primary/30 hover:shadow-md hover:shadow-primary/10 sm:grid-cols-[auto_minmax(0,1fr)_auto_auto] sm:gap-4 sm:p-4",
          className,
        )}
      >
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white sm:h-12 sm:w-12 sm:rounded-2xl"
          style={{ backgroundColor: module.accent }}
        >
          <Icon className="h-5 w-5" />
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-muted-foreground">
              {translateUI(module.code)}
            </span>
            {module.credits ? (
              <span className="text-[10px] text-muted-foreground">
                {translateUI(module.credits)} {translateUI(" cr")}</span>
            ) : null}
            <span className="text-[10px] text-muted-foreground">
              {translateUI("Sem ")}{translateUI(module.semester)}
            </span>
          </div>
          <h3 className="mt-1 truncate font-heading text-[14px] font-semibold tracking-tight group-hover:text-primary sm:text-[15px]">
            {module.name}
          </h3>
          <div className="mt-2 flex items-center gap-2">
            <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-muted sm:max-w-[180px]">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${module.progress}%`,
                  backgroundColor: module.accent,
                }}
              />
            </div>
            <span
              className="shrink-0 text-[11px] font-medium tabular-nums"
              style={{ color: module.accent }}
            >
              {translateUI(module.progress)}%
            </span>
          </div>
          <p className="mt-1.5 text-[11px] text-muted-foreground sm:hidden">
            {translateUI(module.lecturer)} · {translateUI(module.notesCount)} {translateUI(" notes ·")}{" "}
            {translateUI(module.topicsCompleted)}/{translateUI(module.topicsTotal)} {translateUI(" topics")}</p>
        </div>

        <div className="hidden min-w-[140px] text-right sm:block">
          <p className="truncate text-[13px] font-medium text-foreground/90">
            {translateUI(module.lecturer)}
          </p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {translateUI(module.notesCount)} {translateUI(" notes · ")}{translateUI(module.topicsCompleted)}/
            {translateUI(module.topicsTotal)} {translateUI(" topics")}</p>
        </div>

        <ChevronRight className="hidden h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary sm:block" />
      </Link>
    );
  }

  return (
    <Link
      href={`/modules/${module.id}`}
      className={cn(
        "surface group block rounded-[20px] p-5 transition duration-200 hover:-translate-y-0.5 hover:border-primary/25",
        className,
      )}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div
          className="flex h-11 w-11 items-center justify-center rounded-2xl text-white"
          style={{ backgroundColor: module.accent }}
        >
          <Icon className="h-5 w-5" />
        </div>
        <span className="text-xs font-medium text-muted-foreground">
          {translateUI(module.code)}
          {translateUI(module.credits ? ` · ${module.credits} cr` : "")}
        </span>
      </div>
      <h3 className="font-heading text-lg font-semibold tracking-tight group-hover:text-primary">
        {module.name}
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">{translateUI(module.lecturer)}</p>
      <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
        <span>{translateUI(module.notesCount)} {translateUI(" Notes")}</span>
        <span>
          {translateUI(module.topicsCompleted)}/{translateUI(module.topicsTotal)} {translateUI(" topics")}</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${module.progress}%`,
            backgroundColor: module.accent,
          }}
        />
      </div>
      <p className="mt-2 text-xs font-medium" style={{ color: module.accent }}>
        {translateUI(module.progress)}{translateUI("% progress")}</p>
    </Link>
  );
}

function BookFallback({ className }: { className?: string }) {
  return <Network className={className} />;
}
