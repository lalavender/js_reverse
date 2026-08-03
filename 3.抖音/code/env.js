/**
 * env.js - 环境补全文件
 * 为 bdms.js 提供 Node.js 环境中缺失的浏览器 API
 *
 */

// ============================================================
// 1. 基础浏览器全局对象
// ============================================================

// location (bdms.js 中访问 window.location / globalThis.location)
globalThis.location = {
  ancestorOrigins: [],
  href: 'https://www.douyin.com/',
  pathname: '/',
  hostname: 'www.douyin.com',
  search: '',
  hash: '',
  origin: 'https://www.douyin.com',
  protocol: 'https:',
  host: 'www.douyin.com',
  port: '',
  assign() {},
  reload() {},
  replace() {},
  toString() { return this.href; },
};

// XMLHttpRequest - 用于埋点上报
globalThis.XMLHttpRequest = class {
  constructor() {
    this._headers = {};
    this.readyState = 0;
    this.status = 0;
    this.statusText = '';
    this.responseText = '';
    this.response = null;
    this.onreadystatechange = null;
  }
  open(method, url, async) {
    this._method = method;
    this._url = url;
    this._async = async;
    this.readyState = 1;
  }
  setRequestHeader(key, value) {
    this._headers[key] = value;
  }
  send(body) {
    this.readyState = 4;
    this.status = 200;
    if (this.onreadystatechange) this.onreadystatechange();
  }
  abort() { this.readyState = 0; }
  getResponseHeader(key) { return null; }
  getAllResponseHeaders() { return ''; }
  addEventListener() {}
  removeEventListener() {}
  dispatchEvent() { return true; }
  overrideMimeType() {}
};

// document
globalThis.document = {
  cookie: '',
  title: '',
  URL: 'https://www.douyin.com/',
  documentURI: 'https://www.douyin.com/',
  origin: 'https://www.douyin.com',
  compatMode: 'CSS1Compat',
  characterSet: 'UTF-8',
  charset: 'UTF-8',
  contentType: 'text/html',
  designMode: 'off',
  dir: '',
  lastModified: '07/30/2026 22:00:00',
  hidden: false,
  visibilityState: 'visible',
  readyState: 'complete',
  referrer: '',
  domain: 'www.douyin.com',
  documentElement: {
    style: {},
    clientWidth: 1440,
    clientHeight: 900,
    getAttribute() { return null; },
    setAttribute() {},
  },
  head: {
    appendChild() {},
    removeChild() {},
    querySelector() { return null; },
    querySelectorAll() { return []; },
  },
  body: {
    appendChild() {},
    removeChild() {},
    querySelector() { return null; },
    querySelectorAll() { return []; },
    style: {},
  },
  documentMode: undefined,
  createElement(tag) {
    return {
      style: {},
      className: '',
      id: '',
      src: '',
      href: '',
      width: 0,
      height: 0,
      tagName: tag.toUpperCase(),
      nodeType: 1,
      nodeName: tag.toUpperCase(),
      textContent: '',
      innerHTML: '',
      outerHTML: '<' + tag + '></' + tag + '>',
      disabled: false,
      checked: false,
      value: '',
      name: '',
      type: '',
      setAttribute() {},
      getAttribute() { return null; },
      hasAttribute() { return false; },
      removeAttribute() {},
      appendChild() {},
      removeChild() {},
      insertBefore() {},
      replaceChild() {},
      cloneNode() { return this; },
      contains() { return false; },
      addEventListener() {},
      removeEventListener() {},
      dispatchEvent() { return true; },
      getElementsByTagName() { return []; },
      getElementsByClassName() { return []; },
      querySelector() { return null; },
      querySelectorAll() { return []; },
      closest() { return null; },
      matches() { return false; },
      getBoundingClientRect() { return { top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0, x: 0, y: 0 }; },
      getClientRects() { return []; },
      scrollIntoView() {},
      focus() {},
      blur() {},
      click() {},
      dispatchEvent() {},
    };
  },
  createElementNS(ns, tag) {
    return this.createElement(tag);
  },
  createTextNode(text) {
    return { nodeType: 3, nodeName: '#text', textContent: String(text), data: String(text) };
  },
  createComment(text) {
    return { nodeType: 8, nodeName: '#comment', textContent: String(text), data: String(text) };
  },
  createDocumentFragment() {
    return {
      nodeType: 11,
      appendChild() {},
      removeChild() {},
      querySelector() { return null; },
      querySelectorAll() { return []; },
      getElementById() { return null; },
    };
  },
  createAttribute(name) {
    return { name, value: '', specified: true };
  },
  addEventListener() {},
  removeEventListener() {},
  dispatchEvent() { return true; },
  getElementsByTagName() { return []; },
  getElementsByClassName() { return []; },
  getElementById() { return null; },
  querySelector() { return null; },
  querySelectorAll() { return []; },
  fonts: {
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent() { return true; },
    ready: Promise.resolve({}),
    status: 'loaded',
    check() { return true; },
    load() { return Promise.resolve([]); },
  },
  adoptedStyleSheets: [],
  pictureInPictureElement: null,
  pictureInPictureEnabled: false,
  fullscreen: false,
  fullscreenEnabled: false,
  wasDiscarded: false,
  currentScript: {
    getAttribute() { return null; },
    src: '',
  },
  scrollingElement: null,
  timeline: { get current() { return 0; } },
  hasFocus() { return true; },
  write() {},
  writeln() {},
  open() { return this; },
  close() {},
  contains() { return true; },
  adoptNode() { return {}; },
  importNode() { return {}; },
  normalizeDocument() {},
};

