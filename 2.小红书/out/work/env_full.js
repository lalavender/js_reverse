/**
 * env_full.js — 基于 env.js 快照构建的完整浏览器环境模拟
 * 
 * 思路：从 env_snapshot_raw.json 中提取 mnsv2 初始化需要的
 * 全部 window 属性列表(346个)，创建 mock 环境
 */
const fs = require('fs');
const path = require('path');

// ===== 1. 加载快照数据 =====
const envSnapshot = JSON.parse(fs.readFileSync(path.join(__dirname, 'env_snapshot_raw.json'), 'utf8'));
const browserData = JSON.parse(fs.readFileSync(path.join(__dirname, 'env1_and_browser.json'), 'utf8'));

// ===== 2. 基础环境 =====
globalThis.window = globalThis;
globalThis.self = globalThis;
globalThis.top = globalThis;
globalThis.parent = globalThis;
globalThis.globalThis = globalThis;

// ===== 3. 安装 JS 内置 =====
globalThis.encodeURIComponent = globalThis.encodeURIComponent || encodeURIComponent;
globalThis.TextEncoder = globalThis.TextEncoder || TextEncoder;
globalThis.Uint8Array = Uint8Array;
globalThis.Array = Array;
globalThis.Date = Date;
globalThis.Math = Math;
globalThis.RegExp = RegExp;
globalThis.parseInt = parseInt;
globalThis.parseFloat = parseFloat;
globalThis.Object = Object;
globalThis.Function = Function;
globalThis.String = String;
globalThis.Error = Error;
globalThis.Set = Set;
globalThis.Map = Map;
globalThis.Reflect = Reflect;
globalThis.Symbol = Symbol;
globalThis.Promise = Promise;
globalThis.Boolean = Boolean;
globalThis.Number = Number;
globalThis.JSON = JSON;
globalThis.isNaN = isNaN;
globalThis.isFinite = isFinite;
globalThis.unescape = unescape;
globalThis.escape = escape;
globalThis.decodeURI = decodeURI;
globalThis.decodeURIComponent = decodeURIComponent;
globalThis.encodeURI = encodeURI;
globalThis.encodeURIComponent = encodeURIComponent;
globalThis.clearTimeout = clearTimeout;
globalThis.clearInterval = clearInterval;
globalThis.queueMicrotask = queueMicrotask;

// setTimeout/setInterval need binding
globalThis.setTimeout = setTimeout;
globalThis.setInterval = setInterval;

// ===== 4. navigator =====
const nav = browserData.navigator || {};
globalThis.navigator = {};
const navProps = [
  'userAgent', 'platform', 'language', 'cookieEnabled', 'doNotTrack',
  'hardwareConcurrency', 'maxTouchPoints', 'vendor', 'vendorSub',
  'product', 'productSub', 'appCodeName', 'appName', 'appVersion',
  'buildID', 'oscpu', 'webdriver', 'pdfViewerEnabled', 'globalPrivacyControl',
  'onLine', 'mimeTypesCount', 'pluginsCount'
];
for (const k of navProps) {
  Object.defineProperty(globalThis.navigator, k, {
    get: () => nav[k] !== undefined ? nav[k] : (k === 'webdriver' ? false : undefined),
    configurable: true
  });
}
// Special: mimeTypes and plugins with length
Object.defineProperty(globalThis.navigator, 'mimeTypes', {
  get: () => ({ length: nav.mimeTypesCount || 0, item: () => null }),
  configurable: true
});
Object.defineProperty(globalThis.navigator, 'plugins', {
  get: () => ({ length: nav.pluginsCount || 0, item: () => null, namedItem: () => null }),
  configurable: true
});
Object.defineProperty(globalThis.navigator, 'connection', {
  get: () => ({ effectiveType: '4g', downlink: 10, rtt: 50 }),
  configurable: true
});
Object.defineProperty(globalThis.navigator, 'languages', {
  get: () => nav.languages || ['zh-CN', 'en-US', 'en'],
  configurable: true
});
Object.defineProperty(globalThis.navigator, 'mediaCapabilities', {
  get: () => ({ decoding: () => Promise.resolve({supported:true}) }),
  configurable: true
});
Object.defineProperty(globalThis.navigator, 'storage', {
  get: () => ({ estimate: () => Promise.resolve({quota: 1000000000, usage: 50000000}) }),
  configurable: true
});
Object.defineProperty(globalThis.navigator, 'deviceMemory', {
  get: () => 8, configurable: true
});

