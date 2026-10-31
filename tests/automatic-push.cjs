const assert = require('node:assert/strict'), fs = require('node:fs'), vm = require('node:vm'), ts = require('typescript');
let subscription = null, subscribed = 0, detached = 0, registered = 0, prompts = 0, owner = 'user-a', currentUser = 'user-a';
const fresh = () => ({ endpoint: 'https://fcm.googleapis.com/device', toJSON: () => ({keys:{p256dh:'key',auth:'auth'}}), unsubscribe: async () => { detached++; subscription = null; } });
const registration = { pushManager: { getSubscription: async () => subscription, subscribe: async () => { subscribed++; return subscription = fresh(); } }, getNotifications: async () => [] };
const client = {auth:{getUser:async()=>({data:{user:{id:currentUser}}})},rpc:async(name)=>{
 if(name==='get_push_public_key')return {data:'AQID',error:null};
 if(name==='get_push_device')return {data:owner===currentUser?{id:'device'}:null,error:null};
 if(name==='register_push_subscription'){registered++;owner=currentUser;return {data:{id:'device',updates:true,lessons:true},error:null};}
 throw Error(name);
}};
const notification = { permission:'default', requestPermission:()=>{prompts++;return Promise.resolve('granted');} };
const api = {}; const preferences = new Map();
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/lib/push-client.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText, {
 exports:api, localStorage:{getItem:key=>preferences.get(key),setItem:(key,value)=>preferences.set(key,value),removeItem:key=>preferences.delete(key)}, require:()=>({createClient:()=>client}), Notification:notification, navigator:{serviceWorker:{register:async()=>registration,ready:Promise.resolve(registration)}},
 window:{isSecureContext:true,PushManager:{},Notification:notification,location:{origin:'https://www.darasax.com'},dispatchEvent(){}}, Event:class{},atob,Uint8Array,setTimeout,clearTimeout,
});
(async()=>{
 assert.equal(await api.ensurePhoneNotifications('user-a'),null);assert.equal(prompts,0);assert.equal(registered,0);
 notification.permission='granted';await api.ensurePhoneNotifications('user-a');assert.equal(subscribed,1);assert.equal(registered,1);assert.equal(prompts,0);
 await api.ensurePhoneNotifications('user-a');assert.equal(subscribed,1);assert.equal(registered,2);
 owner='other-account';await api.ensurePhoneNotifications('user-a');assert.equal(detached,1);assert.equal(subscribed,2);assert.equal(registered,3);
 await api.ensurePhoneNotifications('user-a',()=>false);assert.equal(registered,3);
 api.setPhoneNotificationsDisabled('user-a',true);assert.equal(api.phoneNotificationsDisabled('user-a'),true);assert.equal(api.phoneNotificationsDisabled('user-b'),false);await api.ensurePhoneNotifications('user-a');assert.equal(registered,3,'Disabled devices must not reconnect automatically');
 api.dismissNotificationBanner('user-a');assert.equal(api.notificationBannerDismissed('user-a'),true);assert.equal(api.notificationBannerDismissed('user-b'),false);api.setPhoneNotificationsDisabled('user-a',false);
 currentUser='user-b';assert.equal(await api.ensurePhoneNotifications('user-a'),null);assert.equal(registered,3);
 notification.permission='denied';assert.equal(await api.ensurePhoneNotifications('user-b'),null);assert.equal(prompts,0);
 const lifecycleSource=ts.transpileModule(fs.readFileSync('src/components/notifications/push-account-lifecycle.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 let permissionPrompts=0,automaticConnections=0; const saved=new Map();
 function mount(permission) {
  const listeners={};const lifecycle={};const native={permission};
  class KeyEvent {constructor(key){this.key=key;this.isTrusted=true;}}
  vm.runInNewContext(lifecycleSource,{exports:lifecycle,KeyboardEvent:KeyEvent,Notification:native,
   setInterval:()=>1,clearInterval(){},document:{visibilityState:"visible",addEventListener:(name,fn)=>{listeners[name]=fn;},removeEventListener(){}},
   localStorage:{getItem:key=>saved.get(key),setItem:(key,value)=>saved.set(key,value)},
   navigator:{userAgent:'Android',platform:'Linux',maxTouchPoints:1},
   window:{matchMedia:()=>({matches:true}),addEventListener:(name,fn)=>{listeners[name]=fn;},removeEventListener(){}},
   require:name=>name==='react'?{useEffect:fn=>fn(),useState:initial=>[initial,()=>{}]}:name.includes('language-provider')?{useTranslate:()=>text=>text}:name.includes('push-client')?{
    phoneNotificationsDisabled:()=>false,notificationBannerDismissed:()=>false,dismissNotificationBanner(){},pushSupported:()=>true,ensurePhoneNotifications:async()=>{automaticConnections++;return {id:'device'};},
    requestPhonePermission:()=>{permissionPrompts++;native.permission='granted';return Promise.resolve('granted');},
   }:{jsx:()=>null,jsxs:()=>null}
  });
  lifecycle.PushAccountLifecycle({userId:'user-a'});return listeners;
 }
 const listeners=mount('default');assert.equal(permissionPrompts,0);
 assert.equal(listeners.click,undefined);assert.equal(listeners.keydown,undefined,'Ordinary workspace gestures do not ask permission');
 mount('granted');await new Promise(resolve=>setImmediate(resolve));assert.equal(automaticConnections,1,'Granted devices connect automatically');
 const buttonSource=ts.transpileModule(fs.readFileSync('src/components/notifications/push-setup-button.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 let confirmed=0,connections=0,decision='granted',deviceResult={id:'device'};
 function setup() {
  const exports={};
  vm.runInNewContext(buttonSource,{exports,require:name=>name==='react'?{useEffect:fn=>fn(),useRef:value=>({current:value}),useState:value=>[value,()=>{}]}:name.includes('language-provider')?{useTranslate:()=>text=>text}:name.includes('push-client')?{
   setPhoneNotificationsDisabled(){},requestPhonePermission:()=>{permissionPrompts++;return Promise.resolve(decision);},
   ensurePhoneNotifications:async()=>{connections++;return deviceResult;}
  }:name.includes('/button')?{Button:()=>null}:{jsx:(type,props)=>({type,props}),jsxs:(type,props)=>({type,props})}});
  return exports.PushSetupButton({userId:'user-a',onConnected:()=>{confirmed++;}}).props.children[0];
 }
 let button=setup();assert.equal(button.props.children,'Enable notifications');assert.equal(permissionPrompts,0);
 button.props.onClick();button.props.onClick();await new Promise(resolve=>setImmediate(resolve));
 assert.equal(permissionPrompts,1);assert.equal(connections,1);assert.equal(confirmed,1);
 decision='denied';button=setup();button.props.onClick();await new Promise(resolve=>setImmediate(resolve));assert.equal(connections,1);assert.equal(confirmed,1);
 decision='granted';deviceResult=null;button=setup();button.props.onClick();await new Promise(resolve=>setImmediate(resolve));assert.equal(confirmed,1,'Permission alone must not show Notifications on');
 const settings=fs.readFileSync('src/components/notifications/push-settings.tsx','utf8');assert.doesNotMatch(settings,/type="checkbox"|Turn off on this device|set_push_preferences/);
 console.log('Passed automatic subscription after permission, explicit setup permission, verified connection status, subscription reuse, cross-account cleanup, cancelled-session guard, denied permission, persistent disable preferences, and account-scoped banner dismissal.');
})().catch(error=>{console.error(error);process.exitCode=1;});
