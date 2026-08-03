/**
 * 小红书 mnsv2 Node.js 补环境加载器
 * 
 * 原理：重建浏览器 window/document/navigator 环境，
 * 加载 bundler-runtime（webpack 运行时），
 * 再加载 vendor-dynamic（webpack chunk，含 mnsv2 模块），
 * 待 webpack 模块注册完毕后从 window.mnsv2 取签名器并调用。
 */

const fs = require('fs');
const path = require('path');

// ============================================================
// 1. 加载 env.js 中的浏览器环境快照
// ============================================================
const env = require('../env.js');

// ============================================================
// 2. 构建全局 fake 浏览器环境
// ============================================================

// --- 2a. 基础工具函数 ---
function makeFn(name) {
  return function(...args) {
    // 可在此加 log 观察调用
    // console.log(`[env] ${name} called with`, args.length, 'args');
  };
}

function makeStubObject(keys) {
  const obj = {};
  for (const k of keys || []) {
    obj[k] = makeFn(k);
  }
  return obj;
}

// --- 2b. navigator ---
const navigatorData = env.browser?.navigator || {};
const navigatorObj = {};
for (const [k, v] of Object.entries(navigatorData)) {
  Object.defineProperty(navigatorObj, k, {
    get: () => v,
    configurable: true,
    enumerable: true,
  });
}
// 额外属性（只读） - 这些在 mnsv2_env[0] 里有但不在 browser.navigator 中
navigatorObj.connection = { effectiveType: '4g', rtt: 50, downlink: 10 };
navigatorObj.plugins = { length: 5, item: () => null, namedItem: () => null };
navigatorObj.mimeTypes = { length: 0, item: () => null, namedItem: () => null };
navigatorObj.mediaDevices = { enumerateDevices: () => Promise.resolve([]) };
navigatorObj.permissions = { query: () => Promise.resolve({ state: 'granted' }) };
navigatorObj.mediaSession = {};
navigatorObj.storage = { estimate: () => Promise.resolve({ quota: 0, usage: 0 }) };
navigatorObj.presentation = {};

// --- 2c. screen ---
const screenData = env.browser?.screen || {};
const screenObj = {};
for (const [k, v] of Object.entries(screenData)) {
  screenObj[k] = v;
}
// 额外 screen 属性
screenObj.availLeft = screenData.availLeft ?? 0;
screenObj.availTop = screenData.availTop ?? 0;

// --- 2d. location ---
const locationData = env.browser?.location || {};
const locationObj = {};
for (const [k, v] of Object.entries(locationData)) {
  if (typeof v === 'string') {
    locationObj[k] = v;
  }
}
locationObj.reload = () => {};
locationObj.replace = (url) => {};
locationObj.assign = (url) => {};
locationObj.toString = () => locationObj.href || '';
if (!locationObj.ancestorOrigins) {
  locationObj.ancestorOrigins = [];
}

// --- 2e. document ---
const documentData = env.browser?.document || {};
const documentObj = {
  URL: documentData.URL || 'https://www.xiaohongshu.com/explore',
  referrer: documentData.referrer || '',
  charset: documentData.charset || 'UTF-8',
  cookieEnabled: documentData.cookieEnabled ?? true,
  designMode: documentData.designMode || 'off',
  hidden: documentData.hidden ?? false,
  visibilityState: documentData.visibilityState || 'visible',
  readyState: documentData.readyState || 'complete',
  domain: documentData.domain || 'www.xiaohongshu.com',
  cookie: '',
  DOCTYPE: { name: 'html', publicId: '', systemId: '' },
  documentElement: { 
    tagName: 'HTML', 
    nodeType: 1, 
    style: {},
    clientWidth: 1920,
    clientHeight: 1080,
    getBoundingClientRect: () => ({top:0,left:0,bottom:1080,right:1920,width:1920,height:1080,x:0,y:0}),
  },
  head: { tagName: 'HEAD' },
  body: { tagName: 'BODY', style: {} },
  scripts: [],
  styleSheets: [],
  forms: [],
  images: [],
  links: [],
};

