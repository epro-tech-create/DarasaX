const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
const api={};let uploaded,request,removed=[],response=new Response(JSON.stringify({sessions:[],text:'Monday',warning:'Review'}));
const bucket={upload:async(path,file,options)=>{uploaded={path,file,options};return {error:null};},remove:async paths=>{removed.push(...paths);return {error:null};}};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/lib/timetable-upload.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{
 exports:api,require:()=>({createClient:()=>({auth:{getUser:async()=>({data:{user:{id:'00000000-0000-4000-8000-000000000001'}},error:null})},storage:{from:name=>{assert.equal(name,'timetable-import-uploads');return bucket;}}})}),
 crypto:{randomUUID:()=> '00000000-0000-4000-8000-000000000002'},fetch:async(url,options)=>{request={url,...options};return response;},SyntaxError,TypeError,Error,JSON,
});
(async()=>{
 const file=new File([new Uint8Array(6*1024*1024)],'timetable.jpg',{type:'image/jpeg'});
 const result=await api.uploadTimetableDocument(file,'BENG24COE-1');assert.equal(result.text,'Monday');assert.equal(uploaded.file.size,6*1024*1024);assert.equal(uploaded.options.contentType,'image/jpeg');assert.ok(request.body.length<1024);assert.equal(request.headers['Content-Type'],'application/json');assert.equal(JSON.parse(request.body).path,uploaded.path);assert.equal(removed.length,1);
 await assert.rejects(()=>api.readTimetableResponse(new Response('Request Entity Too Large',{status:413})),/too large/);
 await assert.rejects(()=>api.readTimetableResponse(new Response('<html>Gateway timeout</html>',{status:504})),/too long/);
 await assert.rejects(()=>api.readTimetableResponse(new Response('Unauthorized',{status:401})),/Sign in again/);
 await assert.rejects(()=>api.readTimetableResponse(new Response('not JSON',{status:500})),/unexpected response/);
 await assert.rejects(()=>api.readTimetableResponse(new Response('{}')),/unexpected response/);
 response=new Response('<html>Server failed</html>',{status:500});await assert.rejects(()=>api.uploadTimetableDocument(file,'BENG24COE-1'),/unexpected response/);assert.equal(removed.length,2,'Failed imports remove temporary files');
 await assert.rejects(()=>api.uploadTimetableDocument(new File([new Uint8Array(10*1024*1024+1)],'large.jpg'),'BENG24COE-1'),/10 MB/);
 console.log('Passed 6 MB JPG direct storage upload, small JSON processing request, temporary file cleanup, readable non-JSON/413/504/auth errors, and 10 MB validation.');
})().catch(error=>{console.error(error);process.exitCode=1;});
