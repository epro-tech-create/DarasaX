"use client";

import { useState } from "react";
import { Copy, Share2 } from "lucide-react";
import { useTranslate } from "@/components/providers/language-provider";
import { announcementShareText } from "@/lib/announcement-sharing";

export function AnnouncementShareButton({ id, title, body, recipient }: {
  id: string; title: string; body?: string; recipient?: string;
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
  const buttonClass = "focus-ring inline-flex min-h-11 items-center gap-1.5 rounded-lg px-3 text-xs font-medium text-primary hover:bg-primary/10 disabled:opacity-50";
  return <div className="mt-2">
    <div className="flex flex-wrap gap-1">
      <button type="button" onClick={share} aria-label={`${t("Share to WhatsApp")}: ${title}`} className={buttonClass}>
        <Share2 className="h-3.5 w-3.5" aria-hidden="true" />{t("Share to WhatsApp")}
      </button>
      <button type="button" disabled={busy} onClick={() => void copy()} aria-label={`${t("Copy announcement")}: ${title}`} className={buttonClass}>
        <Copy className="h-3.5 w-3.5" aria-hidden="true" />{t("Copy announcement")}
      </button>
    </div>
    <p className="text-xs text-muted-foreground">{t("Choose your class group in WhatsApp, then tap Send.")}</p>
    {message && <p role="status" className="mt-1 text-xs text-muted-foreground">{t(message)}</p>}
    {manualText && <label className="mt-2 block text-xs text-muted-foreground">{t("Copy announcement text")}
      <textarea readOnly value={manualText} onFocus={event => event.currentTarget.select()} rows={6}
        className="focus-ring mt-1 w-full rounded-lg border border-border bg-background p-2" />
    </label>}
  </div>;
}
