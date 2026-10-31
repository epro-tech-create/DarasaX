const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
let open = false;
const api = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/components/layout/more-menu.tsx', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020 },
}).outputText, { exports: api, require(name) {
  if (name === 'react') return { ...React, useState: () => [open, () => {}] };
  if (name === 'react/jsx-runtime') return require(name);
  if (name === 'next/link') return { default: ({ children, ...props }) => React.createElement('a', props, children) };
  if (name === 'lucide-react') return new Proxy({}, { get: () => () => null });
  if (name.endsWith('/sign-out-button')) return { SignOutButton: () => React.createElement('button', null, 'Sign out') };
  if (name.endsWith('/language-provider')) return { useTranslate: () => text => text };
  throw new Error('Unexpected dependency ' + name);
}});
const render = props => renderToStaticMarkup(React.createElement(api.MoreMenu, props));
let html = render({ profileHref: '/profile', settingsHref: '/settings', helpdeskHref: '/helpdesk' });
assert.match(html, /aria-label="More options"/);
assert.match(html, /aria-expanded="false"/);
assert.doesNotMatch(html, /Sign out|href="\/helpdesk"/);
open = true;
html = render({ profileHref: '/profile', settingsHref: '/settings', helpdeskHref: '/helpdesk' });
assert.match(html, /aria-expanded="true"/);
for (const path of ['/profile', '/settings', '/helpdesk']) assert.ok(html.includes(`href="${path}"`));
assert.match(html, /Sign out/);
for (const role of ['admin', 'cr', 'lecturer']) {
  html = render({ profileHref: `/${role}/profile`, helpdeskHref: `/${role}/helpdesk` });
  assert.ok(html.includes(`href="/${role}/helpdesk"`));
  assert.doesNotMatch(html, /href="\/settings"/);
  assert.match(html, /Sign out/);
}
console.log('Passed three-dot disclosure, hidden closed content, role-specific links, student settings, and retained sign-out access.');
