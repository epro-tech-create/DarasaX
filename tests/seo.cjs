const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
function load(file, deps = {}) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true,
  }}).outputText;
  vm.runInNewContext(code, { exports, require: name => deps[name] ?? require(name), process, URL });
  return exports;
}
const seo = load('src/lib/seo.ts');
const landing = load('src/components/landing/landing-page.tsx', {
  '@/components/providers/language-provider': { useTranslate: () => value => value },
  'next/image': ({ src, alt }) => React.createElement('img', { src, alt }),
  'next/link': ({ href, children, ...props }) => React.createElement('a', { href, ...props }, children),
  '@/components/brand/logo': { Logo: () => React.createElement('span', null, 'DarasaX') },
  '@/components/ui/button': { Button: ({ href, children }) => React.createElement(href ? 'a' : 'button', { href }, children) },
  '@/components/landing/campus-gallery': { HeroBackground: () => null, CampusStories: () => null },
  '@/components/ui/theme-toggle': { ThemeToggle: () => null },
});
const html = renderToStaticMarkup(React.createElement(landing.default));
assert.equal((html.match(/<h1\b/g) ?? []).length, 1);
assert.doesNotMatch(html, /DIT|BENG24COE|Year 3|Semester 1/);
assert.match(html, /built for universities/);
assert.match(html, /student activities/);
assert.match(html, /Who can use DarasaX/);
assert.match(html, /approved class access/);
assert.doesNotMatch(html, /opacity:0(?:;|")/, 'Marketing copy must be visible before hydration');

(async () => {
  const original = process.env.APP_ROLE;
  try {
    for (const role of ['student', 'admin', 'class_rep', 'lecturer']) {
      process.env.APP_ROLE = role;
      const robots = load('src/app/robots.ts', { '@/lib/seo': seo }).default();
      const sitemap = load('src/app/sitemap.ts', { '@/lib/seo': seo }).default();
      const home = load('src/app/page.tsx', { 'next/headers': {headers:async()=>new Map([['x-nonce','test-nonce']])}, '@/lib/seo': seo, '@/components/landing/landing-page': { __esModule: true, default: () => null } });
      const security = load('src/lib/security-headers.ts');
      const config = load('next.config.ts', {'./src/lib/security-headers':security}).default;
      const headers = await config.headers();
      const rendered = renderToStaticMarkup(await home.default());
      assert.equal(home.metadata.robots.index, role === 'student');
      assert.equal(home.metadata.alternates.canonical, 'https://www.darasax.com/');
      if (role === 'student') {
        assert.equal(robots.sitemap, 'https://www.darasax.com/sitemap.xml');
        assert.equal(sitemap.length, 1);
        assert.equal(sitemap[0].url, home.metadata.alternates.canonical);
        assert.match(rendered, /application\/ld\+json/);
        assert.doesNotMatch(JSON.stringify(sitemap), /login|dashboard|share|token/);
        assert(!headers.some(entry => entry.source === '/:path*' && entry.headers.some(header=>header.key==='X-Robots-Tag')));
        assert(headers.some(entry => entry.source === '/login/:path*' && entry.headers.some(header => header.key === 'X-Robots-Tag')));
      } else {
        assert.equal(robots.rules.disallow, '/');
        assert.equal(sitemap.length, 0);
        assert.doesNotMatch(rendered, /application\/ld\+json/);
        assert(headers.some(entry => entry.source === '/:path*' && entry.headers.some(header => header.value === 'noindex, nofollow')));
      }
    }
  } finally { if (original === undefined) delete process.env.APP_ROLE; else process.env.APP_ROLE = original; }
  assert.equal(seo.websiteSchema['@graph'][0].name, 'DarasaX');
  assert.equal(seo.websiteSchema['@graph'][0].url, 'https://www.darasax.com/');
  assert(!JSON.stringify(seo.websiteSchema).includes('aggregateRating'));
  console.log('Passed visible SSR copy, one H1, canonical/sitemap agreement, structured data, private noindex headers and robots isolation for every portal.');
})().catch(error => { console.error(error); process.exitCode = 1; });