// navigator - 完整模拟
if (globalThis.navigator && typeof globalThis.navigator === 'object') {
  var _nav = globalThis.navigator;
  var _props = {
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    platform: 'MacIntel',
    language: 'zh-CN',
    languages: ['zh-CN', 'en'],
    appName: 'Netscape',
    appVersion: '5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    appCodeName: 'Mozilla',
    vendor: 'Google Inc.',
    vendorSub: '',
    product: 'Gecko',
    productSub: '20030107',
    cookieEnabled: true,
    onLine: true,
    hardwareConcurrency: 8,
    maxTouchPoints: 0,
    deviceMemory: 8,
    doNotTrack: null,
    webdriver: false,
    pdfViewerEnabled: false,
    mimeTypes: [],
    plugins: [],
  };
  var _funcs = {
    javaEnabled: function() { return false; },
    sendBeacon: function() { return false; },
  };
  // Node 的 navigator.userAgent/language 是原型上的只读 getter,
  // 直接赋值会被静默忽略 (VM 会读到 "Node.js/xx" 而被判定为机器人,
  // 导致 bdms 的 XHR 加签钩子不安装)。必须用 defineProperty 覆盖为自有属性。
  for (var _k in _props) {
    try {
      Object.defineProperty(_nav, _k, { value: _props[_k], writable: true, configurable: true });
    } catch(e) {
      try { _nav[_k] = _props[_k]; } catch(e2) {}
    }
  }
  for (var _k in _funcs) {
    try { _nav[_k] = _funcs[_k]; } catch(e) {}
  }
  // connection (实际浏览器中 ownKeys 为空, 但属性通过原型链访问)
  if (!_nav.connection) {
    try {
      var _conn = {};
      Object.defineProperty(_conn, 'effectiveType', { get: function() { return '4g'; }, configurable: true });
      Object.defineProperty(_conn, 'rtt', { get: function() { return 50; }, configurable: true });
      Object.defineProperty(_conn, 'downlink', { get: function() { return 10; }, configurable: true });
      Object.defineProperty(_conn, 'saveData', { get: function() { return false; }, configurable: true });
      Object.defineProperty(_conn, 'addEventListener', { value: function() {}, writable: true });
      Object.defineProperty(_conn, 'removeEventListener', { value: function() {}, writable: true });
      _nav.connection = _conn;
    } catch(e) {}
  }
}

// screen
globalThis.screen = {
  width: 1440,
  height: 900,
  availWidth: 1440,
  availHeight: 877,
  colorDepth: 24,
  pixelDepth: 24,
  top: 0,
  left: 0,
  availTop: 0,
  availLeft: 0,
  orientation: {
    type: 'landscape-primary',
    angle: 0,
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent() { return true; },
  },
  isExtended: false,
  onchange: null,
  addEventListener() {},
  removeEventListener() {},
  dispatchEvent() { return true; },
};

