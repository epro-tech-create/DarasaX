const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
function load(file, deps = {}) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022,
  }}).outputText;
  vm.runInNewContext(code, { exports, require: name => deps[name] ?? require(name), Error });
  return exports;
}
const batch = load('src/lib/upload-batch.ts');
const { UploadWorkspace } = load('src/components/staff/upload-workspace.tsx', {
  '@/components/providers/language-provider': { useTranslate: () => value => value },
  '@/components/ui/button': { Button: props => React.createElement('button', props) },
  '@/data/mock': { modules: [{ id: 'mod-a', code: 'A', name: 'Module A' }] },
  '@/lib/class-registry': { useClassRegistry: () => ({ streams: [{ id: 'class-1', label: 'Class 1' }, { id: 'class-2', label: 'Class 2' }], ready: true, error: '' }) },
  '@/lib/materials-store': { useMaterialsStore: () => ({ publish: async () => {} }) },
  '@/lib/staff-auth': { useStaffSession: () => ({ session: { streamId: 'class-1', streamIds: ['class-1', 'class-2'] } }) },
  '@/lib/upload-batch': batch,
  '@/lib/supabase/query-cache': { invalidateQueries() {} },
});
for (const role of ['admin', 'class_rep', 'lecturer']) {
  const html = renderToStaticMarkup(React.createElement(UploadWorkspace, {
    role, title: 'Publish', description: 'Files', uploadedBy: 'Fixture',
    allowedModuleIds: role === 'lecturer' ? ['mod-a'] : undefined,
  }));
  assert.match(html, /value="class-1"/);
  if (role === 'class_rep') {
    assert.doesNotMatch(html, /value="all"|value="class-2"/);
  } else {
    assert.match(html, /<option value="all" selected="">All streams<\/option>/);
    assert.match(html, /value="class-2"/);
  }
  assert.match(html, /type="file"[^>]*multiple=""/);
  assert.match(html, /500 MB per file/);
}
const noModules = renderToStaticMarkup(React.createElement(UploadWorkspace, { role: 'lecturer', title: 'Upload', description: '', uploadedBy: 'Fixture', allowedModuleIds: [] }));
assert.match(noModules, /No modules assigned/);
assert.doesNotMatch(noModules, /Module A/);
assert.equal(batch.MAX_UPLOAD_BYTES, 500 * 1024 * 1024);
(async () => {
  const releases = [], states = new Map(), calls = [];
  let active = 0, peak = 0;
  const items = [0, 1, 2, 3, 4];
  const running = batch.publishBatch(items, async item => {
    calls.push(item); active++; peak = Math.max(peak, active);
    await new Promise(resolve => { releases[item] = resolve; });
    active--;
    if (item === 1) throw new Error('Network interrupted');
  }, (index, state, error) => states.set(index, { state, error }));
  assert.equal(active, 3, 'Three files upload concurrently');
  releases[0](); releases[1](); releases[2]();
  for (let i = 0; i < 10; i++) await Promise.resolve();
  releases[3](); releases[4](); await running;
  assert.equal(peak, 3);
  assert.equal(states.get(1).state, 'failed');
  assert.match(states.get(1).error, /Network interrupted/);
  for (const item of [0, 2, 3, 4]) assert.equal(states.get(item).state, 'published');
  const retry = items.filter(item => states.get(item).state === 'failed');
  await batch.publishBatch(retry, async item => calls.push(item), (index, state) => states.set(retry[index], { state }));
  assert.equal(calls.filter(item => item === 0).length, 1, 'Successful files are not uploaded again on retry');
  assert.equal(calls.filter(item => item === 1).length, 2);
  assert.equal(states.get(1).state, 'published');
  console.log('Passed admin/lecturer global defaults, CR class restriction, multiple selection, empty lecturer scope, 500 MB limit, bounded concurrency, partial failure and retry without duplicates.');
})().catch(error => { console.error(error); process.exitCode = 1; });
