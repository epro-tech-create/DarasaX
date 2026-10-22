import {
  DEFAULT_CLASS_STREAM,
  modules,
  timetable as seedTimetable,
} from "@/data/mock";
import type { ClassStreamId, Module, TimetableEntry } from "@/types";
import { occurrenceTime, tanzaniaDate, sessionActive } from "@/lib/timetable-dates";

export function getNextClass(
  now = new Date(),
  streamId: ClassStreamId = DEFAULT_CLASS_STREAM,
  timetable: TimetableEntry[] = seedTimetable,
): {
  entry: TimetableEntry;
  module: Module;
  dayOffset: number;
} | null {
  const currentDay = now.getDay();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const streamTimetable = timetable.filter((entry) => entry.streamId === streamId && sessionActive(entry));

  const enriched = streamTimetable
    .map((entry) => {
      if (entry.sessionDate) {
        const starts = occurrenceTime(entry.sessionDate, entry.startTime);
        const ends = occurrenceTime(entry.sessionDate, entry.endTime);
        if (ends <= now.getTime()) return null;
        return { entry, sortKey: starts, dayOffset: Math.round((Date.parse(entry.sessionDate) - Date.parse(tanzaniaDate(now))) / 86400000) };
      }
      let dayOffset = entry.day - currentDay;
      if (dayOffset < 0) dayOffset += 7;
      const [h, m] = entry.startTime.split(":").map(Number);
      const startMinutes = h * 60 + m;
      if (dayOffset === 0 && startMinutes + 30 < currentMinutes) {
        dayOffset = 7;
      }
      const sortKey = now.getTime() + (dayOffset * 1440 + startMinutes - currentMinutes) * 60000;
      return { entry, sortKey, dayOffset };
    })
    .filter((entry) => entry !== null)
    .sort((a, b) => a.sortKey - b.sortKey);

  const next = enriched[0];
  if (!next) return null;
  const courseModule = modules.find((m) => m.id === next.entry.moduleId);
  if (!courseModule) return null;
  return { entry: next.entry, module: courseModule, dayOffset: next.dayOffset };
}
