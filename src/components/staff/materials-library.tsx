"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ClipboardList,
  Download,
  Eye,
  FileText,
  FolderOpen,
  Image as ImageIcon,
  LayoutGrid,
  Layers,
  List,
  Megaphone,
  Pencil,
  Presentation,
  Search,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StaffModal } from "@/components/staff/staff-modal";
import { classStreams, getModule, modules } from "@/data/mock";
import {
  downloadMaterial,
  useMaterialsStore,
  viewMaterial,
} from "@/lib/materials-store";
import { cn } from "@/lib/utils";
import type { ClassStreamId, MaterialUpload, UploadKind } from "@/types";

const VIEW_KEY = "darasax-library-view";

const kinds: { id: UploadKind; label: string }[] = [
  { id: "notes", label: "Notes" },
  { id: "slides", label: "Slides" },
  { id: "past_paper", label: "Past paper" },
  { id: "assignment", label: "Assignment" },
  { id: "announcement", label: "Announcement" },
  { id: "timetable", label: "Timetable" },
];

const kindIcon: Record<UploadKind, LucideIcon> = {
  notes: FileText,
  slides: Presentation,
  past_paper: ClipboardList,
  assignment: Layers,
  announcement: Megaphone,
  timetable: FolderOpen,
};

function resolveIcon(item: MaterialUpload): LucideIcon {
  const name = (item.fileName ?? item.mimeType ?? "").toLowerCase();
  if (/\.(png|jpe?g|gif|webp)$/.test(name) || name.includes("image/")) {
    return ImageIcon;
  }
  return kindIcon[item.kind] ?? FileText;
}

