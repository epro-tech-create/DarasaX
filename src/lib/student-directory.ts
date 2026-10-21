import type { Json, MonitoredStudentRow } from "@/types/database";
export type StudentDirectoryRow = MonitoredStudentRow & {registration_number:string|null;admission_status:string|null};
export function studentDirectoryRows(data:Json|null):StudentDirectoryRow[] {
 return Array.isArray(data) ? data as unknown as StudentDirectoryRow[] : [];
}