// document 方法
documentObj.getElementById = (id) => {
  // 返回一个最小化元素对象
  return null; // 多数场景找不到也无所谓
};
documentObj.getElementsByTagName = (tag) => {
  if (tag === 'script') return [];
  if (tag === 'meta') return [];
  if (tag === 'link') return [];
  return [];
};
documentObj.getElementsByClassName = () => [];
documentObj.querySelector = (sel) => {
  // 有些代码会读 meta/link 的属性
  return null;
};
documentObj.querySelectorAll = (sel) => {
  return { length: 0, item: () => null, forEach: () => {} };
};
documentObj.createElement = (tag) => {
  const el = {
    tagName: tag.toUpperCase(),
    nodeType: 1,
    style: {},
    src: '',
    id: '',
    className: '',
    innerHTML: '',
    innerText: '',
    textContent: '',
    href: '',
    rel: '',
    type: '',
    charset: '',
    async: false,
    defer: false,
    crossOrigin: null,
    integrity: '',
    referrerPolicy: '',
    dataset: {},
    attributes: {},
    getAttribute: (name) => null,
    setAttribute: (name, val) => { el[name] = val; },
    removeAttribute: (name) => {},
    appendChild: (child) => child,
    removeChild: (child) => child,
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => true,
    getBoundingClientRect: () => ({top:0,left:0,bottom:0,right:0,width:0,height:0,x:0,y:0}),
    cloneNode: () => el,
    parentNode: null,
    parentElement: null,
    nextSibling: null,
    previousSibling: null,
    childNodes: [],
    firstChild: null,
    lastChild: null,
  };
  return el;
};
documentObj.createTextNode = (text) => ({ nodeType: 3, textContent: text, data: text });
documentObj.createComment = (text) => ({ nodeType: 8, textContent: text });
documentObj.createDocumentFragment = () => ({ nodeType: 11, childNodes: [], appendChild: (c) => c });
documentObj.createEvent = (type) => ({ type, preventDefault: () => {} });
documentObj.addEventListener = (ev, fn) => {};
documentObj.removeEventListener = (ev, fn) => {};
documentObj.dispatchEvent = (ev) => true;
documentObj.hasFocus = () => true;
documentObj.close = () => {};
documentObj.open = () => {};
documentObj.write = () => {};
documentObj.writeln = () => {};
documentObj.execCommand = () => false;
documentObj.queryCommandSupported = () => false;
documentObj.elementFromPoint = (x, y) => documentObj.body;
documentObj.elementsFromPoint = (x, y) => [];
documentObj.caretRangeFromPoint = (x, y) => null;
documentObj.defaultView = null; // will be set to window
documentObj.toString = () => '[object HTMLDocument]';

// --- 2f. performance ---
const perfObj = {
  timing: {
    navigationStart: Date.now() - 5000,
    unloadEventStart: 0, unloadEventEnd: 0,
    redirectStart: 0, redirectEnd: 0,
    fetchStart: Date.now() - 5000,
    domainLookupStart: Date.now() - 4900,
    domainLookupEnd: Date.now() - 4850,
    connectStart: Date.now() - 4800,
    connectEnd: Date.now() - 4700,
    secureConnectionStart: Date.now() - 4750,
    requestStart: Date.now() - 4600,
    responseStart: Date.now() - 4400,
    responseEnd: Date.now() - 4300,
    domLoading: Date.now() - 4200,
    domInteractive: Date.now() - 3000,
    domContentLoadedEventStart: Date.now() - 2800,
    domContentLoadedEventEnd: Date.now() - 2700,
    domComplete: Date.now() - 1000,
    loadEventStart: Date.now() - 800,
    loadEventEnd: Date.now() - 500,
  },
  navigation: { type: 0, redirectCount: 0 },
  memory: { usedJSHeapSize: 50000000, totalJSHeapSize: 100000000, jsHeapSizeLimit: 2000000000 },
  getEntries: () => [],
  getEntriesByType: () => [],
  getEntriesByName: () => [],
  mark: () => {},
  measure: () => {},
  clearMarks: () => {},
  clearMeasures: () => {},
  now: () => Date.now() - 5000,
  timeOrigin: Date.now() - 5000,
  toJSON: () => ({}),
};
perfObj.setupPolyfill = () => {};
perfObj.setNavigationStart = () => {};
perfObj.clearResourceTimings = () => {};
perfObj.resourcesBufferCache = {};

