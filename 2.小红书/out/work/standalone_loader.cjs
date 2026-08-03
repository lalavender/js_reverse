/**
 * 极简 mnsv2 加载器
 * 用 env.js 的环境快照重建浏览器环境，eval signv2_code.js 创建 window.mnsv2，然后签名
 */
const fs = require('fs');

// 1. 加载环境快照
const env = require('../env.js');

// 2. 构建 fake 浏览器环境
const navigator = {};
const navData = env.browser?.navigator || {};
for (const [k, v] of Object.entries(navData)) {
  Object.defineProperty(navigator, k, { get: () => v, configurable: true, enumerable: true });
}
navigator.connection = { effectiveType: '4g', rtt: 50, downlink: 10 };
navigator.plugins = { length: 5, item: () => null, namedItem: () => null };
navigator.mimeTypes = { length: 0, item: () => null, namedItem: () => null };
navigator.mediaDevices = { enumerateDevices: () => Promise.resolve([]) };
navigator.permissions = { query: () => Promise.resolve({ state: 'granted' }) };
navigator.storage = { estimate: () => Promise.resolve({ quota: 0, usage: 0 }) };

const screen = {};
const scrData = env.browser?.screen || {};
for (const [k, v] of Object.entries(scrData)) {
  screen[k] = v;
}

const location = {};
const locData = env.browser?.location || {};
for (const [k, v] of Object.entries(locData)) {
  if (typeof v === 'string') location[k] = v;
}
location.reload = () => {};
location.replace = () => {};
location.assign = () => {};
location.toString = () => location.href || '';

const docData = env.browser?.document || {};
const document = {
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
  getElementsByClassName: () => [],
  querySelector: () => null,
  querySelectorAll: () => ({ length: 0, forEach: () => {} }),
  createElement: (tag) => ({
    tagName: tag.toUpperCase(), nodeType: 1, style: {},
    src: '', id: '', className: '', innerHTML: '', innerText: '',
    href: '', rel: '', type: '', charset: '', async: false, defer: false,
    getAttribute: () => null,
    setAttribute: () => {},
    removeAttribute: () => {},
    appendChild: (c) => c,
    removeChild: (c) => c,
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => true,
    parentNode: null,
    getBoundingClientRect: () => ({top:0,left:0,bottom:0,right:0,width:0,height:0}),
    childNodes: [],
  }),
  createTextNode: (t) => ({ nodeType: 3, textContent: t, data: t }),
  createComment: (t) => ({ nodeType: 8, textContent: t }),
  createDocumentFragment: () => ({ nodeType: 11, appendChild: (c) => c }),
  createEvent: () => ({ preventDefault: () => {} }),
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => true,
  hasFocus: () => true,
  close: () => {},
  open: () => {},
  write: () => {},
  writeln: () => {},
  execCommand: () => false,
  elementFromPoint: () => document.body,
  defaultView: null,
  toString: () => '[object HTMLDocument]',
};

const performance = {
  timing: { navigationStart: Date.now() - 5000, fetchStart: Date.now() - 5000 },
  navigation: { type: 0, redirectCount: 0 },
  memory: { usedJSHeapSize: 50000000 },
  getEntries: () => [],
  getEntriesByType: () => [],
  mark: () => {},
  measure: () => {},
  now: () => Date.now() - 5000,
  timeOrigin: Date.now() - 5000,
  setupPolyfill: () => {},
  setNavigationStart: () => {},
  clearResourceTimings: () => {},
};

const crypto = {
  getRandomValues: (arr) => { for(let i=0;i<arr.length;i++)arr[i]=Math.floor(Math.random()*256); return arr; },
  randomUUID: () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => (Math.random()*16|0).toString(16)),
  subtle: { digest: () => Promise.resolve(new ArrayBuffer(32)) },
};

const localStorage = {
  _data: {},
  getItem: (k) => localStorage._data[k] ?? null,
  setItem: (k, v) => { localStorage._data[k] = String(v); },
  removeItem: (k) => delete localStorage._data[k],
  clear: () => { localStorage._data = {}; },
  get length() { return Object.keys(localStorage._data).length; },
  key: (i) => Object.keys(localStorage._data)[i] ?? null,
};

const sessionStorage = { _data: {}, getItem: () => null, setItem: () => {}, removeItem: () => {}, clear: () => {}, get length() { return 0; }, key: () => null };

