const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');
function load(file, deps = {}) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), {compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017}}).outputText,
    {exports, require: name => deps[name], URL});
  return exports;
}
const redirects = load('src/lib/auth/redirect.ts');
const approved = {status:'approved',welcome_seen_at:'2026-10-21'};
for (const next of ['/planner','/cr','/cr/materials','/admin','/lecturer','//evil.invalid','/\\evil.invalid','https://evil.invalid','/%63r','/modules/../cr','/modules/%2e%2e/cr','/%','/login','/auth/callback','/modules%2f../cr']) {
  assert.equal(redirects.safeStudentReturnPath(next), null, next);
  assert.equal(redirects.studentPostAuthPath(true, next, approved), '/dashboard');
  assert.equal(redirects.studentPostAuthPath(false, next), '/onboarding');
}
assert.equal(redirects.studentPostAuthPath(true, '/modules/topic-1?tab=notes', approved), '/modules/topic-1?tab=notes');
assert.equal(redirects.studentPostAuthPath(false, '/modules/topic-1'), '/onboarding?next=%2Fmodules%2Ftopic-1');
let staff = null;
let complete = false;
const signIns = [];
let auditBlocked = false, exchangeError = null;
let accountReads = null;
const readAccount = (key, value) => accountReads ? new Promise(resolve => accountReads.set(key, () => resolve(value))) : Promise.resolve(value);
async function bounded(task) {
  let timer;
  try { return await Promise.race([task, new Promise((_,reject) => {timer=setTimeout(()=>reject(Error('Login waited for nonessential work')),1000);})]); }
  finally { clearTimeout(timer); }
}
const callback = load('src/app/auth/callback/route.ts', {
  '@/lib/auth/redirect': redirects,
  '@/lib/auth/admission': {getStudentAdmission: () => readAccount('admission',approved)},
  '@/lib/auth/staff-profile': {getStaffProfile: () => readAccount('staff',staff)},
  '@/lib/app-role': {roleFromHost: () => 'student', getAppRole: () => 'student', APP_HOME: {class_rep:'/cr'}},
  'next/server': {after: task => void task(), NextResponse: {redirect: url => ({location:url.href})}},
  '@/lib/supabase/server': {createClient: async () => ({rpc: async name => { signIns.push({name, role: staff?.role ?? "student"}); if(auditBlocked) await new Promise(()=>{}); return {error:null}; }, auth: {
    exchangeCodeForSession: async () => ({data:{user:exchangeError ? null : {id:'user'}},error:exchangeError}),
    getUser: async () => {throw Error('Code exchange already verified the user');}, signOut: async () => ({})
  }})},
  '@/lib/auth/enrollment': { studentEnrollmentError: () => null },
  '@/lib/auth/profile': {getProfile: () => readAccount('profile',{onboarding_completed:complete}), ensureProfile: async (_client,_user,profile) => profile}
});
(async () => {
  const request = {url:'https://darasax.eprotechtz.com/auth/callback?code=test&next=%2Fcr'};
  assert.equal(new URL((await callback.GET(request)).location).pathname, '/onboarding');
  complete = true;
  assert.equal(new URL((await callback.GET(request)).location).pathname, '/dashboard');
  staff = {role:'class_rep',status:'active'};
  assert.equal(new URL((await callback.GET(request)).location).pathname, '/cr');
  staff = {role:'admin',status:'active'};
  assert.equal((await callback.GET(request)).location, 'https://admin.darasax.com/login');
  staff.status = 'inactive';
  assert.equal(new URL((await callback.GET(request)).location).pathname, '/login');
  assert.deepEqual(signIns.map(x => x.role), ['student','student','class_rep']);
  assert.ok(signIns.every(x => x.name === 'record_sign_in'));
  staff=null; auditBlocked=true;
  assert.equal(new URL((await bounded(callback.GET(request))).location).pathname, '/dashboard', 'Slow audit logging must not block sign-in');
  accountReads=new Map();
  const pending=callback.GET(request);
  for(let i=0;i<12;i++) await Promise.resolve();
  assert.deepEqual([...accountReads.keys()].sort(),['admission','profile','staff'],'Independent account reads start together');
  for(const resolve of accountReads.values()) resolve();
  await bounded(pending); accountReads=null;
  const profileHelpers=load('src/lib/auth/profile.ts',{'@/lib/auth/redirect':redirects});
  const known={id:'user',full_name:'Student',avatar_url:'avatar',email:'student@example.invalid'};
  assert.equal(await profileHelpers.ensureProfile({from(){throw Error('Repeated profile query');}},{id:'user',email:known.email},known),known);
  exchangeError=new Error('Expired code');
  assert.equal(new URL((await callback.GET(request)).location).pathname, '/login', 'Failed code exchange never grants access');
  console.log('Passed return-URL validation and Google callback regression tests.');
})().catch(error => {console.error(error);process.exitCode=1;});