// --- 2g. crypto ---
const cryptoObj = {
  getRandomValues: (arr) => {
    for (let i = 0; i < arr.length; i++) arr[i] = Math.floor(Math.random() * 256);
    return arr;
  },
  randomUUID: () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  }),
  subtle: {
    encrypt: () => Promise.reject(new Error('not implemented')),
    decrypt: () => Promise.reject(new Error('not implemented')),
    digest: () => Promise.resolve(new ArrayBuffer(32)),
    sign: () => Promise.reject(new Error('not implemented')),
    verify: () => Promise.reject(new Error('not implemented')),
    generateKey: () => Promise.reject(new Error('not implemented')),
    importKey: () => Promise.reject(new Error('not implemented')),
    exportKey: () => Promise.reject(new Error('not implemented')),
    deriveKey: () => Promise.reject(new Error('not implemented')),
    deriveBits: () => Promise.reject(new Error('not implemented')),
    wrapKey: () => Promise.reject(new Error('not implemented')),
    unwrapKey: () => Promise.reject(new Error('not implemented')),
  },
};
Object.defineProperty(cryptoObj, 'subtle', { get: () => cryptoObj.subtle });

// --- 2h. localStorage / sessionStorage ---
class SimpleStorage {
  constructor() { this._data = {}; }
  getItem(k) { return this._data[k] ?? null; }
  setItem(k, v) { this._data[k] = String(v); }
  removeItem(k) { delete this._data[k]; }
  clear() { this._data = {}; }
  key(i) { return Object.keys(this._data)[i] ?? null; }
  get length() { return Object.keys(this._data).length; }
}

// --- 2i. console ---
const consoleObj = {};
for (const k of ['log','warn','error','info','debug','trace','dir','table','group','groupEnd','time','timeEnd','count','assert']) {
  consoleObj[k] = (...args) => process.stdout.write(`[console.${k}] ${args.map(a => typeof a === 'object' ? JSON.stringify(a).slice(0,200) : String(a)).join(' ')}\n`);
}

// ============================================================
// 3. 组装 window 全局对象
// ============================================================

// 从 env.mnsv2_env 获取所有 window 属性名（mnsv2 初始化时会检查的）
let mnsv2WindowProps = [];
try {
  const env0 = JSON.parse(env.mnsv2_env['0']);
  mnsv2WindowProps = Object.keys(env0);
} catch(e) {
  console.warn('[loader] 无法解析 mnsv2_env[0]', e.message);
}

