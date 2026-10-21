import PDFDocument from "pdfkit";
import type { StudentDirectoryRow } from "./student-directory";

/** Server-only report generation; authorization remains in the export handler. */
export async function studentDetailsPdf(rows: StudentDirectoryRow[], scope: string): Promise<Buffer> {
  const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: 36, bufferPages: true,
    info: { Title: "DarasaX Student Register", Author: "DarasaX", Subject: scope } });
  const chunks: Buffer[] = [];
  const complete = new Promise<Buffer>((resolve, reject) => {
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });
  const left = 36, width = doc.page.width - 72;
  const widths = [170, 125, 210, 110, 45, width - 660];
  const labels = ["Full name", "Registration number", "Email", "Class", "Year", "Status"];
  const generated = new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Dar_es_Salaam", dateStyle: "medium", timeStyle: "short" }).format(new Date());
  let y = 0;
  function header() {
    doc.font("Helvetica-Bold").fontSize(22).fillColor("#132338").text("Darasa", left, 29, { continued: true }).fillColor("#38a3f5").text("X");
    doc.font("Helvetica").fontSize(8).fillColor("#64748b").text(`Generated ${generated} EAT`, 470, 38, { width: width - 434, align: "right" });
    doc.font("Helvetica-Bold").fontSize(17).fillColor("#132338").text("Student register", left, 67);
    doc.font("Helvetica").fontSize(9).fillColor("#475569").text(`${scope}  |  ${rows.length} student${rows.length === 1 ? "" : "s"}`, left, 92, { width });
    y = 118;
    doc.rect(left, y, width, 30).fill("#1678bd");
    let x = left;
    labels.forEach((label, i) => {
      doc.font("Helvetica-Bold").fontSize(8).fillColor("#ffffff").text(label, x + 8, y + 9, { width: widths[i] - 16, lineBreak: false });
      x += widths[i];
    });
    y += 30;
  }
  header();
  const ordered = [...rows].sort((a, b) => a.name.localeCompare(b.name) || a.email.localeCompare(b.email));
  for (const [index, row] of ordered.entries()) {
    const values = [row.name, row.registration_number || "Not provided", row.email, row.stream_id, String(row.year), row.admission_status || "Not provided"];
    doc.font("Helvetica").fontSize(8);
    const height = Math.max(32, ...values.map((value, i) => doc.heightOfString(value, { width: widths[i] - 16 }) + 18));
    if (y + height > doc.page.height - 56) { doc.addPage(); header(); }
    if (index % 2 === 0) doc.rect(left, y, width, height).fill("#f0f6fb");
    let x = left;
    values.forEach((value, i) => {
      doc.font("Helvetica").fontSize(8).fillColor("#24364b").text(value, x + 8, y + 9, { width: widths[i] - 16 });
      x += widths[i];
    });
    y += height;
    doc.moveTo(left, y).lineTo(left + width, y).strokeColor("#dce5ee").lineWidth(0.4).stroke();
  }
  if (!rows.length) doc.font("Helvetica").fontSize(10).fillColor("#64748b").text("No students found for this class.", left + 8, y + 20);
  const pages = doc.bufferedPageRange();
  for (let page = pages.start; page < pages.start + pages.count; page++) {
    doc.switchToPage(page);
    const footer = doc.page.height - 48;
    doc.font("Helvetica").fontSize(8).fillColor("#64748b").text("Confidential - student details | DarasaX", left, footer, { lineBreak: false });
    doc.text(`Page ${page + 1} of ${pages.count}`, left, footer, { width, align: "right", lineBreak: false });
  }
  doc.end();
  return complete;
}