// ===== 5. location =====
const loc = browserData.location || {};
globalThis.location = {
  href: loc.href || 'https://www.xiaohongshu.com/explore',
  host: loc.host || 'www.xiaohongshu.com',
  hostname: loc.hostname || 'www.xiaohongshu.com',
  origin: loc.origin || 'https://www.xiaohongshu.com',
  protocol: loc.protocol || 'https:',
  pathname: loc.pathname || '/explore',
  search: loc.search || '',
  hash: loc.hash || '',
  reload: () => {},
  replace: (u) => {},
  assign: (u) => {},
  toString: function() { return this.href; },
  ancestorOrigins: { length: 0 }
};

// ===== 6. screen =====
const scr = browserData.screen || {};
globalThis.screen = {
  width: scr.width || 1920,
  height: scr.height || 1080,
  availWidth: scr.availWidth || 1920,
  availHeight: scr.availHeight || 1004,
  colorDepth: scr.colorDepth || 30,
  pixelDepth: scr.pixelDepth || 30,
  top: scr.top || 0,
  left: scr.left || 0,
  availTop: scr.availTop || 0,
  availLeft: scr.availLeft || 0,
  mozOrientation: scr.orientation || 'landscape-primary',
  onmozorientationchange: null,
  orientation: { type: 'landscape-primary', angle: 0 }
};

// ===== 7. document =====
const doc = browserData.document || {};
globalThis.document = {
  URL: doc.URL || 'https://www.xiaohongshu.com/explore',
  documentURI: doc.documentURI || doc.URL || 'https://www.xiaohongshu.com/explore',
  baseURI: doc.baseURI || doc.URL || 'https://www.xiaohongshu.com/explore',
  referrer: doc.referrer || '',
  title: doc.title || '',
  charset: doc.charset || 'UTF-8',
  contentType: doc.contentType || 'text/html',
  designMode: doc.designMode || 'off',
  dir: doc.dir || '',
  hidden: doc.hidden !== undefined ? doc.hidden : false,
  visibilityState: doc.visibilityState || 'visible',
  readyState: doc.readyState || 'complete',
  domain: doc.domain || 'www.xiaohongshu.com',
  lastModified: doc.lastModified || new Date().toLocaleString(),
  cookie: '',
  cookieEnabled: doc.cookieEnabled !== undefined ? doc.cookieEnabled : true,
  compatMode: 'CSS1Compat',
  characterSet: 'UTF-8',
  inputEncoding: 'UTF-8',
  documentElement: {
    tagName: 'HTML', nodeType: 1, nodeName: 'HTML',
    style: {}, getAttribute: () => null, setAttribute: () => {},
    clientWidth: scr.width || 1920, clientHeight: scr.height || 1080
  },
  head: { tagName: 'HEAD', nodeType: 1, nodeName: 'HEAD' },
  body: { tagName: 'BODY', nodeType: 1, nodeName: 'BODY', style: {} },
  getElementById: () => null,
  getElementsByTagName: () => [],
  getElementsByClassName: () => [],
  getElementsByName: () => [],
  querySelector: () => null,
  querySelectorAll: () => ({ length: 0, item: () => null }),
  createElement: (tag) => ({
    tagName: (tag || '').toUpperCase(), nodeType: 1,
    style: {}, children: [], childNodes: [],
    getAttribute: () => null, setAttribute: () => {},
    appendChild: (c) => c, removeChild: () => {},
    insertBefore: (c, r) => c, addEventListener: () => {},
    removeEventListener: () => {}, parentNode: null,
    parentElement: null, cloneNode: () => ({}),
    classList: { add: () => {}, remove: () => {}, contains: () => false },
    textContent: '', innerHTML: '', innerText: ''
  }),
  createTextNode: (t) => ({ nodeType: 3, textContent: t, nodeValue: t }),
  createDocumentFragment: () => ({ nodeType: 11, children: [], appendChild: (c) => c }),
  createComment: (t) => ({ nodeType: 8, textContent: t }),
  createAttribute: (n) => ({ name: n, value: '' }),
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => true,
  hasFocus: () => true,
  defaultView: globalThis,
  createEvent: () => ({ initEvent: () => {} }),
  write: () => {},
  writeln: () => {},
  open: () => {},
  close: () => {},
  adoptNode: (n) => n,
  importNode: (n) => n,
  normalizeDocument: () => {},
  normalize: () => {},
  getElementsByTagNameNS: () => [],
  evaluate: () => ({ result: null, snapshotLength: 0 }),
  exitFullscreen: () => Promise.resolve(),
  fullscreenElement: null,
  fullscreenEnabled: false,
  hidden: false,
  visibilityState: 'visible',
  wasDiscarded: false,
};
// Make document.cookie a proper getter/setter
Object.defineProperty(globalThis.document, 'cookie', {
  get: () => '',
  set: (v) => {},
  configurable: true
});

