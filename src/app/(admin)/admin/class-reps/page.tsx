"use client";

import { useMemo, useState } from "react";
import { GraduationCap, Pencil, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StaffModal } from "@/components/staff/staff-modal";
import { StaffSection, StaffStatCard } from "@/components/staff/staff-ui";
import { classStreams } from "@/data/mock";
import { useAdminPeopleStore } from "@/lib/admin-people-store";
import type { ClassRepAccount, ClassStreamId } from "@/types";

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  streamId: "BENG24COE-1" as ClassStreamId,
  status: "active" as ClassRepAccount["status"],
};

export default function AdminClassRepsPage() {
  const {
    classReps,
    addClassRep,
    updateClassRep,
    deleteClassRep,
    streamsWithoutCr,
  } = useAdminPeopleStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ClassRepAccount | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [note, setNote] = useState("");

  const active = useMemo(
    () => classReps.filter((c) => c.status === "active"),
    [classReps],
  );

  function openAdd() {
    setEditing(null);
    setForm({
      ...emptyForm,
      streamId: streamsWithoutCr[0]?.id ?? "BENG24COE-1",
    });
    setModalOpen(true);
  }

  function openEdit(cr: ClassRepAccount) {
    setEditing(cr);
    setForm({
      name: cr.name,
      email: cr.email,
      phone: cr.phone ?? "",
      streamId: cr.streamId,
      status: cr.status,
    });
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditing(null);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) return;
    if (editing) {
      updateClassRep(editing.id, {
        name: form.name,
        email: form.email,
        phone: form.phone,
        streamId: form.streamId,
        status: form.status,
      });
      setNote("Class rep updated.");
    } else {
      addClassRep({
        name: form.name,
        email: form.email,
        phone: form.phone,
        streamId: form.streamId,
        status: form.status,
      });
      setNote(`CR appointed for ${form.streamId}.`);
    }
    closeModal();
  }

  function onDelete(cr: ClassRepAccount) {
    if (!window.confirm(`Remove ${cr.name} as class representative?`)) return;
    deleteClassRep(cr.id);
    setNote(`Removed ${cr.name}.`);
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Class representatives"
        description="Appoint, edit, or remove CRs. One active CR per stream."
        actions={
          <Button size="sm" type="button" onClick={openAdd}>
            <Plus className="h-3.5 w-3.5" />
            Add CR
          </Button>
        }
      />

      <div className="grid gap-2.5 sm:grid-cols-3">
        <StaffStatCard
          label="Active CRs"
          value={String(active.length)}
          icon={GraduationCap}
          tone="success"
        />
        <StaffStatCard
          label="Streams covered"
          value={`${active.length}/${classStreams.length}`}
          icon={GraduationCap}
        />
        <StaffStatCard
          label="Need CR"
          value={String(streamsWithoutCr.length)}
          hint={
            streamsWithoutCr.length
              ? streamsWithoutCr.map((s) => s.label).join(", ")
              : "All streams have a CR"
          }
          icon={GraduationCap}
          tone={streamsWithoutCr.length ? "warning" : "success"}
        />
      </div>

      {note ? <p className="text-[12px] font-medium text-success">{note}</p> : null}

      <StaffSection title="CR directory" description={`${classReps.length} records`}>
        <div className="space-y-2">
          {classReps.map((cr) => (
            <div
              key={cr.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/70 px-3 py-3"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[13px] font-semibold">{cr.name}</p>
                  <Badge tone={cr.status === "active" ? "success" : "default"}>
                    {cr.status}
                  </Badge>
                </div>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {cr.streamId} · {cr.email}
                  {cr.phone ? ` · ${cr.phone}` : ""}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  Appointed{" "}
                  {new Date(cr.appointedAt).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  type="button"
                  variant="outline"
                  onClick={() => openEdit(cr)}
                >
                  <Pencil className="h-3 w-3" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  type="button"
                  variant="ghost"
                  className="text-danger hover:bg-danger/10 hover:text-danger"
                  onClick={() => onDelete(cr)}
                >
                  <Trash2 className="h-3 w-3" />
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      </StaffSection>

      <StaffModal
        open={modalOpen}
        onClose={closeModal}
        title={editing ? "Edit class rep" : "Add class rep"}
        description={
          editing
            ? "Update CR details. Activating on a stream deactivates the previous CR."
            : "Appoint a CR. An existing active CR on that stream is deactivated."
        }
      >
        <form onSubmit={onSubmit} className="space-y-3">
          <label className="block space-y-1">
            <span className="text-[11px] text-muted-foreground">Full name</span>
            <input
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="h-10 w-full rounded-xl border border-border bg-background px-3 text-[13px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-[11px] text-muted-foreground">Email</span>
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="h-10 w-full rounded-xl border border-border bg-background px-3 text-[13px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-[11px] text-muted-foreground">Phone (optional)</span>
            <input
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              className="h-10 w-full rounded-xl border border-border bg-background px-3 text-[13px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1">
              <span className="text-[11px] text-muted-foreground">Stream</span>
              <select
                value={form.streamId}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    streamId: e.target.value as ClassStreamId,
                  }))
                }
                className="h-10 w-full rounded-xl border border-border bg-background px-3 text-[13px]"
              >
                {classStreams.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                    {s.isEvening ? " (Evening)" : ""}
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
                    status: e.target.value as ClassRepAccount["status"],
                  }))
                }
                className="h-10 w-full rounded-xl border border-border bg-background px-3 text-[13px]"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit">{editing ? "Save changes" : "Appoint CR"}</Button>
          </div>
        </form>
      </StaffModal>
    </div>
  );
}
