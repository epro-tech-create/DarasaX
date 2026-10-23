const assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm'),ts=require('typescript');
function load(path,mocks){const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText,{exports,require:n=>mocks[n]??require(n)});return exports;}
const policy=load('src/lib/auth/idle-policy.ts',{});
async function scenario(role){
 let now=1_000_000,callback,activity,expired=0;
 const storage=new Map([['darasax_last_active_at',String(now)]]);
 const fakeDate=class extends Date {static now(){return now;}};
 const exports={};
 vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/components/auth/session-timeout.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{
  exports,Date:fakeDate,Number,
  localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},
  window:{addEventListener:(name,fn)=>{if(name==='pointerdown')activity=fn;},removeEventListener(){},setInterval:fn=>{callback=fn;return 1;},clearInterval(){}},
  document:{visibilityState:'visible',addEventListener(){},removeEventListener(){}},
  require:n=>({'react':{useEffect:fn=>fn()},'@/lib/auth/sign-out':{signOutAndForget:async()=>{expired++;}},'@/lib/app-role':{getAppRole:()=>role},'@/lib/auth/idle-policy':policy,'@/lib/supabase/client':{createClient:()=>({auth:{getSession:async()=>({data:{session:{user:{last_sign_in_at:new Date(0).toISOString()}}}})}})}}[n])
 });
 async function tick(){callback();await new Promise(r=>setImmediate(r));}
 exports.SessionTimeout(); await tick(); assert.equal(expired,0);
 const limit=policy.idleTimeoutMs(role);
 now+=limit-1; await tick(); assert.equal(expired,0,role+' remains signed in before limit');
 activity(); const latest=now;
 now+=limit-1; await tick(); assert.equal(expired,0,role+' activity resets timer');
 now=latest+limit; activity(); await new Promise(r=>setImmediate(r)); assert.equal(expired,1,role+' cannot revive an expired session');
 assert.equal(Number(storage.get('darasax_last_active_at')),latest);
}
(async()=>{assert.equal(policy.idleTimeoutMs('admin'),1800000);assert.equal(policy.idleTimeoutMs('student'),21600000);for(const role of ['class_rep','lecturer'])assert.equal(policy.idleTimeoutMs(role),7200000);for(const role of ['admin','student','class_rep','lecturer'])await scenario(role);assert.match(policy.idleTimeoutMessage('admin'),/30 minutes/);assert.match(policy.idleTimeoutMessage('student'),/6 hours/);assert.match(policy.idleTimeoutMessage('class_rep'),/2 hours/);console.log('Passed role-specific idle limits, activity resets, exact expiry boundary and expired-session protection for all four portals.');})().catch(e=>{console.error(e);process.exitCode=1;});

