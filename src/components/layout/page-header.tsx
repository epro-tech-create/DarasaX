"use client";
import { useTranslate } from "@/components/providers/language-provider";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  actions,
  className,
  size = "md",
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
  size?: "md" | "lg";
}) {
  const translateUI = useTranslate();
  return (
    <div
      className={cn(
        "mb-4 flex flex-col gap-3 sm:mb-5 sm:flex-row sm:items-start sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0 flex-1">
        <h1
          className={cn(
            "font-heading font-semibold tracking-tight",
            size === "lg" ? "text-xl" : "text-[15px]",
          )}
        >
          {translateUI(title)}
        </h1>
        {description ? (
          <p
            className={cn(
              "max-w-2xl text-muted-foreground",
              size === "lg"
                ? "mt-1 text-[12px] sm:text-[13px]"
                : "mt-0.5 text-xs sm:text-[13px]",
            )}
          >
            {translateUI(description)}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
          {translateUI(actions)}
        </div>
      ) : null}
    </div>
  );
}
