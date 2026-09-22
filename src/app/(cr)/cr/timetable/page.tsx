"use client";

import { PageHeader } from "@/components/layout/page-header";
import { TimetableEditor } from "@/components/staff/timetable-editor";
import { useStaffSession } from "@/lib/staff-auth";

export default function ClassRepTimetablePage() {
  const { session } = useStaffSession();
  const streamId = session?.streamId ?? "BENG24COE-1";
  return (
    <div className="space-y-5">
      <PageHeader
        title="Class timetable"
        description={`Add, edit, or delete sessions for ${streamId}. Changes sync to your classmates.`}
      />
      <TimetableEditor
        streamId={streamId}
        title="Manage class sessions"
        description="Add modules, change rooms/times, or remove sessions — students update automatically."
      />
    </div>
  );
}
