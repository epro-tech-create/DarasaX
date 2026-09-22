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
            size === "lg"
              ? "text-xl sm:text-2xl"
              : "text-[15px] sm:text-base",
          )}
        >
          {title}
        </h1>
        {description ? (
          <p
            className={cn(
              "max-w-2xl text-muted-foreground",
              size === "lg"
                ? "mt-1 text-[12px] sm:text-[13px]"
                : "mt-0.5 text-[11px] sm:text-[12px]",
            )}
          >
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
          {actions}
        </div>
      ) : null}
    </div>
  );
}