// ===== 8. performance =====
const perfNow = browserData.perf_now || 78094;
const perfTiming = browserData.perf_timing || {};
globalThis.performance = {
  now: () => typeof performance !== 'undefined' ? performance.now() : Date.now() - 5000,
  timeOrigin: Date.now() - 5000,
  timing: {
    navigationStart: Date.now() - 5000,
    fetchStart: Date.now() - 5000,
    domainLookupStart: Date.now() - 4900,
    domainLookupEnd: Date.now() - 4850,
    connectStart: Date.now() - 4800,
    connectEnd: Date.now() - 4700,
    requestStart: Date.now() - 4600,
    responseStart: Date.now() - 4400,
    responseEnd: Date.now() - 4300,
    domLoading: Date.now() - 4200,
    domInteractive: Date.now() - 3000,
    domContentLoadedEventStart: Date.now() - 2500,
    domContentLoadedEventEnd: Date.now() - 2400,
    domComplete: Date.now() - 1000,
    loadEventStart: Date.now() - 800,
    loadEventEnd: Date.now() - 500,
    unloadEventStart: 0,
    unloadEventEnd: 0,
    redirectStart: 0,
    redirectEnd: 0,
    secureConnectionStart: Date.now() - 4750,
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
  clearResourceTimings: () => {},
  setResourceTimingBufferSize: () => {},
  toJSON: () => ({}),
  setupPolyfill: () => {},
  setNavigationStart: () => {},
};

// ===== 9. crypto =====
globalThis.crypto = {
  getRandomValues: (arr) => {
    if (!arr || !arr.length) return arr;
    for (let i = 0; i < arr.length; i++) arr[i] = Math.floor(Math.random() * 256);
    return arr;
  },
  randomUUID: () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,
    c => (Math.random() * 16 | 0).toString(16)),
  subtle: {
    digest: (algo, data) => {
      try {
        const crypto = require('crypto');
        const hash = crypto.createHash(algo === 'SHA-256' ? 'sha256' : 'sha1');
        hash.update(Buffer.from(data));
        return Promise.resolve(hash.digest().buffer);
      } catch(e) { return Promise.reject(e); }
    },
    encrypt: () => Promise.reject(new Error('not implemented')),
    decrypt: () => Promise.reject(new Error('not implemented')),
    generateKey: () => Promise.reject(new Error('not implemented')),
    importKey: () => Promise.reject(new Error('not implemented')),
    exportKey: () => Promise.reject(new Error('not implemented')),
    sign: () => Promise.reject(new Error('not implemented')),
    verify: () => Promise.reject(new Error('not implemented')),
  }
};

