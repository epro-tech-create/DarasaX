const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function load(file, deps = {}) {
 const exports = {};
 vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{exports,require:n=>deps[n],URL,RegExp});
 return exports;
}
const roles=load('src/lib/app-role.ts'), cookieHelpers=load('src/lib/auth/admin-device-cookies.ts'), security=load('src/lib/auth/admin-security.ts');
const names=cookieHelpers.adminCookieNames(true);
let user,staff,verified,startResult,attemptAllowed,verifyError,verifyUser,finishError,stored,writes,sends,verificationCalls,rpcs,signedOut;
function reset(){ user={id:'admin-one',email:'admin@example.invalid'};staff={role:'admin',status:'active'};verified=false;startResult={sent:true,verified:false};attemptAllowed=true;verifyError=null;verifyUser=user;finishError=null;stored=new Map();writes=[];sends=[];verificationCalls=[];rpcs=[];signedOut=false; }
const client={auth:{
 getUser:async()=>({data:{user}}),
 signInWithOtp:async args=>{sends.push(args);return {error:null};},
 verifyOtp:async args=>{verificationCalls.push(args);return {data:{user:verifyUser},error:verifyError};},
 signOut:async()=>{signedOut=true;}
},rpc:async(name,args)=>{rpcs.push({name,args});if(name==='admin_email_verified')return {data:verified};if(name==='start_admin_email_check')return {data:startResult};if(name==='admin_email_attempt')return {data:attemptAllowed};if(name==='finish_admin_email_check')return {error:finishError};return {error:null};}};
const route=load('src/app/api/admin-security/route.ts',{
 'node:crypto':require('node:crypto'),
 'next/headers':{cookies:async()=>({get:name=>stored.has(name)?{value:stored.get(name)}:undefined,set:(name,value,options)=>{writes.push({name,value,options});if(options.maxAge===0)stored.delete(name);else stored.set(name,value);}})},
 'next/server':{NextResponse:{json:(body,options={})=>({body,status:options.status??200,headers:options.headers})}},
 '@/lib/supabase/server':{createClient:async()=>client},
 '@/lib/auth/staff-profile':{getStaffProfile:async()=>staff},
 '@/lib/auth/admin-security':security,
 '@/lib/auth/admin-device-cookies':cookieHelpers,
 '@/lib/app-role':roles,
 '@/lib/auth/email':{maskEmail:()=> 'a***@example.invalid'},
 '@/lib/auth/constants':{AUTH_OTP_LENGTH:6}
});
const request=(body,origin='https://admin.darasax.com')=>({url:'https://admin.darasax.com/api/admin-security',headers:new Headers({origin}),json:async()=>body});
const call=body=>route.POST(request(body));
(async()=>{
 reset();assert.equal((await route.GET(request())).body.verified,false);
 assert.equal((await route.POST(request({action:'start'},'https://evil.invalid'))).status,403);assert.equal(sends.length,0);
 user=null;assert.equal((await call({action:'start'})).status,401);assert.equal(sends.length,0);
 reset();staff={role:'lecturer',status:'active'};assert.equal((await call({action:'start'})).status,401);
 reset();staff.status='inactive';assert.equal((await call({action:'start'})).status,401);
 reset();assert.equal((await route.POST({...request({action:'start'}),url:'https://lecturer.darasax.com/api/admin-security',headers:new Headers({origin:'https://lecturer.darasax.com'})})).status,401);
 reset();const sent=await call({action:'start',email:'attacker@example.invalid'});assert.equal(sent.status,200);assert.equal(sends[0].email,'admin@example.invalid');assert.equal(sends[0].options.shouldCreateUser,false);assert.match(stored.get(names.challenge),/^[a-f0-9]{64}$/);assert.equal(sent.body.email,'a***@example.invalid');
 assert.ok(writes.every(w=>w.options.httpOnly&&w.options.secure&&w.options.sameSite==='strict'&&w.options.path==='/'));assert.equal(writes[0].options.maxAge,600);assert.equal(sent.headers['Cache-Control'],'private, no-store');
 reset();startResult={verified:true};assert.equal((await call({action:'start'})).body.verified,true);assert.equal(sends.length,0);
 reset();startResult={error:'Please sign in again.',restart:true};assert.equal((await call({action:'start'})).status,429);assert.equal(sends.length,0);assert.equal(writes.length,0);
 reset();assert.equal((await call({action:'verify',code:'123456'})).status,401);assert.equal(verificationCalls.length,0);
 for(const code of ['12345','1234567','12345x',123456,'']){reset();stored.set(names.challenge,'challenge');assert.equal((await call({action:'verify',code})).status,400);assert.equal(verificationCalls.length,0);}
 reset();stored.set(names.challenge,'challenge');attemptAllowed=false;assert.equal((await call({action:'verify',code:'123456'})).status,429);assert.equal(verificationCalls.length,0);
 reset();stored.set(names.challenge,'challenge');verifyError={message:'invalid'};assert.equal((await call({action:'verify',code:'123456'})).status,400);assert.ok(!rpcs.some(r=>r.name==='finish_admin_email_check'));
 reset();stored.set(names.challenge,'challenge');verifyUser={id:'other-account'};assert.equal((await call({action:'verify',code:'123456'})).status,403);assert.equal(signedOut,true);assert.equal(stored.has(names.challenge),false);
 reset();stored.set(names.challenge,'challenge');finishError={message:'invalid proof'};assert.equal((await call({action:'verify',code:'123456',remember:true})).status,403);assert.equal(stored.has(names.browser),false);
 reset();stored.set(names.challenge,'challenge');assert.equal((await call({action:'verify',code:'123456'})).body.verified,true);assert.equal(verificationCalls[0].email,user.email);assert.equal(verificationCalls[0].type,'email');assert.equal(stored.has(names.browser),false);assert.equal(stored.has(names.challenge),false);
 reset();stored.set(names.challenge,'challenge');assert.equal((await call({action:'verify',code:'123456',remember:true})).status,200);const browserWrite=writes.find(w=>w.name===names.browser);assert.equal(browserWrite.options.maxAge,30*24*60*60);assert.equal(browserWrite.options.httpOnly,true);assert.match(browserWrite.value,/^[a-f0-9]{64}$/);
 assert.equal((await call({action:'forget'})).status,200);assert.equal(stored.has(names.browser),false);
 console.log('Passed administrator email API: CSRF, role checks, authenticated recipient, code validation, attempt limits, account swap rejection, fail-closed proof, secure cookies, optional trust and revocation.');
})().catch(error=>{console.error(error);process.exitCode=1;});
