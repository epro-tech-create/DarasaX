"use client";

import { useTranslate } from "@/components/providers/language-provider";
import { useMemo, useState } from "react";
import { GraduationCap, Pencil, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StaffModal } from "@/components/staff/staff-modal";
import { StaffSection, StaffStatCard } from "@/components/staff/staff-ui";
import { useClassRegistry } from "@/lib/class-registry";
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
  const translateUI = useTranslate();
  const { streams: classStreams } = useClassRegistry();
  const {
    classReps,
    addClassRep,
    updateClassRep,
    deleteClassRep,
    streamsWithoutCr,
  } = useAdminPeopleStore();
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ClassRepAccount | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [note, setNote] = useState("");
  const [formError, setFormError] = useState("");

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

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (saving || !form.name.trim() || !form.email.trim()) return;
    setSaving(true);
    setNote("");
    setFormError("");
    try {
      if (editing) {
        await updateClassRep(editing.id, {
          name: form.name,
          email: form.email,
          phone: form.phone,
          streamId: form.streamId,
          status: form.status,
        });
        setNote("Class rep updated.");
      } else {
        await addClassRep({
          name: form.name,
          email: form.email,
          phone: form.phone,
          streamId: form.streamId,
          status: form.status,
        });
        setNote(`CR appointed for ${form.streamId}.`);
      }
      closeModal();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  }

  function onDelete(cr: ClassRepAccount) {
    if (!window.confirm(translateUI(`Remove ${cr.name} as class representative?`))) return;
    deleteClassRep(cr.id).then(
      () => setNote(`Removed ${cr.name}.`),
      (err: unknown) =>
        setNote(
          `Could not remove: ${err instanceof Error ? err.message : "try again."}`,
        ),
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title={translateUI("Class representatives")}
        description={translateUI("Appoint, edit, or remove CRs. Up to two active CRs per class.")}
        actions={
          <Button size="sm" type="button" onClick={openAdd}>
            <Plus className="h-3.5 w-3.5" />
            Add CR
          </Button>
        }
      />

      <div className="grid gap-2.5 sm:grid-cols-3">
        <StaffStatCard
          label={translateUI("Active CRs")}
          value={`${active.length}/${classStreams.length * 2}`}
          icon={GraduationCap}
          tone="success"
        />
        <StaffStatCard
          label={translateUI("Classes fully staffed")}
          value={`${classStreams.length - streamsWithoutCr.length}/${classStreams.length}`}
          icon={GraduationCap}
        />
        <StaffStatCard
          label={translateUI("Classes needing CRs")}
          value={String(streamsWithoutCr.length)}
          hint={
            streamsWithoutCr.length
              ? streamsWithoutCr.map((s) => s.label).join(", ")
              : translateUI("All classes have two CRs")
          }
          icon={GraduationCap}
          tone={streamsWithoutCr.length ? "warning" : "success"}
        />
      </div>

      {note ? <p className="text-[12px] font-medium text-success">{translateUI(note)}</p> : null}
      {formError ? <p className="text-[12px] font-medium text-danger">{translateUI(formError)}</p> : null}

      <StaffSection title={translateUI("CR directory")} description={translateUI(`${classReps.length} records`)}>
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
                    {translateUI(cr.status)}
                  </Badge>
                </div>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {translateUI(cr.streamId)} · {cr.email}
                  {translateUI(cr.phone ? ` · ${cr.phone}` : "")}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {translateUI("Appointed")}{" "}
                  {translateUI(new Date(cr.appointedAt).toLocaleDateString(translateUI.locale, {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  }))}
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
                  {translateUI("Edit")}</Button>
                <Button
                  size="sm"
                  type="button"
                  variant="ghost"
                  className="text-danger hover:bg-danger/10 hover:text-danger"
                  onClick={() => onDelete(cr)}
                >
                  <Trash2 className="h-3 w-3" />
                  {translateUI("Delete")}</Button>
              </div>
            </div>
          ))}
        </div>
      </StaffSection>

      <StaffModal
        open={modalOpen}
        onClose={closeModal}
        title={translateUI(editing ? "Edit class rep" : "Add class rep")}
        description={
          translateUI(editing
            ? "Update CR details. Each class supports two active representatives; neither replaces the other."
            : "Appoint an existing verified student using their registered email. They keep the same login.")
        }
      >
        <form onSubmit={onSubmit} className="space-y-3">
          <label className="block space-y-1">
            <span className="text-[11px] text-muted-foreground">{translateUI("Full name")}</span>
            <input
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="h-10 w-full rounded-xl border border-border bg-background px-3 text-[13px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-[11px] text-muted-foreground">{translateUI("Email")}</span>
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="h-10 w-full rounded-xl border border-border bg-background px-3 text-[13px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-[11px] text-muted-foreground">{translateUI("Phone (optional)")}</span>
            <input
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              className="h-10 w-full rounded-xl border border-border bg-background px-3 text-[13px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1">
              <span className="text-[11px] text-muted-foreground">{translateUI("Stream")}</span>
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
                    {translateUI(s.label)}
                    {translateUI(s.isEvening ? " (Evening)" : "")}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1">
              <span className="text-[11px] text-muted-foreground">{translateUI("Status")}</span>
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
                <option value="active">{translateUI("Active")}</option>
                <option value="inactive">{translateUI("Inactive")}</option>
              </select>
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={closeModal}>
              {translateUI("Cancel")}</Button>
            <Button type="submit" disabled={saving}>{translateUI(saving ? "Saving..." : editing ? "Save changes" : "Appoint CR")}</Button>
          </div>
        </form>
      </StaffModal>
    </div>
  );
}
