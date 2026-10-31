"use client";

import { useTranslate } from "@/components/providers/language-provider";
import { useRef, useState, type ReactNode } from "react";
import { CheckCircle2, FileUp, UploadCloud, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ClassStreamId, StaffRole, UploadKind } from "@/types";
import { modules } from "@/data/mock";
import { useClassRegistry } from "@/lib/class-registry";
import { useMaterialsStore } from "@/lib/materials-store";
import { MAX_UPLOAD_BYTES, publishBatch, type UploadState } from "@/lib/upload-batch";
import { invalidateQueries } from "@/lib/supabase/query-cache";
import { useStaffSession } from "@/lib/staff-auth";

const kinds: { id: UploadKind; label: string }[] = [
  { id: "notes", label: "Notes" }, { id: "slides", label: "Slides" },
  { id: "past_paper", label: "Past paper" }, { id: "assignment", label: "Assignment" },
  { id: "announcement", label: "Announcement" },
];
const control = "focus-ring h-10 w-full rounded-xl border border-border bg-background px-3 text-sm disabled:opacity-60";
type QueuedFile = { id: string; file: File; title: string; state: UploadState; error?: string };
const stateLabels: Record<UploadState, string> = { queued: "Ready to upload", uploading: "Uploading…", published: "Published", failed: "Upload failed" };

