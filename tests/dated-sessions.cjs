const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
function load(file,requireFn=()=>({})){const exported={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{exports:exported,require:requireFn,Intl,Date});return exported;}
const dates=load('src/lib/timetable-dates.ts');
assert.equal(dates.tanzaniaDate(new Date('2026-10-21T22:00:00Z')),'2026-10-22');
assert.equal(dates.weekStart('2026-10-25'),'2026-10-19');assert.equal(dates.dateDay('2026-10-25'),0);
assert.equal(dates.addDateDays('2026-12-31',1),'2027-01-01');assert.equal(dates.occurrenceTime('2026-10-22','09:00'),Date.parse('2026-10-22T06:00:00Z'));
const academic=load('src/lib/academic.ts',name=>name.includes('timetable-dates')?dates:{DEFAULT_CLASS_STREAM:'BENG24COE-1',modules:[{id:'mod-numerical',name:'Numerical Methods'}],timetable:[]});
const fixture=(id,date,time,status='scheduled')=>({id,seriesId:id,originalDate:date,sessionDate:date,moduleId:'mod-numerical',streamId:'BENG24COE-1',day:dates.dateDay(date),startTime:time,endTime:'12:00',room:'B14',lecturer:'Lecturer',status});
const now=new Date('2026-10-22T05:00:00Z');
let next=academic.getNextClass(now,'BENG24COE-1',[fixture('cancel','2026-10-22','08:30','cancelled'),fixture('delay','2026-10-22','08:40','postponed'),fixture('old','2026-10-21','09:00'),fixture('right','2026-10-22','09:00')]);
assert.equal(next.entry.id,'right');assert.equal(next.dayOffset,0);
next=academic.getNextClass(now,'BENG24COE-1',[fixture('moved','2026-10-25','09:00','rescheduled')]);assert.equal(next.dayOffset,3);
assert.equal(academic.getNextClass(new Date('2026-10-26T05:00:00Z'),'BENG24COE-1',[fixture('past','2026-10-25','09:00')]),null);
next=academic.getNextClass(new Date('2026-10-22T07:30:00Z'),'BENG24COE-1',[fixture('ongoing','2026-10-22','09:00'),fixture('tomorrow','2026-10-23','07:00')]);assert.equal(next.entry.id,'ongoing');
const mapped=dates.occurrenceEntry({series_id:'weekly',original_date:'2026-10-22',session_date:'2026-10-24',stream_id:'BENG24COE-1',module_id:'mod-numerical',day:6,start_time:'14:00',end_time:'16:00',room:'B14',lecturer:'Lecturer',status:'rescheduled',reason:'Venue change'});
assert.equal(mapped.id,'weekly@2026-10-22');assert.equal(mapped.originalDate,'2026-10-22');assert.equal(mapped.sessionDate,'2026-10-24');
console.log('Passed Tanzania dates, Sunday/year boundaries, dated next-class selection, cancellation/postponement exclusion, cross-day moves, ongoing sessions, and stable occurrence identities.');
