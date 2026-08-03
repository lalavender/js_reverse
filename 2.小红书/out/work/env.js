/**
 * 小红书 window.mnsv2 补环境脚本
 * 
 * 在 Node.js 中创建与浏览器一致的环境，使 mnsv2 可以正常运行。
 */

const jsdom = require('jsdom');
const { JSDOM } = jsdom;

// ========== 1. 创建基础 DOM 环境 ==========
const dom = new JSDOM('<!DOCTYPE html><html><head></head><body></body></html>', {
  url: 'https://www.xiaohongshu.com/explore',
  referrer: undefined,
  contentType: 'text/html',
  includeNodeLocations: false,
  storageQuota: 10000000,
  pretendToBeVisual: true,
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:153.0) Gecko/20100101 Firefox/153.0'
});

const window = dom.window;
const document = window.document;

// ========== 2. 覆盖/补充浏览器特有属性 ==========

function safeDefineProps(obj, props) {
  for (const [key, desc] of Object.entries(props)) {
    try { Object.defineProperty(obj, key, desc); } catch(e) {}
  }
}

// --- navigator ---
safeDefineProps(window.navigator, {
  pdfViewerEnabled: { value: true, configurable: true },
  doNotTrack: { value: 'unspecified', configurable: true },
  maxTouchPoints: { value: 0, configurable: true },
  oscpu: { value: 'Intel Mac OS X 10.15', configurable: true },
  vendor: { value: '', configurable: true },
  vendorSub: { value: '', configurable: true },
  productSub: { value: '20100101', configurable: true },
  cookieEnabled: { value: true, configurable: true },
  buildID: { value: '20181001000000', configurable: true },
  globalPrivacyControl: { value: false, configurable: true },
  webdriver: { value: false, configurable: true },
  hardwareConcurrency: { value: 8, configurable: true },
  appCodeName: { value: 'Mozilla', configurable: true },
  appName: { value: 'Netscape', configurable: true },
  platform: { value: 'MacIntel', configurable: true },
  userAgent: { value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:153.0) Gecko/20100101 Firefox/153.0', configurable: true },
  product: { value: 'Gecko', configurable: true },
  language: { value: 'zh-CN', configurable: true },
  languages: { value: ['zh-CN', 'en'], configurable: true },
  onLine: { value: true, configurable: true },
  plugins: { value: [], configurable: true },
  mimeTypes: { value: [], configurable: true },
  javaEnabled: { value: () => false, configurable: true },
  getBattery: { value: () => Promise.resolve({ level: 1, charging: true, chargingTime: 0, dischargingTime: Infinity }), configurable: true },
  sendBeacon: { value: () => true, configurable: true },
  mediaDevices: { value: { enumerateDevices: () => Promise.resolve([]) }, configurable: true },
  permissions: { value: { query: () => Promise.resolve({ state: 'granted' }) }, configurable: true },
  connection: { value: { effectiveType: '4g', rtt: 50, downlink: 10 }, configurable: true },
  deviceMemory: { value: 8, configurable: true },
});

// --- screen ---
safeDefineProps(window.screen, {
  availWidth: { value: 1920, configurable: true },
  availHeight: { value: 1004, configurable: true },
  width: { value: 1920, configurable: true },
  height: { value: 1080, configurable: true },
  colorDepth: { value: 30, configurable: true },
  pixelDepth: { value: 30, configurable: true },
  top: { value: 244, configurable: true },
  left: { value: -1920, configurable: true },
  availTop: { value: 0, configurable: true },
  availLeft: { value: 0, configurable: true },
  mozOrientation: { value: 'landscape-primary', configurable: true },
  onmozorientationchange: { value: null, configurable: true },
  orientation: { value: { type: 'landscape-primary', angle: 0 }, configurable: true },
});

// --- document ---
safeDefineProps(document, {
  hidden: { value: false, configurable: true },
  visibilityState: { value: 'visible', configurable: true },
  readyState: { value: 'complete', configurable: true },
  characterSet: { value: 'UTF-8', configurable: true },
  charset: { value: 'UTF-8', configurable: true },
  compatMode: { value: 'CSS1Compat', configurable: true },
  domain: { value: 'www.xiaohongshu.com', configurable: true },
  referrer: { value: '', configurable: true },
  URL: { value: 'https://www.xiaohongshu.com/explore', configurable: true },
  documentURI: { value: 'https://www.xiaohongshu.com/explore', configurable: true },
});

