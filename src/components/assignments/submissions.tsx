"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { StaffModal } from "@/components/staff/staff-modal";
import { createClient } from "@/lib/supabase/client";
import { useTranslate } from "@/components/providers/language-provider";
import { invalidateQueries } from "@/lib/supabase/query-cache";
import type { Database } from "@/types/database";
import type { MaterialUpload } from "@/types";

type Submission = Database["public"]["Tables"]["assignment_submissions"]["Row"];
const bucket = "assignment-submissions";
const mime: Record<string, string> = { pdf: "application/pdf", jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", zip: "application/zip", txt: "text/plain" };

async function openFile(row: Submission) {
  const tab = window.open("about:blank", "_blank");
  if (!tab) throw new Error("Allow pop-ups to open the submitted file.");
  tab.opener = null;
  try {
    const { data, error } = await createClient().storage.from(bucket).createSignedUrl(row.file_path, 60, { download: row.file_name });
    if (error || !data) throw new Error("Could not open the submission.");
    tab.location.replace(data.signedUrl);
  } catch (error) { tab.close(); throw error; }
}

export function StudentSubmission({ assignment }: { assignment: MaterialUpload }) {
  const t = useTranslate();
  const [row, setRow] = useState<Submission | null>(null);
  const [ready, setReady] = useState(false);
  const [version, setVersion] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const [now, setNow] = useState(Date.now);
  const closed = !!assignment.dueAt && new Date(assignment.dueAt).getTime() <= now;
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const client = createClient();
        const { data: { user } } = await client.auth.getUser();
        if (!user) throw new Error("Sign in to submit your assignment.");
        const { data, error } = await client.from("assignment_submissions").select("*").eq("assignment_id", assignment.id).eq("student_id", user.id).maybeSingle();
        if (error) throw error;
        if (!cancelled) { setRow(data); setReady(true); }
      } catch { if (!cancelled) setError("Could not load your submission. Please refresh."); }
    }
    void load();
    return () => { cancelled = true; };
  }, [assignment.id, version]);
  async function upload() {
    if (!file || busyRef.current) return;
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!mime[ext] || file.size < 1 || file.size > 20 * 1024 * 1024) { setError("Choose a supported file no larger than 20 MB."); return; }
    busyRef.current = true; setBusy(true); setError(""); setSuccess("");
    const client = createClient();
    let path = "";
    try {
      const { data: { user } } = await client.auth.getUser();
      if (!user) throw new Error("Sign in to submit your assignment.");
      path = `${assignment.id}/${user.id}/${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await client.storage.from(bucket).upload(path, file, { contentType: mime[ext], upsert: false });
      if (uploadError) throw uploadError;
      const payload = { file_path: path, file_name: file.name };
      const result = row
        ? await client.from("assignment_submissions").update(payload).eq("id", row.id).eq("student_id", user.id).select("id").single()
        : await client.from("assignment_submissions").insert({ ...payload, assignment_id: assignment.id, student_id: user.id }).select("id").single();
      if (result.error) throw result.error;
      if (row) await client.storage.from(bucket).remove([row.file_path]).catch(() => null);
      path = ""; setFile(null); setReady(false); if (input.current) input.current.value = "";
      setSuccess("Assignment submitted successfully."); setVersion(value => value + 1);
    } catch { setError("Could not submit. Check the deadline and your connection, then refresh and try again."); }
    finally {
      if (path) await client.storage.from(bucket).remove([path]).catch(() => null);
      busyRef.current = false; setBusy(false);
    }
  }
  return <section className="space-y-3 rounded-xl border border-border p-4">
    <h2 className="font-semibold">{t("Your submission")}</h2>
    <p className="text-xs text-muted-foreground">{t(assignment.onlineSubmission ? "Upload one file, up to 20 MB. You can replace it until the deadline. Only you and authorized teaching staff can access it." : "This assignment uses offline hand-in. Follow the publisher’s instructions.")}</p>
    {row ? <div className="rounded-xl bg-primary/5 p-3 text-sm"><p className="break-all font-medium">{row.file_name}</p><p className="mt-1 text-xs text-muted-foreground">{new Date(row.submitted_at).toLocaleString(t.locale, { timeZone: "Africa/Dar_es_Salaam" })} · EAT</p><Button className="mt-2" size="sm" variant="outline" onClick={() => void openFile(row).catch(e => setError(e.message))}>{t("Download submitted file")}</Button></div> : null}
    {assignment.onlineSubmission && <><p className="text-xs text-primary">{t(closed ? "Deadline passed. Submissions are closed." : row ? "A new upload will replace your current submission." : "No submission yet.")}</p>
      <input ref={input} type="file" aria-label={t("Assignment submission file")} accept=".pdf,.jpg,.jpeg,.png,.docx,.xlsx,.zip,.txt" disabled={!ready || busy || closed} onChange={e => setFile(e.target.files?.[0] ?? null)} className="block max-w-full text-xs" />
      <Button disabled={!ready || busy || closed || !file} onClick={() => void upload()}>{t(busy ? "Submitting…" : row ? "Replace submission" : "Submit assignment")}</Button></>}
    {success ? <p role="status" className="text-xs text-primary">{t(success)}</p> : null}
    {error ? <p role="alert" className="text-xs text-danger">{t(error)}</p> : null}
  </section>;
}

export function SubmissionManagerButton({ assignment }: { assignment: MaterialUpload }) {
  const t = useTranslate();
  const [open, setOpen] = useState(false);
  return <><Button size="sm" variant="outline" onClick={() => setOpen(true)}>{t("Submissions")}</Button>
    {open ? <StaffModal open onClose={() => setOpen(false)} title={t("Assignment submissions")} description={assignment.title}><SubmissionInbox assignment={assignment} /></StaffModal> : null}</>;
}

function SubmissionInbox({ assignment }: { assignment: MaterialUpload }) {
  const t = useTranslate();
  const [enabled, setEnabled] = useState(assignment.onlineSubmission === true);
  const [rows, setRows] = useState<Submission[]>([]);
  const [page, setPage] = useState(0);
  const [count, setCount] = useState(0);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [version, setVersion] = useState(0);
  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { data, count, error } = await createClient().from("assignment_submissions").select("*", { count: "exact" }).eq("assignment_id", assignment.id).order("submitted_at", { ascending: false }).order("id").range(page * 25, page * 25 + 24);
      if (!cancelled) { setRows(data ?? []); setCount(count ?? 0); setLoading(false); if (error) setError("Could not load submissions."); }
    }
    void load().catch(() => { if (!cancelled) { setLoading(false); setError("Could not load submissions."); } });
    return () => { cancelled = true; };
  }, [assignment.id, page, version]);
  async function toggle() {
    setBusy(true); setError("");
    try {
      const { error } = await createClient().from("materials").update({ online_submission: !enabled }).eq("id", assignment.id).eq("kind", "assignment").select("id").single();
      if (error) throw error;
      setEnabled(value => !value); invalidateQueries("materials"); window.dispatchEvent(new Event("darasax:materials"));
    } catch { setError("Could not change the submission setting."); }
    finally { setBusy(false); }
  }
  return <div className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-muted/40 p-3"><p className="text-sm">{t(enabled ? "Online submissions enabled" : "Offline hand-in")}</p><Button size="sm" variant="outline" disabled={busy} onClick={() => void toggle()}>{t(enabled ? "Disable uploads" : "Enable uploads")}</Button></div>
    <p className="text-xs text-muted-foreground">{t("Only admins, the class CR, and lecturers assigned to this class and module can review these files.")}</p>
    <Button size="sm" variant="outline" disabled={loading} onClick={() => { setLoading(true); setError(""); setVersion(v => v + 1); }}>{t("Refresh")}</Button>
    {loading ? <p role="status">{t("Loading submissions…")}</p> : <><p className="text-sm">{count} {t("submissions")}</p>{rows.map(row => <div key={row.id} className="rounded-xl border border-border p-3"><p className="font-semibold">{row.student_name}</p><p className="text-xs text-muted-foreground">{row.registration_number || row.student_id}</p><p className="mt-1 break-all text-xs">{row.file_name}</p><p className="text-xs text-muted-foreground">{new Date(row.submitted_at).toLocaleString(t.locale, { timeZone: "Africa/Dar_es_Salaam" })} · EAT</p><Button size="sm" variant="outline" className="mt-2" onClick={() => void openFile(row).catch(e => setError(e.message))}>{t("Download")}</Button></div>)}</>}
    {error ? <p role="alert" className="text-xs text-danger">{t(error)}</p> : null}
    <div className="flex justify-between"><Button size="sm" variant="outline" disabled={loading || page === 0} onClick={() => { setLoading(true); setPage(p => p - 1); }}>{t("Previous")}</Button><Button size="sm" variant="outline" disabled={loading || (page + 1) * 25 >= count} onClick={() => { setLoading(true); setPage(p => p + 1); }}>{t("Next")}</Button></div>
  </div>;
}
