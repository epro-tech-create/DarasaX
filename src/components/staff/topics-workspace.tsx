"use client";

import { useMemo, useState } from "react";
import { ListOrdered, Pencil, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StaffModal } from "@/components/staff/staff-modal";
import { StaffSection } from "@/components/staff/staff-ui";
import { modules } from "@/data/mock";
import { useTopicsStore } from "@/lib/topics-store";
import type { ModuleTopicRow } from "@/types/database";
import type { StaffRole } from "@/types";

type FormState = {
  moduleId: string;
  number: string;
  title: string;
  durationMinutes: string;
  summary: string;
  published: boolean;
};

const emptyForm = (moduleId = ""): FormState => ({
  moduleId,
  number: "1",
  title: "",
  durationMinutes: "20",
  summary: "",
  published: true,
});

export function TopicsWorkspace({
  role,
  createdBy,
  allowedModuleIds,
}: {
  role: StaffRole;
  createdBy: string;
  /** When set (e.g. lecturer), only these modules appear in filters/forms. */
  allowedModuleIds?: string[];
}) {
  const { rows, ready, createTopic, updateTopic, deleteTopic } = useTopicsStore();
  const catalog = useMemo(() => {
    if (!allowedModuleIds || allowedModuleIds.length === 0) return modules;
    const allowed = new Set(allowedModuleIds);
    return modules.filter((m) => allowed.has(m.id));
  }, [allowedModuleIds]);
  const [moduleFilter, setModuleFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(() =>
    emptyForm(catalog[0]?.id ?? ""),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const scopedRows = useMemo(() => {
    if (!allowedModuleIds || allowedModuleIds.length === 0) return rows;
    const allowed = new Set(allowedModuleIds);
    return rows.filter((t) => allowed.has(t.module_id));
  }, [rows, allowedModuleIds]);

  const filtered = useMemo(() => {
    return scopedRows
      .filter((t) => moduleFilter === "all" || t.module_id === moduleFilter)
      .sort(
        (a, b) =>
          a.module_id.localeCompare(b.module_id) || a.number - b.number,
      );
  }, [scopedRows, moduleFilter]);

  function nextNumberFor(moduleId: string) {
    return (
      scopedRows
        .filter((t) => t.module_id === moduleId)
        .reduce((max, t) => Math.max(max, t.number), 0) + 1
    );
  }

  function openAdd() {
    const moduleId =
      moduleFilter !== "all"
        ? moduleFilter
        : (catalog[0]?.id ?? "");
    setEditingId(null);
    setForm({
      ...emptyForm(moduleId),
      number: String(nextNumberFor(moduleId)),
    });
    setError("");
    setModalOpen(true);
  }

  function openEdit(row: ModuleTopicRow) {
    setEditingId(row.id);
    setForm({
      moduleId: row.module_id,
      number: String(row.number),
      title: row.title,
      durationMinutes: String(row.duration_minutes),
      summary: row.summary ?? "",
      published: row.published,
    });
    setError("");
    setModalOpen(true);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const number = Number(form.number);
    const durationMinutes = Number(form.durationMinutes);
    if (
      !form.title.trim() ||
      !form.moduleId ||
      number < 1 ||
      durationMinutes < 1
    ) {
      setError("Fill in title, module, topic number, and duration.");
      return;
    }
    setBusy(true);
    setError("");
    setMessage("");
    try {
      if (editingId) {
        await updateTopic(editingId, {
          moduleId: form.moduleId,
          number,
          title: form.title,
          durationMinutes,
          summary: form.summary,
          published: form.published,
        });
        setMessage("Topic updated — students see it on the module Overview.");
      } else {
        await createTopic({
          moduleId: form.moduleId,
          number,
          title: form.title,
          durationMinutes,
          summary: form.summary,
          published: form.published,
          createdBy,
          role,
        });
        setMessage("Topic published — students can mark it done for progress.");
      }
      setModalOpen(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not save topic.";
      setError(
        msg.toLowerCase().includes("duplicate") ||
          msg.toLowerCase().includes("unique")
          ? "That topic number already exists for this module. Pick another number."
          : msg,
      );
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(row: ModuleTopicRow) {
    if (
      !window.confirm(
        `Delete “${row.title}”? Students will lose this topic from the outline.`,
      )
    ) {
      return;
    }
    setMessage("");
    try {
      await deleteTopic(row.id);
      setMessage("Topic removed.");
    } catch {
      setError("Could not delete topic.");
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Module topics"
        description="Add the course outline per module. Students mark topics done to drive progress — this is not a file upload."
        actions={
          <Button
            size="sm"
            type="button"
            onClick={openAdd}
            disabled={catalog.length === 0}
          >
            <Plus className="h-3.5 w-3.5" />
            Add topic
          </Button>
        }
      />

      {message ? (
        <p className="rounded-xl border border-success/30 bg-success/10 px-3 py-2 text-[12px] font-medium text-success">
          {message}
        </p>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="block min-w-0 flex-1 space-y-1">
          <span className="text-[11px] font-medium text-muted-foreground">
            Filter by module
          </span>
          <select
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            className="h-10 w-full rounded-xl border border-border bg-background px-3 text-[13px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            <option value="all">All modules</option>
            {catalog.map((m) => (
              <option key={m.id} value={m.id}>
                {m.code} · {m.name}
              </option>
            ))}
          </select>
        </label>
        <p className="text-[12px] text-muted-foreground sm:pt-5">
          {ready
            ? `${filtered.length} topic${filtered.length === 1 ? "" : "s"}`
            : "Loading…"}
        </p>
      </div>

      {catalog.length === 0 ? (
        <p className="rounded-xl border border-warning/30 bg-warning/10 px-3 py-2 text-[12px] text-warning">
          No modules assigned to your profile. Complete lecturer onboarding or
          ask an admin to assign modules.
        </p>
      ) : null}

      <StaffSection
        title="Course outline"
        description="Same list students see under each module’s Overview tab (when published)."
      >
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <ListOrdered className="h-8 w-8 text-muted-foreground/50" />
            <p className="text-[12px] text-muted-foreground">
              No topics yet. Add the first one for a module.
            </p>
            <Button size="sm" type="button" onClick={openAdd}>
              <Plus className="h-3.5 w-3.5" />
              Add topic
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((row) => {
              const module = catalog.find((m) => m.id === row.module_id) ??
                modules.find((m) => m.id === row.module_id);
              return (
                <div
                  key={row.id}
                  className="flex flex-col gap-3 rounded-xl border border-border/70 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="mb-1 flex flex-wrap items-center gap-1.5">
                      <Badge tone="primary">
                        Topic {String(row.number).padStart(2, "0")}
                      </Badge>
                      <Badge>{module?.code ?? row.module_id}</Badge>
                      {!row.published ? (
                        <Badge tone="warning">Draft</Badge>
                      ) : null}
                    </div>
                    <p className="truncate text-[13px] font-semibold">
                      {row.title}
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {module?.name} · {row.duration_minutes} min
                      {row.summary
                        ? ` · ${row.summary.slice(0, 80)}${row.summary.length > 80 ? "…" : ""}`
                        : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      type="button"
                      onClick={() => openEdit(row)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      type="button"
                      onClick={() => void onDelete(row)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </StaffSection>

      <StaffModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Edit topic" : "Add topic"}
        description="Students see published topics on the module Overview and use them for progress."
      >
        <form className="space-y-3" onSubmit={onSubmit}>
          <label className="block space-y-1.5">
            <span className="text-[11px] font-medium text-muted-foreground">
              Module
            </span>
            <select
              value={form.moduleId}
              onChange={(e) =>
                setForm((f) => ({ ...f, moduleId: e.target.value }))
              }
              className="h-10 w-full rounded-xl border border-border bg-background px-3 text-[13px]"
              required
            >
              {catalog.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.code} · {m.name}
                </option>
              ))}
            </select>
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1.5">
              <span className="text-[11px] font-medium text-muted-foreground">
                Topic number
              </span>
              <input
                type="number"
                min={1}
                value={form.number}
                onChange={(e) =>
                  setForm((f) => ({ ...f, number: e.target.value }))
                }
                className="h-10 w-full rounded-xl border border-border bg-background px-3 text-[13px]"
                required
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-[11px] font-medium text-muted-foreground">
                Duration (minutes)
              </span>
              <input
                type="number"
                min={1}
                value={form.durationMinutes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, durationMinutes: e.target.value }))
                }
                className="h-10 w-full rounded-xl border border-border bg-background px-3 text-[13px]"
                required
              />
            </label>
          </div>
          <label className="block space-y-1.5">
            <span className="text-[11px] font-medium text-muted-foreground">
              Title
            </span>
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Requirements Engineering"
              className="h-10 w-full rounded-xl border border-border bg-background px-3 text-[13px]"
              required
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-[11px] font-medium text-muted-foreground">
              Summary (optional)
            </span>
            <textarea
              value={form.summary}
              onChange={(e) =>
                setForm((f) => ({ ...f, summary: e.target.value }))
              }
              rows={3}
              placeholder="Short description students see on the topic page"
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-[13px]"
            />
          </label>
          <label className="flex items-center gap-2 text-[12px]">
            <input
              type="checkbox"
              checked={form.published}
              onChange={(e) =>
                setForm((f) => ({ ...f, published: e.target.checked }))
              }
              className="h-4 w-4 rounded border-border"
            />
            Published (visible to students)
          </label>
          {error ? (
            <p className="text-[12px] font-medium text-danger">{error}</p>
          ) : null}
          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? "Saving…" : editingId ? "Save changes" : "Publish topic"}
            </Button>
          </div>
        </form>
      </StaffModal>
    </div>
  );
}
