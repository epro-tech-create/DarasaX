import { PageHeader } from "@/components/layout/page-header";
import { TimetableEditor } from "@/components/staff/timetable-editor";
import { classRepUser } from "@/data/staff-mock";

export default function ClassRepTimetablePage() {
  return (
    <div className="space-y-5">
      <PageHeader
        title="Class timetable"
        description={`Add, edit, or delete sessions for ${classRepUser.streamId}. Changes sync to your classmates.`}
      />
      <TimetableEditor
        streamId={classRepUser.streamId}
        title="Manage class sessions"
        description="Add modules, change rooms/times, or remove sessions — students update automatically."
      />
    </div>
  );
}
