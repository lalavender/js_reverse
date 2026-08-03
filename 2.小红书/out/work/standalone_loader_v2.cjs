/**
 * mnsv2 加载器 v2 — 关键修复：将 browser 环境直接装到 global 上
 * new Function(code)() 的作用域链是 Node 的全局对象
 */
const fs = require('fs');
const vm = require('vm');

// ============================================================
// 1. 加载环境快照
// ============================================================
const env = require('../env.js');

// ============================================================
// 2. 构建完整的 global 环境
// ============================================================

// 将 window 属性安装到 global
function installGlobal(name, value) {
  try {
    Object.defineProperty(global, name, {
      value: value,
      writable: true,
      configurable: true,
      enumerable: true,
    });
  } catch(e) {
    // some properties might be read-only
  }
}

// --- 标准 JS 全局 ---
const stdGlobals = [
  'Object', 'Array', 'Function', 'String', 'Number', 'Boolean', 'Symbol', 'BigInt',
  'Map', 'Set', 'WeakMap', 'WeakSet', 'Promise', 'Proxy', 'Reflect', 'RegExp', 'Date',
  'Math', 'JSON',
  'parseInt', 'parseFloat', 'isNaN', 'isFinite',
  'encodeURI', 'encodeURIComponent', 'decodeURI', 'decodeURIComponent', 'escape', 'unescape',
  'ArrayBuffer', 'Int8Array', 'Uint8Array', 'Uint8ClampedArray', 'Int16Array', 'Uint16Array',
  'Int32Array', 'Uint32Array', 'Float32Array', 'Float64Array', 'BigInt64Array', 'BigUint64Array',
  'DataView', 'SharedArrayBuffer',
  'Error', 'TypeError', 'RangeError', 'SyntaxError', 'ReferenceError', 'EvalError', 'URIError',
  'Set', 'Map', 'WeakSet', 'WeakMap',
  'Promise',
];
for (const k of stdGlobals) {
  if (!(k in global)) {
    installGlobal(k, globalThis[k]);
  }
}

// --- Navigator ---
const navData = env.browser?.navigator || {};
const navigatorObj = {};
for (const [k, v] of Object.entries(navData)) {
  Object.defineProperty(navigatorObj, k, {
    get: () => v, configurable: true, enumerable: true,
  });
}
navigatorObj.connection = { effectiveType: '4g', rtt: 50, downlink: 10 };
navigatorObj.plugins = { length: 5, item: () => null, namedItem: () => null };
navigatorObj.mimeTypes = { length: 0, item: () => null, namedItem: () => null };
navigatorObj.mediaDevices = { enumerateDevices: () => Promise.resolve([]) };
navigatorObj.permissions = { query: () => Promise.resolve({ state: 'granted' }) };
navigatorObj.storage = { estimate: () => Promise.resolve({ quota: 0, usage: 0 }) };

// --- Screen ---
const scrData = env.browser?.screen || {};
const screenObj = {};
for (const [k, v] of Object.entries(scrData)) screenObj[k] = v;

// --- Location ---
const locData = env.browser?.location || {};
const locationObj = {};
for (const [k, v] of Object.entries(locData)) {
  if (typeof v === 'string') locationObj[k] = v;
}
locationObj.reload = () => {};
locationObj.replace = () => {};
locationObj.assign = () => {};
locationObj.toString = () => locationObj.href || '';

// --- Document ---
const docData = env.browser?.document || {};
const documentObj = {
  URL: docData.URL || 'https://www.xiaohongshu.com/explore',
  referrer: docData.referrer || '',
  charset: docData.charset || 'UTF-8',
  cookieEnabled: docData.cookieEnabled ?? true,
  designMode: docData.designMode || 'off',
  hidden: docData.hidden ?? false,
  visibilityState: docData.visibilityState || 'visible',
  readyState: docData.readyState || 'complete',
  domain: docData.domain || 'www.xiaohongshu.com',
  cookie: '',
  documentElement: { tagName: 'HTML', nodeType: 1, style: {}, clientWidth: 1920, clientHeight: 1080 },
  head: { tagName: 'HEAD' },
  body: { tagName: 'BODY', style: {} },
  getElementById: () => null,
  getElementsByTagName: () => [],
  querySelector: () => null,
  querySelectorAll: () => ({ length: 0 }),
  createElement: (tag) => ({ 
    tagName: tag.toUpperCase(), nodeType: 1, style: {},
    getAttribute: () => null, setAttribute: () => {}, appendChild: (c) => c,
    addEventListener: () => {}, removeEventListener: () => {},
    parentNode: null,
  }),
  createTextNode: (t) => ({ nodeType: 3, textContent: t }),
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => true,
  hasFocus: () => true,
  defaultView: null,
  toString: () => '[object HTMLDocument]',
};

