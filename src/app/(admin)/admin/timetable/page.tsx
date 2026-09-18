import { PageHeader } from "@/components/layout/page-header";
import { TimetableEditor } from "@/components/staff/timetable-editor";

export default function AdminTimetablePage() {
  return (
    <div className="space-y-5">
      <PageHeader
        title="Timetable"
        description="Edit the live schedule for each stream. Changes show on the student app."
      />
      <TimetableEditor />
    </div>
  );
}
