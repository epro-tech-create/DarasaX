"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { StaffModal } from "@/components/staff/staff-modal";
import { useTranslate } from "@/components/providers/language-provider";
import { useStaffSession } from "@/lib/staff-auth";
import { modules } from "@/data/mock";
import { createClient } from "@/lib/supabase/client";
import { invalidateQueries } from "@/lib/supabase/query-cache";
import { tanzaniaDate } from "@/lib/timetable-dates";
import { validateImport, type ImportSession } from "@/lib/timetable-import";
import type { Database, Json } from "@/types/database";

const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const field = "focus-ring w-full min-w-0 rounded-lg border border-border bg-background px-2 py-2 text-xs";
type Batch = Database["public"]["Tables"]["timetable_imports"]["Row"];
export function ImportTimetableButton({ streamId }: { streamId: string }) {
  const t = useTranslate();
  const [open, setOpen] = useState(false);
  const { session } = useStaffSession();
  if (session?.role !== "admin" && session?.role !== "class_rep") return null;
  return <><Button size="sm" variant="outline" onClick={() => setOpen(true)}>{t("Import timetable")}</Button>{open ? <StaffModal open onClose={() => setOpen(false)} title={t("Import timetable")} description={t("Upload, review, then apply your class schedule.")}><ImportForm key={streamId} streamId={streamId} /></StaffModal> : null}</>;
}
function ImportForm({ streamId }: { streamId: string }) {
  const t = useTranslate();
  const [file, setFile] = useState<File | null>(null);
  const [sessions, setSessions] = useState<ImportSession[]>([]);
  const [text, setText] = useState("");
  const [effective, setEffective] = useState(tanzaniaDate());
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [latest, setLatest] = useState<Batch | null>(null);
  const [version, setVersion] = useState(0);
  const requestId = useRef<string | null>(null);
  const problems = validateImport(sessions);
  useEffect(() => {
    let cancelled = false;
    void createClient().from("timetable_imports").select("*").eq("stream_id", streamId).is("undone_at", null).order("created_at", { ascending: false }).limit(1).maybeSingle().then(({ data }) => { if (!cancelled) setLatest(data); });
    return () => { cancelled = true; };
  }, [streamId, version]);
  function refresh() { invalidateQueries("timetable"); window.dispatchEvent(new Event("darasax:timetable")); setVersion(v => v + 1); }
  function update(index: number, patch: Partial<ImportSession>) { requestId.current = null; setSessions(rows => rows.map((row, i) => i === index ? { ...row, ...patch } : row)); setNotice(""); }
  async function extract() {
    if (!file || busyRef.current) return;
    busyRef.current = true; setBusy(true); setError(""); setNotice(""); requestId.current = null;
    try {
      const form = new FormData(); form.append("file", file);
      const response = await fetch(`/api/timetable-import?class=${encodeURIComponent(streamId)}`, { method: "POST", body: form });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setSessions(result.sessions); setText(result.text); setNotice(result.warning);
    } catch (error) { setError(error instanceof Error ? error.message : "Could not read this timetable."); }
    finally { busyRef.current = false; setBusy(false); }
  }
  async function apply() {
    if (busyRef.current || problems.length) return;
    if (!window.confirm(t("Replace the regular schedule from the selected effective date? Past sessions and dated cancellations or reschedules will be kept. Review every session before continuing."))) return;
    busyRef.current = true; setBusy(true); setError(""); setNotice("");
    try {
      requestId.current ??= crypto.randomUUID();
      const { error } = await createClient().rpc("apply_timetable_import", { target_class: streamId, starts_on: effective, sessions: sessions as unknown as Json, source_name: file?.name ?? "Reviewed timetable", request_key: requestId.current });
      if (error) throw error;
      refresh(); setNotice("Timetable applied successfully."); setSessions([]); setText(""); requestId.current = null;
    } catch (error) { setError(error instanceof Error ? error.message : "Could not apply the timetable."); }
    finally { busyRef.current = false; setBusy(false); }
  }
  async function undo() {
    if (!latest || busyRef.current || !window.confirm(t("Undo the latest timetable import and restore the previous regular schedule?"))) return;
    busyRef.current = true; setBusy(true); setError("");
    try {
      const { error } = await createClient().rpc("undo_timetable_import", { import_id: latest.id });
      if (error) throw error;
      refresh(); setNotice("Previous timetable restored.");
    } catch (error) { setError(error instanceof Error ? error.message : "Could not undo this import."); }
    finally { busyRef.current = false; setBusy(false); }
  }
  return <div className="space-y-4">
    <p className="text-xs text-muted-foreground">{streamId} · {t("Excel (.xlsx), PDF, JPG or PNG. Maximum 10 MB; PDFs up to 5 pages. For best results, use Excel columns: Day, Start, End, Module, Room, Lecturer.")}</p>
    <input type="file" aria-label={t("Timetable document")} accept=".xlsx,.pdf,.jpg,.jpeg,.png" disabled={busy} onChange={event => { setFile(event.target.files?.[0] ?? null); setSessions([]); setText(""); setError(""); setNotice(""); requestId.current = null; }} className="block max-w-full text-xs" />
    <Button disabled={!file || busy} onClick={() => void extract()}>{t(busy ? "Processing…" : "Read timetable")}</Button>
    {text ? <details className="rounded-xl border border-border p-3 text-xs"><summary className="cursor-pointer font-medium">{t("Extracted document text")}</summary><pre className="mt-2 max-h-52 overflow-auto whitespace-pre-wrap break-words">{text}</pre></details> : null}
    <fieldset disabled={busy} className="space-y-3">
      <label className="block text-xs font-medium">{t("Effective date (Tanzania)")}<input type="date" min={tanzaniaDate()} value={effective} onChange={e => { setEffective(e.target.value); requestId.current = null; }} className={field} /></label>
      <h3 className="font-semibold">{t("Review sessions")} ({sessions.length})</h3>
      <div className="max-h-[50vh] space-y-3 overflow-y-auto">
        {sessions.map((row, index) => <div key={index} className="space-y-2 rounded-xl border border-border p-3">
          <div className="flex items-center justify-between"><p className="text-xs font-semibold">{t("Session")} {index + 1}</p><button type="button" onClick={() => { requestId.current = null; setSessions(rows => rows.filter((_, i) => i !== index)); }} className="focus-ring rounded-lg p-1 text-xs text-danger">{t("Remove")}</button></div>
          <label className="block text-xs">{t("Module")}<select value={row.moduleId} onChange={e => update(index, { moduleId: e.target.value })} className={field}><option value="">{t("Select module")}</option>{modules.map(m => <option key={m.id} value={m.id}>{m.code} · {m.name}</option>)}</select></label>
          <div className="grid grid-cols-3 gap-2"><label className="text-xs">{t("Day")}<select value={row.day} onChange={e => update(index, { day: Number(e.target.value) })} className={field}>{days.map((day, i) => <option key={day} value={i}>{t(day)}</option>)}</select></label><label className="text-xs">{t("Start")}<input type="time" value={row.start} onChange={e => update(index, { start: e.target.value })} className={field} /></label><label className="text-xs">{t("End")}<input type="time" value={row.end} onChange={e => update(index, { end: e.target.value })} className={field} /></label></div>
          <div className="grid gap-2 sm:grid-cols-2"><label className="text-xs">{t("Room")}<input value={row.room} maxLength={200} onChange={e => update(index, { room: e.target.value })} className={field} /></label><label className="text-xs">{t("Lecturer")}<input value={row.lecturer} maxLength={200} onChange={e => update(index, { lecturer: e.target.value })} className={field} /></label></div>
        </div>)}
      </div>
      <Button variant="outline" size="sm" disabled={sessions.length >= 100} onClick={() => { requestId.current = null; setSessions(rows => [...rows, { day: 1, start: "", end: "", moduleId: "", room: "", lecturer: "" }]); }}>{t("Add session")}</Button>
      {sessions.length ? <><ul className="space-y-1 text-xs text-danger">{problems.slice(0, 10).map(problem => <li key={problem}>{t(problem)}</li>)}</ul><Button disabled={!!problems.length || !effective} onClick={() => void apply()}>{t("Apply timetable")}</Button></> : null}
    </fieldset>
    {latest ? <div className="space-y-2 rounded-xl bg-muted/40 p-3 text-xs"><p>{t("Latest import")}: {latest.filename} · {latest.effective_date}</p><Button size="sm" variant="outline" disabled={busy || latest.effective_date < tanzaniaDate()} onClick={() => void undo()}>{t("Undo latest import")}</Button><p className="text-muted-foreground">{t("Undo is available until the effective date has passed. Dated exceptions remain unchanged.")}</p></div> : null}
    {notice ? <p role="status" className="text-xs text-primary">{t(notice)}</p> : null}
    {error ? <p role="alert" className="text-xs text-danger">{t(error)}</p> : null}
  </div>;
}
