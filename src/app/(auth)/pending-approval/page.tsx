import { studentEntry } from "@/lib/auth/student-entry";
import { safeStudentReturnPath } from "@/lib/auth/redirect";
import { AdmissionStatus } from "@/components/auth/admission-status";
export const dynamic = "force-dynamic";
export default async function EntryPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = safeStudentReturnPath((await searchParams).next ?? null);
  const { profile, admission } = await studentEntry("/pending-approval", next);
  return <AdmissionStatus status={admission?.status ?? "pending"} registrationNumber={admission?.registration_number ?? null} className={profile?.class_name ?? null} />;
}
