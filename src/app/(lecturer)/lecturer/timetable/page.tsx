"use client";

import { PageHeader } from "@/components/layout/page-header";
import { TimetableEditor } from "@/components/staff/timetable-editor";
import { classStreams, DEFAULT_CLASS_STREAM } from "@/data/mock";
import { getActiveLecturerStream } from "@/lib/lecturer-context";
import { useStaffSession } from "@/lib/staff-auth";

export default function LecturerTimetablePage() {
  const { session } = useStaffSession();
  const active = getActiveLecturerStream();
  const streamId =
    active && session?.streamIds.includes(active)
      ? active
      : session?.streamIds[0] ?? DEFAULT_CLASS_STREAM;
  const label =
    classStreams.find((s) => s.id === streamId)?.label ?? streamId;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Timetable"
        description={`Sessions for ${label}. Prefer coordinating with the class rep for stream-wide changes.`}
      />
      <TimetableEditor
        streamId={streamId}
        title="Class sessions"
        description={`Editing the active class (${label}).`}
      />
    </div>
  );
}
