import Link from "next/link";
import { ArrowUpRight, CalendarDays, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function OverviewHeader({ label, title, description, actions }: {
  label: string; title: ReactNode; description: string; actions?: ReactNode;
}) {
  const date = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Africa/Dar_es_Salaam" });
  return (
    <header className="relative flex flex-col gap-5 border-b border-border/70 pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <p className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
          <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-primary" />{label}
        </p>
        <div className="[&_h1]:text-xl [&_h1]:font-semibold [&_h1]:tracking-tight sm:[&_h1]:text-2xl">
          {typeof title === "string" ? <h1 className="font-heading break-words">{title}</h1> : title}
        </div>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">{description}</p>
      </div>
      <div className="flex shrink-0 flex-col gap-3 sm:items-end">
        <span className="inline-flex items-center gap-2 text-xs text-muted-foreground"><CalendarDays className="h-3.5 w-3.5" />{date}</span>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}

export function OverviewShortcut({ href, title, description, icon: Icon }: {
  href: string; title: string; description: string; icon: LucideIcon;
}) {
  return (
    <Link href={href} className="surface focus-ring group flex h-full items-center gap-3.5 rounded-2xl p-4 transition duration-200 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 motion-safe:hover:-translate-y-0.5 sm:p-5">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/10"><Icon className="h-5 w-5" /></span>
      <div className="min-w-0 flex-1"><p className="text-sm font-semibold">{title}</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p></div>
      <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:text-primary" />
    </Link>
  );
}
