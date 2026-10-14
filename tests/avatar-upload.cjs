const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
let closed = 0;
let drawn = 0;
let canvas;
const exportsObject = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/lib/auth/avatar.ts','utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText, {
  exports: exportsObject,
  createImageBitmap: async file => { if (file.invalid) throw Error(); return {width:3000,height:1500,close:()=>closed++}; },
  document: {createElement: () => (canvas = {width:0,height:0,getContext:()=>({drawImage:()=>drawn++}),toBlob: callback=>callback(new Blob(['image'],{type:'image/webp'}))})}
});
(async () => {
  await assert.rejects(exportsObject.prepareAvatar({type:'image/svg+xml',size:10}), /JPG, PNG or WebP/);
  await assert.rejects(exportsObject.prepareAvatar({type:'image/jpeg',size:6*1024*1024}), /5 MB/);
  await assert.rejects(exportsObject.prepareAvatar({type:'image/jpeg',size:100,invalid:true}), /could not be opened/);
  const result = await exportsObject.prepareAvatar({type:'image/png',size:500});
  assert.equal(result.type,'image/webp');
  assert.equal(canvas.width,768);
  assert.equal(canvas.height,384);
  assert.equal(drawn,1);
  assert.equal(closed,1);
  console.log('Avatar validation, decoding, resize, WebP output and resource cleanup tests passed.');
})().catch(error=>{console.error(error);process.exitCode=1});
