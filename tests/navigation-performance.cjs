const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function load(file, dependencies, globals = {}) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX,
  }}).outputText;
  vm.runInNewContext(code, { exports, require: name => {
    if (!(name in dependencies)) throw new Error(`Unexpected dependency: ${name}`);
    return dependencies[name];
  }, ...globals });
  return exports;
}

async function middleware() {
  let claims = { sub: 'student-a' }, error = null, cookies, verifies = 0;
  const response = { cookies: { set: (...args) => written.push(args) } };
  const written = [], forwarded = [];
  const { updateSession } = load('src/lib/supabase/middleware.ts', {
    '@supabase/ssr': { createServerClient: (_url, _key, options) => {
      cookies = options.cookies;
      return { auth: { getClaims: async () => { verifies++; return { data: { claims }, error }; },
        getUser: () => { throw new Error('Redundant Auth network request'); } } };
    } },
    'next/server': { NextResponse: { next: () => response } },
  }, { process: { env: {} } });
  const request = { cookies: { getAll: () => [], set: (...args) => forwarded.push(args) } };
  assert.equal((await updateSession(request)).user.id, 'student-a');
  cookies.setAll([{ name: 'session', value: 'refreshed', options: { secure: true } }]);
  assert.equal(forwarded[0][1], 'refreshed');
  assert.equal(written[0][1], 'refreshed');
  error = new Error('Invalid signature');
  assert.equal((await updateSession(request)).user, null, 'Invalid claims must fail closed');
  error = null; claims = null;
  assert.equal((await updateSession(request)).user, null);
  assert.equal(verifies, 3);
}

async function serverRender() {
  let scope = new Map(), id = 'first', auth = 0, profiles = 0, admissions = 0;
  const client = { auth: { getUser: async () => { auth++; return { data: { user: id ? { id } : null } }; } } };
  const { getStudentWorkspace } = load('src/lib/auth/student-workspace.ts', {
    'server-only': {},
    react: { cache: fn => (...args) => {
      const key = JSON.stringify(args);
      if (!scope.has(key)) scope.set(key, fn(...args));
      return scope.get(key);
    } },
    '@/lib/supabase/server': { createClient: async () => client },
    '@/lib/auth/profile': { getProfile: async (_client, user) => { profiles++; return { id: user }; } },
    '@/lib/auth/admission': { getStudentAdmission: async (_client, user) => { admissions++; return { user_id: user }; } },
  });
  const [layout, page] = await Promise.all([getStudentWorkspace(), getStudentWorkspace()]);
  assert.equal(layout, page);
  assert.deepEqual([auth, profiles, admissions], [1, 1, 1], 'Layout and page share one set of reads');
  scope = new Map(); id = 'second';
  assert.equal((await getStudentWorkspace()).profile.id, 'second', 'A new request cannot reuse another account');
  scope = new Map(); id = null;
  assert.equal((await getStudentWorkspace()).profile, null);
  assert.deepEqual([auth, profiles, admissions], [3, 2, 2], 'Guests never query profiles/admissions');
}

async function notifications() {
  let state, mounted = false, authChanged, context, effect, cleanup, queryError = false;
  const tasks = new Map(), listeners = new Map(), queries = [], mutations = [];
  let sequence = 0;
  const schedule = fn => { const id = ++sequence; tasks.set(id, fn); return id; };
  const hooks = {
    createContext: () => (context = { Provider: {}, value: null }),
    createElement: (_type, props) => { context.value = props.value; return props; },
    useContext: () => context.value,
    useState: initial => { if (!mounted) state = initial; return [state, next => { state = typeof next === 'function' ? next(state) : next; }]; },
    useCallback: fn => fn,
    useEffect: fn => { if (!mounted) effect = fn; },
  };
  const client = {
    auth: { getUser: () => { throw new Error('Inbox should reuse server identity'); },
      onAuthStateChange: fn => { authChanged = fn; return { data: { subscription: { unsubscribe() {} } } }; } },
    from: table => {
      let recipient, count = false, mutation;
      const builder = {
        select: (_columns, options) => { count = options?.head === true; return builder; },
        eq: (column, value) => { if (column === 'recipient_id') recipient = value; return builder; },
        order: () => builder, limit: () => builder, is: () => builder, lte: () => builder,
        update: value => { mutation = value; return builder; },
        then: (resolve, reject) => {
          if (mutation) mutations.push({ recipient, mutation });
          else queries.push({ table, recipient, count });
          return Promise.resolve({ data: count || mutation ? null : [{ id: `${recipient}-notice`, title: recipient, created_at: '2026-10-21', read_at: null }], count: 1,
            error: queryError ? new Error('Offline') : null }).then(resolve, reject);
        },
      };
      return builder;
    },
  };
  const store = load('src/lib/notifications-store.ts', { react: hooks, '@/lib/supabase/client': { createClient: () => client } }, {
    setTimeout: schedule, clearTimeout: id => tasks.delete(id), setInterval: () => 1, clearInterval() {},
    document: { visibilityState: 'visible' }, Event: class { constructor(type) { this.type = type; } },
    window: { addEventListener: (type, fn) => listeners.set(type, fn), removeEventListener: type => listeners.delete(type), dispatchEvent: event => listeners.get(event.type)?.() },
  });
  function render() { store.NotificationsProvider({ userId: 'first', children: null }); if (!mounted) { mounted = true; cleanup = effect(); } }
  async function settle() { for (let i = 0; i < 12; i++) await Promise.resolve(); }
  async function timers() { const pending = [...tasks.values()]; tasks.clear(); for (const fn of pending) fn(); await settle(); render(); }
  render(); await timers();
  const first = store.useNotifications();
  for (let i = 0; i < 4; i++) assert.equal(store.useNotifications(), first, 'Badges and panel share the same inbox');
  assert.equal(queries.length, 2, 'Only list/count run once for all consumers');
  assert.equal(first.items[0].title, 'first');
  await first.markRead('first-notice'); await settle(); render();
  assert.equal(mutations[0].recipient, 'first');
  authChanged('SIGNED_OUT', null); await timers();
  assert.equal(store.useNotifications().items.length, 0);
  const afterLogout = queries.length;
  listeners.get('focus')(); await settle();
  assert.equal(queries.length, afterLogout, 'Signed-out inbox must stop querying');
  authChanged('SIGNED_IN', { user: { id: 'second' } }); await timers();
  assert.equal(store.useNotifications().items[0].title, 'second');
  assert.equal(queries.at(-1).recipient, 'second');
  queryError = true; listeners.get('focus')(); await settle(); render();
  assert.match(store.useNotifications().error, /could not be loaded/);
  cleanup(); assert.equal(listeners.size, 0);
}

(async () => {
  await middleware(); await serverRender(); await notifications();
  console.log('Passed verified-claims/cookie refresh, request-scoped student reads, one shared inbox, logout/account isolation and notification errors.');
})().catch(error => { console.error(error); process.exitCode = 1; });
