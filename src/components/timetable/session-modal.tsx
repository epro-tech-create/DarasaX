"use client";
import { useRef, useState, type FormEvent } from "react";
import { StaffModal } from "@/components/staff/staff-modal";
import { Button } from "@/components/ui/button";
import { useTimetableStore } from "@/lib/timetable-store";
import { useStaffSession } from "@/lib/staff-auth";
import { tanzaniaDate, addDateDays, dateDay } from "@/lib/timetable-dates";
import { modules } from "@/data/mock";
import type { ClassStreamId, TimetableEntry } from "@/types";

export function SessionModal({ entry, streamId, onClose }: { entry: TimetableEntry | null; streamId: ClassStreamId; onClose: () => void }) {
  const { addEntry, updateEntry } = useTimetableStore();
  const { session } = useStaffSession();
  const availableModules = session?.role === "lecturer" ? modules.filter(m => session.moduleIds.includes(m.id)) : modules;
  const today = tanzaniaDate();
  const original = entry?.originalDate ?? addDateDays(today, ((entry?.day ?? 1) - dateDay(today) + 7) % 7);
  const [form, setForm] = useState({ moduleId: entry?.moduleId ?? availableModules[0]?.id ?? "",
    day: entry?.day ?? 1, startTime: entry?.startTime ?? "08:00", endTime: entry?.endTime ?? "10:00",
    room: entry?.room ?? "", lecturer: entry?.lecturer ?? availableModules[0]?.lecturer ?? "",
    scope: "once" as "once" | "future", date: original, newDate: entry?.sessionDate ?? original,
    status: (entry?.status === "cancelled" || entry?.status === "postponed" ? entry.status : "scheduled") as "scheduled" | "postponed" | "cancelled", reason: "" });
  const requestId = useRef<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  function change(patch: Partial<typeof form>) { requestId.current = null; setForm(current => ({ ...current, ...patch })); }
  async function submit(event: FormEvent) {
    event.preventDefault(); if (busy) return;
    if (form.startTime >= form.endTime) { setError("End time must be after start time."); return; }
    if (!form.room.trim() || !form.lecturer.trim()) { setError("Enter a room and lecturer."); return; }
    setBusy(true); setError("");
    try {
      const values = { moduleId: form.moduleId, day: form.day, startTime: form.startTime, endTime: form.endTime, streamId, room: form.room.trim(), lecturer: form.lecturer.trim() };
      if (entry) {
        requestId.current ??= crypto.randomUUID();
        await updateEntry(entry.seriesId ?? entry.id, values, { date: form.date, scope: form.scope,
          newDate: form.status === "scheduled" ? form.newDate : form.date, status: form.status, reason: form.reason, requestId: requestId.current });
      } else await addEntry(values);
      onClose();
    } catch (failure) {
      setError(failure && typeof failure === "object" && "message" in failure ? String(failure.message) : "Could not save this session. Please try again.");
    } finally { setBusy(false); }
  }
  const input = "mt-1 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm";
  return <StaffModal open onClose={() => { if (!busy) onClose(); }} title={entry ? "Update session" : "Add weekly session"} description={`${streamId} · Tanzania time (EAT)`}>
    <form onSubmit={submit} className="space-y-3">
      {entry ? <>
        <label className="block text-sm">Apply change to<select className={input} value={form.scope} onChange={e => change({ scope: e.target.value as "once" | "future" })} disabled={busy}>
          <option value="once">This session only</option><option value="future">This and future weekly sessions</option>
        </select></label>
        <label className="block text-sm">{form.scope === "once" ? "Original session date" : "Change weekly schedule from"}<input required type="date" className={input} value={form.date} min={form.scope === "future" ? today : undefined} disabled={busy} onChange={e => change({ date: e.target.value })} /></label>
        <label className="block text-sm">Session action<select className={input} value={form.status} disabled={busy} onChange={e => change({ status: e.target.value as typeof form.status })}>
          <option value="scheduled">Reschedule / update details</option><option value="postponed">Postpone · new time not confirmed</option><option value="cancelled">Cancel session</option>
        </select></label>
        {form.status === "scheduled" ? <label className="block text-sm">{form.scope === "once" ? "New session date" : "First session on the new weekly schedule"}<input required type="date" min={form.scope === "future" && form.date > today ? form.date : today} className={input} value={form.newDate} disabled={busy} onChange={e => change({ newDate: e.target.value })} /></label> : null}
      </> : <label className="block text-sm">Weekly day<select className={input} value={form.day} onChange={e => change({ day: Number(e.target.value) })}>{["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((day, i) => <option key={day} value={i}>{day}</option>)}</select></label>}
      <label className="block text-sm">Module<select className={input} value={form.moduleId} disabled={busy} onChange={e => change({ moduleId: e.target.value, lecturer: modules.find(m => m.id === e.target.value)?.lecturer ?? "" })}>{availableModules.map(m => <option key={m.id} value={m.id}>{m.code} · {m.name}</option>)}</select></label>
      {form.status === "scheduled" || !entry ? <div className="grid grid-cols-2 gap-3"><label className="text-sm">Start<input required type="time" className={input} value={form.startTime} disabled={busy} onChange={e => change({ startTime: e.target.value })} /></label><label className="text-sm">End<input required type="time" className={input} value={form.endTime} disabled={busy} onChange={e => change({ endTime: e.target.value })} /></label></div> : null}
      <label className="block text-sm">Room<input required maxLength={200} className={input} value={form.room} disabled={busy} onChange={e => change({ room: e.target.value })} /></label>
      <label className="block text-sm">Lecturer<input required maxLength={200} className={input} value={form.lecturer} disabled={busy} onChange={e => change({ lecturer: e.target.value })} /></label>
      {entry ? <>
        <label className="block text-sm">Reason {form.status === "scheduled" ? "(optional)" : ""}<textarea required={form.status !== "scheduled"} maxLength={500} className="mt-1 min-h-20 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm" value={form.reason} disabled={busy} onChange={e => change({ reason: e.target.value })} /></label>
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs leading-relaxed" role="status">
          <p className="font-semibold">{form.scope === "once" ? `Only the session originally on ${form.date} will change.` : `The weekly schedule changes from ${form.date}. Earlier sessions stay unchanged; other dated exceptions are retained.`}</p>
          <p className="mt-1">{form.status === "scheduled" ? `${form.newDate} · ${form.startTime}–${form.endTime} EAT · ${form.room}${form.scope === "future" ? " · repeats weekly" : ""}` : form.status === "postponed" ? "No lesson reminder will be sent until a new time is confirmed." : "This session will not take place."}</p>
          <p className="mt-1">Affected students will receive an update. Old unsent reminders will be cancelled.</p>
        </div>
      </> : null}
      {error ? <p role="alert" className="text-sm text-danger">{error}</p> : null}
      <div className="flex justify-end gap-2"><Button type="button" variant="outline" disabled={busy} onClick={onClose}>Close</Button><Button type="submit" disabled={busy}>{busy ? "Saving…" : entry ? "Confirm change" : "Add session"}</Button></div>
    </form>
  </StaffModal>;
}
