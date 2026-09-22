"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Pencil, Plus, Trash2, Users } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StaffModal } from "@/components/staff/staff-modal";
import { StaffSection, StaffStatCard } from "@/components/staff/staff-ui";
import { useAdminPeopleStore } from "@/lib/admin-people-store";
import { useStaffSession } from "@/lib/staff-auth";
import type { StudentMonitor } from "@/types";

const emptyForm = {
  name: "",
  email: "",
  year: 3,
  risk: "low" as StudentMonitor["risk"],
};

export default function ClassRepMembersPage() {
  const { session } = useStaffSession();
  const streamId = session?.streamId ?? "BENG24COE-1";
  const { studentsForStream, addStudent, updateStudent, deleteStudent } =
    useAdminPeopleStore();
  const members = studentsForStream(streamId);
  const atRisk = members.filter((m) => m.risk !== "low");

  function initials(name: string) {
    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("");
  }

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<StudentMonitor | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState("");

  const meta = useMemo(
    () => ({ actor: session?.name ?? "Class Rep", role: "class_rep" as const }),
    [session?.name],
  );

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
        await updateStudent(
          editing.id,
          {
            name: form.name,
            email: form.email,
            year: form.year,
            risk: form.risk,
            streamId,
          },
          meta,
        );
        setMessage("Member updated.");
      } else {
        await addStudent(
          {
            name: form.name,
            email: form.email,
            streamId,
            year: form.year,
            risk: form.risk,
          },
          meta,
        );
        setMessage("Member added to your class.");
      }
      closeModal();
    } catch {
      setMessage("Could not save. Check your connection and try again.");
    }
  }

  function onDelete(s: StudentMonitor) {
    if (!window.confirm(`Remove ${s.name} from ${streamId}?`)) return;
    deleteStudent(s.id, meta).then(
      () => setMessage(`Removed ${s.name}.`),
      () => setMessage("Could not remove. Try again."),
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Class members"
        description={`Add, edit, or remove students in ${streamId}.`}
        actions={
          <Button size="sm" type="button" onClick={openAdd}>
            <Plus className="h-3.5 w-3.5" />
            Add student
          </Button>
        }
      />

      <div className="grid gap-2.5 sm:grid-cols-2">
        <StaffStatCard
          label="Members"
          value={String(members.length)}
          icon={Users}
        />
        <StaffStatCard
          label="Need attention"
          value={String(atRisk.length)}
          hint="Medium or high risk students"
          icon={AlertTriangle}
          tone={atRisk.length ? "warning" : "success"}
        />
      </div>

      {message ? (
        <p className="text-[12px] font-medium text-success">{message}</p>
      ) : null}

      <StaffSection title="Roster" description={`${members.length} students`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-[12px]">
            <thead>
              <tr className="border-b border-border text-[10px] uppercase tracking-wide text-muted-foreground">
                <th className="pb-2 pr-3 font-medium">Student</th>
                <th className="pb-2 pr-3 font-medium">Year</th>
                <th className="pb-2 pr-3 font-medium">Risk</th>
                <th className="pb-2 text-right font-medium"> </th>
              </tr>
            </thead>
            <tbody>
              {members.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="py-10 text-center text-muted-foreground"
                  >
                    No members yet. Add a student to get started.
                  </td>
                </tr>
              ) : null}
              {members.map((s) => (
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
        description={`Details for ${streamId}. Also visible on the Admin students list.`}
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
          </div>
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
