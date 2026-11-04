"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { Ellipsis, UserRound, Settings, LifeBuoy, ClipboardList, Users, Megaphone, CalendarDays, BookOpen, ShieldCheck, FileText, LockKeyhole } from "lucide-react";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { useTranslate } from "@/components/providers/language-provider";

export function MoreMenu({ profileHref, settingsHref, helpdeskHref, assignmentsHref, mbungeTools = false }: { profileHref?: string; settingsHref?: string; helpdeskHref: string; assignmentsHref?: string; mbungeTools?: boolean }) {
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
      {open ? <div id={panelId} className="absolute right-0 top-full z-50 mt-2 max-h-[70dvh] w-60 overflow-y-auto rounded-xl border border-border bg-card p-2 text-foreground shadow-xl">
        <nav aria-label={t("More options")} onClick={() => setOpen(false)}>
          {mbungeTools && <div className="mb-1 border-b border-border pb-1"><p className="px-3 py-2 text-xs font-semibold text-muted-foreground">{t("Mbunge tools")}</p><Link href="/mbunge/announcements" className={linkClass}><Megaphone className="h-4 w-4" />{t("Manage announcements")}</Link><Link href="/mbunge/students" className={linkClass}><Users className="h-4 w-4" />{t("Student list")}</Link><Link href="/mbunge/timetable" className={linkClass}><CalendarDays className="h-4 w-4" />{t("Manage timetable")}</Link><Link href="/mbunge/materials" className={linkClass}><BookOpen className="h-4 w-4" />{t("Class library")}</Link></div>}
          {assignmentsHref ? <Link href={assignmentsHref} className={linkClass}><ClipboardList className="h-4 w-4" aria-hidden />{t("Assignments")}</Link> : null}
          <Link href={helpdeskHref} className={linkClass}><LifeBuoy className="h-4 w-4" aria-hidden />{t("Helpdesk")}</Link>
          {profileHref ? <Link href={profileHref} className={linkClass}><UserRound className="h-4 w-4" aria-hidden />{t("Personal Profile")}</Link> : null}
          {settingsHref ? <Link href={settingsHref} className={linkClass}><Settings className="h-4 w-4" aria-hidden />{t("Settings")}</Link> : null}
          <div className="mt-1 border-t border-border pt-1">
            <Link href="/legal/privacy" className={linkClass}><LockKeyhole className="h-4 w-4" aria-hidden />{t("Privacy Policy")}</Link>
            <Link href="/legal/terms" className={linkClass}><FileText className="h-4 w-4" aria-hidden />{t("Terms of Use")}</Link>
            <Link href="/legal/security" className={linkClass}><ShieldCheck className="h-4 w-4" aria-hidden />{t("Security & Privacy")}</Link>
          </div>
        </nav>
        <div className="mt-1 border-t border-border px-1 pt-2"><SignOutButton /></div>
      </div> : null}
    </div>
  );
}
