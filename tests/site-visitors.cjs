const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const crypto = require('node:crypto');
const calls = [];
const env = { VERCEL_ENV: 'production', APP_ROLE: 'student', VISITOR_TRACKING_SECRET: 'synthetic-test-secret', NEXT_PUBLIC_SUPABASE_URL: 'https://test.invalid', NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test' };
const exportsObject = {};
class FixedDate extends Date { constructor() { super('2026-10-20T22:00:00Z'); } }
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/app/api/site-visits/route.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
}).outputText, {
  exports: exportsObject, Response, URL, Intl, Date: FixedDate, process: { env },
  require: name => ({ 'node:crypto': crypto, 'node:net': require('node:net'),
    '@supabase/supabase-js': { createClient: () => ({ rpc: async (name, input) => { calls.push({ name, input }); return {}; } }) }
  })[name]
});
const { POST } = exportsObject;
function call(headers = {}) {
  return POST(new Request('https://www.darasax.com/api/site-visits', { method: 'POST', headers: {
    origin: 'https://www.darasax.com', 'user-agent': 'Browser', 'x-vercel-forwarded-for': '192.0.2.1', ...headers
  } }));
}
(async () => {
  assert.equal((await call({ origin: 'https://evil.invalid' })).status, 403);
  assert.equal((await call({ 'user-agent': 'SearchBot' })).status, 204);
  assert.equal((await call({ 'x-vercel-forwarded-for': 'not-an-ip' })).status, 204);
  assert.equal(calls.length, 0);
  assert.equal((await call()).status, 204);
  assert.equal(calls[0].input.visit_day, '2026-10-21'); // Tanzania has crossed midnight.
  assert.equal(calls[0].input.visit_hash, crypto.createHmac('sha256', env.VISITOR_TRACKING_SECRET).update('site-visitor:2026-10-21:192.0.2.1').digest('hex'));
  assert.equal(JSON.stringify(calls).includes('192.0.2.1'), false);
  await call({ 'x-forwarded-for': '203.0.113.1' });
  assert.equal(calls[0].input.visit_hash, calls[1].input.visit_hash);
  env.APP_ROLE = 'admin'; await call(); assert.equal(calls.length, 2);
  env.APP_ROLE = 'student'; env.VERCEL_ENV = 'preview'; await call(); assert.equal(calls.length, 2);
  console.log('Passed visitor hashing, trusted header, timezone rollover, bot filtering, origin, and production-only checks.');
})().catch(error => { console.error(error); process.exitCode = 1; });
