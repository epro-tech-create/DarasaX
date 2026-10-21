const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const dictionary = require('../src/lib/i18n/sw.json');

function load(file, dependencies, globals = {}) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
    jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true,
  }}).outputText;
  vm.runInNewContext(code, { exports, require: name => dependencies[name] ?? require(name), ...globals });
  return exports;
}
const translation = load('src/lib/i18n/translate.ts', { './sw.json': dictionary });
const { translate } = translation;
assert.equal(translate('Home', 'en'), 'Home');
assert.equal(translate('Home', 'sw'), 'Mwanzo');
assert.equal(translate('  Save changes  ', 'sw'), '  Hifadhi mabadiliko  ');
assert.equal(translate('Active students · 30 days', 'sw'), 'Wanafunzi walioshiriki · siku 30');
assert.equal(translate('3 topics outlined', 'sw'), 'Mada 3 zimeainishwa');
assert.equal(translate('1 topic', 'sw'), 'Mada 1');
assert.equal(translate('Starts in 2 days 3 hr', 'sw'), 'Kinaanza baada ya siku 2 na saa 3');
assert.equal(translate('Remove Gasper from BENG24COE-2?', 'sw'), 'Umondoe Gasper kutoka BENG24COE-2?');
for (const data of ['Gasper Mwamba', 'BENG24COE-2', 'Notes.pdf', 'GSU 07516 · Numerical methods and matrices', 'constructor', '__proto__', 42, null]) {
  assert.equal(translate(data, 'sw'), data);
}
const object = { title: 'Home' };
assert.equal(translate(object, 'sw'), object);
for (let repeat = 0; repeat < 2; repeat++) {
  assert.equal(translate('Unrecognized\n  academic content', 'sw'), 'Unrecognized\n  academic content');
}

// Exercise the real profile control with React and both context values.
const realProvider = load('src/components/providers/language-provider.tsx', {
  '@/lib/supabase/client': { createClient: () => ({}) }, '@/lib/i18n/translate': translation,
});
const controls = load('src/components/profile/language-settings.tsx', {
  '@/components/providers/language-provider': realProvider,
});
for (const language of ['en', 'sw']) {
  const html = renderToStaticMarkup(React.createElement(realProvider.LanguageContext.Provider, {
    value: { language, setLanguage: async () => {} },
  }, React.createElement(controls.LanguageSettings)));
  assert.match(html, new RegExp(language === 'sw' ? 'Lugha ya programu' : 'Interface language'));
  assert.match(html, new RegExp(`value="${language}"[^>]*selected`));
  assert.match(html, /English/);
  assert.match(html, /Kiswahili/);
}

// Drive provider lifecycle without a network connection or real account changes.
let state, authChanged, error = null, unsubscribed = false;
const version = { current: 0 };
let initial = true, effects = [], cleanups = [], listeners = new Map(), calls = [];
const storage = new Map([['darasax:language', 'sw']]);
const document = { documentElement: { lang: 'en' } };
const hooks = {
  createContext: () => ({ Provider: 'Provider' }),
  useState: value => { if (initial) state = value; return [state, value => { state = value; }]; },
  useCallback: value => value, useMemo: fn => fn(),
  useRef: () => version,
  useEffect: (fn, deps) => { if (initial || deps.length) effects.push(fn); },
};
const client = { auth: {
  onAuthStateChange: callback => { authChanged = callback; return { data: { subscription: { unsubscribe: () => { unsubscribed = true; } } } }; },
  getUser: async () => ({ data: { user: { id: 'first', user_metadata: { preferred_language: 'en' } } }, error: null }),
  updateUser: async input => { calls.push(input); return { error }; },
}};
const provider = load('src/components/providers/language-provider.tsx', {
  react: hooks, 'react/jsx-runtime': { jsx: (type, props) => ({ type, props }) },
  '@/lib/supabase/client': { createClient: () => client }, '@/lib/i18n/translate': translation,
}, { document, setTimeout, clearTimeout, localStorage: { getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value) },
  window: { addEventListener: (key, fn) => listeners.set(key, fn), removeEventListener: key => listeners.delete(key) },
});
function render() {
  const result = provider.LanguageProvider({ children: 'content' });
  initial = false;
  for (const effect of effects.splice(0)) { const cleanup = effect(); if (cleanup) cleanups.push(cleanup); }
  return result.props.value;
}
(async () => {
  let value = render();
  // Authenticated preference wins over another account's browser cache.
  authChanged('INITIAL_SESSION', { user: { id: 'first', user_metadata: { preferred_language: 'sw' } } });
  await new Promise(resolve => setTimeout(resolve, 5));
  value = render(); assert.equal(value.language, 'en');
  await value.setLanguage('sw'); value = render();
  assert.equal(value.language, 'sw'); assert.equal(document.documentElement.lang, 'sw');
  assert.equal(storage.get('darasax:language'), 'sw');
  assert.equal(JSON.stringify(calls[0]), '{"data":{"preferred_language":"sw"}}');
  error = { message: 'Network error' };
  await assert.rejects(value.setLanguage('en'), /Could not save your language/);
  assert.equal(render().language, 'sw');
  const before = calls.length; await value.setLanguage('fr'); assert.equal(calls.length, before);
  authChanged('SIGNED_IN', { user: { user_metadata: { preferred_language: 'sw' } } });
  assert.equal(render().language, 'sw');
  authChanged('SIGNED_OUT', null); assert.equal(render().language, 'en');
  authChanged('SIGNED_IN', { user: { user_metadata: {} } }); assert.equal(render().language, 'en');
  error = null;
  let finishSave;
  client.auth.updateUser = () => new Promise(resolve => { finishSave = resolve; });
  const saving = render().setLanguage('sw');
  authChanged('SIGNED_OUT', null);
  finishSave({ error: null }); await saving;
  assert.equal(render().language, 'en', 'A save from an old account must not affect a signed-out browser');
  authChanged('TOKEN_REFRESHED', { user: { user_metadata: { preferred_language: 'sw' } } });
  assert.equal(render().language, 'sw');
  listeners.get('storage')({ key: 'darasax:language', newValue: 'sw' }); assert.equal(render().language, 'sw');
  cleanups.forEach(fn => fn()); assert.ok(unsubscribed); assert.equal(listeners.size, 0);
  console.log('Passed English/Kiswahili rendering, dynamic counts, content preservation, account preference, failed saves, account switching and tab synchronization.');
})().catch(error => { console.error(error); process.exitCode = 1; });
