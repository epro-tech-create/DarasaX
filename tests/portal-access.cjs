const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function load(file, dependencies) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
  }).outputText, { exports, require: name => dependencies[name], process, URL });
  return exports;
}
const roles = load('src/lib/app-role.ts', {});
for (const [host, role] of [
  ['darasax.com', 'student'], ['www.darasax.com', 'student'],
  ['admin.darasax.com', 'admin'], ['lecturer.darasax.com', 'lecturer'],
  ['cr.darasax.com', 'class_rep'],
]) assert.equal(roles.roleFromHost(host), role, host);
assert.equal(roles.roleFromHost('admin.darasax.com.evil.invalid'), null);
let user, staff, failed;
class Response {
  constructor(body, options = {}) { this.status = options.status || 200; this.body = body; this.headers = new Headers(); this.cookies = { getAll: () => [], set() {} }; }
  static next() { return new Response(); }
  static redirect(url) { const r = new Response('', { status: 307 }); r.location = url.href; return r; }
}
const redirects = load('src/lib/auth/redirect.ts', {});
let admission = {status:'approved',welcome_seen_at:'2026-10-21'};
const { proxy } = load('src/proxy.ts', {
  '@/lib/auth/redirect': redirects,
  '@/lib/auth/admission': {getStudentAdmission: async () => admission},
  'next/server': { NextResponse: Response },
  '@/lib/app-role': roles,
  '@/lib/auth/enrollment': { studentEnrollmentError: () => null },
  '@/lib/auth/profile': { getProfile: async () => ({ onboarding_completed: true, institution:"Dar es Salaam Institute of Technology (DIT)", programme:"BENG24COE", year_of_study:3, semester:1, class_name:"BENG24COE-1" }) },
  '@/lib/auth/staff-profile': { getStaffProfile: async () => { if (failed) throw Error(); return staff; } },
  '@/lib/supabase/middleware': { updateSession: async () => ({ user, supabase: { from: () => ({ select() { return this; }, eq() { return this; }, maybeSingle: async () => ({ data: { id: 'BENG24COE-1', institution: 'Dar es Salaam Institute of Technology (DIT)', programme: 'BENG24COE', year: 3, semester: 1 } }) }) }, supabaseResponse: Response.next() }) }
});
const saved = { ...process.env };
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.invalid';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test';
async function check(host, path, member, expected, destination) {
  user = member === undefined ? null : { id: 'user' };
  staff = member || null;
  const url = new URL(`https://${host}${path}`);
  const result = await proxy({ nextUrl: url, url: url.href, headers: new Headers({ host }), cookies: {} });
  assert.equal(result.status, expected, `${host}${path} role ${member?.role}`);
  if (destination) assert.equal(new URL(result.location).pathname, destination);
}
(async () => {
  const host = 'darasax.com';
  const cr = { role: 'class_rep', status: 'active' };
  await check(host, '/cr', undefined, 307, '/login');
  await check(host, '/cr', null, 403);
  await check(host, '/cr/file.pdf', null, 403);
  await check(host, '/cr', cr, 200);
  await check(host, '/dashboard', cr, 307, '/cr');
  await check(host, '/login', cr, 307, '/cr');
  await check(host, '/cr', { ...cr, status: 'inactive' }, 403);
  await check(host, '/cr', { role: 'lecturer', status: 'active' }, 403);
  await check(host, '/dashboard', null, 200);
  admission = {status:'pending',welcome_seen_at:null};
  await check(host, '/dashboard', null, 307, '/pending-approval');
  await check(host, '/pending-approval', null, 200);
  admission.status = 'approved';
  await check(host, '/dashboard', null, 307, '/welcome');
  admission.welcome_seen_at = '2026-10-21';
  await check(host, '/welcome', null, 307, '/dashboard');
  for (const [domain, path, role] of [
    ['admin.darasax.com', '/admin', 'admin'],
    ['lecturer.darasax.com', '/lecturer', 'lecturer'],
    ['darasax-admin.eprotechtz.com', '/admin', 'admin'],
    ['lecturer.eprotechtz.com', '/lecturer', 'lecturer']
  ]) {
    await check(domain, path, undefined, 307, '/login');
    await check(domain, path, null, 403);
    await check(domain, path, cr, 403);
    await check(domain, path, { role, status: 'active' }, 200);
    await check(domain, path, { role, status: 'inactive' }, 403);
    await check(domain, '/register', undefined, 307, '/login');
  }
  await check('darasax-cr.eprotechtz.com', '/', undefined, 307, '/cr');
  assert.equal(new URL((await proxy({ nextUrl: new URL('https://cr.darasax.com/'), url: 'https://cr.darasax.com/', headers: new Headers({ host: 'cr.darasax.com' }) })).location).origin, 'https://darasax.com');
  failed = true;
  await check(host, '/cr', cr, 503);
  failed = false;
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  await check(host, '/cr', cr, 503);
  Object.assign(process.env, saved);
  console.log('Passed portal authorization and domain migration scenarios (mocked Supabase sessions).');
})().catch(e => { console.error(e); process.exitCode = 1; });