// 构建 window
const windowObj = {
  // --- 基本类型 ---
  undefined: void 0,
  NaN: NaN,
  Infinity: Infinity,
  // --- 构造函数 ---
  Object: Object,
  Array: Array,
  Function: Function,
  String: String,
  Number: Number,
  Boolean: Boolean,
  Symbol: Symbol,
  BigInt: BigInt,
  Map: Map,
  Set: Set,
  WeakMap: WeakMap,
  WeakSet: WeakSet,
  Promise: Promise,
  Proxy: Proxy,
  Reflect: Reflect,
  RegExp: RegExp,
  Date: Date,
  Math: Math,
  JSON: JSON,
  parseInt: parseInt,
  parseFloat: parseFloat,
  isNaN: isNaN,
  isFinite: isFinite,
  encodeURI: encodeURI,
  encodeURIComponent: encodeURIComponent,
  decodeURI: decodeURI,
  decodeURIComponent: decodeURIComponent,
  escape: escape,
  unescape: unescape,
  // --- 类型化数组 ---
  ArrayBuffer: ArrayBuffer,
  Int8Array: Int8Array,
  Uint8Array: Uint8Array,
  Uint8ClampedArray: Uint8ClampedArray,
  Int16Array: Int16Array,
  Uint16Array: Uint16Array,
  Int32Array: Int32Array,
  Uint32Array: Uint32Array,
  Float32Array: Float32Array,
  Float64Array: Float64Array,
  BigInt64Array: BigInt64Array,
  BigUint64Array: BigUint64Array,
  DataView: DataView,
  SharedArrayBuffer: SharedArrayBuffer,
  // --- 浏览器对象 ---
  window: null, // self ref after construction
  self: null,
  globalThis: null,
  document: documentObj,
  navigator: navigatorObj,
  screen: screenObj,
  location: locationObj,
  history: { length: 1, scrollRestoration: 'auto', state: null, pushState: () => {}, replaceState: () => {}, go: () => {}, back: () => {}, forward: () => {} },
  performance: perfObj,
  crypto: cryptoObj,
  localStorage: new SimpleStorage(),
  sessionStorage: new SimpleStorage(),
  // --- 标准方法 ---
  alert: makeFn('alert'),
  confirm: () => false,
  prompt: () => null,
  open: makeFn('open'),
  close: makeFn('close'),
  focus: makeFn('focus'),
  blur: makeFn('blur'),
  print: makeFn('print'),
  stop: makeFn('stop'),
  // --- 定时器 ---
  setTimeout: (fn, ms, ...args) => {
    if (typeof fn === 'string') fn = new Function(fn);
    return setTimeout(fn, ms, ...args);
  },
  clearTimeout: (id) => clearTimeout(id),
  setInterval: (fn, ms, ...args) => {
    if (typeof fn === 'string') fn = new Function(fn);
    return setInterval(fn, ms, ...args);
  },
  clearInterval: (id) => clearInterval(id),
  requestAnimationFrame: (fn) => setTimeout(fn, 16),
  cancelAnimationFrame: (id) => clearTimeout(id),
  requestIdleCallback: (fn) => setTimeout(() => fn({ didTimeout: false, timeRemaining: () => 0 }), 1),
  cancelIdleCallback: (id) => clearTimeout(id),
  queueMicrotask: (fn) => Promise.resolve().then(fn),
  // --- 编码 ---
  btoa: (str) => Buffer.from(str, 'binary').toString('base64'),
  atob: (str) => Buffer.from(str, 'base64').toString('binary'),
  // --- 网络 ---
  fetch: async () => new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } }),
  // --- EventTarget ---
  Event: class Event { constructor(type, opts) { this.type = type; this.bubbles = opts?.bubbles; this.cancelable = opts?.cancelable; } preventDefault() {} stopPropagation() {} },
  CustomEvent: class CustomEvent extends (globalThis.Event || class {}) { constructor(type, opts) { super(type, opts); this.detail = opts?.detail; } },
  EventTarget: class EventTarget { constructor() { this._listeners = {}; } addEventListener(type, fn) { if (!this._listeners[type]) this._listeners[type] = []; this._listeners[type].push(fn); } removeEventListener(type, fn) { const arr = this._listeners[type]; if (arr) this._listeners[type] = arr.filter(f => f !== fn); } dispatchEvent(ev) { return true; } },
  AbortController: class AbortController { constructor() { this.signal = { aborted: false, onabort: null, addEventListener: () => {}, removeEventListener: () => {} }; } abort() { this.signal.aborted = true; } },
  AbortSignal: { abort: () => ({ aborted: true }) },
  // --- DOM ---
  Node: { ELEMENT_NODE: 1, TEXT_NODE: 3, COMMENT_NODE: 8, DOCUMENT_NODE: 9 },
  Element: class Element {},
  HTMLElement: class HTMLElement {},
  HTMLDocument: class HTMLDocument {},
  HTMLIFrameElement: class HTMLIFrameElement {},
  HTMLScriptElement: class HTMLScriptElement {},
  MutationObserver: class MutationObserver { constructor(fn) { this.fn = fn; } observe() {} disconnect() {} takeRecords() { return []; } },
  IntersectionObserver: class IntersectionObserver { constructor(fn) { this.fn = fn; } observe() {} unobserve() {} disconnect() {} takeRecords() { return []; } },
  ResizeObserver: class ResizeObserver { constructor(fn) { this.fn = fn; } observe() {} unobserve() {} disconnect() {} },
  // --- Worker ---
  Worker: class Worker { constructor() { this.onmessage = null; this.onerror = null; } postMessage() {} terminate() {} addEventListener() {} removeEventListener() {} dispatchEvent() { return true; } },
  MessageChannel: class MessageChannel { constructor() { this.port1 = {postMessage(){},onmessage:null,close(){},addEventListener(){},removeEventListener(){}}; this.port2 = {...this.port1}; } },
  // --- 其它 ---
  Image: class Image { constructor(w,h) { this.width=w||0; this.height=h||0; this.src=''; this.onload=null; this.onerror=null; this.complete=false; this.naturalWidth=0; this.naturalHeight=0; this.crossOrigin=null; } },
  Audio: class Audio { constructor() { this.src=''; this.autoplay=false; this.loop=false; this.volume=1; this.muted=false; this.onended=null; this.play=()=>Promise.resolve(); this.pause=()=>{}; } },
  XMLHttpRequest: class XMLHttpRequest { 
    constructor() { this.readyState=0; this.status=0; this.statusText=''; this.responseText=''; this.responseXML=null; this.response=''; this.responseType=''; this.timeout=0; this.withCredentials=false; this.onreadystatechange=null; this.onload=null; this.onerror=null; this.ontimeout=null; this.upload={}; this._url=''; this._method='GET'; } 
    open(m, u) { this._method=m; this._url=u; this.readyState=1; } 
    setRequestHeader() {} 
    send(body) { this.readyState=4; this.status=200; this.statusText='OK'; this.responseText='{}'; this.response='{}'; if(this.onreadystatechange) this.onreadystatechange(); if(this.onload) this.onload(); } 
    abort() {} 
    getAllResponseHeaders() { return 'Content-Type: application/json'; } 
    getResponseHeader(h) { if(h.toLowerCase()==='content-type') return 'application/json'; return null; } 
    overrideMimeType() {} 
    addEventListener() {} 
    removeEventListener() {} 
    dispatchEvent() { return true; } 
  },
  FormData: class FormData { constructor() { this._data = {}; } append(k,v) { this._data[k]=v; } get(k) { return this._data[k]; } getAll(k) { return [this._data[k]]; } has(k) { return k in this._data; } delete(k) { delete this._data[k]; } set(k,v) { this._data[k]=v; } forEach(fn) { for(const[k,v] of Object.entries(this._data)) fn(v,k); } },
  Blob: class Blob { constructor(parts, opts) { this._parts=parts||[]; this.type=(opts&&opts.type)||''; this.size=String(this._parts.join('')).length; } slice() { return new Blob(); } text() { return Promise.resolve(String(this._parts.join(''))); } arrayBuffer() { return Promise.resolve(new ArrayBuffer(0)); } stream() { return null; } },
  File: class File extends (globalThis.Blob || class {}) { constructor(parts, name, opts) { super(parts, opts); this.name=name||'file'; this.lastModified=(opts&&opts.lastModified)||Date.now(); } },
  FileReader: class FileReader { constructor() { this.readyState=0; this.result=null; this.error=null; this.onload=null; this.onerror=null; this.onloadend=null; } readAsArrayBuffer(b) { this.result=new ArrayBuffer(0); this.readyState=2; if(this.onload)this.onload(); if(this.onloadend)this.onloadend(); } readAsText(b) { this.result=''; this.readyState=2; if(this.onload)this.onload(); if(this.onloadend)this.onloadend(); } readAsDataURL(b) { this.result='data:,'; this.readyState=2; if(this.onload)this.onload(); if(this.onloadend)this.onloadend(); } abort() { this.readyState=2; } addEventListener(){} removeEventListener(){} dispatchEvent(){return true;} },
  URL: class URL2 { constructor(url, base) { if(base) { try { return new URL(url, base); } catch(e) {} } try { const u = new URL(url); return u; } catch(e) { return { href: url, origin: '', protocol: '', host: '', hostname: '', port: '', pathname: url, search: '', hash: '', toString: () => url }; } } static createObjectURL() { return ''; } static revokeObjectURL() {} },
  // --- webpack 需要用到的特殊对象 ---
  webpackChunkxhs_pc_web: [],
};

