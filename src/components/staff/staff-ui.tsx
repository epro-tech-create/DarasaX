import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export function StaffStatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "primary",
  href,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  tone?: "primary" | "success" | "warning" | "danger";
  href?: string;
}) {
  const tones = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/15 text-success",
    warning: "bg-warning/15 text-warning",
    danger: "bg-danger/15 text-danger",
  };

  const content = (
    <div className="surface relative overflow-hidden rounded-2xl p-4 transition duration-200 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10 motion-safe:hover:-translate-y-0.5 sm:p-5">
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground">
            {label}
          </p>
          <p className="mt-2 truncate font-heading text-2xl font-semibold leading-none tracking-tight">
            {value}
          </p>
          {hint ? (
            <p className="mt-1.5 truncate text-xs text-muted-foreground">{hint}</p>
          ) : null}
        </div>
        <span
          className={cn(
            "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl",
            tones[tone],
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
      </div>
    </div>
  );
  return href ? <Link href={href} className="focus-ring block rounded-2xl">{content}</Link> : content;
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
          <h2 className="font-heading text-sm font-semibold tracking-tight">{title}</h2>
          {description ? (
            <p className="mt-1 max-w-xl text-xs leading-snug text-muted-foreground sm:text-[13px]">
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
