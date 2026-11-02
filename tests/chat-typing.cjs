const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function load(path, dependencies, globals = {}) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText,
    { exports, require: name => dependencies[name], ...globals });
  return exports;
}
const helpers = load('src/lib/chat-typing.ts', {});
let now = 100000;
assert.equal(helpers.countOtherTypists({ a: [{ user_id: 'self', typing: true, updated_at: now }], b: [{ user_id: 'other', typing: true, updated_at: now }], c: [{ user_id: 'other', typing: true, updated_at: now }], d: [{ user_id: 'expired', typing: true, updated_at: now - 7000 }], e: [{ user_id: 'idle', typing: false, updated_at: now }], f: [{ user_id: 'future', typing: true, updated_at: now + 90000 }] }, 'self', now), 1);
const timers = new Map(); let nextTimer = 0;
const addTimer = (fn, delay, interval = false) => { const id = ++nextTimer; timers.set(id, { fn, due: now + delay, delay, interval }); return id; };
function advance(ms) {
  const end = now + ms;
  for (;;) {
    const next = [...timers].filter(([, value]) => value.due <= end).sort((a, b) => a[1].due - b[1].due)[0];
    if (!next) break;
    const [id, timer] = next; now = timer.due;
    if (timer.interval) timer.due += timer.delay; else timers.delete(id);
    timer.fn();
  }
  now = end;
}
const tracks = []; let state, cleanup, status, sync, presence = {}, removed = 0, topic, config;
const listeners = new Map();
const target = { visibilityState: 'visible', addEventListener: (name, fn) => listeners.set(name, fn), removeEventListener: name => listeners.delete(name) };
const channel = {
  on: (_type, _filter, fn) => { sync = fn; return channel; },
  subscribe: fn => { status = fn; return channel; },
  presenceState: () => presence,
  track: payload => { tracks.push(payload); return Promise.resolve('ok'); },
};
const hook = load('src/hooks/use-chat-typing.ts', {
  react: { useState: initial => { state = initial; return [state, next => { state = typeof next === 'function' ? next(state) : next; }]; }, useRef: value => ({ current: value }), useCallback: fn => fn, useEffect: fn => { cleanup = fn(); } },
  '@/lib/supabase/client': { createClient: () => ({ channel: (name, options) => { topic = name; config = options.config; return channel; }, removeChannel: () => { removed++; return Promise.resolve('ok'); } }) },
  '@/lib/chat-typing': helpers,
}, { Date: { now: () => now }, crypto: { randomUUID: () => 'tab-id' }, window: target, document: target,
  setTimeout: (fn, ms) => addTimer(fn, ms), clearTimeout: id => timers.delete(id), setInterval: (fn, ms) => addTimer(fn, ms, true), clearInterval: id => timers.delete(id) });
const typing = hook.useChatTyping('BENG24COE-1', 'self');
assert.equal(topic, 'darasax:typing:BENG24COE-1'); assert.equal(config.private, true);
typing.updateTyping('My private draft'); assert.equal(tracks.length, 0);
status('SUBSCRIBED'); assert.equal(tracks.at(-1).typing, true);
assert.equal(JSON.stringify(tracks).includes('private draft'), false, 'never publish draft text');
typing.updateTyping('More text'); assert.equal(tracks.length, 1, 'throttle activity updates');
advance(1600); typing.updateTyping('Still typing'); assert.equal(tracks.length, 2);
advance(2500); assert.equal(tracks.at(-1).typing, false, 'clear after idle');
presence = { other: [{ user_id: 'other', typing: true, updated_at: now }] }; sync(); assert.equal(state.count, 1);
advance(7000); assert.equal(state.count, 0, 'expire missing stop events');
typing.updateTyping('Hello'); typing.stopTyping(); assert.equal(tracks.at(-1).typing, false, 'stop after send or blur');
typing.updateTyping('Hello again'); target.visibilityState = 'hidden'; listeners.get('visibilitychange')(); assert.equal(tracks.at(-1).typing, false, 'stop in background');
status('CHANNEL_ERROR'); assert.equal(state.count, 0, 'hide disconnected presence');
cleanup(); assert.equal(removed, 1); assert.equal(timers.size, 0); assert.equal(listeners.size, 0);
console.log('Passed private room typing, throttling, idle/background cleanup, expiry, multi-tab deduplication, and draft privacy tests.');
