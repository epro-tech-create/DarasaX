"use client";
import { useStudentProfile } from "@/components/providers/student-profile-provider";
export function StudentGreeting({ greeting }: { greeting: string }) {
  const { profile } = useStudentProfile();
  const name = profile?.full_name?.trim().split(/\s+/)[0] || "Student";
  return (
    <h1 className="font-heading text-xl font-semibold tracking-tight">
      {greeting}, {name}
    </h1>
  );
}