// window 层级对象
globalThis.self = globalThis;
globalThis.top = globalThis;
globalThis.parent = globalThis;
globalThis.frames = globalThis;
globalThis.window = globalThis;
globalThis.opener = null;

// window 尺寸与坐标
globalThis.innerWidth = 1440;
globalThis.innerHeight = 877;
globalThis.outerWidth = 1440;
globalThis.outerHeight = 900;
globalThis.screenX = 0;
globalThis.screenY = 0;
globalThis.screenLeft = 0;
globalThis.screenTop = 0;
globalThis.scrollX = 0;
globalThis.scrollY = 0;
globalThis.pageXOffset = 0;
globalThis.pageYOffset = 0;
globalThis.devicePixelRatio = 1;
globalThis.name = '';
globalThis.closed = false;
globalThis.status = '';
globalThis.addEventListener = function() {};
globalThis.removeEventListener = function() {};
globalThis.dispatchEvent = function() { return true; };
globalThis.postMessage = function() {};
globalThis.getComputedStyle = function() { return { getPropertyValue() { return ''; } }; };

// ============================================================
// 2. Storage
// ============================================================

// localStorage
globalThis.localStorage = {
  _data: {},
  getItem(key) { return this._data[key] !== undefined ? this._data[key] : null; },
  setItem(key, val) { this._data[key] = String(val); },
  removeItem(key) { delete this._data[key]; },
  clear() { this._data = {}; },
  get length() { return Object.keys(this._data).length; },
  key(i) { const keys = Object.keys(this._data); return keys[i] || null; },
};

// sessionStorage
globalThis.sessionStorage = {
  _data: {},
  getItem(key) { return this._data[key] !== undefined ? this._data[key] : null; },
  setItem(key, val) { this._data[key] = String(val); },
  removeItem(key) { delete this._data[key]; },
  clear() { this._data = {}; },
  get length() { return Object.keys(this._data).length; },
  key(i) { const keys = Object.keys(this._data); return keys[i] || null; },
};

// cookieStore
globalThis.cookieStore = {
  get() { return Promise.resolve(null); },
  getAll() { return Promise.resolve([]); },
  set() { return Promise.resolve(); },
  delete() { return Promise.resolve(); },
  addEventListener() {},
  removeEventListener() {},
};

// ============================================================
// 3. 加密与随机数
// ============================================================

if (!globalThis.crypto) {
  const nodeCrypto = require('crypto');
  globalThis.crypto = {
    getRandomValues(arr) {
      const bytes = nodeCrypto.randomBytes(arr.length);
      for (let i = 0; i < arr.length; i++) arr[i] = bytes[i];
      return arr;
    },
    randomUUID() {
      return nodeCrypto.randomUUID();
    },
    subtle: {
      digest() { return Promise.resolve(new ArrayBuffer(32)); },
      encrypt() { return Promise.resolve(new ArrayBuffer(0)); },
      decrypt() { return Promise.resolve(new ArrayBuffer(0)); },
      sign() { return Promise.resolve(new ArrayBuffer(0)); },
      verify() { return Promise.resolve(true); },
      generateKey() { return Promise.resolve({}); },
      deriveKey() { return Promise.resolve({}); },
      deriveBits() { return Promise.resolve(new ArrayBuffer(0)); },
      importKey() { return Promise.resolve({}); },
      exportKey() { return Promise.resolve(new ArrayBuffer(0)); },
      wrapKey() { return Promise.resolve(new ArrayBuffer(0)); },
      unwrapKey() { return Promise.resolve(new ArrayBuffer(0)); },
    },
  };
}

// ============================================================
// 4. 性能
// ============================================================

if (!globalThis.performance) {
  const { performance } = require('perf_hooks');
  globalThis.performance = performance;
}

// Chrome-specific performance.memory
if (!globalThis.performance.memory) {
  Object.defineProperty(globalThis.performance, 'memory', {
    value: {
      jsHeapSizeLimit: 4294705152,
      totalJSHeapSize: 10000000,
      usedJSHeapSize: 8000000,
    },
    configurable: true,
    enumerable: true,
    writable: true,
  });
}

