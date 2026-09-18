import { PageHeader } from "@/components/layout/page-header";
import { TimetableEditor } from "@/components/staff/timetable-editor";
import { classRepUser } from "@/data/staff-mock";

export default function ClassRepTimetablePage() {
  return (
    <div className="space-y-5">
      <PageHeader
        title="Class timetable"
        description={`Edit sessions for ${classRepUser.streamId} only.`}
      />
      <TimetableEditor
        streamId={classRepUser.streamId}
        title="Edit class sessions"
        description="Update room, time, or lecturer on existing classes — you are not creating a second timetable."
      />
    </div>
  );
}
