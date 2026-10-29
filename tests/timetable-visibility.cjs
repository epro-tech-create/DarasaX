const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
function load(file, dependencies = {}) {
  const exported = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020,
  } }).outputText, { exports: exported, require: name => dependencies[name], Date, Intl });
  return exported;
}
const dates = load('src/lib/timetable-dates.ts');
const fixtures = ['scheduled', 'rescheduled', 'cancelled', 'postponed'].map((status, i) => ({
  id: status, moduleId: status, status, reason: 'PRIVATE-OLD-REASON', streamId: 'TEST-CLASS',
  sessionDate: '2026-10-29', day: 4, startTime: `${10 + i}:00`, endTime: `${11 + i}:00`, room: 'Room',
}));
const blank = ({ children }) => React.createElement('div', null, children);
const common = {
  react: React, 'react/jsx-runtime': require('react/jsx-runtime'),
  '@/components/providers/language-provider': { useTranslate: () => value => value },
  '@/data/mock': { DEFAULT_CLASS_STREAM: 'TEST-CLASS', getModule: id => ({ name: `Course-${id}`, code: id }), modules: [{ id: 'scheduled', name: 'Course-scheduled', code: 'COURSE' }] },
  '@/lib/timetable-dates': { ...dates, tanzaniaDate: () => '2026-10-29' },
  '@/lib/timetable-store': { useTimetableStore: () => ({ forStream: () => fixtures, entries: fixtures }) },
  '@/components/ui/button': { Button: blank },
};
const view = load('src/components/timetable/timetable-view.tsx', {
  ...common,
  'framer-motion': { AnimatePresence: blank, motion: new Proxy({}, { get: () => blank }) },
  'lucide-react': new Proxy({}, { get: () => () => null }),
  '@/components/layout/page-header': { PageHeader: blank },
  '@/components/ui/badge': { Badge: blank },
  '@/lib/academic': { getNextClass: () => null },
  '@/lib/class-registry': { useClassRegistry: () => ({ streams: [{ id: 'TEST-CLASS', label: 'Class' }] }) },
  '@/lib/utils': { cn: (...args) => args.filter(Boolean).join(' '), formatTime: time => time },
  '@/components/timetable/no-lessons-today-button': { NoLessonsTodayButton: () => null },
});
const html = renderToStaticMarkup(React.createElement(view.TimetableView, { lockedStream: 'TEST-CLASS', onEdit() {} }));
assert.match(html, /Course-scheduled/);
assert.match(html, /Course-rescheduled/);
assert.doesNotMatch(html, /Course-cancelled|Course-postponed|PRIVATE-OLD-REASON/);
assert.match(html, /2 classes/);
const modal = load('src/components/timetable/session-modal.tsx', {
  ...common,
  '@/components/staff/staff-modal': { StaffModal: blank },
  '@/lib/staff-auth': { useStaffSession: () => ({ session: { role: 'class_rep' } }) },
});
for (const status of ['scheduled', 'postponed']) {
  const form = renderToStaticMarkup(React.createElement(modal.SessionModal, { entry: { ...fixtures[0], status, originalDate: '2026-10-29', lecturer: 'Teacher' }, streamId: 'TEST-CLASS', onClose() {} }));
  assert.doesNotMatch(form, /<textarea|Reason|reason/);
}
console.log('Passed scheduled-only timetable visibility, class totals, hidden legacy reasons, and reason-free lesson forms.');