// ===== 10. Event =====
globalThis.Event = class Event2 {
  constructor(type, opts) {
    this.type = type || '';
    this.bubbles = opts && opts.bubbles;
    this.cancelable = opts && opts.cancelable;
    this.composed = opts && opts.composed;
    this.defaultPrevented = false;
    this.target = null;
    this.currentTarget = null;
    this.eventPhase = 0;
    this.timeStamp = Date.now();
  }
  preventDefault() { this.defaultPrevented = true; }
  stopPropagation() {}
  stopImmediatePropagation() {}
};
globalThis.CustomEvent = class CustomEvent2 extends globalThis.Event {
  constructor(type, opts) {
    super(type, opts);
    this.detail = (opts && opts.detail) || null;
  }
};
globalThis.MouseEvent = class MouseEvent2 extends globalThis.Event {
  constructor(type, opts) {
    super(type, opts);
    this.clientX = (opts && opts.clientX) || 0;
    this.clientY = (opts && opts.clientY) || 0;
    this.screenX = (opts && opts.screenX) || 0;
    this.screenY = (opts && opts.screenY) || 0;
    this.button = (opts && opts.button) || 0;
    this.buttons = (opts && opts.buttons) || 0;
  }
};
globalThis.KeyboardEvent = class KeyboardEvent2 extends globalThis.Event {
  constructor(type, opts) {
    super(type, opts);
    this.key = (opts && opts.key) || '';
    this.code = (opts && opts.code) || '';
    this.ctrlKey = (opts && opts.ctrlKey) || false;
    this.shiftKey = (opts && opts.shiftKey) || false;
    this.altKey = (opts && opts.altKey) || false;
    this.metaKey = (opts && opts.metaKey) || false;
  }
};
globalThis.PointerEvent = class PointerEvent2 extends globalThis.MouseEvent {
  constructor(type, opts) {
    super(type, opts);
    this.pointerId = (opts && opts.pointerId) || 1;
    this.pointerType = (opts && opts.pointerType) || 'mouse';
  }
};
globalThis.WheelEvent = class WheelEvent2 extends globalThis.MouseEvent {
  constructor(type, opts) {
    super(type, opts);
    this.deltaX = (opts && opts.deltaX) || 0;
    this.deltaY = (opts && opts.deltaY) || 0;
    this.deltaZ = (opts && opts.deltaZ) || 0;
    this.deltaMode = (opts && opts.deltaMode) || 0;
  }
};
globalThis.TouchEvent = class TouchEvent2 extends globalThis.Event {
  constructor(type, opts) {
    super(type, opts);
    this.touches = (opts && opts.touches) || [];
    this.targetTouches = (opts && opts.targetTouches) || [];
    this.changedTouches = (opts && opts.changedTouches) || [];
  }
};
globalThis.FocusEvent = class FocusEvent2 extends globalThis.Event {
  constructor(type, opts) {
    super(type, opts);
    this.relatedTarget = (opts && opts.relatedTarget) || null;
  }
};
globalThis.UIEvent = class UIEvent2 extends globalThis.Event {
  constructor(type, opts) { super(type, opts); }
};
globalThis.InputEvent = class InputEvent2 extends globalThis.Event {
  constructor(type, opts) {
    super(type, opts);
    this.data = (opts && opts.data) || '';
    this.inputType = (opts && opts.inputType) || '';
  }
};
globalThis.DragEvent = class DragEvent2 extends globalThis.MouseEvent {
  constructor(type, opts) {
    super(type, opts);
    this.dataTransfer = (opts && opts.dataTransfer) || null;
  }
};
globalThis.ClipboardEvent = class ClipboardEvent2 extends globalThis.Event {
  constructor(type, opts) {
    super(type, opts);
    this.clipboardData = (opts && opts.clipboardData) || null;
  }
};
globalThis.CompositionEvent = class CompositionEvent2 extends globalThis.Event {
  constructor(type, opts) {
    super(type, opts);
    this.data = (opts && opts.data) || '';
  }
};
globalThis.StorageEvent = class StorageEvent2 extends globalThis.Event {
  constructor(type, opts) {
    super(type, opts);
    this.key = (opts && opts.key) || null;
    this.oldValue = (opts && opts.oldValue) || null;
    this.newValue = (opts && opts.newValue) || null;
    this.url = (opts && opts.url) || '';
  }
};
globalThis.AnimationEvent = class AnimationEvent2 extends globalThis.Event {
  constructor(type, opts) { super(type, opts); }
};
globalThis.TransitionEvent = class TransitionEvent2 extends globalThis.Event {
  constructor(type, opts) { super(type, opts); }
};
globalThis.SubmitEvent = class SubmitEvent2 extends globalThis.Event {
  constructor(type, opts) { super(type, opts); }
};
globalThis.ToggleEvent = class ToggleEvent2 extends globalThis.Event {
  constructor(type, opts) { super(type, opts); }
};
globalThis.ErrorEvent = class ErrorEvent2 extends globalThis.Event {
  constructor(type, opts) {
    super(type, opts);
    this.message = (opts && opts.message) || '';
    this.filename = (opts && opts.filename) || '';
    this.lineno = (opts && opts.lineno) || 0;
    this.colno = (opts && opts.colno) || 0;
    this.error = (opts && opts.error) || null;
  }
};
globalThis.PromiseRejectionEvent = class PromiseRejectionEvent2 extends globalThis.Event {
  constructor(type, opts) {
    super(type, opts);
    this.promise = (opts && opts.promise) || null;
    this.reason = (opts && opts.reason) || null;
  }
};
globalThis.MessageEvent = class MessageEvent2 extends globalThis.Event {
  constructor(type, opts) {
    super(type, opts);
    this.data = (opts && opts.data) || null;
    this.origin = (opts && opts.origin) || '';
    this.source = (opts && opts.source) || null;
  }
};
globalThis.CloseEvent = class CloseEvent2 extends globalThis.Event {
  constructor(type, opts) {
    super(type, opts);
    this.code = (opts && opts.code) || 1000;
    this.reason = (opts && opts.reason) || '';
    this.wasClean = (opts && opts.wasClean) !== undefined ? opts.wasClean : true;
  }
};
globalThis.PageTransitionEvent = class PageTransitionEvent2 extends globalThis.Event {
  constructor(type, opts) {
    super(type, opts);
    this.persisted = (opts && opts.persisted) || false;
  }
};
globalThis.HashChangeEvent = class HashChangeEvent2 extends globalThis.Event {
  constructor(type, opts) {
    super(type, opts);
    this.oldURL = (opts && opts.oldURL) || '';
    this.newURL = (opts && opts.newURL) || '';
  }
};
globalThis.PopStateEvent = class PopStateEvent2 extends globalThis.Event {
  constructor(type, opts) {
    super(type, opts);
    this.state = (opts && opts.state) || null;
  }
};
globalThis.BeforeUnloadEvent = class BeforeUnloadEvent2 extends globalThis.Event {
  constructor(type, opts) { super(type, opts); }
};
globalThis.SecurityPolicyViolationEvent = class SecurityPolicyViolationEvent2 extends globalThis.Event {
  constructor(type, opts) { super(type, opts); }
};
globalThis.RTCDataChannelEvent = class RTCDataChannelEvent2 extends globalThis.Event {
  constructor(type, opts) { super(type, opts); }
};

