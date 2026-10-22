import type { TimetableEntry } from "@/types";

export function tanzaniaDate(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Dar_es_Salaam", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}
export function addDateDays(date: string, days: number) {
  return new Date(Date.parse(`${date}T12:00:00Z`) + days * 86400000).toISOString().slice(0, 10);
}
export function dateDay(date: string) { return new Date(`${date}T12:00:00Z`).getUTCDay(); }
export function weekStart(date: string) { return addDateDays(date, -((dateDay(date) + 6) % 7)); }
export function occurrenceTime(date: string, time: string) { return Date.parse(`${date}T${time}:00+03:00`); }
export function sessionActive(entry: TimetableEntry) { return entry.status !== "cancelled" && entry.status !== "postponed"; }
export type TimetableOccurrence = {
  series_id: string; original_date: string; session_date: string; stream_id: string; module_id: string; day: number;
  start_time: string; end_time: string; room: string; lecturer: string; status: string; reason: string;
};
export function occurrenceEntry(row: TimetableOccurrence): TimetableEntry {
  return { id: `${row.series_id}@${row.original_date}`, seriesId: row.series_id, originalDate: row.original_date,
    sessionDate: row.session_date, streamId: row.stream_id as TimetableEntry["streamId"], moduleId: row.module_id,
    day: row.day, startTime: row.start_time, endTime: row.end_time, room: row.room, lecturer: row.lecturer,
    status: row.status as TimetableEntry["status"], reason: row.reason };
}
