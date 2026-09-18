"use client";

import { useMemo, useState } from "react";
import { Check, Pencil, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { classStreams, modules } from "@/data/mock";
import { useTimetableStore } from "@/lib/timetable-store";
import { cn } from "@/lib/utils";
import type { ClassStreamId, TimetableEntry } from "@/types";

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function TimetableEditor({
  streamId: lockedStream,
  title = "Edit timetable",
  description = "Change times, rooms, or lecturers on existing sessions — no duplicate schedules.",
}: {
  streamId?: ClassStreamId;
  title?: string;
  description?: string;
}) {
  const { forStream, updateEntry, ready } = useTimetableStore();
  const [streamId, setStreamId] = useState<ClassStreamId>(
    lockedStream ?? "BENG24COE-1",
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Partial<TimetableEntry>>({});
  const [savedId, setSavedId] = useState<string | null>(null);

  const activeStream = lockedStream ?? streamId;
  const entries = useMemo(
    () =>
      forStream(activeStream)
        .slice()
        .sort((a, b) => a.day - b.day || a.startTime.localeCompare(b.startTime)),
    [forStream, activeStream],
  );

  function startEdit(entry: TimetableEntry) {
    setEditingId(entry.id);
    setDraft({
      startTime: entry.startTime,
      endTime: entry.endTime,
      room: entry.room,
      lecturer: entry.lecturer,
      day: entry.day,
      moduleId: entry.moduleId,
    });
    setSavedId(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setDraft({});
  }

  function saveEdit(id: string) {
    updateEntry(id, {
      startTime: draft.startTime,
      endTime: draft.endTime,
      room: draft.room,
      lecturer: draft.lecturer,
      day: draft.day,
      moduleId: draft.moduleId,
    });
    setEditingId(null);
    setDraft({});
    setSavedId(id);
    window.setTimeout(() => setSavedId(null), 1800);
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
        {!lockedStream ? (
          <label className="block min-w-[220px]">
            <span className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              Stream
            </span>
            <select
              value={streamId}
              onChange={(e) => {
                setStreamId(e.target.value as ClassStreamId);
                cancelEdit();
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
      </div>

      <div className="surface overflow-hidden rounded-[20px]">
        <div className="border-b border-border/70 bg-muted/25 px-4 py-3">
          <p className="text-[12px] font-semibold">{activeStream}</p>
          <p className="text-[11px] text-muted-foreground">
            {ready ? `${entries.length} sessions` : "Loading…"} · edits sync to the student timetable
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-[12px]">
            <thead>
              <tr className="border-b border-border text-[10px] uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-2.5 font-medium">Day</th>
                <th className="px-3 py-2.5 font-medium">Start</th>
                <th className="px-3 py-2.5 font-medium">End</th>
                <th className="px-3 py-2.5 font-medium">Module</th>
                <th className="px-3 py-2.5 font-medium">Room</th>
                <th className="px-3 py-2.5 font-medium">Lecturer</th>
                <th className="px-4 py-2.5 font-medium"> </th>
              </tr>
            </thead>
            <tbody>
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
                            setDraft((d) => ({ ...d, moduleId: e.target.value }))
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
                          <Button size="icon" onClick={() => saveEdit(entry.id)} aria-label="Save">
                            <Check className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={cancelEdit}
                            aria-label="Cancel"
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => startEdit(entry)}
                        >
                          <Pencil className="h-3 w-3" />
                          Edit
                        </Button>
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