// ===== 11. window 属性（来自 env_snapshot） =====
const extraWindowProps = envSnapshot.data || {};

// Build from known types in the snapshot
function createMockWindowProp(name, typeInfo) {
  if (typeInfo === 'null' || typeInfo === null) return null;
  if (typeInfo === 'undefined') return undefined;
  if (typeof typeInfo === 'string') {
    if (typeInfo.startsWith('function:')) {
      // Create stub functions
      const match = typeInfo.match(/function:(\w+)\((\d+)\)/);
      if (match) {
        const fnName = match[1];
        const argCount = parseInt(match[2]);
        if (fnName === 'eval') return eval;
        if (fnName === 'close') return () => {};
        if (fnName === 'handleError') return (a,b,c,d,e) => {};
        // Generic stub
        const fn = function() {};
        Object.defineProperty(fn, 'name', { value: fnName });
        return fn;
      }
      const match2 = typeInfo.match(/function:anon\((\d+)\)/);
      if (match2) {
        return function() {};
      }
      return function() {};
    }
    if (typeInfo.startsWith('Object{')) return {};
    if (typeInfo === 'false') return false;
    if (typeInfo === 'true') return true;
  }
  // Numeric
  if (typeof typeInfo === 'number') return typeInfo;
  if (typeof typeInfo === 'boolean') return typeInfo;
  return {};
}

