"use client";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StaffModal } from "@/components/staff/staff-modal";
import {
  useClassRegistry,
  UNIVERSITIES,
  ACTIVE_INSTITUTION,
  activeCohort,
  type AcademicClass,
} from "@/lib/class-registry";
import { createClient } from "@/lib/supabase/client";
import { useStaffSession } from "@/lib/staff-auth";
const empty = {
  id: "",
  label: "",
  institution: ACTIVE_INSTITUTION,
  programme: "BENG24COE",
  year: 3,
  semester: 1,
  evening: false,
};
export function ClassManager() {
  const { classes, ready, error, refresh } = useClassRegistry();
  const { session } = useStaffSession();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const input =
    "mt-1 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm";
  function changed() {
    window.dispatchEvent(new Event("darasax:classes"));
  }
  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setMessage("");
    try {
      const { error } = await createClient().rpc("add_academic_class", {
        class_id: form.id,
        class_label: form.label || form.id,
        class_institution: form.institution,
        class_programme: form.programme,
        class_year: form.year,
        class_semester: form.semester,
        evening: form.evening,
      });
      if (error) throw error;
      changed();
      setOpen(false);
      setForm(empty);
      setMessage(
        "Class added. Access remains limited to the active DIT BENG24COE Year 3 Semester 1 cohort.",
      );
    } catch {
      setMessage(
        "Could not add class. Check that its code is unique and try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function remove(item: AcademicClass) {
    if (
      busy ||
      !confirm(
        `Remove ${item.label} from registration and timetable choices? Materials and timetable records will be preserved. Students assigned here will need an administrator to move them to an available class.`,
      )
    )
      return;
    setBusy(true);
    setMessage("");
    try {
      const { error } = await createClient().rpc("archive_academic_class", {
        class_id: item.id,
      });
      if (error) throw error;
      changed();
      setMessage("Class removed from available choices.");
    } catch {
      setMessage(
        "Could not remove class. CRs may remove their own class or a class they created.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="surface rounded-2xl p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Available classes</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Manage registration and timetable choices.
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setMessage("");
            setOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Add class
        </Button>
      </div>
      {(message || error) && (
        <p role="status" className="mb-3 text-sm">
          {message || error}
          {error && (
            <button className="ml-2 underline" onClick={() => void refresh()}>
              Retry
            </button>
          )}
        </p>
      )}
      {!ready ? (
        <p className="text-sm text-muted-foreground">Loading classes…</p>
      ) : (
        <ul className="divide-y divide-border">
          {classes.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-3 py-3"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold">{item.label}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {item.programme} · Year {item.year} · Semester {item.semester}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {item.institution} ·{" "}
                  {activeCohort(item)
                    ? "Registration open"
                    : "Not open for registration"}
                </p>
              </div>
              {(session?.role === "admin" ||
                item.created_by === session?.id ||
                item.id === session?.streamId) && (
                <Button
                  size="icon"
                  variant="ghost"
                  disabled={busy}
                  aria-label={`Remove ${item.label}`}
                  onClick={() => void remove(item)}
                >
                  <Trash2 className="h-4 w-4 text-danger" />
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
      <StaffModal
        open={open}
        onClose={() => {
          if (!busy) setOpen(false);
        }}
        title="Add class"
        description="Only the active cohort can enter the student workspace."
      >
        <form onSubmit={save} className="space-y-3">
          <label className="block text-sm">
            Class code
            <input
              required
              pattern="[A-Za-z0-9][A-Za-z0-9-]{2,39}"
              placeholder="BENG24COE-5"
              value={form.id}
              onChange={(e) =>
                setForm({ ...form, id: e.target.value.toUpperCase() })
              }
              className={input}
            />
          </label>
          <label className="block text-sm">
            Class name
            <input
              value={form.label}
              placeholder="Same as class code"
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              className={input}
            />
          </label>
          <label className="block text-sm">
            Institution
            <select
              value={form.institution}
              onChange={(e) =>
                setForm({ ...form, institution: e.target.value })
              }
              className={input}
            >
              {UNIVERSITIES.map((name) => (
                <option key={name}>{name}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            Programme
            <input
              required
              value={form.programme}
              onChange={(e) =>
                setForm({ ...form, programme: e.target.value.toUpperCase() })
              }
              className={input}
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm">
              Year
              <select
                value={form.year}
                onChange={(e) =>
                  setForm({ ...form, year: Number(e.target.value) })
                }
                className={input}
              >
                {[1, 2, 3, 4].map((n) => (
                  <option key={n} value={n}>
                    Year {n}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              Semester
              <select
                value={form.semester}
                onChange={(e) =>
                  setForm({ ...form, semester: Number(e.target.value) })
                }
                className={input}
              >
                {[1, 2].map((n) => (
                  <option key={n} value={n}>
                    Semester {n}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.evening}
              onChange={(e) => setForm({ ...form, evening: e.target.checked })}
            />
            Evening class
          </label>
          <Button type="submit" disabled={busy}>
            {busy ? "Saving…" : "Add class"}
          </Button>
        </form>
      </StaffModal>
    </section>
  );
}
