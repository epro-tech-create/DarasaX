const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
const api={};let allowed=true,downloads=0,removed=0,parsed;
const uid='00000000-0000-4000-8000-000000000001',path=`BENG24COE-1/${uid}/00000000-0000-4000-8000-000000000002.jpg`;
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/app/api/timetable-import/route.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{
 exports:api,URL,Response,File,Buffer,Set,JSON,SyntaxError,console:{error(){}},require:name=>name==='next/server'?{NextResponse:{json:(data,options)=>new Response(JSON.stringify(data),{...options,headers:{...options?.headers,'Content-Type':'application/json'}})}}:name.includes('/supabase/server')?{createClient:async()=>({auth:{getUser:async()=>({data:{user:{id:uid}}})},rpc:async()=>({data:allowed,error:null}),storage:{from:()=>({download:async()=>{downloads++;return {data:new Blob(['jpeg'],{type:'image/jpeg'}),error:null};},remove:async()=>{removed++;return {error:null};}})}})}:{extractTimetable:async file=>{parsed=file;return {sessions:[],text:'Monday',warning:'Review'};}}
});
function request(body,stream='BENG24COE-1',origin='https://darasax-cr.vercel.app') {return new Request(`https://darasax-cr.vercel.app/api/timetable-import?class=${encodeURIComponent(stream)}`,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify(body)});}
(async()=>{
 let result=await api.POST(request({path,fileName:'table.jpg'}));assert.equal(result.status,200);assert.equal(downloads,1);assert.equal(removed,1);assert.equal(parsed.name,'table.jpg');
 result=await api.POST(request({path:path.replace(uid,'00000000-0000-4000-8000-000000000009'),fileName:'table.jpg'}));assert.equal(result.status,400);assert.equal(downloads,1);
 result=await api.POST(request({path,fileName:'table.pdf'}));assert.equal(result.status,400);assert.equal(downloads,1);
 result=await api.POST(request({path,fileName:'table.jpg'},'../'));assert.equal(result.status,400);
 result=await api.POST(request({path,fileName:'table.jpg'},'BENG24COE-1','https://evil.invalid'));assert.equal(result.status,403);
 allowed=false;result=await api.POST(request({path,fileName:'table.jpg'}));assert.equal(result.status,403);assert.equal(downloads,1);
 console.log('Passed private import reference processing, correct filename, temporary-file cleanup, foreign ownership/extension/class rejection, origin checks, and class authorization.');
})().catch(error=>{console.error(error);process.exitCode=1;});