// Build all window properties
for (const [key, val] of Object.entries(extraWindowProps)) {
  if (key === '0' || key === '1' || key === '…') continue;
  if (key === 'self' || key === 'frames' || key === 'parent') continue;
  if (key === 'eval') continue; // built-in
  
  // Don't override already-set core properties
  if (globalThis[key] !== undefined) continue;
  
  const mockVal = createMockWindowProp(key, val);
  try {
    globalThis[key] = mockVal;
  } catch(e) {
    // Some properties might be read-only
  }
}

// ===== 12. 额外所需 =====
globalThis.InstallTrigger = null;
globalThis.chrome = undefined;
globalThis.clientInformation = globalThis.navigator;
globalThis.external = {};

// Storage
globalThis.localStorage = {
  _data: {}, getItem: (k) => globalThis.localStorage._data[k] || null,
  setItem: (k, v) => { globalThis.localStorage._data[k] = String(v); },
  removeItem: (k) => { delete globalThis.localStorage._data[k]; },
  clear: () => { globalThis.localStorage._data = {}; },
  get length() { return Object.keys(globalThis.localStorage._data).length; },
  key: (i) => Object.keys(globalThis.localStorage._data)[i] || null,
};
globalThis.sessionStorage = {
  _data: {}, getItem: (k) => globalThis.sessionStorage._data[k] || null,
  setItem: (k, v) => { globalThis.sessionStorage._data[k] = String(v); },
  removeItem: (k) => { delete globalThis.sessionStorage._data[k]; },
  clear: () => { globalThis.sessionStorage._data = {}; },
  get length() { return Object.keys(globalThis.sessionStorage._data).length; },
  key: (i) => Object.keys(globalThis.sessionStorage._data)[i] || null,
};

// XHR
globalThis.XMLHttpRequest = class XHR {
  constructor() {
    this.readyState = 0; this.status = 0; this.statusText = '';
    this.responseText = ''; this.response = null; this.responseType = '';
    this.responseURL = ''; this.timeout = 0; this.withCredentials = false;
    this.onload = null; this.onerror = null; this.onreadystatechange = null;
    this.ontimeout = null; this.onabort = null;
    this._headers = {}; this._method = ''; this._url = '';
  }
  open(method, url) {
    this.readyState = 1; this._method = method; this._url = url;
  }
  setRequestHeader(k, v) { this._headers[k] = v; }
  send(body) {
    this.readyState = 4; this.status = 200; this.statusText = 'OK';
    this.responseText = '{}'; this.responseURL = this._url;
    if (this.onreadystatechange) this.onreadystatechange();
    if (this.onload) this.onload();
  }
  abort() { this.readyState = 0; if (this.onabort) this.onabort(); }
  addEventListener() {}
  removeEventListener() {}
  getAllResponseHeaders() { return ''; }
  getResponseHeader(k) { return null; }
  overrideMimeType() {}
};

// Fetch
globalThis.fetch = (url, opts) => Promise.resolve({
  ok: true, status: 200, statusText: 'OK',
  url: typeof url === 'string' ? url : url.url,
  headers: new Map(),
  json: () => Promise.resolve({}),
  text: () => Promise.resolve(''),
  arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
  blob: () => Promise.resolve({ size: 0, type: '' }),
  formData: () => Promise.resolve(new FormData()),
  redirected: false, type: 'basic',
});

