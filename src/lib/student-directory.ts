import type { Json, MonitoredStudentRow } from "@/types/database";
import type { StudentMonitor } from "@/types";

export function matchesStudentSearch(student: Pick<StudentMonitor, "name" | "email" | "registrationNumber" | "streamId">, query: string) {
 const text = [student.name, student.email, student.registrationNumber, student.streamId].filter(Boolean).join(" ").toLocaleLowerCase();
 return query.trim().toLocaleLowerCase().split(/\s+/).every(word => text.includes(word));
}
export type StudentDirectoryRow = MonitoredStudentRow & {registration_number:string|null;admission_status:string|null};
export function studentDirectoryRows(data:Json|null):StudentDirectoryRow[] {
 return Array.isArray(data) ? data as unknown as StudentDirectoryRow[] : [];
}
