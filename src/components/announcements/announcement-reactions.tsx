"use client";

import { useState } from "react";
import { SmilePlus } from "lucide-react";
import { useTranslate } from "@/components/providers/language-provider";
import { cn } from "@/lib/utils";
import { REACTION_OPTIONS, useAnnouncementReactions, type ReactionEmoji } from "@/lib/announcement-reactions";

export function AnnouncementReactions({ announcementId }: { announcementId: string }) {
  const t = useTranslate();
  const state = useAnnouncementReactions();
  const [open, setOpen] = useState(false);
  if (!state) return null;
  const reactions = state.rows.filter(row => row.material_id === announcementId);
  const mine = reactions.find(row => row.reacted_by_me)?.emoji;
  const busy = state.busy.has(announcementId);
  function choose(emoji: ReactionEmoji) {
    setOpen(false);
    void state!.react(announcementId, mine === emoji ? null : emoji);
  }
  return <div className="mt-3 border-t border-border/60 pt-3" onKeyDown={event => { if (event.key === "Escape") setOpen(false); }}>
    <div className="flex min-h-9 flex-wrap items-center gap-2" role="group" aria-label={t("Announcement reactions")}>
      {REACTION_OPTIONS.map(option => {
        const row = reactions.find(item => item.emoji === option.emoji);
        if (!row) return null;
        return <button key={option.emoji} type="button" aria-pressed={row.reacted_by_me} disabled={busy || !state.ready}
          aria-label={`${t(option.label)}: ${row.reaction_count}. ${t(row.reacted_by_me ? "Remove your reaction" : "React")}`}
          onClick={() => choose(option.emoji)}
          className={cn("focus-ring inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 text-sm transition disabled:opacity-50", row.reacted_by_me ? "border-primary/50 bg-primary/10 text-primary" : "border-border bg-muted/40 text-muted-foreground hover:bg-muted")}>
          <span aria-hidden="true" className="text-lg leading-none">{option.emoji}</span><span className="font-medium tabular-nums">{row.reaction_count}</span>
        </button>;
      })}
      <button type="button" aria-expanded={open} disabled={busy || !state.ready} onClick={() => setOpen(value => !value)}
        className="focus-ring inline-flex min-h-9 items-center gap-1.5 rounded-full border border-border px-3 text-xs text-muted-foreground hover:bg-muted disabled:opacity-50">
        <SmilePlus className="h-4 w-4" aria-hidden="true" />{t(busy ? "Saving…" : "React")}
      </button>
    </div>
    {open && <div className="mt-2 flex w-fit max-w-full flex-wrap gap-1 rounded-2xl border border-border bg-card p-1.5" role="group" aria-label={t("Choose a reaction")}>
      {REACTION_OPTIONS.map(option => <button key={option.emoji} type="button" aria-label={t(option.label)} aria-pressed={mine === option.emoji} disabled={busy}
        onClick={() => choose(option.emoji)} className={cn("focus-ring flex h-11 w-11 items-center justify-center rounded-full text-2xl transition hover:bg-muted", mine === option.emoji && "bg-primary/10")}>
        <span aria-hidden="true">{option.emoji}</span>
      </button>)}
    </div>}
    {state.failed && <p role="status" className="mt-2 text-xs text-muted-foreground">{t("Reactions could not be loaded.")} <button type="button" className="focus-ring underline" onClick={() => void state.refresh()}>{t("Try again")}</button></p>}
    {state.errors[announcementId] && <p role="alert" className="mt-2 text-xs text-danger">{t(state.errors[announcementId])}</p>}
  </div>;
}
