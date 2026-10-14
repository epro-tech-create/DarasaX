const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');
const output={};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/data/current-timetable.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports:output});
const rows=output.currentTimetable;
assert.equal(rows.length,32);
for (const stream of ['BENG24COE-1','BENG24COE-2']) {
 const entries=rows.filter(row=>row.streamId===stream);
 assert.equal(entries.length,16);
 for (const row of entries) {
  assert.ok(row.startTime >= '07:00' && row.endTime <= '21:00' && row.startTime < row.endTime);
  for (const other of entries) {
   if (row.id===other.id || row.day!==other.day) continue;
   assert.ok(row.endTime<=other.startTime || other.endTime<=row.startTime, `Overlap: ${row.id}, ${other.id}`);
  }
 }
}
assert.ok(rows.some(row=>row.streamId==='BENG24COE-1' && row.day===3 && row.moduleId==='mod-web' && row.startTime==='17:00' && row.endTime==='19:00' && row.room==='R1-1'));
assert.ok(rows.some(row=>row.streamId==='BENG24COE-2' && row.day===4 && row.moduleId==='mod-web' && row.startTime==='19:00' && row.endTime==='21:00' && row.room==='Multimedia Lab 2'));
console.log('32 timetable sessions validated: stream counts, time range, no overlaps, and reference sessions.');