export function UploadWorkspace({ title, description, defaultKind = "notes", uploadedBy, role, footerNote, allowedModuleIds, onBusyChange }: {
  title: string; description: string; defaultKind?: UploadKind; uploadedBy: string; role: StaffRole;
  footerNote?: ReactNode; allowedModuleIds?: string[]; onBusyChange?: (busy: boolean) => void;
}) {
  const t = useTranslate();
  const { streams, ready: classesReady, error: classesError } = useClassRegistry();
  const { session } = useStaffSession();
  const recipientStreams = role === "lecturer" ? streams.filter(stream => session?.streamIds.includes(stream.id)) : role === "class_rep" ? streams.filter(stream => session?.streamId === stream.id) : streams;
  const canTargetAll = role === "admin" || role === "lecturer" && (classesReady && streams.length > 0 && streams.every(stream => session?.streamIds.includes(stream.id)));
  const { publish } = useMaterialsStore();
  const catalog = allowedModuleIds === undefined ? modules : modules.filter(module => allowedModuleIds.includes(module.id));
  const [kind, setKind] = useState<UploadKind>(defaultKind);
  const [moduleId, setModuleId] = useState(catalog[0]?.id ?? "");
  const [selectedStream, setStreamId] = useState<ClassStreamId | "all">("all");
  const streamId = selectedStream === "all" && canTargetAll ? "all" : recipientStreams.some(stream => stream.id === selectedStream) ? selectedStream : recipientStreams[0]?.id;
  const [dueAt, setDueAt] = useState("");
  const [onlineSubmission, setOnlineSubmission] = useState(false);
  const [files, setFiles] = useState<QueuedFile[]>([]);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState("");
  const busy = useRef(false);
  const pending = files.filter(item => item.state !== "published");
  const done = files.filter(item => item.state === "published").length;

  function addFiles(selected: FileList | File[]) {
    if (busy.current) return;
    const incoming = Array.from(selected);
    if (incoming.some(file => file.size < 1 || file.size > MAX_UPLOAD_BYTES)) {
      setError("Each file must be non-empty and no larger than 500 MB."); return;
    }
    setError("");
    setFiles(previous => [...previous, ...incoming.filter(file => !previous.some(item => item.file.name === file.name && item.file.size === file.size && item.file.lastModified === file.lastModified))
      .map(file => ({ id: crypto.randomUUID(), file, title: file.name.replace(/\.[^.]+$/, ""), state: "queued" as const }))]);
  }

  async function handlePublish() {
    if (busy.current || !pending.length) return;
    if (!streamId || !classesReady || classesError) { setError("Choose an available teaching class."); return; }
    if (kind === "assignment" && onlineSubmission && streamId === "all") { setError("Choose a specific class for online submissions."); return; }
    if (!moduleId || !catalog.some(module => module.id === moduleId)) { setError("Select a module you teach."); return; }
    if (pending.some(item => !item.title.trim())) { setError("Enter a title for every file."); return; }
    busy.current = true; setPublishing(true); onBusyChange?.(true); setError("");
    try {
      await publishBatch(pending, item => publish({
        onlineSubmission: kind === "assignment" && onlineSubmission,
        title: item.title.trim(), file: item.file, kind, moduleId, streamId, uploadedBy, role,
        dueAt: kind === "assignment" && dueAt ? new Date(dueAt).toISOString() : undefined,
      }, { deferRefresh: true }), (index, state, message) => {
        const id = pending[index].id;
        setFiles(previous => previous.map(item => item.id === id ? { ...item, state, error: message } : item));
      });
    } finally {
      invalidateQueries("materials"); window.dispatchEvent(new Event("darasax:materials"));
      busy.current = false; setPublishing(false); onBusyChange?.(false);
    }
  }

  return <div className="space-y-4">
    <div><h2 className="font-heading text-base font-semibold">{t(title)}</h2><p className="mt-1 text-sm text-muted-foreground">{t(description)}</p></div>
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="space-y-1.5 sm:col-span-2"><span className="text-xs font-medium">{t("Target stream")}</span>
        <select value={streamId} disabled={publishing} onChange={event => setStreamId(event.target.value as ClassStreamId | "all")} className={control}>
          {canTargetAll && <option value="all">{t("All streams")}</option>}
          {recipientStreams.map(stream => <option key={stream.id} value={stream.id}>{stream.label}</option>)}
        </select>
        <p className="text-xs text-muted-foreground">{t(streamId === "all" ? "These files will be available to approved students in every stream." : "These files will be available only to the selected class.")}</p>
        {!classesReady && <p className="text-xs text-muted-foreground">{t("Loading classes...")}</p>}
        {classesError && <p role="alert" className="text-xs text-danger">{t(classesError)}</p>}
      </label>
      <label className="space-y-1.5"><span className="text-xs font-medium">{t("Type")}</span>
        <select value={kind} disabled={publishing} onChange={event => setKind(event.target.value as UploadKind)} className={control}>
          {kinds.filter(item => defaultKind === "announcement" ? item.id === "announcement" : item.id !== "announcement").map(item => <option key={item.id} value={item.id}>{t(item.label)}</option>)}
        </select>
      </label>
      <label className="space-y-1.5"><span className="text-xs font-medium">{t("Module")}</span>
        <select value={moduleId} disabled={publishing || !catalog.length} onChange={event => setModuleId(event.target.value)} className={control}>
          {!catalog.length && <option value="">{t("No modules assigned")}</option>}
          {catalog.map(module => <option key={module.id} value={module.id}>{module.code} · {module.name}</option>)}
        </select>
      </label>
    </div>
    {kind === "assignment" && <label className="block space-y-1.5"><span className="text-xs font-medium">{t("Assignment deadline (optional)")}</span>
      <input type="datetime-local" value={dueAt} disabled={publishing} onChange={event => setDueAt(event.target.value)} className={control} />
    </label>}
    {kind === "assignment" && <label className="flex items-start gap-3 rounded-xl border border-border p-3 text-sm"><input type="checkbox" checked={onlineSubmission} disabled={publishing} onChange={e => setOnlineSubmission(e.target.checked)} className="mt-1 accent-primary" /><span>{t("Accept online submissions")}<span className="mt-1 block text-xs text-muted-foreground">{t("Students can upload one file and replace it until the deadline. Leave off for offline hand-in.")}</span></span></label>}
    <label onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); addFiles(event.dataTransfer.files); }}
      className="focus-ring flex cursor-pointer flex-col items-center rounded-2xl border border-dashed border-border bg-muted/30 px-4 py-7 text-center hover:border-primary/50">
      <input type="file" multiple disabled={publishing} className="sr-only" accept=".pdf,.ppt,.pptx,.doc,.docx,.png,.jpg,.jpeg,.zip,.txt,.md"
        onChange={event => { if (event.target.files) addFiles(event.target.files); event.target.value = ""; }} />
      <UploadCloud className="h-7 w-7 text-primary" aria-hidden />
      <span className="mt-3 text-sm font-semibold">{t("Drop files here or click to browse")}</span>
      <span className="mt-1 text-xs text-muted-foreground">{t("Select multiple files. Maximum 500 MB per file.")}</span>
    </label>
    {files.length > 0 && <ul className="max-h-80 space-y-2 overflow-y-auto" aria-label={t("Selected files")}>
      {files.map(item => <li key={item.id} className="rounded-xl border border-border p-3">
        <div className="flex items-start gap-2"><div className="min-w-0 flex-1">
          <p className="truncate text-xs text-muted-foreground" title={item.file.name}>{item.file.name} · {(item.file.size / 1024 / 1024).toFixed(1)} MB</p>
          <label className="mt-2 block"><span className="sr-only">{t("Title")} — {item.file.name}</span><input value={item.title}
            disabled={publishing || item.state === "published"} onChange={event => setFiles(previous => previous.map(file => file.id === item.id ? { ...file, title: event.target.value } : file))} className={control} /></label>
        </div><button type="button" aria-label={`${t("Remove")} ${item.file.name}`} disabled={publishing} onClick={() => setFiles(previous => previous.filter(file => file.id !== item.id))} className="focus-ring rounded-lg p-2 text-muted-foreground disabled:opacity-40"><X className="h-4 w-4" /></button></div>
        <p className={`mt-2 text-xs ${item.state === "failed" ? "text-danger" : item.state === "published" ? "text-success" : "text-muted-foreground"}`} role="status">{t(stateLabels[item.state])}</p>
        {item.error && <p className="mt-1 break-words text-xs text-danger">{t(item.error)}</p>}
      </li>)}
    </ul>}
    {error && <p role="alert" className="rounded-xl bg-danger/10 p-3 text-sm text-danger">{t(error)}</p>}
    <div className="flex flex-wrap items-center gap-2">
      <Button type="button" onClick={() => void handlePublish()} disabled={publishing || !pending.length || pending.some(item => !item.title.trim()) || !catalog.length}>
        <FileUp className="h-4 w-4" />{t(publishing ? "Publishing…" : files.some(item => item.state === "failed") ? "Retry failed uploads" : "Publish to students")}
      </Button>
      <Button type="button" variant="outline" disabled={publishing || !files.length} onClick={() => { setFiles([]); setError(""); }}>{t("Clear")}</Button>
      {done > 0 && <span className="inline-flex items-center gap-1 text-xs text-success"><CheckCircle2 className="h-4 w-4" />{done} / {files.length} {t("Published")}</span>}
    </div>
    {footerNote && <div className="text-xs text-muted-foreground">{t(footerNote)}</div>}
  </div>;
}
