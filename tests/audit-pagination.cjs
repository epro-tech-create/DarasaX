const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
const api={};vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/lib/audit-log-query.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{exports:api,Intl,Date});
const now=new Date('2026-10-21T22:30:00Z');
assert.equal(api.tanzaniaDayBounds(now).start,'2026-10-21T21:00:00.000Z');
assert.equal(api.tanzaniaDayBounds(now).end,'2026-10-22T21:00:00.000Z');
assert.match(api.auditSearchFilter('a,b)c'),/actor\.ilike\."%a,b\)c%"/);
assert.ok(api.auditSearchFilter('100%_').includes('100\\\\%\\\\_'));
const rows=Array.from({length:1251},(_,i)=>({id:1251-i,at:i<300?'2026-10-21T22:00:00Z':'2026-10-20T10:00:00Z',actor:'Admin',role:'admin',action:i%2?'upload':'login',summary:i===1100?'Historic target':'Event '+i,detail:null,stream_id:null}));
let calls=[],fail=false;
const client={from(table){assert.equal(table,'audit_log');let filters={},head=false,range=null,orders=[];const b={
 select(_fields,options){assert.equal(options.count,'exact');head=!!options.head;return b;},
 eq(k,v){filters[k]=v;return b;},gte(k,v){filters.gte=v;return b;},lt(k,v){filters.lt=v;return b;},
 or(value){filters.search=value;return b;},order(k,opts){assert.equal(opts.ascending,false);orders.push(k);return b;},range(a,z){range=[a,z];return b;},
 then(resolve,reject){calls.push({filters,head,range,orders});let data=rows.filter(r=>(!filters.action||r.action===filters.action)&&(!filters.gte||r.at>=filters.gte)&&(!filters.lt||r.at<filters.lt)&&(!filters.search||r.summary==='Historic target'));
 return Promise.resolve(fail?{error:new Error('Denied')}:{data:head?null:range?data.slice(range[0],range[1]+1):data,count:data.length,error:null}).then(resolve,reject);}};return b;}};
(async()=>{
 const first=await api.loadAuditPage(client,{page:0,query:'',action:'all',now});
 assert.equal(first.totalCount,1251);assert.equal(first.todayCount,300);assert.equal(first.matchingCount,1251);assert.equal(first.audit.length,50);
 assert.deepEqual(calls[0].orders,['at','id']);assert.equal(calls[1].head,true);assert.equal(calls[2].head,true);
 const all=[];for(let page=0;page<Math.ceil(1251/api.AUDIT_PAGE_SIZE);page++){const result=await api.loadAuditPage(client,{page,query:'',action:'all',now});all.push(...result.audit.map(r=>r.id));}
 assert.equal(all.length,1251);assert.equal(new Set(all).size,1251);assert.equal(all.at(-1),'1');
 const historical=await api.loadAuditPage(client,{page:0,query:'Historic target',action:'all',now});assert.equal(historical.matchingCount,1);assert.equal(historical.audit[0].summary,'Historic target');assert.equal(historical.totalCount,1251);
 const uploads=await api.loadAuditPage(client,{page:0,query:'',action:'upload',now});assert.equal(uploads.matchingCount,625);assert.equal(uploads.totalCount,1251);assert.equal(uploads.todayCount,300);
 fail=true;await assert.rejects(()=>api.loadAuditPage(client,{page:0,query:'',action:'all',now}),/Denied/);
 console.log('Passed exact total/today counts, Tanzania midnight boundaries, 1,251-record pagination without gaps, historical search, action filtering, quoted punctuation, and query error handling.');
})().catch(e=>{console.error(e);process.exitCode=1;});
