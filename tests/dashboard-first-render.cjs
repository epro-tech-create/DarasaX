const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict'),ts=require('typescript');
function load(file,deps){const exported={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2020}}).outputText,{exports:exported,require:n=>deps[n],Date,Intl});return exported;}
const dates=load('src/lib/timetable-dates.ts',{});
let workspace={user:{id:'one'},profile:{class_name:'BENG24COE-1'}},failed=false,calls=[];
const row={series_id:'lesson',original_date:'2026-10-27',session_date:'2026-10-27',stream_id:'BENG24COE-1',module_id:'mod-dsp',day:2,start_time:'10:00',end_time:'13:00',room:'C7',lecturer:'Teacher',status:'scheduled',reason:''};
const client={rpc:(name,args)=>({eq:(key,value)=>({range:async()=>{calls.push({name,args,key,value});return {data:[row],error:failed?new Error('Offline'):null};}})})};
const server=load('src/lib/auth/dashboard-timetable.ts',{'server-only':{},'@/lib/auth/student-workspace':{getStudentWorkspace:async()=>({...workspace,client})},'@/lib/timetable-dates':dates});
(async()=>{
const now=new Date('2026-10-26T07:00:00Z');const initial=await server.getDashboardTimetable(now);
assert.equal(initial.loaded,true);assert.equal(initial.entries.length,1);assert.equal(calls[0].value,'BENG24COE-1');assert.equal(calls[0].args.range_start,'2026-10-26');
failed=true;assert.equal((await server.getDashboardTimetable(now)).loaded,false,'Network failure is not an empty timetable');
workspace={user:null,profile:null};const count=calls.length;await server.getDashboardTimetable(now);assert.equal(calls.length,count,'Guests do not read schedules');
let live={entries:[],ready:false,error:''};const Card=()=>null;
const component=load('src/components/dashboard/live-next-class.tsx',{'react':{useState:f=>[f(),()=>{}],useEffect:()=>{}},'react/jsx-runtime':{jsx:(type,props)=>({type,props})},'@/components/providers/student-profile-provider':{useStudentProfile:()=>({profile:{class_name:'BENG24COE-1'}})},'@/components/providers/language-provider':{useTranslate:()=>s=>s},'@/lib/timetable-store':{useTimetableStore:()=>live},'@/lib/academic':{getNextClass:(_now,_stream,entries)=>entries.length?{entry:entries[0],module:{},dayOffset:1}:null},'@/components/dashboard/next-class-card':{NextClassCard:Card}});
const props={initialEntries:initial.entries,initialLoaded:true,initialNow:now.getTime()};
assert.equal(component.LiveNextClass(props).type,Card,'The hero exists before client data loads');
live={entries:[],ready:true,error:'Offline'};assert.equal(component.LiveNextClass(props).type,Card,'A failed refresh keeps the server-rendered hero');
live={entries:[],ready:true,error:''};assert.match(component.LiveNextClass(props).props.className,/min-h/,'A confirmed empty schedule keeps its layout space');
console.log('Passed initial hero rendering, class-scoped server data, unauthenticated access, refresh failure, and stable empty-state checks.');
})().catch(e=>{console.error(e);process.exitCode=1;});
