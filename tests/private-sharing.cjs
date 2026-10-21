const fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript'),assert=require('node:assert/strict');
function load(file,deps){const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{exports,require:n=>deps[n],URL});return exports;}
const redirects=load('src/lib/auth/redirect.ts',{});
const token='00000000-0000-0000-0000-000000000001';
let user=null,staff=null,admission={status:'pending',welcome_seen_at:null},complete=true,visible=false,signed=0;
const item={id:'material',title:'Private notes',file_path:'r2:class/material/user/file.pdf',file_name:'file.pdf'};
const client={auth:{getUser:async()=>({data:{user}})},rpc:async()=>({data:visible?item:null})};
function redirect(path){throw {redirect:path};}
const sharing=load('src/lib/material-sharing.ts',{
  'server-only':{},react:{cache:fn=>fn},'next/navigation':{redirect},
  '@/lib/supabase/server':{createClient:async()=>client},
  '@/lib/auth/staff-profile':{getStaffProfile:async()=>staff},
  '@/lib/auth/profile':{getProfile:async()=>({onboarding_completed:complete})},
  '@/lib/auth/admission':{getStudentAdmission:async()=>admission},
  '@/lib/auth/redirect':redirects
});
class Response{constructor(body,opts){this.body=body;this.status=opts?.status??200;this.headers=new Headers();}static redirect(url){return new Response(url,{status:307});}}
const route=load('src/app/share/[token]/file/route.ts',{'next/server':{NextResponse:Response},'@/lib/material-sharing':sharing,'@/lib/r2':{readUrl:async()=>{signed++;return 'https://private.invalid/signed';}}});
const call=()=>route.GET({nextUrl:new URL('https://darasax.com/share/'+token+'/file?download=1')},{params:Promise.resolve({token})});
async function expectRedirect(prefix){await assert.rejects(call(),e=>e.redirect.startsWith(prefix));assert.equal(signed,0);}
(async()=>{
 await expectRedirect('/login?next=');
 user={id:'student'};await expectRedirect('/pending-approval?next=');
 admission.status='approved';await expectRedirect('/welcome?next=');
 admission.welcome_seen_at='now';assert.equal((await call()).status,404);assert.equal(signed,0);
 visible=true;const result=await call();assert.equal(result.status,307);assert.equal(result.headers.get('Cache-Control'),'private, no-store');assert.equal(signed,1);
 signed=0;visible=false;staff={status:'active',role:'class_rep'};assert.equal((await call()).status,404);assert.equal(signed,0);
 staff={status:'inactive'};await expectRedirect('/login');
 console.log('Passed shared-download login, approval, welcome, denied scope, staff and signed-URL guards.');
})().catch(e=>{console.error(e);process.exitCode=1;});
