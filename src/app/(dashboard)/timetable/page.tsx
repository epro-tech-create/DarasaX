"use client";
import { TimetableView } from "@/components/timetable/timetable-view";
import { useStudentProfile } from "@/components/providers/student-profile-provider";
import type { ClassStreamId } from "@/types";
export default function TimetablePage() {
  const { profile } = useStudentProfile();
  return <TimetableView initialStream={profile?.class_name as ClassStreamId | undefined} />;
}
