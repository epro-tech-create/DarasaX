"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";
import { useTranslate } from "@/components/providers/language-provider";

export function AnnouncementShareButton({ title, body }: { title: string; body?: string }) {
  const t = useTranslate();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [manualCopy, setManualCopy] = useState(false);
  const text = [title, body, "DarasaX"].filter(Boolean).join("\n\n");

  async function share() {
    if (busy) return;
    setBusy(true);
    setMessage("");
    setManualCopy(false);
    try {
      if (navigator.share) {
        await navigator.share({ title, text });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        setMessage("Announcement copied.");
      } else {
        setManualCopy(true);
      }
    } catch (error) {
      if (!(error instanceof Error && error.name === "AbortError")) setManualCopy(true);
    } finally {
      setBusy(false);
    }
  }

  return <div className="mt-2">
    <button type="button" disabled={busy} onClick={() => void share()} aria-label={`${t("Share")}: ${title}`}
      className="focus-ring inline-flex min-h-10 items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-primary hover:bg-primary/10 disabled:opacity-50">
      <Share2 className="h-3.5 w-3.5" aria-hidden="true" />{t("Share")}
    </button>
    {message && <p role="status" className="text-xs text-muted-foreground">{t(message)}</p>}
    {manualCopy && <label className="block text-xs text-muted-foreground">{t("Copy announcement text")}
      <textarea readOnly value={text} onFocus={event => event.currentTarget.select()} rows={4}
        className="focus-ring mt-1 w-full rounded-lg border border-border bg-background p-2" />
    </label>}
  </div>;
}
