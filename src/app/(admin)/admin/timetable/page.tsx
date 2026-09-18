import { PageHeader } from "@/components/layout/page-header";
import { TimetableEditor } from "@/components/staff/timetable-editor";

export default function AdminTimetablePage() {
  return (
    <div className="space-y-5">
      <PageHeader
        title="Timetable"
        description="Add, edit, or delete sessions for any stream. Students see updates right away."
      />
      <TimetableEditor />
    </div>
  );
}
