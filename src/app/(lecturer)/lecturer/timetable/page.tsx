"use client";

import { useTranslate } from "@/components/providers/language-provider";
import { PageHeader } from "@/components/layout/page-header";
import { TimetableEditor } from "@/components/staff/timetable-editor";
import { classStreams, DEFAULT_CLASS_STREAM } from "@/data/mock";
import { getActiveLecturerStream } from "@/lib/lecturer-context";
import { useStaffSession } from "@/lib/staff-auth";

export default function LecturerTimetablePage() {
  const translateUI = useTranslate();
  const { session } = useStaffSession();
  const active = getActiveLecturerStream();
  const streamId =
    active && session?.streamIds.includes(active)
      ? active
      : session?.streamIds[0] ?? DEFAULT_CLASS_STREAM;
  const label =
    classStreams.find((s) => s.id === streamId)?.label ?? streamId;

  return (
    <div className="space-y-6">
      <PageHeader
        size="lg"
        title={translateUI("Timetable")}
        description={translateUI(`Sessions for ${label}. Coordinate with the class rep for stream-wide changes — edits go live to students.`)}
      />
      <TimetableEditor
        streamId={streamId}
        title={translateUI("Class sessions")}
        description={translateUI(`Editing the active class (${label}).`)}
      />
    </div>
  );
}
