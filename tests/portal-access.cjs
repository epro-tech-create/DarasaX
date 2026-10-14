const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function load(file, dependencies) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS }
  }).outputText, { exports, require: name => dependencies[name], process, URL });
  return exports;
}
const roles = load('src/lib/app-role.ts', {});
let user, staff, failed;
class Response {
  constructor(body, options = {}) { this.status = options.status || 200; this.body = body; this.headers = new Headers(); this.cookies = { getAll: () => [], set() {} }; }
  static next() { return new Response(); }
  static redirect(url) { const r = new Response('', { status: 307 }); r.location = url.href; return r; }
}
const { proxy } = load('src/proxy.ts', {
  'next/server': { NextResponse: Response },
  '@/lib/app-role': roles,
  '@/lib/auth/profile': { getProfile: async () => ({ onboarding_completed: true }) },
  '@/lib/auth/staff-profile': { getStaffProfile: async () => { if (failed) throw Error(); return staff; } },
  '@/lib/supabase/middleware': { updateSession: async () => ({ user, supabase: {}, supabaseResponse: Response.next() }) }
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
  const host = 'darasax.eprotechtz.com';
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
  for (const [domain, path, role] of [
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
  failed = true;
  await check(host, '/cr', cr, 503);
  failed = false;
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  await check(host, '/cr', cr, 503);
  Object.assign(process.env, saved);
  console.log('Passed 23 portal authorization scenarios (mocked Supabase sessions).');
})().catch(e => { console.error(e); process.exitCode = 1; });
