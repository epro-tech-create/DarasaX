import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export function StaffStatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "primary",
}: {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  tone?: "primary" | "success" | "warning" | "danger";
}) {
  const tones = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/15 text-success",
    warning: "bg-warning/15 text-warning",
    danger: "bg-danger/15 text-danger",
  };

  return (
    <div className="surface relative overflow-hidden rounded-2xl p-4 transition duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/10">
      <div className="pointer-events-none absolute -right-4 -top-6 h-20 w-20 rounded-full bg-primary/10 blur-2xl" />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-medium text-muted-foreground">
            {label}
          </p>
          <p className="mt-1 truncate font-heading text-[22px] font-semibold leading-none tracking-tight">
            {value}
          </p>
          {hint ? (
            <p className="mt-1.5 truncate text-[11px] text-muted-foreground">{hint}</p>
          ) : null}
        </div>
        <span
          className={cn(
            "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
            tones[tone],
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
      </div>
    </div>
  );
}

export function StaffSection({
  title,
  description,
  action,
  children,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("surface overflow-hidden rounded-[20px]", className)}>
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border/70 px-4 py-3.5 sm:px-5">
        <div className="min-w-0 flex-1">
          <h2 className="font-heading text-[14px] font-semibold tracking-tight">{title}</h2>
          {description ? (
            <p className="mt-1 max-w-xl text-[11px] leading-snug text-muted-foreground sm:text-[12px]">
              {description}
            </p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}
