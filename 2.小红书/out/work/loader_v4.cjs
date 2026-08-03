// mnsv2 loader v4 — 分两步：只定义函数，手动调
const fs = require('fs');

// ======= 1. 安装全部浏览器全局 =======
global.window = global;
global.self = global;
global.top = global;
global.parent = global;

global.document = Object.defineProperty({
  URL: 'https://www.xiaohongshu.com/explore',
  referrer: '', charset: 'UTF-8', cookie: '',
  cookieEnabled: true, designMode: 'off',
  hidden: false, visibilityState: 'visible', readyState: 'complete',
  domain: 'www.xiaohongshu.com',
  documentElement: { tagName: 'HTML', nodeType: 1, style: {} },
  head: { tagName: 'HEAD' }, body: { tagName: 'BODY', style: {} },
  getElementById: () => null, getElementsByTagName: () => [],
  querySelector: () => null, querySelectorAll: () => ({length:0}),
  createElement: (t) => ({tagName:t.toUpperCase(),style:{},getAttribute:()=>null,setAttribute:()=>{},appendChild:c=>c,addEventListener:()=>{},removeEventListener:()=>{},parentNode:null}),
  createTextNode: (t) => ({nodeType:3,textContent:t}),
  addEventListener: () => {}, removeEventListener: () => {}, dispatchEvent: () => true,
  hasFocus: () => true, defaultView: global,
}, 'cookie', { get: () => '', set: () => {} });

global.navigator = {};
const navProps = {
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:153.0) Gecko/20100101 Firefox/153.0',
  platform: 'MacIntel', language: 'zh-CN', appVersion: '5.0 (Macintosh)',
  appName: 'Netscape', appCodeName: 'Mozilla', product: 'Gecko',
  productSub: '20100101', vendor: '', vendorSub: '', buildID: '20181001000000',
  cookieEnabled: true, onLine: true, webdriver: false,
  hardwareConcurrency: 8, maxTouchPoints: 0, oscpu: 'Intel Mac OS X 10.15',
  plugins: { length: 0 }, mimeTypes: { length: 0 },
  connection: { effectiveType: '4g' },
};
for (const [k,v] of Object.entries(navProps)) {
  Object.defineProperty(global.navigator, k, { get: () => v, configurable: true });
}

global.performance = {
  timing: { navigationStart: Date.now() - 5000, fetchStart: Date.now() - 5000,
    domainLookupStart: Date.now()-4900, domainLookupEnd: Date.now()-4850,
    connectStart: Date.now()-4800, connectEnd: Date.now()-4700,
    requestStart: Date.now()-4600, responseStart: Date.now()-4400, responseEnd: Date.now()-4300,
    domLoading: Date.now()-4200, domInteractive: Date.now()-3000, domComplete: Date.now()-1000,
    loadEventStart: Date.now()-800, loadEventEnd: Date.now()-500,
  },
  navigation: { type: 0 }, memory: { usedJSHeapSize: 50000000 },
  now: () => Date.now() - 5000, timeOrigin: Date.now() - 5000,
  getEntries: () => [], getEntriesByType: () => [],
  mark: () => {}, measure: () => {},
  setupPolyfill: () => {}, setNavigationStart: () => {}, clearResourceTimings: () => {},
};

global.crypto = {
  getRandomValues: (arr) => { for(let i=0;i<arr.length;i++) arr[i]=Math.floor(Math.random()*256); return arr; },
  randomUUID: () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => (Math.random()*16|0).toString(16)),
  subtle: { digest: () => Promise.resolve(new ArrayBuffer(32)),
    encrypt: () => Promise.reject(new Error('no')), decrypt: () => Promise.reject(new Error('no')), },
};

global.Event = class Event2 {
  constructor(type, opts) { this.type=type; this.bubbles=opts?.bubbles; this.cancelable=opts?.cancelable; }
  preventDefault(){} stopPropagation(){}
};
global.location = {
  href:'https://www.xiaohongshu.com/explore', host:'www.xiaohongshu.com',
  hostname:'www.xiaohongshu.com', origin:'https://www.xiaohongshu.com',
  protocol:'https:', pathname:'/explore', search:'', hash:'',
  reload:()=>{}, replace:()=>{}, assign:()=>{}, toString:()=>'https://www.xiaohongshu.com/explore',
};
global.screen = { width:1920, height:1080, availWidth:1920, availHeight:1004, colorDepth:30, pixelDepth:30,
  availLeft:0, availTop:0, top:244, left:-1920 };
