"use client";

import { useState, type ReactNode } from "react";
import { Copy, Share2 } from "lucide-react";
import { useTranslate } from "@/components/providers/language-provider";
import { announcementShareText } from "@/lib/announcement-sharing";

export function AnnouncementShareButton({ id, title, body, recipient, trailingAction, showInstructions = false }: {
  id: string; title: string; body?: string; recipient?: string; trailingAction?: ReactNode; showInstructions?: boolean;
}) {
  const t = useTranslate();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [manualText, setManualText] = useState("");
  function getText() {
    return announcementShareText({ id, title, body, recipient }, window.location.origin);
  }
  function share() {
    window.open(`https://wa.me/?text=${encodeURIComponent(getText())}`, "_blank", "noopener,noreferrer");
  }
  async function copy() {
    if (busy) return;
    setBusy(true);
    setMessage("");
    setManualText("");
    const text = getText();
    try {
      if (!navigator.clipboard) { setManualText(text); return; }
      await navigator.clipboard.writeText(text);
      setMessage("Announcement copied.");
    } catch {
      setManualText(text);
    } finally {
      setBusy(false);
    }
  }
  const buttonClass = "focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border px-3 text-xs font-medium transition disabled:opacity-50";
  return <div className="mt-3">
    <div className="flex items-center gap-2">
      <button type="button" onClick={share} aria-label={`${t("Share to WhatsApp")}: ${title}`} title={t("Share to WhatsApp")} className={`${buttonClass} min-w-0 flex-1 border-primary/20 bg-primary/10 text-primary hover:bg-primary/15`}>
        <Share2 className="h-4 w-4 shrink-0" aria-hidden="true" /><span className="truncate">WhatsApp</span>
      </button>
      <button type="button" disabled={busy} onClick={() => void copy()} aria-label={`${t("Copy announcement")}: ${title}`} title={t("Copy announcement")} className={`${buttonClass} w-11 shrink-0 px-0 text-muted-foreground hover:bg-muted hover:text-foreground`}>
        <Copy className="h-4 w-4" aria-hidden="true" />
      </button>
      {trailingAction}
    </div>
    {showInstructions && <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{t("Choose your class group in WhatsApp, then tap Send.")}</p>}
    {message && <p role="status" className="mt-1 text-xs text-muted-foreground">{t(message)}</p>}
    {manualText && <label className="mt-2 block text-xs text-muted-foreground">{t("Copy announcement text")}
      <textarea readOnly value={manualText} onFocus={event => event.currentTarget.select()} rows={6}
        className="focus-ring mt-1 w-full rounded-lg border border-border bg-background p-2" />
    </label>}
  </div>;
}
