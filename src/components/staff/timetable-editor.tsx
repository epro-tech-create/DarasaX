"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import { Plus } from "lucide-react";
import { useClassRegistry } from "@/lib/class-registry";
import { TimetableView } from "@/components/timetable/timetable-view";
import { Button } from "@/components/ui/button";
import type { ClassStreamId, TimetableEntry } from "@/types";
const SessionModal = dynamic(() => import("@/components/timetable/session-modal").then(module => module.SessionModal));

export function TimetableEditor({ streamId: lockedStream, title = "Manage timetable", description = "Change one dated session or update the weekly schedule from a chosen date." }: { streamId?: ClassStreamId; title?: string; description?: string }) {
  const { streams } = useClassRegistry();
  const [selected, setSelected] = useState<ClassStreamId>(lockedStream ?? "BENG24COE-1");
  const [editing, setEditing] = useState<TimetableEntry | null | undefined>(undefined);
  const streamId = lockedStream ?? selected;
  return <section className="space-y-4">
    <div><h2 className="text-lg font-semibold">{title}</h2><p className="mt-1 text-sm text-muted-foreground">{description}</p></div>
    {!lockedStream ? <label className="block text-sm">Class<select aria-label="Class to manage" value={selected} onChange={e => setSelected(e.target.value as ClassStreamId)} className="ml-3 h-11 rounded-xl border border-border bg-background px-3">{streams.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}</select></label> : null}
    <TimetableView key={streamId} lockedStream={streamId} onEdit={setEditing} actions={<Button size="sm" onClick={() => setEditing(null)}><Plus className="h-4 w-4" aria-hidden />Add weekly session</Button>} />
    {editing !== undefined ? <SessionModal key={editing?.id ?? "new"} entry={editing} streamId={streamId} onClose={() => setEditing(undefined)} /> : null}
  </section>;
}