// --- window 基本属性 ---
window.innerWidth = 1317;
window.innerHeight = 933;
window.outerWidth = 1920;
window.outerHeight = 1050;
window.scrollX = 0;
window.scrollY = 0;
window.screenX = -1918;
window.screenY = 274;
window.mozInnerScreenX = -1918;
window.mozInnerScreenY = 391;
window.devicePixelRatio = 1;
window.fullScreen = false;
window.closed = false;
window.name = '';
window.status = '';
window.opener = null;
window.length = 2;
document.title = '小红书';
document.cookie = '';

// --- performance ---
const perfTimeOrigin = Date.now() - 5000;
try { window.performance.timing = {
  navigationStart: perfTimeOrigin, unloadEventStart: 0, unloadEventEnd: 0,
  redirectStart: 0, redirectEnd: 0, fetchStart: perfTimeOrigin,
  domainLookupStart: perfTimeOrigin + 10, domainLookupEnd: perfTimeOrigin + 15,
  connectStart: perfTimeOrigin + 15, connectEnd: perfTimeOrigin + 50,
  secureConnectionStart: perfTimeOrigin + 30,
  requestStart: perfTimeOrigin + 50, responseStart: perfTimeOrigin + 100, responseEnd: perfTimeOrigin + 120,
  domLoading: perfTimeOrigin + 200, domInteractive: perfTimeOrigin + 2000,
  domContentLoadedEventStart: perfTimeOrigin + 2100, domContentLoadedEventEnd: perfTimeOrigin + 2200,
  domComplete: perfTimeOrigin + 4900, loadEventStart: perfTimeOrigin + 4950, loadEventEnd: perfTimeOrigin + 5000,
}; } catch(e) {}
try { window.performance.navigation = { type: 0, redirectCount: 0 }; } catch(e) {}
try { window.performance.timeOrigin = perfTimeOrigin; } catch(e) {}
if (!window.performance.now) window.performance.now = () => Date.now() - perfTimeOrigin;

// --- crypto ---
const nodeCrypto = require('crypto');
window.crypto = {
  getRandomValues: (buf) => nodeCrypto.randomFillSync(buf),
  randomUUID: () => nodeCrypto.randomUUID(),
  subtle: nodeCrypto.webcrypto?.subtle || {},
};

// ========== 3. 暴露 ==========

module.exports = {
  window, document, dom,

  setupGlobal() {
    // window + document
    globalThis.window = window;
    globalThis.document = document;
    
    // browser objects
    globalThis.navigator = window.navigator;
    globalThis.location = window.location;
    globalThis.screen = window.screen;
    globalThis.performance = window.performance;
    globalThis.crypto = window.crypto;
    globalThis.Event = window.Event;
    
    // 浏览器全局函数
    globalThis.setTimeout = (...args) => window.setTimeout(...args);
    globalThis.clearTimeout = (...args) => window.clearTimeout(...args);
    globalThis.setInterval = (...args) => window.setInterval(...args);
    globalThis.clearInterval = (...args) => window.clearInterval(...args);
    globalThis.encodeURIComponent = window.encodeURIComponent;
    globalThis.decodeURIComponent = window.decodeURIComponent;
    globalThis.unescape = unescape;
    globalThis.escape = escape;
    globalThis.btoa = (s) => Buffer.from(s, 'binary').toString('base64');
    globalThis.atob = (s) => Buffer.from(s, 'base64').toString('binary');
    
    // 核心构造函数 (强制覆盖已有)
    const coreCtors = [
      'Array','Object','Function','String','Number','Boolean','Symbol',
      'Error','TypeError','RangeError','EvalError','SyntaxError','ReferenceError',
      'Date','RegExp','Set','Map','WeakMap','WeakSet','Promise',
      'Uint8Array','Uint16Array','Uint32Array','Int8Array','Int16Array','Int32Array',
      'Float32Array','Float64Array','ArrayBuffer','SharedArrayBuffer','DataView',
      'TextEncoder','TextDecoder',
      'parseInt','parseFloat','isNaN','isFinite',
      'JSON','Math','console','Reflect',
    ];
    for (const name of coreCtors) {
      if (globalThis[name] === undefined && eval(`typeof ${name}`) !== 'undefined') {
        try { globalThis[name] = eval(name); } catch(e) {}
      }
    }
    
    // 特殊处理 InstallTrigger (Firefox 特有, Node 没有)
    globalThis.InstallTrigger = null;
    
    // 隐藏 Node 特征
    globalThis.process = undefined;
    globalThis.Buffer = undefined;
    globalThis.global = window;  // 避免 code.js 检测到 global
    globalThis.globalThis = window;
  },
};
