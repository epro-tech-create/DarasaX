"use client";

import { useTranslate } from "@/components/providers/language-provider";
import { useStudentProfile } from "@/components/providers/student-profile-provider";
export function StudentGreeting({ greeting }: { greeting: string }) {
  const translateUI = useTranslate();
  const { profile } = useStudentProfile();
  const name = profile?.full_name?.trim().split(/\s+/)[0] || "Student";
  return (
    <h1 className="font-heading text-xl font-semibold tracking-tight">
      {translateUI(greeting)}, {name}
    </h1>
  );
}