// performance timing
if (!globalThis.performance.timing) {
  const t = Date.now();
  globalThis.performance.timing = {
    navigationStart: t - 500,
    unloadEventStart: t - 490,
    unloadEventEnd: t - 480,
    redirectStart: 0,
    redirectEnd: 0,
    fetchStart: t - 495,
    domainLookupStart: t - 490,
    domainLookupEnd: t - 488,
    connectStart: t - 488,
    connectEnd: t - 480,
    secureConnectionStart: t - 485,
    requestStart: t - 478,
    responseStart: t - 460,
    responseEnd: t - 450,
    domLoading: t - 440,
    domInteractive: t - 300,
    domContentLoadedEventStart: t - 290,
    domContentLoadedEventEnd: t - 280,
    domComplete: t - 100,
    loadEventStart: t - 80,
    loadEventEnd: t - 50,
  };
}

if (!globalThis.performance.navigation) {
  globalThis.performance.navigation = { type: 0, redirectCount: 0 };
}

if (!globalThis.performance.getEntriesByType) {
  globalThis.performance.getEntriesByType = function() { return []; };
  globalThis.performance.getEntries = function() { return []; };
  globalThis.performance.mark = function() {};
  globalThis.performance.measure = function() {};
  globalThis.performance.clearMarks = function() {};
  globalThis.performance.clearMeasures = function() {};
}

// ============================================================
// 5. 浏览器 API 模拟
// ============================================================

// history
globalThis.history = {
  length: 1,
  state: null,
  scrollRestoration: 'auto',
  back() {},
  forward() {},
  go() {},
  pushState() {},
  replaceState() {},
};

// matchMedia
globalThis.matchMedia = function(query) {
  return {
    matches: false,
    media: query,
    onchange: null,
    addListener() {},
    removeListener() {},
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent() { return true; },
  };
};

// requestAnimationFrame / cancelAnimationFrame
globalThis.requestAnimationFrame = function(cb) {
  return setTimeout(cb, 16);
};
globalThis.cancelAnimationFrame = function(id) {
  clearTimeout(id);
};

// alert / confirm / prompt
globalThis.alert = function() {};
globalThis.confirm = function() { return true; };
globalThis.prompt = function() { return null; };

// Image
globalThis.Image = function(width, height) {
  const img = {
    width: width || 0,
    height: height || 0,
    naturalWidth: 0,
    naturalHeight: 0,
    complete: false,
    currentSrc: '',
    src: '',
    alt: '',
    crossOrigin: null,
    decoding: 'auto',
    loading: 'eager',
    referrerPolicy: '',
    sizes: '',
    useMap: '',
    isMap: false,
    x: 0,
    y: 0,
    onload: null,
    onerror: null,
    onabort: null,
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent() {},
    decode() { return Promise.resolve(); },
    cloneNode() { return Object.assign({}, img); },
    getBoundingClientRect() { return { x: 0, y: 0, width: this.width, height: this.height, top: 0, left: 0, right: this.width, bottom: this.height }; },
  };
  return img;
};

// MouseEvent / KeyboardEvent / PointerEvent / TouchEvent
globalThis.MouseEvent = function(type, init) {
  return {
    type: type,
    target: null,
    currentTarget: null,
    clientX: (init && init.clientX) || 0,
    clientY: (init && init.clientY) || 0,
    screenX: (init && init.screenX) || 0,
    screenY: (init && init.screenY) || 0,
    pageX: (init && init.pageX) || 0,
    pageY: (init && init.pageY) || 0,
    offsetX: (init && init.offsetX) || 0,
    offsetY: (init && init.offsetY) || 0,
    button: (init && init.button) || 0,
    buttons: (init && init.buttons) || 0,
    which: 1,
    ctrlKey: false,
    shiftKey: false,
    altKey: false,
    metaKey: false,
    bubbles: true,
    cancelable: true,
    defaultPrevented: false,
    composed: true,
    detail: 0,
    movementX: 0,
    movementY: 0,
    relatedTarget: null,
    region: null,
    stopPropagation() {},
    stopImmediatePropagation() {},
    preventDefault() {},
  };
};
globalThis.MouseEvent.prototype = {};

