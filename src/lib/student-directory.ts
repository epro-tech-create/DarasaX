import type { Json, MonitoredStudentRow } from "@/types/database";
export type StudentDirectoryRow = MonitoredStudentRow & {registration_number:string|null;admission_status:string|null};
export function studentDirectoryRows(data:Json|null):StudentDirectoryRow[] {
 return Array.isArray(data) ? data as unknown as StudentDirectoryRow[] : [];
}
/** Quote every CSV cell and prevent spreadsheet formula execution in user-supplied values. */
export function csvCell(value:unknown):string {
 const text=String(value??"");
 const safe=/^\s*[=+@-]|^[\t\r\n]/.test(text) ? "'"+text : text;
 return '"'+safe.replace(/"/g,'""')+'"';
}
export function studentDetailsCsv(rows:StudentDirectoryRow[]):string {
 const headers=["Full name","Registration number","Email","Class","Year","Admission status"];
 return "\uFEFF"+[headers,...rows.map(r=>[r.name,r.registration_number??"",r.email,r.stream_id,r.year,r.admission_status??""])].map(row=>row.map(csvCell).join(",")).join("\r\n")+"\r\n";
}
