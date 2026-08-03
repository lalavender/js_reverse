/**
 * env.js v2 — 去掉 watch() Proxy，保留完整环境
 * 
 * 相比 v1 的变化:
 *   1. 移除了 watch() Proxy（避免大量日志拖慢初始）
 *   2. 保留了所有 DOM 构造器和属性
 *   3. 保持 setNative / Function.prototype.toString 保护
 *   4. 更清晰的模块化组织
 */

// ======== 1. Function.prototype.toString 保护 ========
(function() {
  const $toString = Function.prototype.toString;
  const $callTostring = Function.prototype.call.bind($toString);
  const memoryMap = new Map();

  Object.defineProperty(Function.prototype, "toString", {
    enumerable: false,
    configurable: true,
    writable: true,
    value: function toString() {
      return typeof this === 'function' && memoryMap.get(this) || $callTostring(this);
    }
  });

  memoryMap.set(Function.prototype.toString, "function toString() { [native code] }");

  globalThis.setNative = function setNative(func, funcname) {
    Object.defineProperty(func, "name", {
      value: funcname || func.name || '',
      writable: false, enumerable: false, configurable: true
    });
    const nativeStr = funcname || func.name || '';
    memoryMap.set(func, `function ${nativeStr}() { [native code] }`);
  };
})();

// ======== 2. window = globalThis ========
globalThis.window = globalThis;

// ======== 3. DOM 构造函数 ========
function EventTarget(){}
function Document(){}
function HTMLHtmlElement(){}
function Navigator(){}
function Location(){}
function Screen(){}
function History(){}
function Storage(){}
function Performance(){}
function XMLHttpRequest(){}
function CanvasRenderingContext2D(){}
function HTMLCanvasElement(){}
function HTMLElement(){}

[EventTarget, Document, HTMLHtmlElement, Navigator, Location,
 Screen, History, Storage, Performance, XMLHttpRequest,
 CanvasRenderingContext2D, HTMLCanvasElement, HTMLElement]
 .forEach(fn => setNative(fn, fn.name));

// ======== 4. Document + cookie ========
Document.prototype.addEventListener = function(){};
Object.defineProperty(Document.prototype, 'cookie', {
  get: function() {
    return 'abRequestId=bc87e19f-1473-5802-857f-aa14072c42f5; a1=197c660cf2d0j0l1bdwbkv2cyce6csd6n3v6nths750000683082; webId=c09b78e6b3cb4b550c9d51b97c057cd0; gid=yjWSKK8f0jIdyjWSKK8Siq9xJf8V81yDfEDThMWhJSvSdK28KSMfKI888KYq8YJ88SyyYWqJ; xsecappid=xhs-pc-web; ets=1775377444539; webBuild=6.7.0; loadts=1776689467785; unread={%22ub%22:%2269d63940000000001b0206cf%22%2C%22ue%22:%2269db583e000000001f00105f%22%2C%22uc%22:24}; websectiga=7750c37de43b7be9de8ed9ff8ea0e576519e8cd2157322eb972ecb429a7735d4; sec_poison_id=4e4a9eab-d586-4ce8-ab46-4095b5cf9e04';
  },
  set: function(value) {},
  enumerable: true, configurable: true
});

// ======== 5. HTMLElement + HTMLHtmlElement ========
HTMLElement.prototype.offsetWidth = 1920;
HTMLElement.prototype.offsetHeight = 1080;
HTMLElement.prototype.clientWidth = 1920;
HTMLElement.prototype.clientHeight = 1080;
HTMLElement.prototype.style = {};
HTMLElement.prototype.className = '';
HTMLElement.prototype.id = '';
HTMLElement.prototype.innerHTML = '';
HTMLElement.prototype.textContent = '';
HTMLElement.prototype.appendChild = function(){};
HTMLElement.prototype.removeChild = function(){};
HTMLElement.prototype.setAttribute = function(){};
HTMLElement.prototype.getAttribute = function(attr){ return null; };
HTMLElement.prototype.getBoundingClientRect = function() {
  return { top: 0, left: 0, width: 1920, height: 1080, right: 1920, bottom: 1080 };
};
['appendChild','removeChild','setAttribute','getAttribute','getBoundingClientRect']
  .forEach(m => setNative(HTMLElement.prototype[m], m));

