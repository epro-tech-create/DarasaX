const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
let response={data:{url:'https://github.com/login/oauth/authorize?test=1'},error:null},input,assigned=[];
const exportsObject={};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/lib/auth/oauth.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{exports:exportsObject,window:{location:{assign:url=>assigned.push(url)}}});
const client={auth:{signInWithOAuth:async options=>{input=options;return response;}}};
(async()=>{
 const callback='https://www.darasax.com/auth/callback?next=%2Fmodules%2Ftest';
 await exportsObject.signInWithGitHub(client,callback);
 assert.equal(input.provider,'github');assert.equal(input.options.redirectTo,callback);assert.equal(input.options.skipBrowserRedirect,true);assert.equal(input.options.scopes,'user:email');assert.equal(assigned.length,1);
 response={data:{url:null},error:null};await assert.rejects(()=>exportsObject.signInWithGitHub(client,callback),/redirect URL/);assert.equal(assigned.length,1);
 response={data:{url:null},error:new Error('provider is not enabled')};await assert.rejects(()=>exportsObject.signInWithGitHub(client,callback),/not enabled/);assert.equal(assigned.length,1);
 response={data:{url:'https://accounts.google.com/test'},error:null};await exportsObject.signInWithGoogle(client,callback);assert.equal(input.provider,'google');assert.equal(input.options.queryParams.prompt,'select_account');
 const errorExports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/lib/auth/errors.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports:errorExports});
 assert.match(errorExports.getAuthErrorMessage(new Error('Unsupported provider: provider is not enabled')),/provider is not enabled/);
 console.log('Passed GitHub provider, email scope, single redirect, next URL, disabled-provider errors and Google regression checks.');
})().catch(e=>{console.error(e);process.exitCode=1;});
