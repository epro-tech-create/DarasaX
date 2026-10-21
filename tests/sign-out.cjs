const fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript'),assert=require('node:assert/strict');
function load(file,deps,globals={}){const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{exports,require:n=>deps[n],URL,process:{env:{NEXT_PUBLIC_SUPABASE_URL:'https://project.supabase.co'}},...globals});return exports;}
let cookies=[{name:'sb-project-auth-token.0',value:'old'},{name:'sb-project-auth-token-code-verifier',value:'old'},{name:'theme',value:'dark'}],cleared=[],calls=0;
const route=load('src/app/auth/signout/route.ts',{
 '@/lib/auth/admin-device-cookies':load('src/lib/auth/admin-device-cookies.ts',{}),
 'next/headers':{cookies:async()=>({getAll:()=>cookies,set:(...args)=>cleared.push(args)})},
 'next/server':{NextResponse:{json:(body,options={})=>({body,status:options.status??200,headers:options.headers})}},
 '@/lib/supabase/server':{createClient:async()=>({auth:{signOut:async o=>{assert.equal(o.scope,'local');calls++;throw Error('network');}}})}
});
let replaced=null,invalidated=false,fetchFailure=false,scope=null;
function storage(values){const object={...values};Object.defineProperty(object,'removeItem',{value:k=>delete object[k],enumerable:false});return object;}
const local=storage({'sb-project-auth-token':'old','darasax_last_active_at':'123','darasax_topic_progress_v2':'old','darasax:theme':'dark'}),session=storage({darasax_verify_email:'old@example.invalid',darasax_lecturer_active_stream:'old'});
const {signOutAndForget}=load('src/lib/auth/sign-out.ts',{
 '@/lib/supabase/client':{createClient:()=>({auth:{signOut:async o=>{scope=o.scope;return {error:new Error('already revoked')};}}})},
 '@/lib/supabase/query-cache':{invalidateQueries:prefix=>{assert.equal(prefix,'');invalidated=true;}}
},{fetch:async(path,opts)=>{assert.equal(path,'/auth/signout');assert.equal(opts.method,'POST');return {ok:!fetchFailure};},Event,window:{localStorage:local,sessionStorage:session,dispatchEvent(){},location:{replace:p=>replaced=p}}});
(async()=>{
 const req={url:'https://www.darasax.com/auth/signout',headers:new Headers({origin:'https://evil.invalid'})};
 assert.equal((await route.POST(req)).status,403);assert.equal(calls,0);
 req.headers=new Headers({origin:'https://www.darasax.com'});const result=await route.POST(req);assert.equal(result.status,200);assert.equal(result.headers['Cache-Control'],'private, no-store');assert.equal(cleared.length,3);assert.ok(cleared.some(c=>c[0]==='__Host-darasax-admin-challenge'));assert.ok(cleared.every(c=>c[2].maxAge===0));assert.ok(cleared.every(c=>c[0]!=='theme'));
 await signOutAndForget();assert.equal(scope,'local');assert.equal(replaced,'/login');assert.equal(invalidated,true);assert.equal(local['sb-project-auth-token'],undefined);assert.equal(session.darasax_verify_email,undefined);assert.equal(session.darasax_lecturer_active_stream,undefined);assert.equal(local['darasax:theme'],'dark');
 fetchFailure=true;replaced=null;await assert.rejects(signOutAndForget,/Could not sign out/);assert.equal(replaced,null);
 console.log('Passed sign-out CSRF, cookie expiry despite auth outage, cached identity cleanup, full-page navigation and failed-request checks.');
})().catch(e=>{console.error(e);process.exitCode=1;});
