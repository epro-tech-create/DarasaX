const fs = require('node:fs'), vm = require('node:vm'), ts = require('typescript'), assert = require('node:assert/strict');
function load(file) { const exports = {}; vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText, {exports, URL, require:()=>({})}); return exports; }
const {validRegistrationNumber} = load('src/lib/auth/admission.ts');
for(const n of ['240242400506','230242400506','250242400506','00123','9']) assert.equal(validRegistrationNumber(n),true,n);
for(const n of ['','24A123',' 240123','240123 ','24-123','24.123','24e123','123\n']) assert.equal(validRegistrationNumber(n),false,n);
const {studentPostAuthPath,safeStudentReturnPath} = load('src/lib/auth/redirect.ts');
const next='/share/00000000-0000-0000-0000-000000000001/file?download=1';
assert.equal(safeStudentReturnPath(next),next);
for(const status of ['pending','rejected','suspended']) assert.equal(studentPostAuthPath(true,next,{status}),'/pending-approval?next='+encodeURIComponent(next));
assert.equal(studentPostAuthPath(true,next,{status:'approved',welcome_seen_at:null}),'/welcome?next='+encodeURIComponent(next));
assert.equal(studentPostAuthPath(true,next,{status:'approved',welcome_seen_at:'now'}),next);
assert.equal(studentPostAuthPath(true,null,null),'/pending-approval');
console.log('Passed digit-prefix, registration format and approval/welcome return-path checks.');