// 补上 mnsv2_env[0] 中列出的附加属性（window 标准属性）
const extraWindowProps = [
  'self', 'name', 'history', 'navigation', 'customElements',
  'locationbar', 'menubar', 'personalbar', 'scrollbars', 'statusbar', 'toolbar',
  'status', 'closed', 'event', 'frames', 'length', 'opener', 'parent', 'frameElement',
  'clientInformation', 'external',
  'innerWidth', 'innerHeight', 'scrollX', 'pageXOffset', 'scrollY', 'pageYOffset',
  'screenLeft', 'screenTop', 'screenX', 'screenY', 'outerWidth', 'outerHeight',
  'mozInnerScreenX', 'mozInnerScreenY', 'devicePixelRatio',
  'scrollMaxX', 'scrollMaxY', 'fullScreen',
  'ondevicemotion', 'ondeviceorientation', 'ondeviceorientationabsolute',
  'InstallTrigger', 'visualViewport', 'cookieStore', 'originAgentCluster',
  'documentPictureInPicture', 'crypto',
  // event handlers
  'onabort','onblur','oncancel','oncanplay','oncanplaythrough','onchange','onclick',
  'onclose','oncontextmenu','oncuechange','ondblclick','ondrag','ondragend','ondragenter',
  'ondragexit','ondragleave','ondragover','ondragstart','ondrop','ondurationchange',
  'onemptied','onended','onerror','onfocus','onformdata','oninput','oninvalid',
  'onkeydown','onkeypress','onkeyup','onload','onloadeddata','onloadedmetadata',
  'onloadstart','onmousedown','onmouseenter','onmouseleave','onmousemove','onmouseout',
  'onmouseover','onmouseup','onmousewheel','onmozfullscreenchange','onmozfullscreenerror',
  'onpause','onplay','onplaying','onprogress','onratechange','onreset','onresize',
  'onscroll','onsecuritypolicyviolation','onseeked','onseeking','onselect','onselectionchange',
  'onslotchange','onstalled','onsubmit','onsuspend','ontimeupdate','ontoggle','onvolumechange',
  'onwaiting','onwebkitanimationend','onwebkitanimationiteration','onwebkitanimationstart',
  'onwebkittransitionend','onwheel','onafterprint','onbeforeprint','onbeforeunload',
  'onhashchange','onlanguagechange','onmessage','onmessageerror','onoffline','ononline',
  'onpagehide','onpageshow','onpopstate','onrejectionhandled','onstorage','onunhandledrejection',
  'onunload',
  // extra
  'content','controllers','cookie','defaultStatus','defaultstatus','dialogArguments','dialogHeight',
  'dialogLeft','dialogTop','dialogWidth','directories','frameElement','innerHeight','innerWidth',
  'locationbar','menubar','offscreenBuffering','onappinstalled','onbeforeinstallprompt',
  'ondevicelight','ondevicemotion','ondeviceorientation','ondeviceorientationabsolute',
  'ondragdrop','onmozfullscreenchange','onmozfullscreenerror','onmousewheel','onorientationchange',
  'onpaint','onscroll','ontimeout','onvrdisplayactivate','onvrdisplayblur','onvrdisplayconnect',
  'onvrdisplaydeactivate','onvrdisplaydisconnect','onvrdisplayfocus','onvrdisplaypointerrestricted',
  'onvrdisplaypointerunrestricted','onvrdisplaypresentchange','orientation','outerHeight',
  'outerWidth','pageXOffset','pageYOffset','parent','personalbar','returnValue','screen',
  'screenLeft','screenTop','screenX','screenY','scrollbars','scrollMaxX','scrollMaxY',
  'scrollX','scrollY','self','status','statusbar','toolbar','top',
];

