const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const exportsForTest = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/lib/school.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, { exports: exportsForTest });
const { getAcademicCountdown, getSchoolOpenDate, getMsUntilSchoolOpen, formatCountdownParts, TEST_ONE_AT } = exportsForTest;
const opening = new Date('2026-10-26T00:00:00+03:00');
const test = new Date(TEST_ONE_AT);
assert.equal(getSchoolOpenDate().getTime(), opening.getTime());
assert.equal((test - opening) / 86400000, 42, 'Test 1 starts at the beginning of academic week 7');
const before = getAcademicCountdown(new Date(opening.getTime() - 1));
assert.equal(before.phase, 'opening'); assert.equal(before.remaining, 1);
const at = getAcademicCountdown(opening);
assert.equal(at.phase, 'test'); assert.equal(at.target.getTime(), test.getTime());
assert.equal(at.remaining / 86400000, 42);
assert.equal(getMsUntilSchoolOpen(opening), 0);
assert.equal(getMsUntilSchoolOpen(new Date('2027-01-01T00:00:00+03:00')), 0, 'Do not roll the opening date to another year');
assert.equal(getAcademicCountdown(new Date('2026-10-25T20:59:59Z')).phase, 'opening');
assert.equal(getAcademicCountdown(new Date('2026-10-25T21:00:00Z')).phase, 'test', 'Switch at Tanzania midnight');
const beforeTest = getAcademicCountdown(new Date(test.getTime() - 1000));
assert.equal(beforeTest.phase, 'test'); assert.equal(beforeTest.reached, false);
assert.equal(formatCountdownParts(beforeTest.remaining).seconds, 1);
for (const when of [test, new Date('2026-12-08'), new Date('2027-01-01')]) {
  const result = getAcademicCountdown(when);
  assert.equal(result.phase, 'test'); assert.equal(result.remaining, 0); assert.equal(result.reached, true);
}
assert.equal(formatCountdownParts(-1000).totalSeconds, 0);
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const component = {};
const text = Object.assign(value => value, { locale: 'en-GB' });
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/components/dashboard/exam-countdown.tsx', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
}).outputText, { exports: component, require: name => ({
  '@/lib/school': exportsForTest,
  '@/components/providers/language-provider': { useTranslate: () => text },
  '@/components/dashboard/next-class-card': { StatCard: () => null },
}[name] ?? require(name)) });
const render = initialNow => renderToStaticMarkup(React.createElement(component.ExamCountdown, { initialNow }));
const openingHtml = render(opening.getTime() - 86400000);
assert.match(openingHtml, /School opening/); assert.match(openingHtml, /26 October 2026/);
assert.doesNotMatch(openingHtml, /Exam countdown|planner/);
const testHtml = render(opening.getTime());
assert.match(testHtml, /Exam countdown/); assert.match(testHtml, /7 December 2026/); assert.match(testHtml, /Week 7/);
assert.doesNotMatch(testHtml, /School opening|planner/);
assert.match(render(test.getTime()), /Test 1 period has started/);
console.log('Passed Tanzania-time opening/Test 1 boundaries, week-7 timing, no annual rollover, and elapsed countdown checks.');
