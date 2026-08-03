// Browser environment stubs for Node.js
// Must delete native getters before setting custom values

// First, delete any native browser-like globals
try { delete globalThis.navigator; } catch(e) {}
try { delete globalThis.document; } catch(e) {}
try { delete globalThis.chrome; } catch(e) {}
try { delete globalThis.InstallTrigger; } catch(e) {}

// ====== document ======
globalThis.document = {
  nodeType: 9,
  nodeName: '#document',
  nodeValue: null,
  ownerDocument: null,
  parentNode: null,
  parentElement: null,
  childNodes: [],
  firstChild: null,
  lastChild: null,
  previousSibling: null,
  nextSibling: null,
  doctype: null,
  documentElement: null,
  implementation: {},
  URL: 'https://www.xiaohongshu.com',
  documentURI: 'https://www.xiaohongshu.com',
  compatMode: 'CSS1Compat',
  characterSet: 'UTF-8',
  charset: 'UTF-8',
  contentType: 'text/html',
  head: null,
  body: null,
  cookie: '',
  readyState: 'complete',
  referrer: '',
  title: '',
  scripts: { length: 0 },
  styleSheets: { length: 0 },
  forms: { length: 0 },
  links: { length: 0 },
  images: { length: 0 },
  embeds: { length: 0 },
  plugins: { length: 0 },
  anchors: { length: 0 },
  applets: { length: 0 },
  hidden: false,
  visibilityState: 'visible',
  location: { href: 'https://www.xiaohongshu.com', protocol: 'https:', hostname: 'www.xiaohongshu.com' },
  defaultView: globalThis,
  createElement: function(tag) { return { nodeType: 1, tagName: tag.toUpperCase(), nodeName: tag.toUpperCase(), childNodes: [], children: [], getAttribute: function() { return null; }, setAttribute: function() {}, removeAttribute: function() {}, hasAttribute: function() { return false; }, hasAttributes: function() { return false; }, getBoundingClientRect: function() { return {top:0,left:0,right:0,bottom:0,width:0,height:0}; }, addEventListener: function() {}, removeEventListener: function() {}, dispatchEvent: function() { return true; }, querySelector: function() { return null; }, querySelectorAll: function() { return {length:0}; }, classList: {add:function(){},remove:function(){},contains:function(){return false;},toggle:function(){}}, style: {}, dataset: {} }; },
  createTextNode: function(text) { return { nodeType: 3, nodeValue: text, data: text, textContent: text }; },
  createComment: function(text) { return { nodeType: 8, nodeValue: text, data: text }; },
  createDocumentFragment: function() { return { nodeType: 11, childNodes: [], appendChild: function(child) { return child; } }; },
  createEvent: function(type) { return { type: type, preventDefault: function() {}, stopPropagation: function() {} }; },
  getElementById: function() { return null; },
  getElementsByClassName: function() { return {length:0}; },
  getElementsByTagName: function() { return {length:0}; },
  getElementsByName: function() { return {length:0}; },
  querySelector: function() { return null; },
  querySelectorAll: function() { return {length:0}; },
  addEventListener: function() {},
  removeEventListener: function() {},
  dispatchEvent: function() { return true; },
  write: function() {},
  writeln: function() {},
  open: function() {},
  close: function() {},
  hasFocus: function() { return true; },
  getSelection: function() { return { type: 'None', toString: function() { return ''; }, removeAllRanges: function() {}, addRange: function() {} }; },
  toString: function() { return '[object HTMLDocument]'; }
};

// ====== navigator ======
globalThis.navigator = {
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  appCodeName: 'Mozilla',
  appName: 'Netscape',
  appVersion: '5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  platform: 'MacIntel',
  product: 'Gecko',
  productSub: '20030107',
  vendor: 'Google Inc.',
  vendorSub: '',
  language: 'zh-CN',
  languages: ['zh-CN', 'zh', 'en'],
  onLine: true,
  cookieEnabled: true,
  hardwareConcurrency: 8,
  deviceMemory: 8,
  webdriver: false,
  pdfViewerEnabled: false,
  maxTouchPoints: 0,
  oscpu: 'Intel Mac OS X 10.15',
  buildID: '',
  doNotTrack: 'unspecified',
  plugins: { length: 5, item: function() {}, namedItem: function() {}, refresh: function() {} },
  mimeTypes: { length: 0, item: function() {}, namedItem: function() {} },
  connection: { effectiveType: '4g', rtt: 50, downlink: 10, saveData: false, addEventListener: function() {}, removeEventListener: function() {} },
  getBattery: function() { return Promise.resolve({ charging: true, level: 1, chargingTime: 0, dischargingTime: Infinity }); },
  javaEnabled: function() { return false; },
  sendBeacon: function() { return true; },
  toString: function() { return '[object Navigator]'; }
};

