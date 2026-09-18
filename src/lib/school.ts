/** School / semester open date (exams / term start target). */
export const SCHOOL_OPEN_MONTH = 10; // October
export const SCHOOL_OPEN_DAY = 26;

export function getSchoolOpenDate(from: Date = new Date()): Date {
  const year = from.getFullYear();
  let open = new Date(year, SCHOOL_OPEN_MONTH - 1, SCHOOL_OPEN_DAY, 0, 0, 0, 0);
  if (from.getTime() >= open.getTime()) {
    open = new Date(year + 1, SCHOOL_OPEN_MONTH - 1, SCHOOL_OPEN_DAY, 0, 0, 0, 0);
  }
  return open;
}

export function getMsUntilSchoolOpen(from: Date = new Date()): number {
  return Math.max(0, getSchoolOpenDate(from).getTime() - from.getTime());
}

export function formatCountdownParts(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { days, hours, minutes, seconds, totalSeconds };
}
