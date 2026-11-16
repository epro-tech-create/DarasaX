import "server-only";
import type { StudentDirectoryRow } from "./student-directory";

/** Server-only Excel report; authorization remains in the export handler. */
export async function studentDetailsXlsx(rows: StudentDirectoryRow[], scope: string): Promise<Buffer> {
  const { Workbook } = await import("exceljs");
  const workbook = new Workbook();
  workbook.creator = "DarasaX";
  workbook.subject = scope;
  workbook.title = "DarasaX Student Register";

  const sheet = workbook.addWorksheet("Students");
  sheet.columns = [
    { header: "S/N", key: "serial", width: 8 },
    { header: "Full name", key: "name", width: 34 },
    { header: "Reg. NO", key: "registrationNumber", width: 20 },
    { header: "Class", key: "class", width: 20 },
  ];
  sheet.views = [{ state: "frozen", ySplit: 1 }];
  sheet.autoFilter = { from: "A1", to: "D1" };
  const header = sheet.getRow(1);
  header.height = 24;
  header.font = { bold: true, color: { argb: "FFFFFFFF" } };
  header.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1677D2" } };
  header.alignment = { vertical: "middle" };

  const ordered = [...rows].sort((a, b) => a.name.localeCompare(b.name) || (a.registration_number ?? "").localeCompare(b.registration_number ?? ""));
  for (const [index, row] of ordered.entries()) {
    sheet.addRow({ serial: index + 1, name: row.name, registrationNumber: row.registration_number ?? "", class: row.stream_id });
  }
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) {
      row.alignment = { vertical: "middle" };
      if (rowNumber % 2 === 0) row.eachCell(cell => { cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF2F7FC" } }; });
    }
  });

  return Buffer.from(await workbook.xlsx.writeBuffer());
}
