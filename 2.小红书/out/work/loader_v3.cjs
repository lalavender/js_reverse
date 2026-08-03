// mnsv2 加载器 v3 — 精确匹配浏览器 env 数组
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
  timing: { navigationStart: Date.now() - 5000, fetchStart: Date.now() - 5000 },
  navigation: { type: 0 }, memory: { usedJSHeapSize: 50000000 },
  now: () => Date.now() - 5000, getEntries: () => [], getEntriesByType: () => [],
  mark: () => {}, measure: () => {},
  setupPolyfill: () => {}, setNavigationStart: () => {}, clearResourceTimings: () => {},
};

global.crypto = {
  getRandomValues: (arr) => { for(let i=0;i<arr.length;i++) arr[i]=Math.floor(Math.random()*256); return arr; },
  subtle: { digest: () => Promise.resolve(new ArrayBuffer(32)) },
};

global.Event = class Event2 {
  constructor(type, opts) { this.type = type; this.bubbles = opts?.bubbles; this.cancelable = opts?.cancelable; }
  preventDefault() {} stopPropagation() {}
};
global.location = {
  href: 'https://www.xiaohongshu.com/explore', host: 'www.xiaohongshu.com',
  hostname: 'www.xiaohongshu.com', origin: 'https://www.xiaohongshu.com',
  protocol: 'https:', pathname: '/explore', search: '', hash: '',
  reload: () => {}, replace: () => {}, assign: () => {}, toString: () => 'https://www.xiaohongshu.com/explore',
};
global.screen = { width: 1920, height: 1080, availWidth: 1920, availHeight: 1004, colorDepth: 30, pixelDepth: 30 };
global.localStorage = { _d:{}, getItem:(k)=>null, setItem:(k,v)=>{}, removeItem:()=>{}, clear:()=>{}, get length(){return 0}, key:()=>null };
global.sessionStorage = { _d:{}, getItem:(k)=>null, setItem:(k,v)=>{}, removeItem:()=>{}, clear:()=>{}, get length(){return 0}, key:()=>null };

console.log('=== 环境就绪 ===');

// ======= 2. 加载 signv2_code.js =======
const code = fs.readFileSync('work/signv2_code.js', 'utf8');
eval(code);
console.log('=== eval 完成 ===');
console.log('_AUuXfEG27Xa3x:', typeof window._AUuXfEG27Xa3x);
console.log('__$c 类型:', typeof __$c, '长度:', __$c.length);

// ======= 3. 精确构造 env 数组（匹配浏览器 $0）=======
const env = [
  undefined,           // 0: undefined
  {},                  // 1: Object (空对象)
  global,              // 2: window/self
  undefined,           // 3: undefined
  performance,         // 4: Performance
  encodeURIComponent,  // 5: fn
  Array,               // 6: fn
  TextEncoder,         // 7: fn
  Date,                // 8: fn
  Math,                // 9: Math
  Uint8Array,          // 10: fn
  document,            // 11: HTMLDocument
  setTimeout,          // 12: fn
  RegExp,              // 13: fn
  unescape,            // 14: fn
  parseInt,            // 15: fn
  Object,              // 16: Object constructor
  navigator,           // 17: Navigator
  null,                // 18: null
  Set,                 // 19: Set
  Function,            // 20: Function
  String,              // 21: String
  Error,               // 22: Error
  undefined,           // 23: undefined (chrome undefined)
  Event,               // 24: Event
  Reflect,             // 25: Reflect
];

console.log('env[1] constructor:', env[1].constructor.name);

// ======= 4. 调用 =======
console.log('\n=== 调用 _AUuXfEG27Xa3x ===');
try {
  const result = window._AUuXfEG27Xa3x(__$c, env);
  console.log('返回值:', result);
} catch(e) {
  console.error('调用失败:', e.message);
  console.error(e.stack?.substring(0, 1000));
}

console.log('\n=== 结果 ===');
console.log('window.mnsv2:', typeof window.mnsv2);
console.log('window._0x30ce91:', typeof window._0x30ce91);

if (typeof window.mnsv2 === 'function') {
  try {
    const C = '/api/redcaptcha/v2/getconfig{}';
    const U = '701d7db129f79737abc1c57cc97e69da';
    const P = '040a1d360bddd5d9c6fe7097ff1437e0';
    const sign = window.mnsv2(C, U, P);
    console.log('✅ 签名:', sign);
  } catch(e) {
    console.error('❌ 签名出错:', e.message);
  }
}
