/** Current academic calendar. Dates start at midnight in Tanzania (UTC+3). */
export const SCHOOL_OPEN_AT = "2026-10-26T00:00:00+03:00";
export const TEST_ONE_AT = "2026-12-07T00:00:00+03:00";

export function getSchoolOpenDate(): Date { return new Date(SCHOOL_OPEN_AT); }
export function getMsUntilSchoolOpen(from: Date = new Date()): number {
  return Math.max(0, getSchoolOpenDate().getTime() - from.getTime());
}

export function getAcademicCountdown(from: Date = new Date()) {
  const opening = getSchoolOpenDate();
  const schoolIsOpen = from.getTime() >= opening.getTime();
  const target = schoolIsOpen ? new Date(TEST_ONE_AT) : opening;
  return {
    phase: schoolIsOpen ? "test" as const : "opening" as const,
    target,
    remaining: Math.max(0, target.getTime() - from.getTime()),
    reached: from.getTime() >= target.getTime(),
  };
}

export function formatCountdownParts(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { days, hours, minutes, seconds, totalSeconds };
}
