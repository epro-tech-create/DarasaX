"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { Ellipsis, UserRound, Settings, LifeBuoy, ClipboardList } from "lucide-react";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { useTranslate } from "@/components/providers/language-provider";

export function MoreMenu({ profileHref, settingsHref, helpdeskHref, assignmentsHref }: { profileHref?: string; settingsHref?: string; helpdeskHref: string; assignmentsHref?: string }) {
  const t = useTranslate();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setOpen(false); trigger.current?.focus(); }
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);

  const linkClass = "focus-ring flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm hover:bg-muted";
  return (
    <div ref={root} className="relative shrink-0" onBlur={event => {
      if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false);
    }}>
      <button ref={trigger} type="button" aria-label={t("More options")} aria-expanded={open} aria-controls={panelId}
        onClick={() => setOpen(value => !value)}
        className="focus-ring inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition hover:bg-muted hover:text-foreground">
        <Ellipsis className="h-[18px] w-[18px]" aria-hidden />
      </button>
      {open ? <div id={panelId} className="absolute right-0 top-full z-50 mt-2 w-60 rounded-xl border border-border bg-card p-2 text-foreground shadow-xl">
        <nav aria-label={t("More options")} onClick={() => setOpen(false)}>
          {assignmentsHref ? <Link href={assignmentsHref} className={linkClass}><ClipboardList className="h-4 w-4" aria-hidden />{t("Assignments")}</Link> : null}
          <Link href={helpdeskHref} className={linkClass}><LifeBuoy className="h-4 w-4" aria-hidden />{t("Helpdesk")}</Link>
          {profileHref ? <Link href={profileHref} className={linkClass}><UserRound className="h-4 w-4" aria-hidden />{t("Personal Profile")}</Link> : null}
          {settingsHref ? <Link href={settingsHref} className={linkClass}><Settings className="h-4 w-4" aria-hidden />{t("Settings")}</Link> : null}
        </nav>
        <div className="mt-1 border-t border-border px-1 pt-2"><SignOutButton /></div>
      </div> : null}
    </div>
  );
}