HTMLHtmlElement.prototype = new HTMLElement();

// ======== 6. Navigator ========
Navigator.prototype.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
Navigator.prototype.appVersion = '5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
Navigator.prototype.platform = 'Win32';
Navigator.prototype.language = 'zh-CN';
Navigator.prototype.languages = ['zh-CN','zh','en'];
Navigator.prototype.cookieEnabled = true;
Navigator.prototype.webdriver = false;

// ======== 7. Location ========
Location.prototype.href = 'https://www.xiaohongshu.com/';
Location.prototype.protocol = 'https:';
Location.prototype.host = 'www.xiaohongshu.com';
Location.prototype.hostname = 'www.xiaohongshu.com';
Location.prototype.port = '';
Location.prototype.pathname = '/';
Location.prototype.search = '';
Location.prototype.hash = '';
Location.prototype.origin = 'https://www.xiaohongshu.com';

// ======== 8. Screen ========
Screen.prototype.width = 1920;
Screen.prototype.height = 1080;
Screen.prototype.availWidth = 1920;
Screen.prototype.availHeight = 1040;
Screen.prototype.colorDepth = 24;
Screen.prototype.pixelDepth = 24;

// ======== 9. History ========
History.prototype.length = 1;
History.prototype.pushState = function(){};
History.prototype.replaceState = function(){};
History.prototype.back = function(){};
History.prototype.forward = function(){};
History.prototype.go = function(){};
['pushState','replaceState','back','forward','go']
  .forEach(m => setNative(History.prototype[m], m));

// ======== 10. Storage ========
Storage.prototype.getItem = function(key){ return null; };
Storage.prototype.setItem = function(key, value){};
Storage.prototype.removeItem = function(key){};
Storage.prototype.clear = function(){};
Storage.prototype.length = 0;
Storage.prototype.key = function(index){ return null; };
['getItem','setItem','removeItem','clear','key']
  .forEach(m => setNative(Storage.prototype[m], m));

// ======== 11. Performance ========
Performance.prototype.now = function(){ return Date.now(); };
Performance.prototype.timing = {
  navigationStart: Date.now(), fetchStart: Date.now(),
  domainLookupStart: Date.now(), domainLookupEnd: Date.now(),
  connectStart: Date.now(), connectEnd: Date.now(),
  requestStart: Date.now(), responseStart: Date.now(),
  responseEnd: Date.now(), domLoading: Date.now(),
  domInteractive: Date.now(), domContentLoadedEventStart: Date.now(),
  domContentLoadedEventEnd: Date.now(), domComplete: Date.now(),
  loadEventStart: Date.now(), loadEventEnd: Date.now()
};
setNative(Performance.prototype.now, 'now');

// ======== 12. XMLHttpRequest ========
XMLHttpRequest.prototype.open = function(){};
XMLHttpRequest.prototype.send = function(){};
XMLHttpRequest.prototype.setRequestHeader = function(){};
XMLHttpRequest.prototype.getResponseHeader = function(){ return null; };
XMLHttpRequest.prototype.getAllResponseHeaders = function(){ return ''; };
XMLHttpRequest.prototype.abort = function(){};
XMLHttpRequest.prototype.readyState = 0;
XMLHttpRequest.prototype.status = 0;
XMLHttpRequest.prototype.responseText = '';
XMLHttpRequest.prototype.responseXML = null;
XMLHttpRequest.DONE = 4;
['open','send','setRequestHeader']
  .forEach(m => setNative(XMLHttpRequest.prototype[m], m));

