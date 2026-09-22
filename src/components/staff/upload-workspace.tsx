"use client";

import { useState, type ReactNode } from "react";
import { CheckCircle2, FileUp, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ClassStreamId, StaffRole, UploadKind } from "@/types";
import { modules, classStreams } from "@/data/mock";
import { useMaterialsStore } from "@/lib/materials-store";

const kinds: { id: UploadKind; label: string }[] = [
  { id: "notes", label: "Notes" },
  { id: "slides", label: "Slides" },
  { id: "past_paper", label: "Past paper" },
  { id: "assignment", label: "Assignment" },
  { id: "announcement", label: "Announcement" },
];

export function UploadWorkspace({
  title,
  description,
  defaultKind = "notes",
  showStream = true,
  lockedStream,
  uploadedBy,
  role,
  footerNote,
}: {
  title: string;
  description: string;
  defaultKind?: UploadKind;
  showStream?: boolean;
  lockedStream?: ClassStreamId;
  uploadedBy: string;
  role: StaffRole;
  footerNote?: ReactNode;
}) {
  const { publish } = useMaterialsStore();
  const [kind, setKind] = useState<UploadKind>(defaultKind);
  const [moduleId, setModuleId] = useState(modules[0]?.id ?? "");
  const [streamId, setStreamId] = useState<ClassStreamId | "all">(
    lockedStream ?? classStreams[0]?.id ?? "all",
  );
  const [titleValue, setTitleValue] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);
  const [error, setError] = useState("");

  function onFileChange(next?: File | null) {
    if (!next) return;
    setFile(next);
    if (!titleValue) setTitleValue(next.name.replace(/\.[^.]+$/, ""));
    setPublished(false);
    setError("");
  }

  async function handlePublish() {
    if (!titleValue.trim() || !file) return;
    setPublishing(true);
    setError("");
    try {
      await publish({
        title: titleValue.trim(),
        kind,
        moduleId,
        streamId: lockedStream ?? streamId,
        uploadedBy,
        role,
        file,
      });
      setPublished(true);
      setFile(null);
      setTitleValue("");
    } catch {
      setError("Could not save the file. Try a smaller file and publish again.");
    } finally {
      setPublishing(false);
    }
  }

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,0.65fr)]">
      <div className="surface min-w-0 rounded-[20px] p-4 sm:p-5">
        <div className="mb-4">
          <h2 className="font-heading text-[15px] font-semibold">{title}</h2>
          <p className="mt-1 text-[12px] text-muted-foreground">{description}</p>
        </div>

        <label
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/30 px-4 py-10 text-center transition hover:border-primary/50 hover:bg-primary/[0.04]",
            file && "border-primary/40 bg-primary/[0.05]",
          )}
        >
          <input
            type="file"
            className="hidden"
            accept=".pdf,.ppt,.pptx,.doc,.docx,.png,.jpg,.jpeg,.zip,.txt,.md"
            onChange={(e) => onFileChange(e.target.files?.[0])}
          />
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/12 text-primary">
            <UploadCloud className="h-5 w-5" />
          </span>
          <p className="mt-3 text-[13px] font-semibold">
            {file ? file.name : "Drop file or browse"}
          </p>
          <p className="mt-1 max-w-sm text-[11px] text-muted-foreground">
            The real file is stored so students (and you) can view or download it.
          </p>
        </label>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block space-y-1.5 sm:col-span-2">
            <span className="text-[11px] font-medium text-muted-foreground">Title</span>
            <input
              value={titleValue}
              onChange={(e) => setTitleValue(e.target.value)}
              placeholder="e.g. Topic 04 — Fourier notes"
              className="h-10 w-full rounded-xl border border-border bg-background px-3 text-[13px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-[11px] font-medium text-muted-foreground">Type</span>
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value as UploadKind)}
              className="h-10 w-full rounded-xl border border-border bg-background px-3 text-[13px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              {kinds.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-1.5">
            <span className="text-[11px] font-medium text-muted-foreground">Module</span>
            <select
              value={moduleId}
              onChange={(e) => setModuleId(e.target.value)}
              className="h-10 w-full rounded-xl border border-border bg-background px-3 text-[13px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              {modules.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.code} · {m.name}
                </option>
              ))}
            </select>
          </label>

          {showStream && !lockedStream ? (
            <label className="block space-y-1.5 sm:col-span-2">
              <span className="text-[11px] font-medium text-muted-foreground">
                Target stream
              </span>
              <select
                value={streamId}
                onChange={(e) =>
                  setStreamId(e.target.value as ClassStreamId | "all")
                }
                className="h-10 w-full rounded-xl border border-border bg-background px-3 text-[13px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                <option value="all">All streams</option>
                {classStreams.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                    {s.isEvening ? " (Evening)" : ""}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
        </div>

        {error ? (
          <p className="mt-3 text-[12px] font-medium text-danger">{error}</p>
        ) : null}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button
            type="button"
            onClick={handlePublish}
            disabled={!file || !titleValue.trim() || publishing}
          >
            <FileUp className="h-3.5 w-3.5" />
            {publishing ? "Publishing…" : "Publish to students"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setFile(null);
              setTitleValue("");
              setPublished(false);
              setError("");
            }}
          >
            Clear
          </Button>
          {published ? (
            <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-success">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Live on student Modules / Past Papers
            </span>
          ) : null}
        </div>
        {footerNote}
      </div>

      <aside className="flex min-w-0 flex-col gap-3">
        <div className="gradient-primary relative overflow-hidden rounded-[20px] p-4 text-white shadow-lg shadow-primary/20">
          <div className="absolute -right-6 -top-8 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
          <p className="relative text-[11px] font-medium uppercase tracking-[0.12em] text-white/75">
            Student delivery
          </p>
          <p className="relative mt-2 font-heading text-[15px] font-semibold leading-snug">
            One publish → student accounts
          </p>
          <p className="relative mt-2 text-[12px] text-white/80">
            Pick the module carefully. Notes and slides appear on that module’s
            Notes tab; past papers appear under Past Papers for the whole class.
          </p>
        </div>
        <div className="surface rounded-[20px] p-4">
          <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
            Before you publish
          </p>
          <ul className="mt-3 space-y-2.5 text-[12px] text-muted-foreground">
            {[
              "Clear title students recognise",
              "Correct module selected",
              "Readable file (not blurry scans)",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                <span className="leading-snug">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}
