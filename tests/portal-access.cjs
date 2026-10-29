const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function load(file, dependencies) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
  }).outputText, { exports, require: name => dependencies[name], process, URL, Headers });
  return exports;
}
const roles = load('src/lib/app-role.ts', {});
for (const [host, role] of [
  ['darasax.com', 'student'], ['www.darasax.com', 'student'],
  ['admin.darasax.com', 'admin'], ['lecturer.darasax.com', 'lecturer'],
  ['cr.darasax.com', 'class_rep'],
]) assert.equal(roles.roleFromHost(host), role, host);
assert.equal(roles.roleFromHost('admin.darasax.com.evil.invalid'), null);
let user, staff, failed, adminVerified=true, lecturerApplication=null;
class Response {
  constructor(body, options = {}) { this.status = options.status || 200; this.body = body; this.headers = new Headers(); this.cookies = { getAll: () => [], set() {} }; }
  static next() { return new Response(); }
  static redirect(url) { const r = new Response('', { status: 307 }); r.location = url.href; return r; }
}
const redirects = load('src/lib/auth/redirect.ts', {});
let admission = {status:'approved',welcome_seen_at:'2026-10-21'};
const securityHeaders = load('src/lib/security-headers.ts', {});
const { proxy } = load('src/proxy.ts', {
  'node:crypto': require('node:crypto'),
  '@/lib/security-headers': securityHeaders,
  '@/lib/auth/redirect': redirects,
  '@/lib/auth/admission': {getStudentAdmission: async () => admission},
  'next/server': { NextResponse: Response },
  '@/lib/app-role': roles,
  '@/lib/auth/admin-security': {adminEmailVerified:async()=>adminVerified,ADMIN_EMAIL_PATH:'/admin-verify-email'},
  '@/lib/auth/enrollment': { studentEnrollmentError: () => null },
  '@/lib/auth/profile': { getProfile: async () => ({ onboarding_completed: true, institution:"Dar es Salaam Institute of Technology (DIT)", programme:"BENG24COE", year_of_study:3, semester:1, class_name:"BENG24COE-1" }) },
  '@/lib/auth/staff-profile': { getStaffProfile: async () => { if (failed) throw Error(); return staff; } },
  '@/lib/supabase/middleware': { updateSession: async () => ({ user, supabase: { rpc:async()=>({data:lecturerApplication}),from: () => ({ select() { return this; }, eq() { return this; }, maybeSingle: async () => ({ data: { id: 'BENG24COE-1', institution: 'Dar es Salaam Institute of Technology (DIT)', programme: 'BENG24COE', year: 3, semester: 1 } }) }) }, supabaseResponse: Response.next() }) }
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
  if (destination) assert.equal(destination.startsWith('https://') ? new URL(result.location).href : new URL(result.location).pathname, destination);
}
(async () => {
  const host = 'darasax.com';
  for (const domain of ['darasax.com', 'admin.darasax.com', 'lecturer.darasax.com', 'cr.darasax.com']) {
    for (const path of ['/robots.txt', '/sitemap.xml', '/opengraph-image']) await check(domain, path, undefined, 200);
  }
  await check(host, '/', undefined, 200);
  const cr = { role: 'class_rep', status: 'active' };
  await check(host, '/login', {role:'admin',status:'active'},307,'https://admin.darasax.com/login');
  await check(host, '/dashboard', {role:'admin',status:'active'},307,'https://admin.darasax.com/login');
  // The export handler authenticates/scopes the caller itself on every portal.
  for (const domain of ['darasax.com','admin.darasax.com','lecturer.darasax.com']) await check(domain,'/api/students/export',undefined,200);
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
    await check(domain, '/register', undefined, 307, role === 'lecturer' ? '/signup' : '/login');
  }
  await check('lecturer.darasax.com', '/signup', undefined, 200);
  await check('lecturer.darasax.com', '/verify-email', null, 200);
  await check('lecturer.darasax.com', '/login', null, 200);
  await check('admin.darasax.com', '/signup', undefined, 200);
  adminVerified=false;
  await check('admin.darasax.com','/admin',{role:'admin',status:'active'},307,'/admin-verify-email');
  await check('admin.darasax.com','/admin-verify-email',{role:'admin',status:'active'},200);
  await check('admin.darasax.com','/admin-verify-email',undefined,307,'/login');
  adminVerified=true;lecturerApplication={status:'pending'};
  await check('lecturer.darasax.com','/lecturer',{role:'lecturer',status:'inactive'},307,'/lecturer-approval');
  await check('lecturer.darasax.com','/login',{role:'lecturer',status:'inactive'},307,'/lecturer-approval');
  lecturerApplication=null;
  await check('darasax-cr.eprotechtz.com', '/', undefined, 307, '/cr');
  assert.equal(new URL((await proxy({ nextUrl: new URL('https://cr.darasax.com/'), url: 'https://cr.darasax.com/', headers: new Headers({ host: 'cr.darasax.com' }) })).location).origin, 'https://darasax.com');
  failed = true;
  await check(host, '/auth/callback', cr, 200);
  await check(host, '/cr', cr, 503);
  failed = false;
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  await check(host, '/cr', cr, 503);
  Object.assign(process.env, saved);
  console.log('Passed portal authorization and domain migration scenarios (mocked Supabase sessions).');
})().catch(e => { console.error(e); process.exitCode = 1; });
