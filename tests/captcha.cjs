const fs=require('fs'),ts=require('typescript'),vm=require('vm'),assert=require('node:assert/strict');
const out={};let renders=0,active,sequence=0,scriptLoads=0,failNextLoad=true;const requests=[];const widgets=new Map();
const element=()=>({style:{},setAttribute(){},append(){},remove(){},focus(){}});
const window={turnstile:{render:(node,opts)=>{const id=String(++renders);widgets.set(id,opts);return id;},execute:id=>{setImmediate(()=>widgets.get(id)?.callback('fresh-token-'+(++sequence)));},remove:id=>widgets.delete(id)}};
const document={activeElement:null,querySelector:()=>({nonce:'page-nonce'}),createElement:()=>element(),body:{append(){}},head:{appendChild:node=>{scriptLoads++;assert.equal(node.nonce,'page-nonce');setImmediate(()=>{if(failNextLoad){failNextLoad=false;node.onerror();}else node.onload();});}}};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/lib/auth/captcha.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{exports:out,window,document,HTMLElement:class {},URL,Request,Response,Promise,Error,JSON,String,setTimeout,clearTimeout,process:{env:{NEXT_PUBLIC_TURNSTILE_SITE_KEY:'test-widget',NEXT_PUBLIC_SUPABASE_URL:'https://test.supabase.co'}},fetch:async(url,opts)=>{requests.push({url,opts});return new Response('{}');}});
(async()=>{
await out.preloadCaptcha();assert.equal(scriptLoads,1,'Warm-up failures are recoverable');
await Promise.all([out.preloadCaptcha(),out.preloadCaptcha()]);assert.equal(scriptLoads,2,'Concurrent warm-ups share a script request');
assert.equal(renders,0,'Preloading never starts a verification challenge');assert.equal(requests.length,0,'Preloading never sends an auth request');
for(const path of ['signup','otp','recover','resend','token?grant_type=password'])await out.captchaFetch('https://test.supabase.co/auth/v1/'+path,{method:'POST',body:JSON.stringify({email:'test@example.invalid'})});
assert.equal(scriptLoads,2,'Submissions reuse the loaded script');
assert.equal(renders,5);assert.equal(new Set(requests.map(r=>JSON.parse(r.opts.body).gotrue_meta_security.captcha_token)).size,5);
for(const path of ['verify','token?grant_type=refresh_token','authorize'])await out.captchaFetch('https://test.supabase.co/auth/v1/'+path,{method:'POST',body:'{}'});
await out.captchaFetch('https://other.invalid/auth/v1/signup',{method:'POST',body:'{}'});
assert.equal(renders,5);assert.ok(requests.slice(5).every(r=>r.opts.body==='{}'));
console.log('Passed fresh CAPTCHA tokens on login, signup, recovery, OTP send/resend; OTP verification, refresh, OAuth and other origins stay unchanged.');
})().catch(e=>{console.error(e);process.exitCode=1;});
