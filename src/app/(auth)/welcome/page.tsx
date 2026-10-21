import { studentEntry } from "@/lib/auth/student-entry";
import { safeStudentReturnPath } from "@/lib/auth/redirect";
import { ApprovedWelcome } from "@/components/auth/admission-status";
export const dynamic = "force-dynamic";
export default async function EntryPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = safeStudentReturnPath((await searchParams).next ?? null);
  await studentEntry("/welcome", next);
  return <ApprovedWelcome next={next} />;
}
