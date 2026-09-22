"use client";

import { useMemo, useState } from "react";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { classStreams, modules } from "@/data/mock";
import { useTimetableStore } from "@/lib/timetable-store";
import { cn } from "@/lib/utils";
import type { ClassStreamId, TimetableEntry } from "@/types";

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function defaultLecturer(moduleId: string) {
  return modules.find((m) => m.id === moduleId)?.lecturer ?? "";
}

export function TimetableEditor({
  streamId: lockedStream,
  title = "Manage timetable",
  description = "Add, edit, or remove sessions. Changes sync to student accounts immediately.",
}: {
  streamId?: ClassStreamId;
  title?: string;
  description?: string;
}) {
  const { forStream, updateEntry, addEntry, deleteEntry, ready } =
    useTimetableStore();
  const [streamId, setStreamId] = useState<ClassStreamId>(
    lockedStream ?? "BENG24COE-1",
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Partial<TimetableEntry>>({});
  const [savedId, setSavedId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [flash, setFlash] = useState("");
  const [addForm, setAddForm] = useState({
    moduleId: modules[0]?.id ?? "",
    day: 1,
    startTime: "08:00",
    endTime: "10:00",
    room: "LT 1",
    lecturer: modules[0]?.lecturer ?? "",
  });

  const activeStream = lockedStream ?? streamId;
  const entries = useMemo(
    () =>
      forStream(activeStream)
        .slice()
        .sort((a, b) => a.day - b.day || a.startTime.localeCompare(b.startTime)),
    [forStream, activeStream],
  );

  function startEdit(entry: TimetableEntry) {
    setShowAdd(false);
    setEditingId(entry.id);
    setDraft({
      startTime: entry.startTime,
      endTime: entry.endTime,
      room: entry.room,
      lecturer: entry.lecturer,
      day: entry.day,
      moduleId: entry.moduleId,
      streamId: entry.streamId,
    });
    setSavedId(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setDraft({});
  }

  function saveEdit(id: string) {
    if (
      !draft.startTime ||
      !draft.endTime ||
      !draft.room?.trim() ||
      !draft.lecturer?.trim() ||
      !draft.moduleId
    ) {
      return;
    }
    if (draft.startTime >= draft.endTime) {
      setFlash("End time must be after start time.");
      return;
    }
    updateEntry(id, {
      startTime: draft.startTime,
      endTime: draft.endTime,
      room: draft.room.trim(),
      lecturer: draft.lecturer.trim(),
      day: draft.day,
      moduleId: draft.moduleId,
    }).catch(() => setFlash("Could not save. Check your connection and try again."));
    setEditingId(null);
    setDraft({});
    setSavedId(id);
    setFlash("Session updated — students see it now.");
    window.setTimeout(() => setSavedId(null), 1800);
  }

  function onDelete(id: string, moduleName: string) {
    if (
      !window.confirm(
        `Remove “${moduleName}” from this stream’s timetable? Students will lose this session.`,
      )
    ) {
      return;
    }
    deleteEntry(id)
      .then(() => setFlash("Session deleted — removed from student timetable."))
      .catch(() => setFlash("Could not delete. Try again."));
    if (editingId === id) cancelEdit();
  }

  function onAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!addForm.moduleId || !addForm.room.trim() || !addForm.lecturer.trim()) {
      return;
    }
    if (addForm.startTime >= addForm.endTime) {
      setFlash("End time must be after start time.");
      return;
    }
    addEntry({
      streamId: activeStream,
      moduleId: addForm.moduleId,
      day: addForm.day,
      startTime: addForm.startTime,
      endTime: addForm.endTime,
      room: addForm.room,
      lecturer: addForm.lecturer,
    }).then(
      (created) => {
        setShowAdd(false);
        setSavedId(created.id);
        setFlash("Session added — live on student timetable.");
        window.setTimeout(() => setSavedId(null), 1800);
      },
      () => setFlash("Could not add. Check your connection and try again."),
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-heading text-[15px] font-semibold">{title}</h2>
          <p className="mt-0.5 max-w-xl text-[12px] text-muted-foreground">
            {description}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!lockedStream ? (
            <label className="block min-w-[200px]">
              <span className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                Stream
              </span>
              <select
                value={streamId}
                onChange={(e) => {
                  setStreamId(e.target.value as ClassStreamId);
                  cancelEdit();
                  setShowAdd(false);
                }}
                className="h-10 w-full rounded-xl border border-border bg-background px-3 text-[13px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                {classStreams.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                    {s.isEvening ? " (Evening)" : ""}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <Button
            type="button"
            size="sm"
            className="sm:mb-0.5"
            onClick={() => {
              cancelEdit();
              setShowAdd((v) => !v);
              setFlash("");
            }}
          >
            <Plus className="h-3.5 w-3.5" />
            {showAdd ? "Close" : "Add session"}
          </Button>
        </div>
      </div>

      {flash ? (
        <p className="text-[12px] font-medium text-success">{flash}</p>
      ) : null}

      {showAdd ? (
        <form onSubmit={onAdd} className="surface space-y-3 rounded-[20px] p-4">
          <h3 className="font-heading text-[13px] font-semibold">
            New session · {activeStream}
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <label className="block space-y-1">
              <span className="text-[11px] text-muted-foreground">Module</span>
              <select
                value={addForm.moduleId}
                onChange={(e) =>
                  setAddForm((f) => ({
                    ...f,
                    moduleId: e.target.value,
                    lecturer: defaultLecturer(e.target.value) || f.lecturer,
                  }))
                }
                className="h-10 w-full rounded-xl border border-border bg-background px-3 text-[13px]"
              >
                {modules.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.code} · {m.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1">
              <span className="text-[11px] text-muted-foreground">Day</span>
              <select
                value={addForm.day}
                onChange={(e) =>
                  setAddForm((f) => ({ ...f, day: Number(e.target.value) }))
                }
                className="h-10 w-full rounded-xl border border-border bg-background px-3 text-[13px]"
              >
                {[1, 2, 3, 4, 5].map((d) => (
                  <option key={d} value={d}>
                    {dayNames[d]}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1">
              <span className="text-[11px] text-muted-foreground">Room</span>
              <input
                required
                value={addForm.room}
                onChange={(e) => setAddForm((f) => ({ ...f, room: e.target.value }))}
                className="h-10 w-full rounded-xl border border-border bg-background px-3 text-[13px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-[11px] text-muted-foreground">Start</span>
              <input
                required
                type="time"
                value={addForm.startTime}
                onChange={(e) =>
                  setAddForm((f) => ({ ...f, startTime: e.target.value }))
                }
                className="h-10 w-full rounded-xl border border-border bg-background px-3 text-[13px] tabular-nums"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-[11px] text-muted-foreground">End</span>
              <input
                required
                type="time"
                value={addForm.endTime}
                onChange={(e) =>
                  setAddForm((f) => ({ ...f, endTime: e.target.value }))
                }
                className="h-10 w-full rounded-xl border border-border bg-background px-3 text-[13px] tabular-nums"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-[11px] text-muted-foreground">Lecturer</span>
              <input
                required
                value={addForm.lecturer}
                onChange={(e) =>
                  setAddForm((f) => ({ ...f, lecturer: e.target.value }))
                }
                className="h-10 w-full rounded-xl border border-border bg-background px-3 text-[13px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </label>
          </div>
          <Button type="submit">Save to student timetable</Button>
        </form>
      ) : null}

      <div className="surface overflow-hidden rounded-[20px]">
        <div className="border-b border-border/70 bg-muted/25 px-4 py-3">
          <p className="text-[12px] font-semibold">{activeStream}</p>
          <p className="text-[11px] text-muted-foreground">
            {ready ? `${entries.length} sessions` : "Loading…"} · shared with students
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-left text-[12px]">
            <thead>
              <tr className="border-b border-border text-[10px] uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-2.5 font-medium">Day</th>
                <th className="px-3 py-2.5 font-medium">Start</th>
                <th className="px-3 py-2.5 font-medium">End</th>
                <th className="px-3 py-2.5 font-medium">Module</th>
                <th className="px-3 py-2.5 font-medium">Room</th>
                <th className="px-3 py-2.5 font-medium">Lecturer</th>
                <th className="px-4 py-2.5 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-10 text-center text-[12px] text-muted-foreground"
                  >
                    No sessions yet. Use Add session to create the first one.
                  </td>
                </tr>
              ) : null}
              {entries.map((entry) => {
                const isEditing = editingId === entry.id;
                const module = modules.find((m) => m.id === entry.moduleId);
                return (
                  <tr
                    key={entry.id}
                    className={cn(
                      "border-b border-border/50 last:border-0",
                      isEditing && "bg-primary/[0.04]",
                      savedId === entry.id && "bg-success/10",
                    )}
                  >
                    <td className="px-4 py-2.5">
                      {isEditing ? (
                        <select
                          value={draft.day ?? entry.day}
                          onChange={(e) =>
                            setDraft((d) => ({ ...d, day: Number(e.target.value) }))
                          }
                          className="h-8 rounded-lg border border-border bg-background px-2"
                        >
                          {[1, 2, 3, 4, 5].map((d) => (
                            <option key={d} value={d}>
                              {dayNames[d]}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <Badge>{dayNames[entry.day]}</Badge>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      {isEditing ? (
                        <input
                          type="time"
                          value={draft.startTime ?? entry.startTime}
                          onChange={(e) =>
                            setDraft((d) => ({ ...d, startTime: e.target.value }))
                          }
                          className="h-8 rounded-lg border border-border bg-background px-2 tabular-nums"
                        />
                      ) : (
                        <span className="tabular-nums text-muted-foreground">
                          {entry.startTime}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      {isEditing ? (
                        <input
                          type="time"
                          value={draft.endTime ?? entry.endTime}
                          onChange={(e) =>
                            setDraft((d) => ({ ...d, endTime: e.target.value }))
                          }
                          className="h-8 rounded-lg border border-border bg-background px-2 tabular-nums"
                        />
                      ) : (
                        <span className="tabular-nums text-muted-foreground">
                          {entry.endTime}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      {isEditing ? (
                        <select
                          value={draft.moduleId ?? entry.moduleId}
                          onChange={(e) =>
                            setDraft((d) => ({
                              ...d,
                              moduleId: e.target.value,
                              lecturer:
                                defaultLecturer(e.target.value) || d.lecturer,
                            }))
                          }
                          className="h-8 max-w-[200px] rounded-lg border border-border bg-background px-2"
                        >
                          {modules.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.code}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="font-medium">{module?.name}</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      {isEditing ? (
                        <input
                          value={draft.room ?? entry.room}
                          onChange={(e) =>
                            setDraft((d) => ({ ...d, room: e.target.value }))
                          }
                          className="h-8 w-24 rounded-lg border border-border bg-background px-2"
                        />
                      ) : (
                        entry.room
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      {isEditing ? (
                        <input
                          value={draft.lecturer ?? entry.lecturer}
                          onChange={(e) =>
                            setDraft((d) => ({ ...d, lecturer: e.target.value }))
                          }
                          className="h-8 w-40 rounded-lg border border-border bg-background px-2"
                        />
                      ) : (
                        <span className="text-muted-foreground">{entry.lecturer}</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      {isEditing ? (
                        <div className="flex gap-1">
                          <Button
                            size="icon"
                            type="button"
                            onClick={() => saveEdit(entry.id)}
                            aria-label="Save"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            type="button"
                            variant="ghost"
                            onClick={cancelEdit}
                            aria-label="Cancel"
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex gap-1.5">
                          <Button
                            size="sm"
                            type="button"
                            variant="outline"
                            onClick={() => startEdit(entry)}
                          >
                            <Pencil className="h-3 w-3" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            type="button"
                            variant="ghost"
                            className="text-danger hover:bg-danger/10 hover:text-danger"
                            onClick={() =>
                              onDelete(entry.id, module?.name ?? "session")
                            }
                          >
                            <Trash2 className="h-3 w-3" />
                            Delete
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