// Other constructors
globalThis.Image = class Image2 {
  constructor(w, h) { this.width = w || 0; this.height = h || 0; this.src = ''; this.onload = null; this.onerror = null; }
};
globalThis.FormData = class FormData2 {
  constructor() { this._data = {}; }
  append(k, v, fn) { this._data[k] = v; }
  get(k) { return this._data[k]; }
  getAll(k) { return [this._data[k]]; }
  has(k) { return k in this._data; }
  delete(k) { delete this._data[k]; }
  set(k, v) { this._data[k] = v; }
  forEach(fn) { Object.entries(this._data).forEach(([k,v]) => fn(v,k)); }
  get length() { return Object.keys(this._data).length; }
};
globalThis.Blob = class Blob2 {
  constructor(parts, opts) {
    this.size = 0; this.type = (opts && opts.type) || '';
    if (parts) for (const p of parts) if (typeof p === 'string') this.size += p.length;
  }
  slice() { return new Blob2(); }
  text() { return Promise.resolve(''); }
  arrayBuffer() { return Promise.resolve(new ArrayBuffer(0)); }
  stream() { return null; }
};
globalThis.FileReader = class FR {
  constructor() { this.onload = null; this.onerror = null; this.result = null; }
  readAsArrayBuffer() { this.result = new ArrayBuffer(0); if (this.onload) this.onload(); }
  readAsText() { this.result = ''; if (this.onload) this.onload(); }
  readAsDataURL() { this.result = 'data:,'; if (this.onload) this.onload(); }
  abort() {}
};
globalThis.File = class File2 extends globalThis.Blob {
  constructor(parts, name, opts) { super(parts, opts); this.name = name || ''; this.lastModified = Date.now(); }
};
globalThis.AbortController = class AC {
  constructor() { this.signal = { aborted: false, onabort: null, addEventListener: () => {}, removeEventListener: () => {} }; }
  abort() { this.signal.aborted = true; if (this.signal.onabort) this.signal.onabort(); }
};
globalThis.MutationObserver = class MO {
  constructor(cb) { this._cb = cb; }
  observe() {} disconnect() {} takeRecords() { return []; }
};
globalThis.ResizeObserver = class RO {
  constructor(cb) { this._cb = cb; }
  observe() {} unobserve() {} disconnect() {}
};
globalThis.IntersectionObserver = class IO {
  constructor(cb, opts) { this._cb = cb; }
  observe() {} unobserve() {} disconnect() {} takeRecords() { return []; }
};
globalThis.PerformanceObserver = class PO {
  constructor(cb) { this._cb = cb; }
  observe() {} disconnect() {} takeRecords() { return []; }
};
globalThis.PerformanceObserverEntryList = class POEL {};
globalThis.Request = class Request2 {
  constructor(url, opts) { this.url = url; this.method = (opts && opts.method) || 'GET'; }
};
globalThis.Response = class Response2 {
  constructor(body, opts) { this._body = body; this.status = (opts && opts.status) || 200; this.ok = this.status >= 200 && this.status < 300; }
  json() { return Promise.resolve(typeof this._body === 'string' ? JSON.parse(this._body) : this._body); }
  text() { return Promise.resolve(String(this._body)); }
};
globalThis.Headers = class Headers2 {
  constructor(init) { this._map = new Map(); if (init) for (const [k,v] of Object.entries(init)) this._map.set(k.toLowerCase(), v); }
  get(k) { return this._map.get(k.toLowerCase()) || null; }
  set(k, v) { this._map.set(k.toLowerCase(), v); }
  has(k) { return this._map.has(k.toLowerCase()); }
  forEach(fn) { this._map.forEach((v,k) => fn(v,k,this)); }
};
globalThis.URL = URL;
globalThis.URLSearchParams = URLSearchParams;
globalThis.console = console;

// ===== 13. 导出 =====
module.exports = {
  envSnapshot,
  browserData,
  version: '1.0'
};

console.log('✅ 环境就绪');
console.log(`   window 属性数: ${Object.keys(globalThis).length}`);
console.log(`   有 navigator: ${typeof globalThis.navigator}`);
console.log(`   有 document: ${typeof globalThis.document}`);
console.log(`   有 location: ${typeof globalThis.location}`);
console.log(`   有 crypto: ${typeof globalThis.crypto}`);
console.log(`   有 performance: ${typeof globalThis.performance}`);
console.log(`   navigator.userAgent: ${globalThis.navigator.userAgent}`);