const window = {
  window: null, self: null, globalThis: null, top: null, parent: null, frames: null,
  document, navigator, screen, location, performance, crypto, localStorage, sessionStorage,
  undefined: void 0, NaN, Infinity,
  Object, Array, Function, String, Number, Boolean, Symbol, BigInt, Map, Set,
  WeakMap, WeakSet, Promise, Proxy, Reflect, RegExp, Date, Math, JSON,
  parseInt, parseFloat, isNaN, isFinite,
  encodeURI, encodeURIComponent, decodeURI, decodeURIComponent, escape, unescape,
  ArrayBuffer, Int8Array, Uint8Array, Uint8ClampedArray, Int16Array, Uint16Array,
  Int32Array, Uint32Array, Float32Array, Float64Array, BigInt64Array, BigUint64Array,
  DataView, SharedArrayBuffer,
  Event: class Event { constructor(type, opts) { this.type = type; } preventDefault() {} stopPropagation() {} },
  CustomEvent: class CustomEvent extends Event { constructor(type, opts) { super(type, opts); this.detail = opts?.detail; } },
  AbortController: class AbortController { constructor() { this.signal = { aborted: false }; } abort() { this.signal.aborted = true; } },
  MutationObserver: class MutationObserver { constructor() {} observe() {} disconnect() {} takeRecords() { return []; } },
  HTMLElement: class HTMLElement {},
  Worker: class Worker { constructor() { this.onmessage = null; } postMessage() {} terminate() {} addEventListener() {} removeEventListener() {} },
  Image: class Image { constructor() { this.src = ''; this.onload = null; this.onerror = null; this.width = 0; this.height = 0; } },
  XMLHttpRequest: class XMLHttpRequest {
    constructor() { this.readyState = 0; this.status = 0; this.responseText = ''; this.onreadystatechange = null; this.onload = null; this.onerror = null; }
    open() { this.readyState = 1; }
    setRequestHeader() {}
    send() { this.readyState = 4; this.status = 200; this.responseText = '{}'; if (this.onload) this.onload(); if (this.onreadystatechange) this.onreadystatechange(); }
    abort() {}
    getAllResponseHeaders() { return ''; }
    getResponseHeader() { return null; }
    addEventListener() {} removeEventListener() {}
  },
  FormData: class FormData { constructor() { this._data = {}; } append(k,v) { this._data[k]=v; } get(k) { return this._data[k]; } },
  Blob: class Blob { constructor(parts) { this._parts = parts || []; this.size = 0; this.type = ''; } },
  FileReader: class FileReader { constructor() { this.onload = null; } readAsArrayBuffer() {} readAsText() {} },
  URL: class URL2 { constructor(url) { return new URL(url); } static createObjectURL() { return ''; } static revokeObjectURL() {} },
  history: { length: 1, state: null, pushState: () => {}, replaceState: () => {}, go: () => {}, back: () => {}, forward: () => {} },
  alert: () => {}, confirm: () => false, prompt: () => null,
  setTimeout: (fn, ms, ...args) => setTimeout(fn, ms, ...args),
  clearTimeout: (id) => clearTimeout(id),
  setInterval: (fn, ms, ...args) => setInterval(fn, ms, ...args),
  clearInterval: (id) => clearInterval(id),
  requestAnimationFrame: (fn) => setTimeout(fn, 16),
  cancelAnimationFrame: (id) => clearTimeout(id),
  requestIdleCallback: (fn) => setTimeout(() => fn({ didTimeout: false, timeRemaining: () => 0 }), 1),
  cancelIdleCallback: (id) => clearTimeout(id),
  queueMicrotask: (fn) => Promise.resolve().then(fn),
  btoa: (str) => Buffer.from(str, 'binary').toString('base64'),
  atob: (str) => Buffer.from(str, 'base64').toString('binary'),
  fetch: async () => new (require('node-fetch')?.Response || Object)(null, { status: 200 }),
  name: '', closed: false, opener: null, length: 0,
  innerWidth: 1920, innerHeight: 799, outerWidth: 1920, outerHeight: 1080,
  screenX: 0, screenY: 0, screenLeft: 0, screenTop: 0,
  scrollX: 0, scrollY: 0, pageXOffset: 0, pageYOffset: 0,
  devicePixelRatio: 2,
  scrollMaxX: 0, scrollMaxY: 0, fullScreen: false,
  InstallTrigger: void 0,
  webpackChunkxhs_pc_web: [],
  // mnsv2_env[0] lists all these properties
  close: () => {}, stop: () => {}, focus: () => {}, blur: () => {},
  open: () => null, print: () => {}, getSelection: () => null,
  getComputedStyle: () => ({}), matchMedia: () => ({}),
  moveTo: () => {}, moveBy: () => {}, resizeTo: () => {}, resizeBy: () => {},
  scroll: () => {}, scrollTo: () => {}, scrollBy: () => {},
  getDefaultComputedStyle: () => ({}), scrollByLines: () => {}, scrollByPages: () => {},
  updateCommands: () => {}, find: () => false, dump: () => {},
  setResizable: () => {},
  postMessage: () => {}, captureEvents: () => {}, releaseEvents: () => {},
  reportError: () => {},
  originAgentCluster: null,
};

// 设置循环引用
window.window = window;
window.self = window;
window.top = window;
window.parent = window;
window.frames = window;
window.globalThis = window;
document.defaultView = window;

// 加到 global
for (const key of Object.getOwnPropertyNames(window)) {
  try { global[key] = window[key]; } catch(e) {}
}
global.window = window;
global.self = window;
global.globalThis = window;
global.document = document;
global.navigator = navigator;
global.location = location;

console.log('[loader] 环境就绪, window.mnsv2:', typeof window.mnsv2);

// 3. 加载 signv2_code.js - 这会在 window 上创建 mnsv2
console.log('[loader] 加载 signv2_code.js...');
const code = fs.readFileSync('work/signv2_code.js', 'utf8');
console.log('[loader] code length:', code.length);

try {
  const fn = new Function(code);
  fn();
  console.log('[loader] eval 完成');
} catch(e) {
  console.error('[loader] eval 出错:', e.message);
  console.error(e.stack?.slice(0, 1000));
}

console.log('[loader] 加载后 window.mnsv2:', typeof window.mnsv2);

// 4. 签名测试
if (typeof window.mnsv2 === 'function') {
  try {
    const C = '/api/redcaptcha/v2/getconfig{}';
    const U = '701d7db129f79737abc1c57cc97e69da';
    const P = '040a1d360bddd5d9c6fe7097ff1437e0';
    const sign = window.mnsv2(C, U, P);
    console.log('[loader] ✅ 签名结果:', sign);
  } catch(e) {
    console.error('[loader] ❌ 签名出错:', e.message);
    console.error(e.stack?.slice(0, 1500));
  }
} else {
  console.log('[loader] mnsv2 未创建');
}
