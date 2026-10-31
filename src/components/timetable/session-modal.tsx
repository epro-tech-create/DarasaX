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
  const { addEntry, updateEntry, deleteEntry } = useTimetableStore();
  const { session } = useStaffSession();
  const availableModules = session?.role === "lecturer" ? modules.filter(m => session.moduleIds.includes(m.id)) : modules;
  const today = tanzaniaDate();
  const original = entry?.originalDate ?? addDateDays(today, ((entry?.day ?? 1) - dateDay(today) + 7) % 7);
  const [form, setForm] = useState({ moduleId: entry?.moduleId ?? availableModules[0]?.id ?? "",
    day: entry?.day ?? 1, startTime: entry?.startTime ?? "08:00", endTime: entry?.endTime ?? "10:00",
    room: entry?.room ?? "", lecturer: entry?.lecturer ?? availableModules[0]?.lecturer ?? "",
    scope: "once" as "once" | "future", date: original, newDate: entry?.sessionDate ?? original,
    status: (entry?.status === "postponed" ? "postponed" : "scheduled") as "scheduled" | "postponed" | "cancelled", reason: "" });
  const requestId = useRef<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const deleting = useRef(false);
  const deleteRequestId = useRef<string | null>(null);
  function change(patch: Partial<typeof form>) { requestId.current = null; setForm(current => ({ ...current, ...patch })); }
  async function removeLesson() {
    if (!entry || busy || deleting.current) return;
    deleting.current = true; setBusy(true); setError("");
    deleteRequestId.current ??= crypto.randomUUID();
    try {
      await deleteEntry(entry, { date: original, scope: "once", reason: form.reason.trim(), requestId: deleteRequestId.current });
      onClose();
    } catch (failure) {
      setError(failure && typeof failure === "object" && "message" in failure ? String(failure.message) : "Could not delete this lesson. Please try again.");
    } finally { deleting.current = false; setBusy(false); }
  }
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
          newDate: form.status === "scheduled" ? form.newDate : form.date, status: form.status, reason: form.reason.trim(), requestId: requestId.current });
      } else await addEntry(values);
      onClose();
    } catch (failure) {
      setError(failure && typeof failure === "object" && "message" in failure ? String(failure.message) : "Could not save this session. Please try again.");
    } finally { setBusy(false); }
  }
  const input = "mt-1 block h-11 min-w-0 w-full max-w-full rounded-xl border border-border bg-background px-3 text-sm [color-scheme:light_dark]";
  const selectedModule = modules.find(item => item.id === form.moduleId);
  const lessonDate = entry?.sessionDate ?? original;
  const dateLabel = (value: string) => new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short" }).format(new Date(`${value}T12:00:00`));
  const postponed = Boolean(entry && form.status === "postponed");
  return <StaffModal open onClose={() => { if (!busy) onClose(); }} title={confirmDelete ? "Delete lesson?" : entry ? "Edit lesson" : "Add weekly lesson"} description={`${streamId} · All times in EAT`} className="overflow-x-hidden">
    <form onSubmit={submit} className="min-w-0 space-y-4">
      {entry ? <div className="rounded-xl bg-muted/60 px-3 py-2.5">
        <p className="text-sm font-semibold leading-snug">{selectedModule?.name ?? "Class lesson"}</p>
        <p className="mt-1 text-xs text-muted-foreground">{dateLabel(lessonDate)} · {entry.startTime}–{entry.endTime}{entry.status === "cancelled" ? " · Cancelled" : ""}</p>
      </div> : null}
      {confirmDelete && entry ? <>
        <p className="text-sm leading-relaxed">Delete only the lesson on <strong>{dateLabel(lessonDate)}</strong>? Other weeks stay unchanged.</p>
        <p className="text-sm leading-relaxed text-muted-foreground">This lesson will disappear from the timetable. No notification will be sent, and further reminders will stop.</p>
        <label className="block text-sm font-medium">Reason (optional)<textarea maxLength={500} value={form.reason} disabled={busy} onChange={e => { deleteRequestId.current = null; change({ reason: e.target.value }); }} className="mt-1 min-h-20 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm" /></label>
        {error ? <p role="alert" className="text-sm text-danger">{error}</p> : null}
        <div className="flex justify-end gap-2"><Button type="button" variant="outline" disabled={busy} onClick={() => { setConfirmDelete(false); setError(""); }}>Keep lesson</Button><Button type="button" variant="danger" disabled={busy} onClick={() => void removeLesson()}>{busy ? "Deleting…" : "Delete lesson"}</Button></div>
      </> : <>
        {entry ? <div className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1" role="group" aria-label="Lesson action">
          <button type="button" disabled={busy} aria-pressed={!postponed} onClick={() => change({ status: "scheduled" })} className={`focus-ring min-h-10 rounded-lg px-2 text-sm font-medium ${!postponed ? "bg-background shadow-sm" : "text-muted-foreground"}`}>Edit details</button>
          <button type="button" disabled={busy} aria-pressed={postponed} onClick={() => change({ status: "postponed" })} className={`focus-ring min-h-10 rounded-lg px-2 text-sm font-medium ${postponed ? "bg-background shadow-sm" : "text-muted-foreground"}`}>Postpone</button>
        </div> : null}
        {postponed ? <p className="rounded-xl border border-border p-3 text-sm leading-relaxed text-muted-foreground">New time not confirmed? Postpone this lesson to stop reminders until you reschedule it.</p> : <>
          {entry ? <label className="block min-w-0 text-sm font-medium">{form.scope === "future" ? "First lesson date" : "Lesson date"}<input required type="date" min={form.scope === "future" && original > today ? original : today} className={input} value={form.newDate} disabled={busy} onChange={e => change({ newDate: e.target.value })} /></label>
            : <label className="block text-sm font-medium">Repeats every<select className={input} value={form.day} disabled={busy} onChange={e => change({ day: Number(e.target.value) })}>{["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((day, i) => <option key={day} value={i}>{day}</option>)}</select></label>}
          {!entry ? <label className="block text-sm font-medium">Module<select className={input} value={form.moduleId} disabled={busy} onChange={e => change({ moduleId: e.target.value, lecturer: modules.find(m => m.id === e.target.value)?.lecturer ?? "" })}>{availableModules.map(m => <option key={m.id} value={m.id}>{m.code} · {m.name}</option>)}</select></label> : null}
          <div className="grid min-w-0 grid-cols-2 gap-3"><label className="min-w-0 text-sm font-medium">Start time<input required type="time" className={input} value={form.startTime} disabled={busy} onChange={e => change({ startTime: e.target.value })} /></label><label className="min-w-0 text-sm font-medium">End time<input required type="time" className={input} value={form.endTime} disabled={busy} onChange={e => change({ endTime: e.target.value })} /></label></div>
          <label className="block text-sm font-medium">Room<input required maxLength={200} className={input} value={form.room} disabled={busy} onChange={e => change({ room: e.target.value })} /></label>
        </>}
        {entry ? <fieldset disabled={busy} className="space-y-2">
          <legend className="mb-2 text-sm font-medium">Apply to</legend>
          <label className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 text-sm ${form.scope === "once" ? "border-primary bg-primary/5" : "border-border"}`}><input type="radio" name="lesson-scope" value="once" checked={form.scope === "once"} onChange={() => change({ scope: "once" })} className="accent-primary" /><span>This lesson only <span className="text-xs text-muted-foreground">· {dateLabel(lessonDate)}</span></span></label>
          <label className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 text-sm ${form.scope === "future" ? "border-primary bg-primary/5" : "border-border"}`}><input type="radio" name="lesson-scope" value="future" checked={form.scope === "future"} onChange={() => change({ scope: "future" })} className="accent-primary" /><span>This and future weeks</span></label>
          {form.scope === "future" ? <p className="text-xs leading-relaxed text-muted-foreground">Weekly changes start from {dateLabel(original)}. Earlier lessons and separately edited dates stay unchanged.</p> : null}
        </fieldset> : null}
        {!postponed ? <details className="rounded-xl border border-border px-3 py-2.5">
          <summary className="focus-ring cursor-pointer text-sm font-medium">{entry ? "More details" : "Lecturer"}</summary>
          <div className="mt-3 space-y-3">
            {entry ? <label className="block text-sm">Module<select className={input} value={form.moduleId} disabled={busy} onChange={e => change({ moduleId: e.target.value, lecturer: modules.find(m => m.id === e.target.value)?.lecturer ?? "" })}>{availableModules.map(m => <option key={m.id} value={m.id}>{m.code} · {m.name}</option>)}</select></label> : null}
            <label className="block text-sm">Lecturer<input required maxLength={200} className={input} value={form.lecturer} disabled={busy} onChange={e => change({ lecturer: e.target.value })} /></label>
          </div>
        </details> : null}
        {entry ? <label className="block text-sm font-medium">Reason (optional)<textarea maxLength={500} value={form.reason} disabled={busy} onChange={e => change({ reason: e.target.value })} className="mt-1 min-h-20 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm" /></label> : null}
        {entry ? <p className="text-xs leading-relaxed text-muted-foreground">{postponed ? "Students will be notified. Reminders pause until a new time is saved." : "Students will be notified and reminders will follow the updated time."}</p> : null}
        {error ? <p role="alert" className="text-sm text-danger">{error}</p> : null}
        <div className="sticky -bottom-4 -mx-4 flex flex-wrap items-center justify-end gap-2 border-t border-border bg-background px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 sm:-bottom-5 sm:-mx-5 sm:px-5">
          {entry ? <Button type="button" variant="ghost" className="mr-auto text-danger" disabled={busy} onClick={() => { deleteRequestId.current = null; setError(""); setConfirmDelete(true); }}>Delete lesson</Button> : <Button type="button" variant="outline" disabled={busy} onClick={onClose}>Close</Button>}
          <Button type="submit" disabled={busy}>{busy ? "Saving…" : postponed ? "Confirm postponement" : entry?.status === "cancelled" ? "Restore lesson" : entry ? "Save changes" : "Add lesson"}</Button>
        </div>
      </>}
    </form>
  </StaffModal>;
}
