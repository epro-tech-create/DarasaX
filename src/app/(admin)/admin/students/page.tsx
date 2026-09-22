"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, GraduationCap, Pencil, Plus, Trash2, Users } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StaffModal } from "@/components/staff/staff-modal";
import { StaffSection, StaffStatCard } from "@/components/staff/staff-ui";
import { classStreams } from "@/data/mock";
import { useAdminPeopleStore } from "@/lib/admin-people-store";
import type { ClassStreamId, StudentMonitor } from "@/types";

const emptyForm = {
  name: "",
  email: "",
  streamId: "BENG24COE-1" as ClassStreamId,
  year: 3,
  risk: "low" as StudentMonitor["risk"],
};

export default function AdminStudentsPage() {
  const { students, addStudent, updateStudent, deleteStudent } =
    useAdminPeopleStore();
  const [stream, setStream] = useState("all");
  const [risk, setRisk] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<StudentMonitor | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState("");

  const filtered = useMemo(() => {
    return students.filter(
      (s) =>
        (stream === "all" || s.streamId === stream) &&
        (risk === "all" || s.risk === risk),
    );
  }, [students, stream, risk]);

  const highRisk = students.filter((s) => s.risk === "high").length;
  const streamCount = new Set(students.map((s) => s.streamId)).size;

  function initials(name: string) {
    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("");
  }

  function openAdd() {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(s: StudentMonitor) {
    setEditing(s);
    setForm({
      name: s.name,
      email: s.email,
      streamId: s.streamId,
      year: s.year,
      risk: s.risk,
    });
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditing(null);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) return;
    setMessage("");
    try {
      if (editing) {
        await updateStudent(editing.id, {
          name: form.name,
          email: form.email,
          streamId: form.streamId,
          year: form.year,
          risk: form.risk,
        });
        setMessage("Student updated.");
      } else {
        await addStudent({
          name: form.name,
          email: form.email,
          streamId: form.streamId,
          year: form.year,
          risk: form.risk,
        });
        setMessage("Student added.");
      }
      closeModal();
    } catch {
      setMessage("Could not save. Check your connection and try again.");
    }
  }

  function onDelete(s: StudentMonitor) {
    if (!window.confirm(`Remove ${s.name} from the roster?`)) return;
    deleteStudent(s.id).then(
      () => setMessage(`Removed ${s.name}.`),
      () => setMessage("Could not remove. Try again."),
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Students"
        description="Add, edit, or remove students. Changes sync across Admin and Class Rep."
        actions={
          <Button size="sm" type="button" onClick={openAdd}>
            <Plus className="h-3.5 w-3.5" />
            Add student
          </Button>
        }
      />

      <div className="grid gap-2.5 sm:grid-cols-3">
        <StaffStatCard label="Students" value={String(students.length)} icon={Users} />
        <StaffStatCard
          label="Streams"
          value={String(streamCount)}
          icon={GraduationCap}
        />
        <StaffStatCard
          label="High risk"
          value={String(highRisk)}
          icon={AlertTriangle}
          tone={highRisk ? "danger" : "success"}
        />
      </div>

      {message ? (
        <p className="text-[12px] font-medium text-success">{message}</p>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row">
        <select
          value={stream}
          onChange={(e) => setStream(e.target.value)}
          className="h-10 rounded-xl border border-border bg-background px-3 text-[13px]"
        >
          <option value="all">All streams</option>
          {classStreams.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
        <select
          value={risk}
          onChange={(e) => setRisk(e.target.value)}
          className="h-10 rounded-xl border border-border bg-background px-3 text-[13px]"
        >
          <option value="all">All risk</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>

      <StaffSection title="Roster" description={`${filtered.length} students`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-[12px]">
            <thead>
              <tr className="border-b border-border text-[10px] uppercase tracking-wide text-muted-foreground">
                <th className="pb-2 pr-3 font-medium">Student</th>
                <th className="pb-2 pr-3 font-medium">Stream</th>
                <th className="pb-2 pr-3 font-medium">Year</th>
                <th className="pb-2 pr-3 font-medium">Risk</th>
                <th className="pb-2 text-right font-medium"> </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} className="border-b border-border/60 last:border-0">
                  <td className="py-3 pr-3">
                    <div className="flex items-center gap-2.5">
                      <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/12 text-[11px] font-semibold text-primary">
                        {initials(s.name)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{s.name}</p>
                        <p className="truncate text-[11px] text-muted-foreground">
                          {s.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 pr-3 text-muted-foreground">{s.streamId}</td>
                  <td className="py-3 pr-3 tabular-nums">{s.year}</td>
                  <td className="py-3 pr-3">
                    <Badge
                      tone={
                        s.risk === "high"
                          ? "danger"
                          : s.risk === "medium"
                            ? "warning"
                            : "success"
                      }
                    >
                      {s.risk}
                    </Badge>
                  </td>
                  <td className="py-3">
                    <div className="flex justify-end gap-0.5">
                      <Button
                        size="icon"
                        type="button"
                        variant="ghost"
                        aria-label={`Edit ${s.name}`}
                        title="Edit"
                        onClick={() => openEdit(s)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        type="button"
                        variant="ghost"
                        className="text-muted-foreground hover:bg-danger/10 hover:text-danger"
                        aria-label={`Delete ${s.name}`}
                        title="Delete"
                        onClick={() => onDelete(s)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </StaffSection>

      <StaffModal
        open={modalOpen}
        onClose={closeModal}
        title={editing ? "Edit student" : "Add student"}
        description={
          editing
            ? "Update details. Changes appear for Class Reps on the same roster."
            : "Enter student details. They appear on the Class Rep members list."
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
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1">
              <span className="text-[11px] text-muted-foreground">Year</span>
              <select
                value={form.year}
                onChange={(e) =>
                  setForm((f) => ({ ...f, year: Number(e.target.value) }))
                }
                className="h-10 w-full rounded-xl border border-border bg-background px-3 text-[13px]"
              >
                {[1, 2, 3, 4].map((y) => (
                  <option key={y} value={y}>
                    Year {y}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="block space-y-1">
            <span className="text-[11px] text-muted-foreground">Risk</span>
            <select
              value={form.risk}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  risk: e.target.value as StudentMonitor["risk"],
                }))
              }
              className="h-10 w-full rounded-xl border border-border bg-background px-3 text-[13px]"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </label>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit">{editing ? "Save changes" : "Add student"}</Button>
          </div>
        </form>
      </StaffModal>
    </div>
  );
}