globalThis.KeyboardEvent = globalThis.MouseEvent;
globalThis.PointerEvent = globalThis.MouseEvent;
globalThis.TouchEvent = globalThis.MouseEvent;
globalThis.WheelEvent = globalThis.MouseEvent;
globalThis.FocusEvent = globalThis.MouseEvent;

// HTMLAllCollection - IE 专有, 但在某些环境检测中使用
globalThis.HTMLAllCollection = function() {};
globalThis.HTMLAllCollection.prototype = {};

// Additional DOM constructors
globalThis.NodeList = Array;
globalThis.HTMLCollection = Array;
globalThis.HTMLFormElement = function() {};
globalThis.HTMLInputElement = function() {};
globalThis.HTMLButtonElement = function() {};
globalThis.HTMLAnchorElement = function() {};
globalThis.HTMLImageElement = globalThis.Image;
globalThis.HTMLScriptElement = function() {};
globalThis.HTMLStyleElement = function() {};
globalThis.HTMLCanvasElement = function() {};
globalThis.HTMLVideoElement = function() {};
globalThis.HTMLAudioElement = function() {};

// HTMLFormControlsCollection
globalThis.HTMLOptionsCollection = Array;

// Canvas
globalThis.HTMLCanvasElement.prototype.getContext = function() {
  return {
    canvas: this,
    fillStyle: '#000000',
    strokeStyle: '#000000',
    lineWidth: 1,
    lineCap: 'butt',
    lineJoin: 'miter',
    miterLimit: 10,
    font: '10px sans-serif',
    textAlign: 'left',
    textBaseline: 'alphabetic',
    globalAlpha: 1,
    globalCompositeOperation: 'source-over',
    shadowBlur: 0,
    shadowColor: 'rgba(0,0,0,0)',
    shadowOffsetX: 0,
    shadowOffsetY: 0,
    imageSmoothingEnabled: true,
    filter: 'none',
    save() {},
    restore() {},
    scale() {},
    rotate() {},
    translate() {},
    transform() {},
    setTransform() {},
    resetTransform() {},
    createLinearGradient() { return { addColorStop() {} }; },
    createRadialGradient() { return { addColorStop() {} }; },
    createPattern() { return {}; },
    clearRect() {},
    fillRect() {},
    strokeRect() {},
    beginPath() {},
    closePath() {},
    moveTo() {},
    lineTo() {},
    bezierCurveTo() {},
    quadraticCurveTo() {},
    arc() {},
    arcTo() {},
    ellipse() {},
    rect() {},
    fill() {},
    stroke() {},
    clip() {},
    isPointInPath() { return false; },
    isPointInStroke() { return false; },
    fillText() {},
    strokeText() {},
    measureText() { return { width: 0, actualBoundingBoxAscent: 0, actualBoundingBoxDescent: 0 }; },
    drawImage() {},
    createImageData() { return { data: [], width: 0, height: 0 }; },
    getImageData() { return { data: new Uint8ClampedArray(4), width: 1, height: 1 }; },
    putImageData() {},
    setLineDash() {},
    getLineDash() { return []; },
    getContextAttributes() { return {}; },
  };
};

// ============================================================
// 6. 抖音特定环境
// ============================================================

// __ac_referer - 抖音验证用, 实际浏览器中为 undefined
globalThis.__ac_referer = '';

// __ac_nonce - 注意: 实际浏览器中并不作为全局变量存在
// 而是存储在 document.cookie 中, 如: __ac_nonce=xxxx
// bdms 的 VM 过程会从 document.cookie 读取
// 因此在调用 init 前需要设 cookie:
//   document.cookie = '__ac_nonce=...';


// ============================================================
// 7. 浏览器额外构造函数 (VM 可能通过 typeof/name 检测)
// ============================================================

globalThis.origin = 'https://www.douyin.com';

globalThis.close = function() {};
globalThis.PluginArray = function() {};
globalThis.File = function() {};
globalThis.Performance = function() {};

