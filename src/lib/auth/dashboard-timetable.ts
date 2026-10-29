import "server-only";
import { getStudentWorkspace } from "@/lib/auth/student-workspace";
import { addDateDays, occurrenceEntry, tanzaniaDate } from "@/lib/timetable-dates";
import type { TimetableEntry } from "@/types";

/** Request-scoped, authenticated initial data so the hero can render before hydration. */
export async function getDashboardTimetable(now: Date): Promise<{ entries: TimetableEntry[]; loaded: boolean }> {
  const { client, user, profile } = await getStudentWorkspace();
  if (!user || !profile?.class_name) return { entries: [], loaded: true };
  const from = tanzaniaDate(now);
  const entries: TimetableEntry[] = [];
  try {
    for (let offset = 0; ; offset += 1000) {
      const { data, error } = await client.rpc("get_timetable_occurrences", {
        range_start: from, range_end: addDateDays(from, 42),
      }).eq("stream_id", profile.class_name).range(offset, offset + 999);
      if (error) throw error;
      entries.push(...(data ?? []).map(occurrenceEntry));
      if (!data || data.length < 1000) return { entries, loaded: true };
    }
  } catch {
    // The browser can retry; never present an unavailable schedule as a free day.
    return { entries: [], loaded: false };
  }
}
