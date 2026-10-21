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
const callback = load('src/app/auth/callback/route.ts', {
  '@/lib/auth/redirect': redirects,
  '@/lib/auth/admission': {getStudentAdmission: async () => approved},
  '@/lib/auth/staff-profile': {getStaffProfile: async () => staff},
  '@/lib/app-role': {roleFromHost: () => 'student', getAppRole: () => 'student', APP_HOME: {class_rep:'/cr'}},
  'next/server': {NextResponse: {redirect: url => ({location:url.href})}},
  '@/lib/supabase/server': {createClient: async () => ({rpc: async name => { signIns.push({name, role: staff?.role ?? "student"}); return {error:null}; }, auth: {
    exchangeCodeForSession: async () => ({error:null}),
    getUser: async () => ({data:{user:{id:'user'}}}), signOut: async () => ({})
  }})},
  '@/lib/auth/enrollment': { studentEnrollmentError: () => null },
  '@/lib/auth/profile': {ensureProfile: async () => ({onboarding_completed:complete})}
});
(async () => {
  const request = {url:'https://darasax.eprotechtz.com/auth/callback?code=test&next=%2Fcr'};
  assert.equal(new URL((await callback.GET(request)).location).pathname, '/onboarding');
  complete = true;
  assert.equal(new URL((await callback.GET(request)).location).pathname, '/dashboard');
  staff = {role:'class_rep',status:'active'};
  assert.equal(new URL((await callback.GET(request)).location).pathname, '/cr');
  staff.status = 'inactive';
  assert.equal(new URL((await callback.GET(request)).location).pathname, '/login');
  assert.deepEqual(signIns.map(x => x.role), ['student','student','class_rep']);
  assert.ok(signIns.every(x => x.name === 'record_sign_in'));
  console.log('Passed return-URL validation and Google callback regression tests.');
})().catch(error => {console.error(error);process.exitCode=1;});