// --- Performance ---
const perfObj = {
  timing: { navigationStart: Date.now() - 5000, unloadEventStart: 0, unloadEventEnd: 0,
    redirectStart: 0, redirectEnd: 0, fetchStart: Date.now() - 5000,
    domainLookupStart: Date.now() - 4900, domainLookupEnd: Date.now() - 4850,
    connectStart: Date.now() - 4800, connectEnd: Date.now() - 4700,
    requestStart: Date.now() - 4600, responseStart: Date.now() - 4400,
    responseEnd: Date.now() - 4300, domLoading: Date.now() - 4200,
    domInteractive: Date.now() - 3000, domComplete: Date.now() - 1000,
    loadEventStart: Date.now() - 800, loadEventEnd: Date.now() - 500,
  },
  navigation: { type: 0, redirectCount: 0 },
  memory: { usedJSHeapSize: 50000000 },
  getEntries: () => [], getEntriesByType: () => [], mark: () => {}, measure: () => {},
  now: () => Date.now() - 5000,
  timeOrigin: Date.now() - 5000,
  setupPolyfill: () => {},
};
perfObj.setNavigationStart = perfObj.setupPolyfill;
perfObj.clearResourceTimings = perfObj.setupPolyfill;

// --- Crypto ---
const cryptoObj = {
  getRandomValues: (arr) => { for(let i=0;i<arr.length;i++) arr[i]=Math.floor(Math.random()*256); return arr; },
  randomUUID: () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => (Math.random()*16|0).toString(16)),
  subtle: { digest: () => Promise.resolve(new ArrayBuffer(32)),
    encrypt: () => Promise.reject(new Error('no')),
    decrypt: () => Promise.reject(new Error('no')),
  },
};

// --- Storage ---
function makeStorage() {
  const store = {};
  return {
    getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => delete store[k], clear: () => { for(const k in store) delete store[k]; },
    get length() { return Object.keys(store).length; },
    key: (i) => Object.keys(store)[i] ?? null,
  };
}

// ============================================================
// 3. 构建 window + 安装到 global
// ============================================================

const windowObj = {
  // refs
  window: null, self: null, top: null, parent: null, frames: null, globalThis: null,
  // browser objects
  document: documentObj, navigator: navigatorObj, screen: screenObj,
  location: locationObj, history: {
    length: 1, state: null, scrollRestoration: 'auto',
    pushState: () => {}, replaceState: () => {}, go: () => {}, back: () => {}, forward: () => {},
  },
  performance: perfObj, crypto: cryptoObj,
  localStorage: makeStorage(), sessionStorage: makeStorage(),
  // events
  Event: class Event { constructor(t,o) { this.type=t; this.bubbles=o?.bubbles; this.cancelable=o?.cancelable; } preventDefault(){} stopPropagation(){} },
  CustomEvent: class CustomEvent extends (globalThis.Event) { constructor(t,o) { super(t,o); this.detail=o?.detail; } },
  AbortController: class AbortController { constructor() { this.signal={aborted:false,addEventListener:()=>{},removeEventListener:()=>{}}; } abort() { this.signal.aborted=true; } },
  // timer
  setTimeout: (fn, ms, ...args) => setTimeout(typeof fn === 'string' ? new Function(fn) : fn, ms, ...args),
  clearTimeout: (id) => clearTimeout(id),
  setInterval: (fn, ms, ...args) => setInterval(typeof fn === 'string' ? new Function(fn) : fn, ms, ...args),
  clearInterval: (id) => clearInterval(id),
  requestAnimationFrame: (fn) => setTimeout(fn, 16),
  cancelAnimationFrame: (id) => clearTimeout(id),
  requestIdleCallback: (fn) => setTimeout(() => fn({didTimeout:false,timeRemaining:()=>0}), 1),
  cancelIdleCallback: (id) => clearTimeout(id),
  queueMicrotask: (fn) => Promise.resolve().then(fn),
  // encoding
  btoa: (str) => Buffer.from(str, 'binary').toString('base64'),
  atob: (str) => Buffer.from(str, 'base64').toString('binary'),
  // web APIs
  fetch: async () => new Response('{}', { status: 200 }),
  XMLHttpRequest: class XMLHttpRequest {
    constructor() { this.readyState=0; this.status=0; this.responseText=''; this.onload=null; this.onerror=null; this.onreadystatechange=null; }
    open() { this.readyState=1; } setRequestHeader(){} send() { this.readyState=4; this.status=200; this.responseText='{}'; if(this.onload)this.onload(); if(this.onreadystatechange)this.onreadystatechange(); }
    abort() {} getAllResponseHeaders(){return '';} getResponseHeader(){return null;} addEventListener(){} removeEventListener(){}
  },
  FormData: class FormData { constructor(){this._data={};} append(k,v){this._data[k]=v;} get(k){return this._data[k];} },
  Blob: class Blob { constructor(p,t){this._parts=p||[];this.type=(t&&t.type)||'';} },
  FileReader: class FileReader { constructor(){this.onload=null;this.onerror=null;} readAsArrayBuffer(){} readAsText(){} readAsDataURL(){} abort(){} },
  URL: class URL2 { constructor(u,b){return new URL(u,b);} static createObjectURL(){return '';} static revokeObjectURL(){} },
  Image: class Image { constructor(){this.src='';this.onload=null;this.onerror=null;this.width=0;this.height=0;} },
  Worker: class Worker { constructor(){this.onmessage=null;} postMessage(){} terminate(){} addEventListener(){} removeEventListener(){} },
  MutationObserver: class MutationObserver { constructor(){} observe(){} disconnect(){} takeRecords(){return [];} },
  IntersectionObserver: class IntersectionObserver { constructor(){} observe(){} unobserve(){} disconnect(){} },
  ResizeObserver: class ResizeObserver { constructor(){} observe(){} unobserve(){} disconnect(){} },
  MessageChannel: class MessageChannel { constructor(){this.port1={postMessage(){},onmessage:null};this.port2={postMessage(){},onmessage:null};} },
  // window properties
  name: '', closed: false, opener: null, length: 0,
  innerWidth: 1920, innerHeight: 799, outerWidth: 1920, outerHeight: 1080,
  screenX: 0, screenY: 0, screenLeft: 0, screenTop: 0,
  scrollX: 0, scrollY: 0, pageXOffset: 0, pageYOffset: 0,
  devicePixelRatio: 2, scrollMaxX: 0, scrollMaxY: 0, fullScreen: false,
  // methods
  alert: () => {}, confirm: () => false, prompt: () => null,
  open: () => null, close: () => {}, stop: () => {}, focus: () => {}, blur: () => {},
  print: () => {}, getSelection: () => null, getComputedStyle: () => ({}),
  matchMedia: () => ({matches:false,media:'',addListener:()=>{},removeListener:()=>{}}),
  moveTo: () => {}, moveBy: () => {}, resizeTo: () => {}, resizeBy: () => {},
  scroll: () => {}, scrollTo: () => {}, scrollBy: () => {},
  postMessage: () => {}, captureEvents: () => {}, releaseEvents: () => {},
  reportError: () => {},
  find: () => false, dump: () => {},
  setResizable: () => {},
  requestIdleCallback: (fn) => setTimeout(fn, 1),
  cancelIdleCallback: (id) => clearTimeout(id),
  // webpack chunk array
  webpackChunkxhs_pc_web: [],
  // extra window properties from mnsv2_env[0]
  InstallTrigger: void 0,
  self: null,
  top: null,
  parent: null,
  frames: null,
  globalThis: null,
};