function FileActions({
  busy,
  onView,
  onDownload,
  onEdit,
  onDelete,
  className,
}: {
  busy: boolean;
  onView: () => void;
  onDownload: () => void;
  onEdit: () => void;
  onDelete: () => void;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      <button
        type="button"
        disabled={busy}
        aria-label="Open"
        title="Open"
        onClick={onView}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40"
      >
        <Eye className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        disabled={busy}
        aria-label="Download"
        title="Download"
        onClick={onDownload}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40"
      >
        <Download className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        disabled={busy}
        aria-label="Edit"
        title="Edit"
        onClick={onEdit}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40"
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        disabled={busy}
        aria-label="Delete"
        title="Delete"
        onClick={onDelete}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-danger/10 hover:text-danger disabled:opacity-40"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function MaterialsLibrary({
  title = "Files",
  filterItems,
}: {
  title?: string;
  filterItems?: (items: MaterialUpload[]) => MaterialUpload[];
}) {
  const { items, ready, updateItem, deleteItem, bumpDownloads } =
    useMaterialsStore();
  const [query, setQuery] = useState("");
  const [kindFilter, setKindFilter] = useState<"all" | UploadKind>("all");
  const [view, setView] = useState<"cards" | "list">("list");
  const [editing, setEditing] = useState<MaterialUpload | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    title: "",
    kind: "notes" as UploadKind,
    moduleId: modules[0]?.id ?? "",
    streamId: "all" as ClassStreamId | "all",
    status: "published" as MaterialUpload["status"],
    file: null as File | null,
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(VIEW_KEY);
      if (saved === "list" || saved === "cards") setView(saved);
    } catch {
      // ignore
    }
  }, []);

  function changeView(next: "cards" | "list") {
    setView(next);
    try {
      localStorage.setItem(VIEW_KEY, next);
    } catch {
      // ignore
    }
  }

  const source = useMemo(
    () => (filterItems ? filterItems(items) : items),
    [items, filterItems],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return source
      .filter((item) => {
        const module = item.moduleId ? getModule(item.moduleId) : null;
        const hay =
          `${item.title} ${module?.name ?? ""} ${module?.code ?? ""} ${item.uploadedBy}`.toLowerCase();
        return (
          (!q || hay.includes(q)) &&
          (kindFilter === "all" || item.kind === kindFilter)
        );
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }, [source, query, kindFilter]);

  function openEdit(item: MaterialUpload) {
    setEditing(item);
    setForm({
      title: item.title,
      kind: item.kind,
      moduleId: item.moduleId ?? modules[0]?.id ?? "",
      streamId: item.streamId ?? "all",
      status: item.status,
      file: null,
    });
  }

  function closeEdit() {
    setEditing(null);
    setForm((f) => ({ ...f, file: null }));
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!editing || !form.title.trim()) return;
    setBusyId(editing.id);
    try {
      await updateItem(editing.id, {
        title: form.title,
        kind: form.kind,
        moduleId: form.moduleId,
        streamId: form.streamId,
        status: form.status,
        file: form.file,
      });
      setMessage("Updated.");
      closeEdit();
    } finally {
      setBusyId(null);
    }
  }

  async function onView(item: MaterialUpload) {
    setBusyId(item.id);
    try {
      await viewMaterial(item);
    } finally {
      setBusyId(null);
    }
  }

  async function onDownload(item: MaterialUpload) {
    setBusyId(item.id);
    try {
      await downloadMaterial(item);
      bumpDownloads(item.id);
    } finally {
      setBusyId(null);
    }
  }

  async function onDelete(item: MaterialUpload) {
    if (!window.confirm(`Delete “${item.title}”?`)) return;
    setBusyId(item.id);
    try {
      await deleteItem(item.id);
      setMessage("Deleted.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search…"
            className="h-10 w-full rounded-xl border border-border bg-transparent pl-9 pr-3 text-[13px] outline-none focus:border-primary"
          />
        </div>
        <select
          value={kindFilter}
          onChange={(e) =>
            setKindFilter(e.target.value as "all" | UploadKind)
          }
          className="h-10 rounded-xl border border-border bg-transparent px-3 text-[13px] outline-none focus:border-primary sm:w-44"
        >
          <option value="all">All types</option>
          {kinds.map((k) => (
            <option key={k.id} value={k.id}>
              {k.label}
            </option>
          ))}
        </select>
        <div
          className="inline-flex h-10 items-center rounded-xl border border-border p-0.5"
          role="group"
          aria-label="View mode"
        >
          <button
            type="button"
            aria-label="List view"
            aria-pressed={view === "list"}
            title="List"
            onClick={() => changeView("list")}
            className={cn(
              "inline-flex h-9 w-9 items-center justify-center rounded-[10px] transition",
              view === "list"
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <List className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            aria-label="Card view"
            aria-pressed={view === "cards"}
            title="Cards"
            onClick={() => changeView("cards")}
            className={cn(
              "inline-flex h-9 w-9 items-center justify-center rounded-[10px] transition",
              view === "cards"
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {message ? (
        <p className="text-[12px] text-success">{message}</p>
      ) : null}

      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-[13px] font-medium text-muted-foreground">
          {title}
        </h2>
        <p className="text-[12px] tabular-nums text-muted-foreground">
          {ready ? filtered.length : "…"}
        </p>
      </div>

      {filtered.length === 0 ? (
        <div className="py-16 text-center text-[13px] text-muted-foreground">
          No files
        </div>
      ) : view === "cards" ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((item) => {
            const module = item.moduleId ? getModule(item.moduleId) : null;
            const Icon = resolveIcon(item);
            const busy = busyId === item.id;
            return (
              <article
                key={item.id}
                className="group flex flex-col rounded-2xl border border-border/70 bg-card p-4"
              >
                <div className="flex items-start gap-3">
                  <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="line-clamp-2 text-[13px] font-medium leading-snug">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {module?.code ?? "General"} · {item.size}
                    </p>
                  </div>
                </div>
                <FileActions
                  busy={busy}
                  className="mt-5 border-t border-border/50 pt-3 opacity-70 transition group-hover:opacity-100"
                  onView={() => onView(item)}
                  onDownload={() => onDownload(item)}
                  onEdit={() => openEdit(item)}
                  onDelete={() => onDelete(item)}
                />
              </article>
            );
          })}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border/70">
          <ul className="divide-y divide-border/60">
            {filtered.map((item) => {
              const module = item.moduleId ? getModule(item.moduleId) : null;
              const Icon = resolveIcon(item);
              const busy = busyId === item.id;
              return (
                <li
                  key={item.id}
                  className="flex items-center gap-3 px-3 py-2.5 sm:px-4"
                >
                  <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium">
                      {item.title}
                    </p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {module?.code ?? "General"} · {item.size}
                    </p>
                  </div>
                  <FileActions
                    busy={busy}
                    className="shrink-0"
                    onView={() => onView(item)}
                    onDownload={() => onDownload(item)}
                    onEdit={() => openEdit(item)}
                    onDelete={() => onDelete(item)}
                  />
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <StaffModal
        open={!!editing}
        onClose={closeEdit}
        title="Edit file"
        description="Changes sync to students."
      >
        <form onSubmit={onSave} className="space-y-3">
          <label className="block space-y-1">
            <span className="text-[11px] text-muted-foreground">Title</span>
            <input
              required
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="h-10 w-full rounded-xl border border-border bg-background px-3 text-[13px] outline-none focus:border-primary"
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1">
              <span className="text-[11px] text-muted-foreground">Type</span>
              <select
                value={form.kind}
                onChange={(e) =>
                  setForm((f) => ({ ...f, kind: e.target.value as UploadKind }))
                }
                className="h-10 w-full rounded-xl border border-border bg-background px-3 text-[13px]"
              >
                {kinds.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1">
              <span className="text-[11px] text-muted-foreground">Status</span>
              <select
                value={form.status}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    status: e.target.value as MaterialUpload["status"],
                  }))
                }
                className="h-10 w-full rounded-xl border border-border bg-background px-3 text-[13px]"
              >
                <option value="published">Published</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="rejected">Rejected</option>
              </select>
            </label>
            <label className="block space-y-1">
              <span className="text-[11px] text-muted-foreground">Module</span>
              <select
                value={form.moduleId}
                onChange={(e) =>
                  setForm((f) => ({ ...f, moduleId: e.target.value }))
                }
                className="h-10 w-full rounded-xl border border-border bg-background px-3 text-[13px]"
              >
                {modules.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.code}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1">
              <span className="text-[11px] text-muted-foreground">Stream</span>
              <select
                value={form.streamId}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    streamId: e.target.value as ClassStreamId | "all",
                  }))
                }
                className="h-10 w-full rounded-xl border border-border bg-background px-3 text-[13px]"
              >
                <option value="all">All streams</option>
                {classStreams.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="block space-y-1">
            <span className="text-[11px] text-muted-foreground">
              Replace file
            </span>
            <input
              type="file"
              accept=".pdf,.ppt,.pptx,.doc,.docx,.png,.jpg,.jpeg,.zip,.txt,.md"
              onChange={(e) =>
                setForm((f) => ({ ...f, file: e.target.files?.[0] ?? null }))
              }
              className="block w-full text-[12px] text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-muted file:px-3 file:py-2 file:text-[12px]"
            />
          </label>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={closeEdit}>
              Cancel
            </Button>
            <Button type="submit" disabled={busyId === editing?.id}>
              Save
            </Button>
          </div>
        </form>
      </StaffModal>
    </div>
  );
}