global.localStorage = { _d:{}, getItem:(k)=>null, setItem:(k,v)=>{}, removeItem:()=>{}, clear:()=>{}, get length(){return 0}, key:()=>null };
global.sessionStorage = { _d:{}, getItem:(k)=>null, setItem:(k,v)=>{}, removeItem:()=>{}, clear:()=>{}, get length(){return 0}, key:()=>null };
global.alert = () => {}; global.confirm = () => false; global.prompt = () => null;
global.XMLHttpRequest = class XHR {
  constructor() { this.readyState=0; this.status=0; this.responseText=''; this.onload=null; this.onerror=null; }
  open() { this.readyState=1; } setRequestHeader(){} send() { this.readyState=4; this.status=200; this.responseText='{}'; if(this.onload)this.onload(); }
  abort() {} addEventListener(){} removeEventListener(){}
};
global.Image = class Image { constructor(){this.src='';this.onload=null;} };
global.FormData = class FormData { constructor(){this._d={};} append(k,v){this._d[k]=v;} get(k){return this._d[k];} };
global.Set = Set; global.Blob = class Blob{}; global.FileReader = class FR{};
global.AbortController = class AC{constructor(){this.signal={aborted:false};} abort(){this.signal.aborted=true;}};
global.MutationObserver = class MO{constructor(){}observe(){}disconnect(){}};
global.queueMicrotask = (fn) => Promise.resolve().then(fn);

console.log('=== 环境就绪 ===');

// ======= 2. 加载代码 =======
const code = fs.readFileSync('work/signv2_code.js', 'utf8');

// Option A: Remove the auto-call at the end
// The last call looks like: glb['_AUuXfEG27Xa3x'](__$c, [...])
// Find where __$c is defined and the call ends
const endIdx = code.indexOf("glb['_AUuXfEG27Xa3x']");
const codeWithoutCall = code.substring(0, endIdx) + 'var _setup_called=true;';

console.log('代码总长:', code.length);
console.log('去除末尾调用后长度:', codeWithoutCall.length);

eval(codeWithoutCall);
console.log('=== 定义完成 ===');
console.log('_AUuXfEG27Xa3x:', typeof _AUuXfEG27Xa3x);
console.log('__$c:', typeof __$c, __$c ? 'exist' : 'missing');

// ======= 3. 精确构造 env 数组 =======
const env = [
  undefined,           // 0
  {},                  // 1: {}
  global,              // 2: window
  undefined,           // 3
  performance,         // 4
  encodeURIComponent,  // 5
  Array,               // 6
  TextEncoder,         // 7
  Date,                // 8
  Math,                // 9
  Uint8Array,          // 10
  document,            // 11
  setTimeout,          // 12
  RegExp,              // 13
  unescape,            // 14
  parseInt,            // 15
  Object,              // 16
  navigator,           // 17
  null,                // 18
  Set,                 // 19: Set
  Function,            // 20
  String,              // 21
  Error,               // 22
  undefined,           // 23 (chrome)
  Event,               // 24
  Reflect,             // 25
];

// ======= 4. 调用 =======
console.log('\n=== 调用 _AUuXfEG27Xa3x ===');
try {
  const result = window._AUuXfEG27Xa3x(__$c, env);
  console.log('返回值:', result);
} catch(e) {
  console.error('调用失败:', e.message);
  console.error(e.stack?.substring(0, 500));
}

console.log('\n=== 结果 ===');
console.log('window.mnsv2:', typeof window.mnsv2);
if (window.mnsv2) {
  console.log('  name:', window.mnsv2.name);
  console.log('  props:', JSON.stringify(Object.getOwnPropertyNames(window.mnsv2)));
}

// ======= 5. 签名 =======
if (typeof window.mnsv2 === 'function') {
  try {
    const C = '/api/redcaptcha/v2/getconfig{}';
    const U = '701d7db129f79737abc1c57cc97e69da';
    const P = '040a1d360bddd5d9c6fe7097ff1437e0';
    const sign = window.mnsv2(C, U, P);
    console.log('✅ 签名:', sign);
  } catch(e) {
    console.error('❌ 签名出错:', e.message);
    console.error(e.stack?.substring(0, 500));
  }
}
