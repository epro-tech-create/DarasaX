import { modules } from "@/data/mock";

export type ImportSession = { day: number; start: string; end: string; moduleId: string; room: string; lecturer: string };
const dayLabels = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const normalized = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
export function parseDay(value: string) {
  const day = value.trim().toLowerCase();
  return dayLabels.findIndex(name => day === name || day === name.slice(0, 3) || day.startsWith(`${name} `) || day.startsWith(`${name.slice(0, 3)} `));
}
export function parseTime(value: string) {
  const match = value.trim().match(/^(\d{1,2})[:.](\d{2})\s*(am|pm)?$/i);
  if (!match) return "";
  let h = Number(match[1]); const m = Number(match[2]);
  if (match[3]) { if (h < 1 || h > 12) return ""; h = h % 12 + (match[3].toLowerCase() === "pm" ? 12 : 0); }
  if (h > 23 || m > 59) return "";
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
function timeRange(text: string) {
  const times = [...text.matchAll(/\b\d{1,2}[:.]\d{2}\s*(?:am|pm)?/gi)].map(match => parseTime(match[0])).filter(Boolean);
  return [times[0] ?? "", times[1] ?? ""];
}
function details(text: string) {
  const hay = normalized(text);
  const course = modules.find(m => hay.includes(normalized(m.code)) || hay.includes(normalized(m.name)) || text.includes(m.id));
  const room = text.match(/\b(?:room\s+[\w-]+|(?:\w+\s+)?lab(?:oratory)?\s*\d*|R\d+[-/]\d+)\b/i)?.[0] ?? "";
  const lecturer = text.match(/\b(?:Dr\.?|Mr\.?|Ms\.?|Mrs\.?|Prof\.?)\s+[A-Za-z]+(?:\s+[A-Za-z]+)?/i)?.[0] ?? "";
  return { moduleId: course?.id ?? "", room, lecturer };
}

// Accept row-based tables and the common day-by-time and time-by-day layouts.
export function parseTimetableRows(rows: string[][]): ImportSession[] {
  const output: ImportSession[] = [];
  let header: string[] = [];
  let currentDay = -1;
  for (const cells of rows) {
    const clean = cells.map(cell => cell.trim());
    if (clean.filter(cell => parseDay(cell) >= 0).length >= 2 || clean.filter(cell => timeRange(cell)[1]).length >= 2 || clean.some(cell => /^(day|siku)$/i.test(cell)) && clean.some(cell => /^(start|start time|time|module|subject)$/i.test(cell))) { header = clean; continue; }
    const day = clean.map(parseDay).find(day => day >= 0);
    if (day !== undefined) currentDay = day;
    const dayColumns = header.map(parseDay);
    const [rowStart, rowEnd] = timeRange(clean[0] ?? "");
    if (dayColumns.some(day => day >= 0) && rowStart && rowEnd) {
      clean.forEach((cell, index) => { if (dayColumns[index] >= 0 && cell && !/^(break|lunch|free)$/i.test(cell)) output.push({ day: dayColumns[index], start: rowStart, end: rowEnd, ...details(cell) }); });
      continue;
    }
    if (day !== undefined && header.filter(cell => timeRange(cell)[1]).length >= 2) {
      clean.forEach((cell, index) => { const [start, end] = timeRange(header[index] ?? ""); if (start && end && cell && !/^(break|lunch|free)$/i.test(cell)) output.push({ day, start, end, ...details(cell) }); });
      continue;
    }
    const col = (pattern: RegExp) => clean[header.findIndex(cell => pattern.test(cell))] ?? "";
    const [rangeStart, rangeEnd] = timeRange(clean.join(" "));
    const start = parseTime(col(/^(start|start time|from)$/i)) || rangeStart;
    const end = parseTime(col(/^(end|end time|to)$/i)) || rangeEnd;
    if (currentDay >= 0 && start && end) {
      const info = details(clean.join(" "));
      output.push({ day: currentDay, start, end, moduleId: info.moduleId,
        room: col(/^(room|venue|location)$/i) || info.room, lecturer: col(/^(lecturer|teacher|instructor)$/i) || info.lecturer });
    }
  }
  return output.filter((row, i) => output.findIndex(other => JSON.stringify(other) === JSON.stringify(row)) === i);
}

export function validateImport(rows: ImportSession[]) {
  const errors: string[] = [];
  if (!rows.length || rows.length > 100) errors.push("Choose 1–100 sessions.");
  rows.forEach((row, i) => {
    if (!Number.isInteger(row.day) || row.day < 0 || row.day > 6 || !parseTime(row.start) || !parseTime(row.end) || row.end <= row.start || !modules.some(m => m.id === row.moduleId) || !row.room.trim() || !row.lecturer.trim()) errors.push(`Session ${i + 1}: complete the module, day, times, room, and lecturer.`);
    rows.slice(i + 1).forEach((other, j) => { if (row.day === other.day && row.start < other.end && other.start < row.end) errors.push(`Sessions ${i + 1} and ${i + j + 2} overlap.`); });
  });
  return errors;
}
