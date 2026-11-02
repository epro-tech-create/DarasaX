"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TimetableView } from "@/components/timetable/timetable-view";
import { ImportTimetableButton } from "@/components/timetable/import-timetable";
import { useStaffSession } from "@/lib/staff-auth";
import type { TimetableEntry } from "@/types";
const SessionModal = dynamic(() => import("@/components/timetable/session-modal").then(m => m.SessionModal));
export default function Page() {
  const { session } = useStaffSession();
  const [selected, setSelected] = useState(session?.streamId || "");
  const [editing, setEditing] = useState<TimetableEntry | null | undefined>(undefined);
  if (!selected) return <p role="status">Loading timetable…</p>;
  return <><TimetableView initialStream={selected} onStreamChange={setSelected} onEdit={setEditing} actions={<><ImportTimetableButton streamId={selected} /><Button size="sm" onClick={() => setEditing(null)}><Plus className="h-4 w-4" />Add session</Button></>} />{editing !== undefined && <SessionModal key={editing?.id || "new"} entry={editing} streamId={editing?.streamId || selected} onClose={() => setEditing(undefined)} />}</>;
}
