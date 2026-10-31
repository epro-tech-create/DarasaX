import "server-only";
import { tmpdir } from "node:os";
import { parseTimetableRows } from "@/lib/timetable-import";

async function recognize(data: Buffer) {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("eng", 1, { cachePath: tmpdir() });
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      worker.recognize(data).then(result => result.data.text),
      new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error("Text recognition timed out. Try a clearer image or Excel.")), 60000); }),
    ]);
  } finally { clearTimeout(timer); await worker.terminate(); }
}

export async function extractTimetable(file: File) {
  const bytes = Buffer.from(await file.arrayBuffer());
  const ext = file.name.split(".").pop()?.toLowerCase();
  let text = "";
  let grids: string[][][] = [];
  if (ext === "xlsx") {
    const { Workbook } = await import("exceljs");
    const workbook = new Workbook();
    await workbook.xlsx.load(bytes as unknown as import("exceljs").Buffer);
    if (workbook.worksheets.length > 10) throw new Error("Choose a workbook with at most 10 worksheets.");
    grids = workbook.worksheets.map(sheet => {
      if (sheet.rowCount > 500 || sheet.columnCount > 50) throw new Error("Choose a timetable with at most 500 rows and 50 columns.");
      const rows: string[][] = [];
      sheet.eachRow(row => {
        const cells: string[] = [];
        for (let col = 1; col <= sheet.columnCount; col++) {
          const cell = row.getCell(col);
          const value = cell.value;
          cells.push(value instanceof Date ? `${String(value.getUTCHours()).padStart(2, "0")}:${String(value.getUTCMinutes()).padStart(2, "0")}` : typeof value === "number" && value >= 0 && value < 1 ? `${String(Math.floor(value * 24)).padStart(2, "0")}:${String(Math.round(value * 1440) % 60).padStart(2, "0")}` : cell.text);
        }
        rows.push(cells);
      });
      return rows;
    });
    text = grids.map(grid => grid.map(row => row.join("\t")).join("\n")).join("\n\n");
  } else if (ext === "pdf") {
    if (!bytes.subarray(0, 5).equals(Buffer.from("%PDF-"))) throw new Error("Invalid PDF.");
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: bytes, isEvalSupported: false });
    try {
      const info = await parser.getInfo();
      if (info.total > 5) throw new Error("Choose a timetable PDF with at most 5 pages.");
      text = (await parser.getText()).text;
      try { grids = (await parser.getTable()).mergedTables; } catch { /* Text extraction remains available. */ }
      if (text.trim().length < 40) {
        const pages = await parser.getScreenshot({ desiredWidth: 1800, imageDataUrl: false });
        text = "";
        for (const page of pages.pages) text += `${await recognize(Buffer.from(page.data))}\n`;
      }
    } finally { await parser.destroy(); }
  } else if (["jpg", "jpeg", "png"].includes(ext ?? "")) {
    const { default: sharp } = await import("sharp");
    const image = sharp(bytes, { limitInputPixels: 25000000 });
    const meta = await image.metadata();
    if (!["jpeg", "png"].includes(meta.format ?? "")) throw new Error("Choose a JPEG or PNG image.");
    text = await recognize(await image.rotate().resize({ width: 2200, withoutEnlargement: true }).png().toBuffer());
  } else throw new Error("Choose an Excel (.xlsx), PDF, JPG, or PNG timetable.");
  const fromTables = grids.flatMap(parseTimetableRows);
  const sessions = fromTables.length ? fromTables : parseTimetableRows(text.split(/\r?\n/).map(line => line.split(/\t|\s{2,}/)));
  if (sessions.length > 100) throw new Error("Choose a document with at most 100 sessions.");
  return { sessions, text: text.slice(0, 30000), warning: sessions.length ? "Review every session. Correct any missing or misread details before applying. For best results, use Excel columns: Day, Start, End, Module, Room, Lecturer." : "No sessions could be matched automatically. Use the extracted text to add sessions, or try an Excel timetable with columns: Day, Start, End, Module, Room, Lecturer." };
}