// ====== chrome ======
globalThis.chrome = {
  loadTimes: function() { return { requestTime: 0, startLoadTime: 0, commitLoadTime: 0, finishDocumentLoadTime: 0, finishLoadTime: 0, firstPaintTime: 0, firstPaintAfterLoadTime: 0, navigationType: 'other', wasFetchedViaSpdy: false, wasNpnNegotiated: false, npnNegotiatedProtocol: 'http/1.1', wasAlternateProtocolAvailable: false, connectionInfo: 'http/1.1' }; },
  csi: function() { return { startE: 0, onloadT: Date.now(), pageT: 0, tran: 0 }; },
  runtime: { id: 'fake', getManifest: function() { return { version: '120' }; }, getURL: function(path) { return path; } },
  app: { isInstalled: false },
  webstore: {},
  i18n: { getMessage: function(msg) { return msg; } },
  toString: function() { return '[object chrome]'; }
};

// ====== InstallTrigger ======
globalThis.InstallTrigger = function() {};
InstallTrigger.enabled = false;
InstallTrigger.toString = function() { return 'function InstallTrigger() { [native code] }'; };

// ====== Event ======
globalThis.Event = function(type, opts) {
  this.type = type;
  this.bubbles = opts && opts.bubbles ? true : false;
  this.cancelable = opts && opts.cancelable ? true : false;
  this.composed = opts && opts.composed ? true : false;
  this.defaultPrevented = false;
  this.target = null;
  this.currentTarget = null;
  this.eventPhase = 0;
  this.timeStamp = Date.now();
  this.isTrusted = false;
};
Event.prototype.preventDefault = function() { this.defaultPrevented = true; };
Event.prototype.stopPropagation = function() {};
Event.prototype.stopImmediatePropagation = function() {};
Event.prototype.toString = function() { return '[object Event]'; };

// ====== performance ======
if (typeof performance !== 'undefined') {
  if (!performance.timing) {
    var t0 = Date.now();
    performance.timing = { navigationStart: t0, loadEventStart: t0, domContentLoadedEventStart: t0, domContentLoadedEventEnd: t0, responseEnd: t0, responseStart: t0, requestStart: t0, connectEnd: t0, connectStart: t0, domainLookupEnd: t0, domainLookupStart: t0, fetchStart: t0, redirectEnd: 0, redirectStart: 0, unloadEventEnd: 0, unloadEventStart: 0 };
  }
  if (!performance.navigation) performance.navigation = { type: 0, redirectCount: 0 };
  if (!performance.memory) performance.memory = { jsHeapSizeLimit: 2172649472, totalJSHeapSize: 10000000, usedJSHeapSize: 8000000 };
  if (!performance.timeOrigin) performance.timeOrigin = Date.now();
}

// ====== TextEncoder ======
if (typeof TextEncoder === 'undefined') {
  globalThis.TextEncoder = function() {};
  TextEncoder.prototype.encode = function(str) { return Buffer.from(str, 'utf-8'); };
  TextEncoder.prototype.encodeInto = function(str, dest) {
    var buf = Buffer.from(str, 'utf-8');
    var written = Math.min(buf.length, dest.length);
    for (var i = 0; i < written; i++) dest[i] = buf[i];
    return { read: str.length, written: written };
  };
  TextEncoder.prototype.encoding = 'utf-8';
}

// ====== unescape ======
if (typeof unescape === 'undefined') {
  globalThis.unescape = function(str) {
    return decodeURIComponent(str.replace(/%(?![0-9A-Fa-f]{2})/g, '%25'));
  };
}

// ====== Reflect ======
if (typeof Reflect === 'undefined') {
  globalThis.Reflect = {
    apply: function(fn, ctx, args) { return fn.apply(ctx, args); },
    construct: function(fn, args) { return new (Function.prototype.bind.apply(fn, [null].concat(args)))(); },
    defineProperty: Object.defineProperty,
    deleteProperty: function(obj, prop) { return delete obj[prop]; },
    get: function(obj, prop) { return obj[prop]; },
    getOwnPropertyDescriptor: Object.getOwnPropertyDescriptor,
    getPrototypeOf: Object.getPrototypeOf,
    has: function(obj, prop) { return prop in obj; },
    isExtensible: Object.isExtensible,
    ownKeys: Object.getOwnPropertyNames,
    preventExtensions: Object.preventExtensions,
    set: function(obj, prop, value) { obj[prop] = value; return true; },
    setPrototypeOf: Object.setPrototypeOf
  };
}
