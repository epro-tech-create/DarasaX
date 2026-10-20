const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function load(path, dependencies = {}) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText,
    { exports, require: key => dependencies[key], Date, Map, Promise, process: { env: { NEXT_PUBLIC_SUPABASE_URL: 'https://test.invalid', NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test' } } });
  return exports;
}
const cache = load('src/lib/supabase/query-cache.ts');
(async () => {
  let requests = 0;
  const fetcher = async () => { requests++; return 'value'; };
  await Promise.all(Array.from({ length: 6 }, () => cache.cachedQuery('shared', fetcher)));
  assert.equal(requests, 1);
  cache.invalidateQueries('shared');
  await cache.cachedQuery('shared', fetcher); assert.equal(requests, 2);
  let resolveOld;
  const old = cache.cachedQuery('race', () => new Promise(resolve => { resolveOld = resolve; }));
  cache.invalidateQueries('race');
  assert.equal(await cache.cachedQuery('race', async () => 'new'), 'new');
  resolveOld('old'); await old;
  assert.equal(await cache.cachedQuery('race', async () => 'unexpected'), 'new');
  let rejectOld;
  const rejected = cache.cachedQuery('error-race', () => new Promise((_resolve, reject) => { rejectOld = reject; }));
  cache.invalidateQueries('error-race');
  await cache.cachedQuery('error-race', async () => 'new');
  rejectOld(new Error('old request failed')); await assert.rejects(rejected);
  assert.equal(await cache.cachedQuery('error-race', async () => 'unexpected'), 'new');
  let authRequests = 0, profileRequests = 0;
  const staff = load('src/lib/staff-auth.ts', {
    react: {}, '@/lib/staff-session-context': {}, '@/lib/supabase/query-cache': cache,
    '@/lib/supabase/client': { createClient: () => ({ auth: { getUser: async () => { authRequests++; return { data: { user: { id: 'staff' } } }; } } }) },
    '@/lib/auth/staff-profile': { getStaffProfile: async () => { profileRequests++; return { id: 'staff', role: 'class_rep', status: 'active', stream_id: 'BENG24COE-2' }; } },
    '@/lib/lecturer-context': {}
  });
  await Promise.all(Array.from({ length: 6 }, () => staff.fetchStaffSession()));
  assert.equal(authRequests, 1); assert.equal(profileRequests, 1);
  cache.invalidateQueries('');
  await staff.fetchStaffSession(); assert.equal(authRequests, 2);
  console.log('Passed request deduplication, invalidation race and shared staff-session checks (six consumers use one auth/profile request pair).');
})().catch(error => { console.error(error); process.exitCode = 1; });
