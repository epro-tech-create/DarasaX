import type { Assignment, MaterialUpload, MissedDaySummary, Topic, TimetableEntry } from "@/types";
import { getTopicsForModule } from "@/data/mock";
import { formatDate } from "@/lib/utils";

/** JS Date.getDay(): 0=Sun … map to timetable day 1=Mon … 5=Fri (0 weekend). */
export function timetableDayFromDate(isoDate: string): number {
  const d = new Date(`${isoDate}T12:00:00`);
  const js = d.getDay();
  return js === 0 ? 0 : js;
}

function sameCalendarDay(iso: string, day: string) {
  return iso.slice(0, 10) === day;
}

function withinDays(iso: string, day: string, windowDays: number) {
  const a = new Date(`${day}T12:00:00`).getTime();
  const b = new Date(iso).getTime();
  const diff = Math.abs(a - b);
  return diff <= windowDays * 24 * 60 * 60 * 1000;
}

export function buildMissedSummary(input: {
  date: string;
  streamId: string;
  timetable: TimetableEntry[];
  materials: MaterialUpload[];
  assignments: Assignment[];
  topics?: Topic[];
}): MissedDaySummary {
  const day = timetableDayFromDate(input.date);
  const classes =
    day === 0
      ? []
      : input.timetable.filter(
          (e) => e.streamId === input.streamId && e.day === day,
        );

  const items = classes.map((entry) => {
    const moduleTopics =
      input.topics?.filter((t) => t.moduleId === entry.moduleId) ??
      getTopicsForModule(entry.moduleId);
    const topic =
      moduleTopics.find((t) => !t.completed)?.title ??
      moduleTopics[0]?.title;

    const notesOnDay = input.materials.filter(
      (m) =>
        m.status === "published" &&
        m.moduleId === entry.moduleId &&
        (m.kind === "notes" || m.kind === "slides") &&
        (sameCalendarDay(m.createdAt, input.date) ||
          withinDays(m.createdAt, input.date, 3)),
    );

    const upcoming = input.assignments
      .filter(
        (a) =>
          a.moduleId === entry.moduleId &&
          a.status === "upcoming",
      )
      .sort(
        (a, b) =>
          new Date(a.deadline).getTime() - new Date(b.deadline).getTime(),
      )[0];

    const announcement = input.materials.find(
      (m) =>
        m.status === "published" &&
        m.moduleId === entry.moduleId &&
        m.kind === "announcement" &&
        withinDays(m.createdAt, input.date, 7),
    );

    return {
      moduleId: entry.moduleId,
      topic,
      newNotes: notesOnDay.length,
      assignment: upcoming?.title,
      deadline: upcoming ? formatDate(upcoming.deadline) : undefined,
      announcement: announcement?.title,
      startTime: entry.startTime,
      endTime: entry.endTime,
      room: entry.room,
    };
  });

  return {
    date: input.date,
    classesMissed: items.length,
    items,
  };
}
