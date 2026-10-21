"use client";

import { useTranslate } from "@/components/providers/language-provider";
import { useState, type FormEvent } from "react";
import { StaffModal } from "@/components/staff/staff-modal";
import { Button } from "@/components/ui/button";
import { useTimetableStore } from "@/lib/timetable-store";
import { modules } from "@/data/mock";
import type { ClassStreamId, TimetableEntry } from "@/types";

export function SessionModal({ entry, streamId, onClose }: { entry: TimetableEntry | null; streamId: ClassStreamId; onClose: () => void }) {
  const translateUI = useTranslate();
  const { addEntry, updateEntry } = useTimetableStore();
  const [form, setForm] = useState(() => ({ moduleId: entry?.moduleId ?? modules[0].id,
    day: entry?.day ?? 1, startTime: entry?.startTime ?? "08:00", endTime: entry?.endTime ?? "10:00",
    room: entry?.room ?? "", lecturer: entry?.lecturer ?? modules[0].lecturer }));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent) {
    event.preventDefault(); if (busy) return;
    if (form.startTime >= form.endTime) { setError("End time must be after start time."); return; }
    if (!form.room.trim() || !form.lecturer.trim()) { setError("Enter a room and lecturer."); return; }
    setBusy(true); setError("");
    try {
      const values = { ...form, streamId, room: form.room.trim(), lecturer: form.lecturer.trim() };
      if (entry) await updateEntry(entry.id, values); else await addEntry(values);
      onClose();
    } catch { setError("Could not save this session. Check the details and try again."); }
    finally { setBusy(false); }
  }
  const input = "mt-1 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm";
  return <StaffModal open onClose={() => { if (!busy) onClose(); }} title={translateUI(entry ? "Edit session" : "Add session")} description={translateUI(streamId)}>
    <form onSubmit={submit} className="space-y-3">
      <label className="block text-sm">{translateUI("Module")}<select className={input} value={form.moduleId} onChange={e => setForm({ ...form, moduleId: e.target.value, lecturer: modules.find(m => m.id === e.target.value)?.lecturer ?? "" })}>{modules.map(m => <option key={m.id} value={m.id}>{translateUI(m.code)} · {m.name}</option>)}</select></label>
      <label className="block text-sm">{translateUI("Day")}<select className={input} value={form.day} onChange={e => setForm({ ...form, day: Number(e.target.value) })}>{["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((day, i) => <option key={day} value={i}>{translateUI(day)}</option>)}</select></label>
      <div className="grid grid-cols-2 gap-3"><label className="text-sm">{translateUI("Start")}<input required type="time" className={input} value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })} /></label><label className="text-sm">{translateUI("End")}<input required type="time" className={input} value={form.endTime} onChange={e => setForm({ ...form, endTime: e.target.value })} /></label></div>
      <label className="block text-sm">{translateUI("Room")}<input required className={input} value={form.room} onChange={e => setForm({ ...form, room: e.target.value })} /></label>
      <label className="block text-sm">{translateUI("Lecturer")}<input required className={input} value={form.lecturer} onChange={e => setForm({ ...form, lecturer: e.target.value })} /></label>
      {error && <p role="alert" className="text-sm text-danger">{translateUI(error)}</p>}
      <div className="flex justify-end gap-2"><Button type="button" variant="outline" disabled={busy} onClick={onClose}>{translateUI("Cancel")}</Button><Button type="submit" disabled={busy}>{translateUI(busy ? "Saving…" : "Save session")}</Button></div>
    </form>
  </StaffModal>;
}
