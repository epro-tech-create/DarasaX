const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const {renderToStaticMarkup} = require('react-dom/server');
const file = 'src/app/(dashboard)/modules/[id]/topics/[topicId]/page.tsx';
let state = {topics:[],ready:false,error:'',refresh(){},setCompleted(){}};
const topic = {id:'topic-net-1',moduleId:'mod-sensor-networks',number:1,title:'Introduction to Sensor Networks',durationMinutes:18,summary:'Overview',content:'Sensor nodes collect environmental data.',learningObjectives:['Explain sensor nodes'],completed:false};
const blank = ({children}) => React.createElement('div',null,children);
const dependencies = {
  '@/components/providers/language-provider': { useTranslate: () => value => value },
  '@/lib/module-links': { useLearningPrefix: () => '' },
  react:React,'react/jsx-runtime':require('react/jsx-runtime'),
  'next/link':{default:blank},
  'next/navigation':{useParams:()=>({id:'mod-sensor-networks',topicId:'topic-net-1'}),notFound:()=>{throw Error('NOT_FOUND')}},
  'lucide-react':new Proxy({}, {get:()=>()=>null}),
  '@/data/mock':{getModule:()=>({id:'mod-sensor-networks',name:'Sensor networks',code:'ETU07523',lecturer:'Lecturer'})},
  '@/lib/materials-store':{useMaterialsStore:()=>({published:[]})},
  '@/lib/module-stats':{noteMaterials:()=>[]},
  '@/lib/topic-progress-store':{useTopicProgress:()=>state},
  '@/lib/utils':{cn:(...args)=>args.join(' ')},
  '@/components/layout/page-header':{PageHeader:({title})=>React.createElement('h1',null,title)},
  '@/components/modules/material-upload-card':{MaterialUploadCard:blank},
  '@/components/ui/badge':{Badge:blank},'@/components/ui/button':{Button:blank}
};
const exportsObject = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017,jsx:ts.JsxEmit.ReactJSX}}).outputText,{exports:exportsObject,require:name=>dependencies[name]});
const render = () => renderToStaticMarkup(React.createElement(exportsObject.default));
assert.match(render(),/Loading topic/);
state={...state,ready:true,error:'Topics could not be loaded. Please try again.'};
assert.match(render(),/Try again/);
state={...state,error:'',topics:[topic]};
assert.match(render(),/Sensor nodes collect environmental data/);
assert.match(render(),/Explain sensor nodes/);
state={...state,topics:[{...topic,moduleId:'another-module'}]};
assert.throws(render,/NOT_FOUND/);
state={...state,topics:[]};
assert.throws(render,/NOT_FOUND/);
console.log('Topic loading, retry, published content, module matching and missing-topic regression checks passed.');
