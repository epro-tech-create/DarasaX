const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require('typescript');
let staff = { role: 'class_rep', status: 'active', stream_id: 'BENG24COE-2' };
let authenticated = true, profileFailure = false, duplicate = false, created = 0, rolledBack = 0, admissionFailure = false;
let admissionWrite;
const academicClass = { id: 'BENG24COE-2', institution: 'Dar es Salaam Institute of Technology (DIT)', programme: 'BENG24COE', year: 3, semester: 1 };
const student = { id: 'new-user', name: 'Test Student', stream_id: 'BENG24COE-2' };
const caller = {
  auth: { getUser: async () => ({ data: { user: authenticated ? { id: 'caller' } : null } }) },
  from: table => ({ select() { return this; }, eq() { return this; }, maybeSingle: async () => ({ data: table === 'staff_profiles' ? staff : academicClass }) })
};
const admin = {
  auth: { admin: {
    createUser: async () => { created++; return duplicate ? { error: {} } : { data: { user: { id: 'new-user' } } }; },
    deleteUser: async () => { rolledBack++; }
  } },
  from: table => ({ update(value) { if (table === "student_admissions") admissionWrite = value; return this; }, select() { return this; }, eq() { return table === 'profiles' ? Promise.resolve({ error: profileFailure ? {} : null }) : table === 'student_admissions' ? Promise.resolve({error: admissionFailure ? {code:'23505'} : null}) : this; }, single: async () => ({ data: student }) })
};
let handler;
const source = fs.readFileSync('supabase/functions/create-student/index.js', 'utf8').replace(/^import .*;\r?\n/, '');
vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText, {
  exports: {}, Response, createClient: (_url, key) => key === 'SUPABASE_SERVICE_ROLE_KEY' ? admin : caller,
  Deno: { env: { get: key => key }, serve: fn => { handler = fn; } }
});
const input = { registrationNumber:'230242400506', name: 'Test Student', email: 'test@example.invalid', temporaryPassword: 'Temporary123!', streamId: 'BENG24COE-2' };
const call = (body = input, token = 'Bearer test') => handler(new Request('https://test.invalid', { method: 'POST', headers: { authorization: token }, body: JSON.stringify(body) }));
(async () => {
  assert.equal((await call(input, '')).status, 401);
  authenticated = false; assert.equal((await call()).status, 401); authenticated = true;
  staff = null; assert.equal((await call()).status, 403);
  staff = { role: 'lecturer', status: 'active' }; assert.equal((await call()).status, 403);
  staff = { role: 'class_rep', status: 'inactive' }; assert.equal((await call()).status, 403);
  staff = { role: 'class_rep', status: 'active', stream_id: 'BENG24COE-1' }; assert.equal((await call()).status, 403);
  assert.equal(created, 0);
  staff.stream_id = 'BENG24COE-2';
  assert.equal((await call({ ...input, temporaryPassword: 'short' })).status, 400);
  assert.equal((await call({...input, registrationNumber:'24A123'})).status, 400);
  assert.equal((await call({...input, registrationNumber:''})).status, 400);
  const result = await call(); assert.equal(result.status, 201);
  const body = await result.json(); assert.deepEqual(body.student, student); assert.equal(body.temporaryPassword, undefined);
  assert.equal(admissionWrite.status, 'approved');
  assert.equal(admissionWrite.registration_number, '230242400506');
  admissionFailure = true; assert.equal((await call()).status, 409); admissionFailure = false;
  duplicate = true; assert.equal((await call()).status, 409); duplicate = false;
  profileFailure = true; assert.equal((await call()).status, 500); assert.equal(rolledBack, 2);
  console.log('Passed student provisioning authentication, CR class scope, password validation, duplicate handling and rollback checks.');
})().catch(error => { console.error(error); process.exitCode = 1; });
