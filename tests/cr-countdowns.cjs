const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript'),React=require('react');
const {renderToStaticMarkup}=require('react-dom/server');const now=Date.parse('2026-11-01T09:00:00+03:00');
const school={};vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/lib/school.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{exports:school,Date});
const api={};vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/components/dashboard/cr-countdowns.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2020}}).outputText,{
 exports:api,Date,require:name=>name==='react'?{...React,useState:v=>[v===null?now:v,()=>{}],useEffect(){}}:name==='react/jsx-runtime'?require(name):name==='next/link'?{default:({children,...props})=>React.createElement('a',props,children)}:name.includes('language-provider')?{useTranslate:()=>Object.assign(s=>s,{locale:'en'})}:name.includes('exam-countdown')?{ExamCountdown:()=>React.createElement('section',null,'Exam countdown')}:name.includes('/school')?school:new Proxy({},{get:()=>()=>null})
});
const html=renderToStaticMarkup(React.createElement(api.CrCountdowns));
assert.match(html,/Exam countdown/);assert.doesNotMatch(html,/Assignment countdown|View assignments/);
const page=fs.readFileSync('src/app/(cr)/cr/page.tsx','utf8');assert.ok(page.indexOf('<CrCountdowns />')>page.indexOf('</StaffSection>'));
console.log('Passed CR exam countdown at the bottom and removal of assignment countdown.');