for (const prop of extraWindowProps) {
  if (!(prop in windowObj)) {
    if (prop.startsWith('on')) {
      windowObj[prop] = null; // event handlers default null
    } else {
      // 非标准或未知属性给默认值
      windowObj[prop] = null;
    }
  }
}

// 一些属性需要特殊处理
windowObj.innerWidth = 1920;
windowObj.innerHeight = 799;
windowObj.outerWidth = 1920;
windowObj.outerHeight = 1080;
windowObj.screenX = 0;
windowObj.screenY = 0;
windowObj.screenLeft = 0;
windowObj.screenTop = 0;
windowObj.scrollX = 0;
windowObj.scrollY = 0;
windowObj.pageXOffset = 0;
windowObj.pageYOffset = 0;
windowObj.devicePixelRatio = 2;
windowObj.name = '';
windowObj.closed = false;
windowObj.opener = null;
windowObj.length = 0; // frames length
windowObj.frames = windowObj;
windowObj.self = windowObj;
windowObj.top = windowObj;
windowObj.parent = windowObj;

// ============================================================
// 4. 注入到全局作用域
// ============================================================

// 设置循环引用
windowObj.window = windowObj;
windowObj.self = windowObj;
windowObj.top = windowObj;
windowObj.parent = windowObj;
windowObj.frames = windowObj;
windowObj.globalThis = windowObj;
documentObj.defaultView = windowObj;
documentObj.parentWindow = windowObj;