var _browserCtors = {
  Worker: function() {},
  SharedWorker: function() {},
  IntersectionObserver: function() {},
  MutationObserver: function() {},
  ResizeObserver: function() {},
  Gamepad: function() {},
  ImageData: function(w, h) { return { data: new Uint8ClampedArray(w * h * 4), width: w, height: h }; },
  CanvasGradient: function() {},
  CanvasPattern: function() {},
  Path2D: function() {},
  XMLSerializer: function() { return { serializeToString: function() { return ''; } }; },
  CSSStyleDeclaration: function() {},
  Option: function() {},
  Node: function() {},
  Event: function() {},
  CustomEvent: function() {},
  MessageEvent: function() {},
  CloseEvent: function() {},
  ErrorEvent: function() {},
  PageTransitionEvent: function() {},
  PopStateEvent: function() {},
  HashChangeEvent: function() {},
  StorageEvent: function() {},
  SubmitEvent: function() {},
  ToggleEvent: function() {},
  InputEvent: function() {},
  BeforeUnloadEvent: function() {},
  DragEvent: function() {},
  ClipboardEvent: function() {},
  CompositionEvent: function() {},
  UIEvent: function() {},
  ProgressEvent: function() {},
  SecurityPolicyViolationEvent: function() {},
  CSS: { supports: function() { return true; }, escape: function(s) { return s; } },
  CSSStyleSheet: function() {},
  CSSRule: function() {},
  CSSStyleRule: function() {},
  CSSImportRule: function() {},
  CSSGroupingRule: function() {},
  CSSPageRule: function() {},
  CSSMarginRule: function() {},
  CSSNamespaceRule: function() {},
  CSSKeyframesRule: function() {},
  CSSKeyframeRule: function() {},
  CSSSupportsRule: function() {},
  CSSFontFaceRule: function() {},
  CSSPositionTryRule: function() {},
  CSSLayerBlockRule: function() {},
  CSSLayerStatementRule: function() {},
  CSSContainerRule: function() {},
  CSSStartingStyleRule: function() {},
  CSSPropertyRule: function() {},
  CSSScopeRule: function() {},
  CSSMediaRule: function() {},
  CSSCounterStyleRule: function() {},
};

for (var _c in _browserCtors) {
  if (typeof globalThis[_c] === 'undefined') {
    globalThis[_c] = _browserCtors[_c];
  }
}

// requestIdleCallback / cancelIdleCallback
if (typeof globalThis.requestIdleCallback === 'undefined') {
  globalThis.requestIdleCallback = function(cb) {
    return setTimeout(function() {
      cb({ didTimeout: false, timeRemaining: function() { return 50; } });
    }, 1);
  };
  globalThis.cancelIdleCallback = function(id) { clearTimeout(id); };
}

// 注意: global 和 process 在真实浏览器中为 undefined,
// 但删除它们会导致 VM 48 个过程无法注册 (Y.size 从 324 → 276)
// 因此保留 global/process 供 VM 使用
// globalThis.global = globalThis;  // Node.js 默认, 保留

// ============================================================
// 8. 确保 Node 原生 API 可用
// ============================================================

if (typeof globalThis.setTimeout === 'undefined') {
  globalThis.setTimeout = setTimeout;
  globalThis.clearTimeout = clearTimeout;
  globalThis.setInterval = setInterval;
  globalThis.clearInterval = clearInterval;
  globalThis.setImmediate = setImmediate;
  globalThis.clearImmediate = clearImmediate;
}

if (typeof globalThis.queueMicrotask === 'undefined') {
  globalThis.queueMicrotask = function(fn) { Promise.resolve().then(fn); };
}

if (typeof globalThis.atob === 'undefined') {
  globalThis.atob = function(s) { return Buffer.from(s, 'base64').toString('binary'); };
  globalThis.btoa = function(s) { return Buffer.from(s, 'binary').toString('base64'); };
}

if (typeof globalThis.structuredClone === 'undefined') {
  globalThis.structuredClone = function(val) { return JSON.parse(JSON.stringify(val)); };
}


// bdms VM 签名配置 - 通过 CDP 从 douyin.com 真实页面捕获 (2026-07-31), 数据见 vm-config.json
// 注意: paths 必须是未转义的原始字符串 (如 "^/aweme/v1/"), VM 会自行把 / 转义为 \\/
// 否则正则变成双重转义, 所有路径都不匹配, a_bogus 无法生成
globalThis.__sdkVmConfig = require('./vm-config.json');

console.log('[env.js] 环境补全完成');