// ======== 13. Canvas ========
HTMLCanvasElement.prototype.getContext = function(type) {
  if (type === '2d') return new CanvasRenderingContext2D();
  return null;
};
CanvasRenderingContext2D.prototype.fillText = function(){};
CanvasRenderingContext2D.prototype.measureText = function(text) {
  return { width: text.length * 10 };
};
CanvasRenderingContext2D.prototype.createLinearGradient = function() {
  return { addColorStop: function(){} };
};
CanvasRenderingContext2D.prototype.fillRect = function(){};
CanvasRenderingContext2D.prototype.clearRect = function(){};
CanvasRenderingContext2D.prototype.getImageData = function(x, y, w, h) {
  return { data: new Uint8ClampedArray(w * h * 4) };
};
CanvasRenderingContext2D.prototype.toDataURL = function() {
  return 'data:image/png;base64,test';
};
['fillText','measureText','createLinearGradient','fillRect','clearRect','getImageData']
  .forEach(m => setNative(CanvasRenderingContext2D.prototype[m], m));
setNative(HTMLCanvasElement.prototype.getContext, 'getContext');

// ======== 14. 创建实例并挂载到 window ========
const doc = new Document();
const nav = new Navigator();
const loc = new Location();
const scr = new Screen();
const his = new History();
const stor = new Storage();
const perf = new Performance();

doc.documentElement = new HTMLHtmlElement();
doc.body = new HTMLElement();
doc.head = new HTMLElement();

doc.createElement = function(tagName) { return new HTMLElement(); };
doc.getElementById = function(id) { return new HTMLElement(); };
doc.getElementsByClassName = function(c) { return []; };
doc.getElementsByTagName = function(t) { return []; };
doc.querySelector = function(s) { return new HTMLElement(); };
doc.querySelectorAll = function(s) { return []; };
['createElement','getElementById','getElementsByClassName',
 'getElementsByTagName','querySelector','querySelectorAll']
  .forEach(m => setNative(doc[m], m));

globalThis.document = doc;
globalThis.navigator = nav;
globalThis.location = loc;
globalThis.screen = scr;
globalThis.history = his;
globalThis.localStorage = stor;
globalThis.sessionStorage = stor;
globalThis.performance = perf;

window.document = doc;
window.navigator = nav;
window.location = loc;
window.screen = scr;
window.history = his;
window.localStorage = stor;
window.sessionStorage = stor;
window.performance = perf;

// ======== 15. Crypto ========
if (typeof globalThis.crypto === 'undefined') {
  const crypto_module = require('crypto');
  window.crypto = {
    getRandomValues: function(arr) {
      const bytes = crypto_module.randomBytes(arr.length);
      for (let i = 0; i < arr.length; i++) arr[i] = bytes[i];
      return arr;
    },
    subtle: null
  };
} else {
  window.crypto = globalThis.crypto;
}

// ======== 16. 挂载构造函数和全局 API ========
window.XMLHttpRequest = XMLHttpRequest;
window.EventTarget = EventTarget;
window.Document = Document;
window.HTMLElement = HTMLElement;
window.HTMLCanvasElement = HTMLCanvasElement;
window.CanvasRenderingContext2D = CanvasRenderingContext2D;
window.setTimeout = setTimeout;
window.setInterval = setInterval;
window.clearTimeout = clearTimeout;
window.clearInterval = clearInterval;
window.Date = Date;
window.Math = Math;
window.JSON = JSON;
window.parseInt = parseInt;
window.parseFloat = parseFloat;
window.isNaN = isNaN;
window.encodeURIComponent = encodeURIComponent;
window.decodeURIComponent = decodeURIComponent;
window.btoa = function(str) { return Buffer.from(str).toString('base64'); };
window.atob = function(str) { return Buffer.from(str, 'base64').toString(); };
window.addEventListener = function() {};
window.MouseEvent = function() {};

// ======== 17. 小红书特有对象 ========
window.insight = {
  sessionId: 'e23ef894-bba1-4ca2-a45f-1158fa16d940',
  version: '1.3.14',
  queue: [],
  isReady: true,
};

window.xhsFingerprintV3 = {
  getV18: function() { return 'v18_' + Math.random().toString(36).slice(2, 10); },
  getCurMiniUa: function() { return 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'; },
  runMiniUa: function(){},
  i12: function(){},
  reportList: [],
  initReport: 2,
  r6: function(){},
};

console.log('✅ env.js v2 基础环境补充完成');
