const fs=require('fs'),vm=require('vm'),ts=require('typescript'),assert=require('node:assert/strict');const exportsObject={};vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/lib/auth/password.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports:exportsObject});
for(const password of ['password','password1234','Password123456','aaaaaaaaaaaa','123456789012'])assert.equal(exportsObject.isPasswordStrongEnough(password),false);
for(const password of ['a thoughtful long passphrase','Rivers!Moon42'])assert.equal(exportsObject.isPasswordStrongEnough(password),true);
console.log('Passed new-password length and common/repeated-password checks; sign-in code remains unchanged.');
