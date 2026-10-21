"use client";

import { useTranslate } from "@/components/providers/language-provider";
import { useState } from "react";
import dynamic from "next/dynamic";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStaffSession } from "@/lib/staff-auth";
import { TimetableView } from "@/components/timetable/timetable-view";
import type { TimetableEntry } from "@/types";
const SessionModal = dynamic(() => import("@/components/timetable/session-modal").then(module => module.SessionModal));
export default function ClassRepTimetablePage() {
  const translateUI = useTranslate();
  const { session } = useStaffSession();
  const [editing, setEditing] = useState<TimetableEntry | null | undefined>(undefined);
  if (!session?.streamId) return <p role="status">{translateUI("Loading your class timetable…")}</p>;
  return <>
    <TimetableView lockedStream={session.streamId} onEdit={setEditing}
      actions={<Button size="sm" onClick={() => setEditing(null)}><Plus className="h-4 w-4" />Add session</Button>} />
    {editing !== undefined && <SessionModal key={editing?.id ?? "new"} entry={editing} streamId={session.streamId} onClose={() => setEditing(undefined)} />}
  </>;
}
