"use client";

import { PageHeader } from "@/components/layout/page-header";
import { TimetableEditor } from "@/components/staff/timetable-editor";
import { DEFAULT_CLASS_STREAM } from "@/data/mock";

export default function LecturerTimetablePage() {
  return (
    <div className="space-y-5">
      <PageHeader
        title="Timetable"
        description="Review and adjust sessions so students always see the right room and time."
      />
      <TimetableEditor
        streamId={DEFAULT_CLASS_STREAM}
        title="Class sessions"
        description="Edit sessions for the default stream. Prefer coordinating with the class rep for stream-specific changes."
      />
    </div>
  );
}