// 安装到 globalThis (Node.js 用)
// 注意：Node 的 globalThis 是 global，我们替换掉它的某些属性
for (const key of Object.getOwnPropertyNames(windowObj)) {
  try {
    global[key] = windowObj[key];
  } catch(e) {
    // 有些属性可能只读
  }
}
// 额外确保 window 和 self 指向我们构建的对象
global.window = windowObj;
global.self = windowObj;
global.globalThis = windowObj;
global.top = windowObj;
global.parent = windowObj;
global.frames = windowObj;
global.document = documentObj;
global.navigator = navigatorObj;
global.location = locationObj;
global.screen = screenObj;
global.performance = perfObj;
global.crypto = cryptoObj;

// 确保 document.cookie 可用
Object.defineProperty(documentObj, 'cookie', {
  get: () => '',
  set: (val) => {},
  configurable: true,
});

console.log('[loader] 环境就绪');
console.log('[loader] window:', typeof window);
console.log('[loader] document:', typeof document);
console.log('[loader] navigator.userAgent:', navigator.userAgent);
console.log('[loader] location.href:', location.href);

// ============================================================
// 5. 加载 bundler-runtime（webpack 运行时）
// ============================================================
console.log('[loader] 加载 bundler-runtime...');
const bundlerRuntimePath = path.join(__dirname, '..', 'scripts', 'bundler-runtime.js');
const bundlerCode = fs.readFileSync(bundlerRuntimePath, 'utf8');
// 在全局作用域执行
const bundlerFn = new Function(bundlerCode);
bundlerFn();
console.log('[loader] bundler-runtime 加载完成');
console.log('[loader] __webpack_require__:', typeof __webpack_require__);

// ============================================================
// 6. 加载 vendor-dynamic（webpack chunk，含 mnsv2 模块）
// ============================================================
console.log('[loader] 加载 vendor-dynamic...');
const vendorPath = path.join(__dirname, '..', 'scripts', 'vendor-dynamic.js');
const vendorCode = fs.readFileSync(vendorPath, 'utf8');

try {
  const vendorFn = new Function(vendorCode);
  vendorFn();
  console.log('[loader] vendor-dynamic 加载完成');
} catch(e) {
  console.error('[loader] vendor-dynamic 加载出错:', e.message);
  console.error(e.stack?.slice(0, 500));
}

// ============================================================
// 7. 测试 mnsv2
// ============================================================
console.log('[loader] window.mnsv2:', typeof window.mnsv2);
if (typeof window.mnsv2 === 'function') {
  try {
    const C = '/api/redcaptcha/v2/getconfig{}';
    const U = '701d7db129f79737abc1c57cc97e69da';
    const P = '040a1d360bddd5d9c6fe7097ff1437e0';
    const sign = window.mnsv2(C, U, P);
    console.log('[loader] 签名结果:', sign);
  } catch(e) {
    console.error('[loader] 签名出错:', e.message);
    console.error(e.stack?.slice(0, 1000));
  }
} else {
  // 看看有哪些 webpack 模块已注册
  console.log('[loader] mnsv2 未就绪，检查 webpack 模块...');
  if (typeof __webpack_modules__ !== 'undefined') {
    console.log('[loader] webpack modules:', Object.keys(__webpack_modules__).length);
  }
  if (typeof __webpack_require__ !== 'undefined') {
    console.log('[loader] __webpack_require__.m keys:', Object.keys(__webpack_require__.m).slice(0, 20));
  }
}

module.exports = { window };
