import PDFDocument from "pdfkit";
import type { StudentDirectoryRow } from "./student-directory";

/** Server-only report generation; authorization remains in the export handler. */
export async function studentDetailsPdf(rows: StudentDirectoryRow[], scope: string): Promise<Buffer> {
  const doc = new PDFDocument({ size: "A4", margin: 36, bufferPages: true,
    info: { Title: "DarasaX Student Register", Author: "DarasaX", Subject: scope } });
  const chunks: Buffer[] = [];
  const complete = new Promise<Buffer>((resolve, reject) => {
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });
  const left = 36, width = doc.page.width - 72;
  const widths = [34, width - 34 - 125 - 104, 125, 104];
  const labels = ["S/N", "Full name", "Reg. NO", "Class"];
  let y = 0;
  function cells(values: string[], height: number, bold = false) {
    let x = left;
    values.forEach((value, i) => {
      doc.rect(x, y, widths[i], height).lineWidth(0.6).strokeColor("black").stroke();
      doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(10).fillColor("black")
        .text(value, x + 5, y + 5, { width: widths[i] - 10, align: i === 0 ? "center" : "left" });
      x += widths[i];
    });
    y += height;
  }
  function header() {
    doc.font("Helvetica-Bold").fontSize(14).fillColor("black")
      .text(scope === "All assigned classes" ? "STUDENT REGISTER" : `${scope} - STUDENT REGISTER`, left, 36, { width, align: "center" });
    y = 36 + doc.heightOfString(scope === "All assigned classes" ? "STUDENT REGISTER" : `${scope} - STUDENT REGISTER`, { width }) + 12;
    cells(labels, 24, true);
  }
  header();
  const ordered = [...rows].sort((a, b) => a.name.localeCompare(b.name) || a.email.localeCompare(b.email));
  for (const [index, row] of ordered.entries()) {
    const values = [String(index + 1), row.name, row.registration_number || "", row.stream_id];
    doc.font("Helvetica").fontSize(10);
    const height = Math.max(23, ...values.map((value, i) => doc.heightOfString(value, { width: widths[i] - 10 }) + 10));
    if (y + height > doc.page.height - 56) { doc.addPage(); header(); }
    cells(values, height);
  }
  if (!rows.length) doc.font("Helvetica").fontSize(10).fillColor("black").text("No students found for this class.", left + 5, y + 12);
  const pages = doc.bufferedPageRange();
  for (let page = pages.start; page < pages.start + pages.count; page++) {
    doc.switchToPage(page);
    doc.font("Helvetica").fontSize(8).fillColor("black").text(`Page ${page + 1} of ${pages.count}`, left, doc.page.height - 48, { width, align: "center", lineBreak: false });
  }
  doc.end();
  return complete;
}
