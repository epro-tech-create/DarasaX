import { modules, timetable } from "@/data/mock";
import type { Module, TimetableEntry } from "@/types";

export function getNextClass(now = new Date()): {
  entry: TimetableEntry;
  module: Module;
  dayOffset: number;
} | null {
  const currentDay = now.getDay();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const enriched = timetable
    .map((entry) => {
      let dayOffset = entry.day - currentDay;
      if (dayOffset < 0) dayOffset += 7;
      const [h, m] = entry.startTime.split(":").map(Number);
      const startMinutes = h * 60 + m;
      if (dayOffset === 0 && startMinutes + 30 < currentMinutes) {
        dayOffset = 7;
      }
      const sortKey = dayOffset * 1440 + startMinutes;
      return { entry, sortKey, dayOffset };
    })
    .sort((a, b) => a.sortKey - b.sortKey);

  const next = enriched[0];
  if (!next) return null;
  const module = modules.find((m) => m.id === next.entry.moduleId);
  if (!module) return null;
  return { entry: next.entry, module, dayOffset: next.dayOffset };
}
