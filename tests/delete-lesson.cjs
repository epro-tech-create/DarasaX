const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const exported = {};
const calls = [];
let failure = null;
const client = { rpc: async (name, args) => {
  calls.push({ name, args });
  return name === 'change_timetable_session' ? { error: failure } : { data: [], error: null };
} };
const dependencies = {
  react: { useCallback: fn => fn, useEffect: () => {}, useState: value => [value, () => {}] },
  '@/lib/audit-log': {},
  '@/lib/supabase/client': { createClient: () => client },
  '@/lib/supabase/query-cache': { invalidateQueries: () => {}, cachedQuery: (_key, fetcher) => fetcher() },
  '@/lib/timetable-dates': { tanzaniaDate: () => '2026-10-29', addDateDays: date => date },
};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/lib/timetable-store.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText, { exports: exported, require: name => dependencies[name],
  process: { env: { NEXT_PUBLIC_SUPABASE_URL: 'test', NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test' } },
  window: { dispatchEvent: () => {} }, Event: class {} });
(async () => {
  const store = exported.useTimetableStore();
  const entry = { id: 'series@2026-10-30', seriesId: 'series', moduleId: 'mod-web', streamId: 'class', startTime: '08:00', endTime: '10:00', room: 'Lab', lecturer: 'Teacher' };
  const change = { date: '2026-10-30', scope: 'once', reason: '', requestId: 'request-id' };
  await store.deleteEntry(entry, change);
  const request = calls.find(call => call.name === 'change_timetable_session');
  assert.equal(request.args.entry_id, 'series');
  assert.equal(request.args.occurrence_date, change.date);
  assert.equal(request.args.change_scope, 'once');
  assert.equal(request.args.change_status, 'cancelled');
  assert.equal(request.args.new_module, entry.moduleId);
  assert.equal(request.args.change_reason, 'Lesson deleted from the timetable.');
  assert.equal(request.args.request_id, change.requestId);
  failure = new Error('Permission denied');
  await assert.rejects(store.deleteEntry(entry, change), /Permission denied/);
  console.log('Passed dated lesson deletion, cancellation RPC, original series identity, default reason, and permission failure propagation.');
})().catch(error => { console.error(error); process.exitCode = 1; });
