const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function load(file, dependencies = {}) {
  const exported = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText, {
    exports: exported, require: name => name in dependencies ? dependencies[name] : require(name), Buffer, File, setTimeout, clearTimeout,
  });
  return exported;
}
const catalog = load('src/data/mock.ts', { '@/data/current-timetable': { currentTimetable: [] } });
const parser = load('src/lib/timetable-import.ts', { '@/data/mock': catalog });
const documents = load('src/lib/timetable-document.ts', { 'server-only': {}, '@/lib/timetable-import': parser });
const course = catalog.modules[0];
const fields = ['Day', 'Start', 'End', 'Module', 'Room', 'Lecturer'];
const rows = [fields, ['Monday', '07:00', '09:00', course.code, 'R1-1', 'Teacher One']];
(async () => {
  let result = parser.parseTimetableRows(rows);
  assert.equal(result.length, 1); assert.equal(result[0].moduleId, course.id); assert.equal(parser.validateImport(result).length, 0);
  assert.equal(parser.parseTime('1:30 pm'), '13:30'); assert.equal(parser.parseTime('25:00'), '');
  assert.ok(parser.validateImport([...result, { ...result[0], start: '08:00' }]).some(e => e.includes('overlap')));
  assert.ok(parser.validateImport([{...result[0], room: ''}]).length);
  assert.equal(parser.parseTimetableRows([['Day','07:00–09:00','09:00–11:00'],['Monday',`${course.code} Room R1-1 Dr Test`, 'Break']]).length, 1);
  assert.equal(parser.parseTimetableRows([['Time','Monday','Tuesday'],['07:00–09:00',`${course.code} Room R1-1 Dr Test`, '']]).length, 1);
  const { Workbook } = require('exceljs'); const workbook = new Workbook();
  const sheet = workbook.addWorksheet('Class'); rows.forEach(row => sheet.addRow(row));
  const xlsx = new File([await workbook.xlsx.writeBuffer()], 'schedule.xlsx');
  result = await documents.extractTimetable(xlsx); assert.equal(result.sessions[0].moduleId, course.id); assert.equal(result.sessions[0].lecturer, 'Teacher One');
  const PDF = require('pdfkit'); const pdf = new PDF({size:'A4'}); const chunks=[];
  const done = new Promise(resolve => pdf.on('end',resolve)); pdf.on('data',chunk=>chunks.push(chunk));
  pdf.fontSize(12).text(`Monday 07:00 - 09:00 ${course.code} Room R1-1 Dr Test`); pdf.end(); await done;
  result = await documents.extractTimetable(new File([Buffer.concat(chunks)], 'schedule.pdf'));
  assert.equal(result.sessions.length, 1); assert.equal(result.sessions[0].moduleId, course.id);
  const sharp = require('sharp');
  const svg = `<svg width="1800" height="160" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="white"/><text x="30" y="90" fill="black" font-family="Arial" font-size="38">Monday 07:00 - 09:00 ${course.code} Room R1-1 Dr Test</text></svg>`;
  const image = await sharp(Buffer.from(svg)).png().toBuffer();
  result = await documents.extractTimetable(new File([image], 'schedule.png'));
  assert.ok(result.text.includes('Monday')); assert.equal(result.sessions.length, 1); assert.equal(result.sessions[0].moduleId, course.id);
  const scan = new PDF({ size: [1800, 160], margin: 0 }); const scanChunks = [];
  const scanned = new Promise(resolve => scan.on('end', resolve)); scan.on('data', chunk => scanChunks.push(chunk));
  scan.image(image, 0, 0, { width: 1800, height: 160 }); scan.end(); await scanned;
  result = await documents.extractTimetable(new File([Buffer.concat(scanChunks)], 'scanned.pdf'));
  assert.equal(result.sessions.length, 1); assert.equal(result.sessions[0].moduleId, course.id);
  await assert.rejects(() => documents.extractTimetable(new File(['bad'], 'schedule.pdf')), /Invalid PDF/);
  console.log('Passed actual Excel, text PDF, image OCR, and scanned PDF extraction; row and matrix layouts; module matching; missing-field and clash validation; invalid PDF rejection.');
})().catch(error => { console.error(error); process.exitCode=1; });
