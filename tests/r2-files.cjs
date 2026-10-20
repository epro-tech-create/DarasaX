const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function load(file, dependencies) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
  }).outputText, { exports, require: n => dependencies[n], process, console, URL, Set });
  return exports;
}
const r2 = load('src/lib/r2.ts', { 'server-only': {}, '@aws-sdk/client-s3': require('@aws-sdk/client-s3'), '@aws-sdk/s3-request-presigner': require('@aws-sdk/s3-request-presigner') });
assert.equal(r2.materialKey('r2:class/id/user/uuid/file.pdf', 'class', 'id'), 'class/id/user/uuid/file.pdf');
for (const path of ['r2:other/id/user/file', 'r2:class/other/user/file', 'r2:class/id/../file', 'class/id/file']) {
  assert.throws(() => r2.materialKey(path, 'class', 'id'));
}
let user = { id: 'u1' }, allowed = true, item = null, removed = [], signed = [], deleted = false;
const supabase = {
  auth: { getUser: async () => ({ data: { user } }) },
  rpc: async () => ({ data: allowed }),
  from: () => ({ select() { return this; }, eq() { return this; }, delete() { deleted = true; return this; }, maybeSingle: async () => ({ data: item }) })
};
const { POST } = load('src/app/api/material-files/route.ts', {
  'node:crypto': require('node:crypto'),
  'next/server': { NextResponse: { json: (body, options) => ({ body, ...options }) } },
  '@/lib/supabase/server': { createClient: async () => supabase },
  '@/lib/r2': { materialKey: r2.materialKey, uploadUrl: async (...args) => { signed.push(args); return 'https://r2.invalid/upload'; },
    readUrl: async (...args) => { signed.push(args); return 'https://r2.invalid/read'; }, removeObject: async key => removed.push(key) }
});
const upload = { action: 'upload', streamId: 'class', materialId: 'id', fileName: 'notes.pdf', size: 1024, mimeType: 'application/pdf' };
const call = (body, origin = 'https://darasax.com') => POST({ url: 'https://darasax.com/api/material-files', headers: new Headers({ origin }), json: async () => body });
(async () => {
  assert.equal((await call(upload, 'https://evil.invalid')).status, 403);
  user = null;
  assert.equal((await call(upload)).status, 401);
  user = { id: 'u1' }; allowed = false;
  assert.equal((await call(upload)).status, 403);
  allowed = true;
  assert.equal((await call({ ...upload, size: 0 })).status, 400);
  assert.equal((await call({ ...upload, size: 500 * 1024 * 1024 })).status, 200);
  assert.equal((await call({ ...upload, size: 500 * 1024 * 1024 + 1 })).status, 400);
  assert.equal((await call({ ...upload, streamId: '../other' })).status, 400);
  const result = await call(upload);
  assert.equal(result.status, 200);
  assert.match(result.body.path, /^r2:class\/id\/u1\//);
  assert.equal((await call({ action: 'read', materialId: 'hidden' })).status, 404);
  item = { id: 'id', stream_id: 'class', module_id: null, file_path: result.body.path, file_name: 'notes.pdf' };
  assert.equal((await call({ action: 'read', materialId: 'id' })).status, 200);
  allowed = false;
  assert.equal((await call({ action: 'delete', materialId: 'id' })).status, 403);
  assert.equal(deleted, false);
  assert.equal(removed.length, 0);
  allowed = true;
  assert.equal((await call({ action: 'cleanup', materialId: 'id', path: item.file_path })).status, 409);
  assert.equal((await call({ action: 'cleanup', materialId: 'id', path: 'r2:class/another/u1/file.pdf' })).status, 503);
  assert.equal(removed.length, 0);
  assert.equal((await call({ action: 'cleanup', materialId: 'id', path: 'r2:class/id/u1/old/file.pdf' })).status, 200);
  assert.equal(removed.pop(), 'class/id/u1/old/file.pdf');
  assert.equal((await call({ action: 'delete', materialId: 'id' })).status, 200);
  assert.equal(removed[0], result.body.path.slice(3));
  // Actual SDK signing, using synthetic credentials and no network access.
  process.env.R2_ENDPOINT = 'https://example.r2.cloudflarestorage.com';
  process.env.R2_BUCKET_NAME = 'notes'; process.env.R2_ACCESS_KEY_ID = 'test'; process.env.R2_SECRET_ACCESS_KEY = 'test';
  const url = new URL(await r2.uploadUrl('class/id/test.pdf', 'application/pdf', 1024));
  assert.match(url.searchParams.get('X-Amz-SignedHeaders'), /content-length/);
  assert.match(url.searchParams.get('X-Amz-SignedHeaders'), /content-type/);
  assert.equal(url.searchParams.get('X-Amz-Expires'), '3600');
  console.log('Passed private R2 authorization, validation, deletion, and SDK signing checks.');
})().catch(e => { console.error(e); process.exitCode = 1; });