// Set circular refs
windowObj.window = windowObj;
windowObj.self = windowObj;
windowObj.top = windowObj;
windowObj.parent = windowObj;
windowObj.frames = windowObj;
windowObj.globalThis = windowObj;
documentObj.defaultView = windowObj;

// ============================================================
// 4. 全部安装到 global (关键！new Function 的作用域链用 global)
// ============================================================

// Install window properties to global
for (const [key, value] of Object.entries(windowObj)) {
  installGlobal(key, value);
}
// Also ensure 'window' itself
installGlobal('window', windowObj);
installGlobal('self', windowObj);
installGlobal('top', windowObj);
installGlobal('parent', windowObj);
installGlobal('frames', windowObj);
installGlobal('globalThis', windowObj);

console.log('[loader] 环境安装完毕');
console.log('[loader] typeof window:', typeof window);
console.log('[loader] typeof document:', typeof document);
console.log('[loader] typeof navigator:', typeof navigator);
console.log('[loader] typeof parseInt:', typeof parseInt);
console.log('[loader] global.mnsv2:', typeof global.mnsv2);
console.log('[loader] window.mnsv2:', typeof window.mnsv2);

// ============================================================
// 5. 加载 signv2_code.js
// ============================================================
console.log('\n[loader] 加载 signv2_code.js...');
const signCode = fs.readFileSync('work/signv2_code.js', 'utf8');
console.log('[loader] 代码长度:', signCode.length);

try {
  // 使用 vm.runInThisContext 可以访问当前 global
  // 或者直接 eval
  // 但 new Function 会创建新作用域...
  // 用 eval 最直接
  eval(signCode);
  console.log('[loader] ✅ eval 完成');
} catch(e) {
  console.error('[loader] ❌ eval 出错:', e.message);
  console.error(e.stack?.slice(0, 1000));
}

console.log('[loader] 加载后 global.mnsv2:', typeof global.mnsv2);
console.log('[loader] 加载后 window.mnsv2:', typeof window.mnsv2);

// ============================================================
// 6. 签名测试
// ============================================================
const mnsv2 = window.mnsv2 || global.mnsv2;
if (typeof mnsv2 === 'function') {
  try {
    const C = '/api/redcaptcha/v2/getconfig{}';
    const U = '701d7db129f79737abc1c57cc97e69da';
    const P = '040a1d360bddd5d9c6fe7097ff1437e0';
    const sign = mnsv2(C, U, P);
    console.log('\n[loader] ✅ 签名结果:', sign);
    console.log('[loader] 签名长度:', sign.length);
    console.log('[loader] 签名前缀:', sign.substring(0, 20));
  } catch(e) {
    console.error('\n[loader] ❌ 签名出错:', e.message);
    console.error(e.stack?.slice(0, 2000));
  }
} else {
  console.log('\n[loader] ❌ mnsv2 函数未创建');
  // 调试：检查 mnsv2 可能在其他地方
  console.log('[loader] global keys with mnsv:', Object.keys(global).filter(k => k.includes('mn') || k.includes('sv')));
}
