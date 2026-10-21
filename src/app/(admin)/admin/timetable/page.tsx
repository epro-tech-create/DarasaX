"use client";
import { useTranslate } from "@/components/providers/language-provider";
import { PageHeader } from "@/components/layout/page-header";
import { TimetableEditor } from "@/components/staff/timetable-editor";

export default function AdminTimetablePage() {
  const translateUI = useTranslate();
  return (
    <div className="space-y-5">
      <PageHeader
        title={translateUI("Timetable")}
        description={translateUI("Add, edit, or delete sessions for any stream. Students see updates right away.")}
      />
      <TimetableEditor />
    </div>
  );
}
