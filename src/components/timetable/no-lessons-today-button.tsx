"use client";

import { useRef, useState } from "react";
import { CalendarOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StaffModal } from "@/components/staff/staff-modal";
import { useStaffSession } from "@/lib/staff-auth";
import { createClient } from "@/lib/supabase/client";
import { invalidateQueries } from "@/lib/supabase/query-cache";
import { tanzaniaDate } from "@/lib/timetable-dates";
import { useTranslate } from "@/components/providers/language-provider";

export function NoLessonsTodayButton({ streamId }: { streamId: string }) {
  const t = useTranslate();
  const { session } = useStaffSession();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<number | null>(null);
  const requestId = useRef<string | null>(null);
  const submitting = useRef(false);
  if (session?.role !== "admin" && !(session?.role === "class_rep" && session.streamId === streamId)) return null;

  async function confirm() {
    if (submitting.current || !reason.trim()) return;
    submitting.current = true; setBusy(true); setError("");
    requestId.current ??= crypto.randomUUID();
    try {
      const { data, error } = await createClient().rpc("cancel_timetable_today", {
        target_class: streamId, reason_text: reason.trim(), request_key: requestId.current,
      });
      if (error) throw error;
      invalidateQueries("timetable");
      invalidateQueries("materials");
      window.dispatchEvent(new Event("darasax:materials"));
      window.dispatchEvent(new Event("darasax:timetable"));
      setResult(data); setOpen(false);
    } catch (failure) {
      setError(failure && typeof failure === "object" && "message" in failure ? String(failure.message) : "Could not update today's lessons. Please try again.");
    } finally { submitting.current = false; setBusy(false); }
  }

  return <>
    <Button size="sm" variant="outline" onClick={() => { setReason(""); setError(""); setResult(null); requestId.current = null; setOpen(true); }}>
      <CalendarOff className="h-4 w-4" aria-hidden="true" />{t("No lessons today")}
    </Button>
    {result !== null && <span role="status" className="text-xs text-muted-foreground">{t("Today's no-lessons announcement is on the Announcements page.")}</span>}
    {open && <StaffModal open title={t("No lessons today")} description={`${streamId} · ${tanzaniaDate()} · EAT`} onClose={() => { if (!busy) setOpen(false); }}>
      <form className="space-y-4" onSubmit={event => { event.preventDefault(); void confirm(); }}>
        <p className="text-sm text-muted-foreground">{t("Publish one announcement that there are no sessions for this class today. It appears on the Announcements page. Today's lesson reminders stop, and future sessions stay unchanged.")}</p>
        <label className="block text-sm font-medium">{t("Reason")}<textarea required maxLength={500} value={reason} disabled={busy} onChange={event => { setReason(event.target.value); requestId.current = null; }} className="focus-ring mt-1 min-h-24 w-full rounded-xl border border-border bg-background p-3 text-sm" /></label>
        {error && <p role="alert" className="text-sm text-danger">{t(error)}</p>}
        <div className="flex justify-end gap-2"><Button variant="outline" type="button" disabled={busy} onClick={() => setOpen(false)}>{t("Close")}</Button><Button type="submit" disabled={busy || !reason.trim()}>{t(busy ? "Saving…" : "Confirm no lessons today")}</Button></div>
      </form>
    </StaffModal>}
  </>;
}
