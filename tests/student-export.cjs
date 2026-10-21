const fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript'),assert=require('node:assert/strict');
function load(file,deps={}){const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{exports,require:n=>deps[n],URL});return exports;}
const directory=load('src/lib/student-directory.ts');
assert.equal(directory.csvCell('=HYPERLINK("x")'), `"'=HYPERLINK(""x"")"`);
for(const value of ['+cmd','-cmd','@SUM(1)','  =cmd','\tcmd','\rcmd'])assert.ok(directory.csvCell(value).startsWith(String.fromCharCode(34,39)),value);
assert.equal(directory.csvCell('a,"b"\nc'),'"a,""b""\nc"');
let user={id:'staff'},staff={role:'class_rep',status:'active',stream_id:'class-1',stream_ids:[]},rpcError=false;
let rows=[{id:'one',name:'Student one',email:'one@example.invalid',registration_number:'000230242400506123456789012345678901234567890',stream_id:'class-1',year:3,admission_status:'approved'},
{id:'two',name:'Other class',email:'two@example.invalid',registration_number:'2500002',stream_id:'class-2',year:3,admission_status:'approved'}];
const client={auth:{getUser:async()=>({data:{user}})},rpc:async()=>({data:rows,error:rpcError?{}:null})};
class Response{constructor(body,opts={}){this.body=body;this.status=opts.status??200;this.headers=new Headers(opts.headers);}static json(body,opts){return new Response(body,opts);}}
const {GET}=load('src/app/api/students/export/route.ts',{'next/server':{NextResponse:Response},'@/lib/supabase/server':{createClient:async()=>client},'@/lib/auth/staff-profile':{getStaffProfile:async()=>staff},'@/lib/student-directory':directory});
const call=(query='')=>GET({url:'https://www.darasax.com/api/students/export'+query});
(async()=>{
 user=null;assert.equal((await call()).status,401);user={id:'staff'};
 for(const membership of [null,{role:'student',status:'active'},{role:'class_rep',status:'inactive',stream_id:'class-1'}]){staff=membership;assert.equal((await call()).status,403);}
 staff={role:'class_rep',status:'active',stream_id:'class-1',stream_ids:[]};
 const cr=await call();assert.equal(cr.status,200);assert.ok(cr.body.startsWith('\uFEFF'));assert.match(cr.body,/000230242400506123456789012345678901234567890/);assert.ok(!cr.body.includes('Other class'));assert.equal(cr.headers.get('Cache-Control'),'private, no-store');assert.match(cr.headers.get('Content-Disposition'),/attachment/);
 assert.equal((await call('?class=class-2')).status,403);
 staff={role:'lecturer',status:'active',stream_id:'class-1',stream_ids:['class-2']};
 const lecturer=await call();assert.ok(lecturer.body.includes('Other class'));assert.ok(!lecturer.body.includes('Student one'));assert.equal((await call('?class=class-1')).status,403);
 staff={role:'admin',status:'active',stream_ids:[]};const admin=await call();assert.ok(admin.body.includes('Student one')&&admin.body.includes('Other class'));const selected=await call('?class=class-2');assert.ok(!selected.body.includes('Student one'));assert.equal((await call('?class=%0d%0aheader')).status,400);
 rpcError=true;assert.equal((await call()).status,500);rpcError=false;
 rows=Array.from({length:1005},(_,i)=>({...rows[0],id:String(i),name:'Student-'+i,registration_number:null}));
 const large=await call();assert.ok(large.body.includes('Student-1004'));assert.ok(!large.body.includes('undefined'));
 console.log('Passed student export authorization for all roles, class filters, exact registration strings, CSV escaping/formula safety, errors and complete large rosters.');
})().catch(e=>{console.error(e);process.exitCode=1;});
