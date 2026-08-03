/**
 * BOSS直聘 __zp_stoken__ 签名生成器（jsdom 环境伪装版）
 *
 * security-js（60fcde2c.js）为深度混淆（函数级分发混淆），静态还原成本极高，
 * 采用黑盒方案：jsdom 完整环境伪装 + 执行原始 security-js 生成 token。
 *
 * 已破解的环境指纹（关键踩坑，缺一不可）：
 * 1. security-js 调用 Object.getOwnPropertyNames(window) + Object.keys(window)
 *    遍历 window 全部属性做环境指纹 → 必须 hook 返回 Chrome 属性集
 *    （jsdom 默认 494 个 vs Chrome 1430 个，直接生成必被拒 38）
 * 2. navigator 指纹 7 项：deviceMemory/hardwareConcurrency/languages/
 *    mimeTypes/plugins/webdriver/webkitTemporaryStorage（必须精确模拟，
 *    且 plugins 每个含 2 个 MIME：application/pdf + text/pdf）
 * 3. Function.prototype.toString 检测（markNative 伪装原生函数）
 * 4. canvas.getContext('2d') 必须返回非 null
 * 5. performance.now 必须返回大值（模拟浏览器从导航开始的运行时长）
 * 6. UA 全家桶：userAgent/appVersion/platform/vendor/product/productSub 等
 *
 * token = (new ABC).z(seed, parseInt(ts) + 60*(480+getTimezoneOffset())*1000)
 * 中国时区（-480）下 tsAdj = ts + 0
 */
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const SECURITY_JS_PATH = path.join(__dirname, '..', 'config', 'security-60fcde2c.js');
const CHROME_KEYS_PATH = path.join(__dirname, '..', 'config', 'chrome-window-keys.json');
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36';

function markNative(fn) {
  if (!fn || typeof fn !== 'function') return;
  try { fn.toString = function () { return 'function () { [native code] }'; }; } catch (e) {}
}

function buildEnv(seed, ts) {
  const secUrl = 'https://www.zhipin.com/web/passport/zp/security.html?seed=' + encodeURIComponent(seed) +
    '&name=60fcde2c&ts=' + ts + '&callbackUrl=%2Fjob_detail%2Findex.html&srcReferer';

  const dom = new JSDOM('<!DOCTYPE html><html><head></head><body></body></html>', {
    url: secUrl,
    referrer: 'https://www.zhipin.com/job_detail/index.html',
    pretendToBeVisual: true,
    runScripts: 'dangerously'
  });
  const win = dom.window;
  const nav = win.navigator;

  // ===== 核心：hook window 属性枚举（security-js 环境指纹）=====
  const chromeKeys = JSON.parse(fs.readFileSync(CHROME_KEYS_PATH, 'utf8'));
  const origGOPN = win.Object.getOwnPropertyNames;
  const origKeys = win.Object.keys;
  win.Object.getOwnPropertyNames = function (o) {
    if (o === win || o === win.window) return chromeKeys.slice();
    return origGOPN.apply(this, arguments);
  };
  win.Object.keys = function (o) {
    if (o === win || o === win.window) return chromeKeys.slice();
    return origKeys.apply(this, arguments);
  };

  // 补齐 chromeKeys 中缺失的属性（security-js 遍历后读取值）
  // 浏览器中这些属性大多是构造函数（function），jsdom 缺失时为 undefined，
  // 遍历读取到 undefined 与浏览器不同 → 用占位函数补齐（且不覆盖已有属性）
  const existingKeys = new Set(Object.getOwnPropertyNames(win));
  let addedCount = 0;
  for (const k of chromeKeys) {
    if (existingKeys.has(k)) continue;
    try {
      const placeholder = function () {};
      placeholder.prototype.constructor = placeholder;
      // 不可枚举，避免影响 Object.keys 结果
      Object.defineProperty(win, k, { value: placeholder, enumerable: false, configurable: true, writable: true });
      addedCount++;
    } catch (e) {}
  }


  // ===== 补齐 Chrome Web 平台 API（security-js 检查存在性）=====
  const chromeAPIs = [
    'WebGLRenderingContext', 'WebGL2RenderingContext', 'CanvasRenderingContext2D', 'OffscreenCanvas',
    'AudioContext', 'AudioBuffer', 'AudioNode', 'AudioParam', 'GainNode', 'AnalyserNode',
    'SpeechSynthesis', 'SpeechSynthesisUtterance', 'Notification', 'RTCPeerConnection',
    'RTCSessionDescription', 'RTCIceCandidate', 'RTCRtpSender', 'RTCRtpReceiver', 'RTCDataChannel',
    'WebAssembly', 'Crypto', 'SubtleCrypto', 'CryptoKey', 'Worker', 'SharedWorker',
    'ServiceWorker', 'ServiceWorkerContainer', 'ServiceWorkerRegistration', 'IndexedDB',
    'IDBFactory', 'IDBDatabase', 'IDBObjectStore', 'IDBTransaction', 'IDBRequest', 'IDBCursor',
    'WebSocket', 'MutationObserver', 'IntersectionObserver', 'IntersectionObserverEntry',
    'ResizeObserver', 'ResizeObserverEntry', 'PerformanceObserver', 'PerformanceObserverEntryList',
    'IdleDeadline', 'ImageBitmap', 'ImageData', 'FileReader', 'FileList', 'File', 'Blob',
    'FormData', 'Headers', 'Request', 'Response', 'AbortController', 'AbortSignal',
    'EventSource', 'CustomEvent', 'MessageChannel', 'MessagePort', 'BroadcastChannel',
    'caches', 'Cache', 'CacheStorage', 'StorageManager', 'CredentialsContainer', 'Credential',
    'MediaDevices', 'MediaStream', 'MediaStreamTrack', 'Geolocation', 'GeolocationPosition',
    'GeolocationCoordinates', 'GeolocationPositionError', 'BatteryManager', 'NetworkInformation',
    'Gamepad', 'GamepadButton', 'GamepadEvent', 'Serial', 'SerialPort', 'USB', 'USBDevice',
    'USBConfiguration', 'USBInterface', 'USBEndpoint', 'HID', 'HIDDevice', 'Bluetooth',
    'BluetoothDevice', 'PushManager', 'PushSubscription', 'NavigatorUAData', 'Sensor',
    'Accelerometer', 'Gyroscope', 'OrientationSensor', 'AbsoluteOrientationSensor',
    'RelativeOrientationSensor', 'ScreenOrientation', 'WakeLock', 'WakeLockSentinel',
    'Clipboard', 'ClipboardItem', 'Permissions', 'PermissionStatus', 'NavigatorManagedData',
    'FileSystemHandle', 'FileSystemFileHandle', 'FileSystemDirectoryHandle', 'EyeDropper',
    'XRSession', 'XRSystem', 'XRFrame', 'XRRigidTransform', 'XRPose', 'XRView',
    'WebTransport', 'WebTransportError', 'WebTransportBidirectionalStream',
    'SpeechRecognition', 'SpeechGrammarList', 'SpeechGrammar', 'MediaRecorder',
    'MediaSource', 'MediaCapabilities', 'PaymentRequest', 'PaymentResponse', 'PaymentAddress',
    'PresentationRequest', 'Presentation', 'PresentationConnection', 'RemotePlayback',
    'ScreenDetailed', 'ScreenDetails', 'GPU', 'GPUAdapter', 'GPUDevice', 'GPUBuffer',
    'GPUTexture', 'GPUShaderModule', 'GPUPipelineLayout', 'GPUBindGroup', 'GPUCommandEncoder',
    'GPUQueue', 'Profiler', 'SharedStorage', 'SharedStorageWorklet', 'Fence', 'FencedFrameConfig',
    'LaunchParams', 'LaunchQueue', 'DocumentPictureInPicture', 'Sanitizer', 'Origin',
    'NotRestoredReasons', 'NotRestoredReasonDetails', 'TimelineTrigger', 'Viewport',
    'WebSocketStream', 'WebSocketError', 'XSLTProcessor', 'Temporal', 'SuppressedError',
    'DisposableStack', 'AsyncDisposableStack', 'Float16Array', 'AudioData', 'VideoFrame',
    'VideoColorSpace', 'EncodedVideoChunk', 'EncodedAudioChunk', 'ImageDecoder', 'ImageTrack',
    'ImageTrackList', 'AudioDecoder', 'AudioEncoder', 'VideoDecoder', 'VideoEncoder',
    'AudioWorklet', 'AudioWorkletNode', 'BarcodeDetector', 'LanguageDetector', 'Summarizer',
    'Translator', 'FontData', 'CrashReportContext', 'ChapterInformation', 'CropTarget',
    'MediaMetadata', 'MediaSession', 'PageRevealEvent', 'PageSwapEvent', 'PeriodicSyncManager',
    'BackgroundFetchManager', 'BackgroundFetchRegistration', 'BackgroundFetchRecord',
    'QuotaExceededError', 'RestrictionTarget', 'SnapEvent', 'TimelineTriggerRange',
    'TimelineTriggerRangeList', 'ViewTransition', 'ViewTransitionTypeSet', 'ViewTimeline',
    'ScrollTimeline', 'TextUpdateEvent', 'TextFormatUpdateEvent', 'TextFormat', 'EditContext',
    'Navigation', 'NavigationActivation', 'NavigationHistoryEntry', 'NavigationTransition',
    'NavigationDestination', 'NavigationCurrentEntryChangeEvent', 'NavigateEvent',
    'WindowControlsOverlay', 'WindowControlsOverlayGeometryChangeEvent', 'VisibilityStateEntry',
    'CloseWatcher', 'CommandEvent', 'InterestEvent', 'ToggleEvent', 'PopStateEvent',
    'HashChangeEvent', 'PageTransitionEvent', 'BeforeUnloadEvent', 'StorageEvent',
    'DOMException', 'DOMError', 'DOMRect', 'DOMRectReadOnly', 'DOMPoint', 'DOMPointReadOnly',
    'DOMQuad', 'DOMMatrix', 'DOMMatrixReadOnly', 'DOMTokenList', 'DOMStringMap', 'DOMStringList',
    'TreeWalker', 'NodeIterator', 'NodeFilter', 'Range', 'StaticRange', 'Selection',
    'CaretPosition', 'Path2D', 'CanvasGradient', 'CanvasPattern', 'TextMetrics',
    'ImageBitmapRenderingContext', 'OffscreenCanvasRenderingContext2D', 'AudioListener',
    'AudioDestinationNode', 'AudioScheduledSourceNode', 'AudioBufferSourceNode', 'BiquadFilterNode',
    'ChannelMergerNode', 'ChannelSplitterNode', 'ConvolverNode', 'ConstantSourceNode',
    'DelayNode', 'DynamicsCompressorNode', 'IIRFilterNode', 'MediaElementAudioSourceNode',
    'MediaStreamAudioSourceNode', 'MediaStreamAudioDestinationNode', 'OscillatorNode',
    'PannerNode', 'PeriodicWave', 'ScriptProcessorNode', 'StereoPannerNode', 'WaveShaperNode',
    'AudioSinkInfo', 'AudioPlaybackStats', 'AudioParamMap', 'BaseAudioContext',
    'OfflineAudioContext', 'OfflineAudioCompletionEvent', 'AudioProcessingEvent',
    'AudioScheduledSourceNode', 'DecompressionStream', 'CompressionStream',
    'ReadableStream', 'WritableStream', 'TransformStream', 'ReadableByteStreamController',
    'ReadableStreamBYOBRequest', 'ReadableStreamBYOBReader', 'ReadableStreamDefaultController',
    'ReadableStreamDefaultReader', 'WritableStreamDefaultController', 'WritableStreamDefaultWriter',
    'TransformStreamDefaultController', 'ByteLengthQueuingStrategy', 'CountQueuingStrategy',
    'MessageEvent', 'ProgressEvent', 'ErrorEvent', 'PromiseRejectionEvent', 'SubmitEvent',
    'CompositionEvent', 'InputEvent', 'KeyboardEvent', 'MouseEvent', 'PointerEvent',
    'TouchEvent', 'Touch', 'TouchList', 'WheelEvent', 'DragEvent', 'FocusEvent', 'ClipboardEvent',
    'AnimationEvent', 'TransitionEvent', 'WebKitCSSMatrix', 'WebKitMutationObserver',
    'webkitURL', 'webkitRTCPeerConnection', 'webkitMediaStream', 'webkitSpeechRecognition',
    'webkitSpeechGrammarList', 'webkitSpeechRecognitionEvent', 'webkitRequestFileSystem',
    'webkitResolveLocalFileSystemURL'
  ];
  const savedChromeAPIs = {};
  chromeAPIs.forEach(name => {
    if (typeof win[name] === 'undefined') {
      try {
        // 构造器占位（带 prototype，模拟原生构造器特征）
        const Ctor = new Function('return function ' + name + '() {}')();
        Ctor.prototype.constructor = Ctor;
        Ctor.prototype.toString = function() { return '[object ' + name + ']'; };
        Object.defineProperty(Ctor.prototype, Symbol.toStringTag, { value: name, configurable: true });
        win[name] = Ctor;
      } catch(e) {}
    }
  });
  // 需要特殊处理的对象（非构造器）
  if (typeof win.caches === 'undefined') { try { win.caches = {}; } catch(e) {} }
  if (typeof win.cookieStore === 'undefined') { try { win.cookieStore = {}; } catch(e) {} }
  if (typeof win.launchQueue === 'undefined') { try { win.launchQueue = { setConsumer: () => {} }; } catch(e) {} }
  if (typeof win.originAgentCluster === 'undefined') { try { win.originAgentCluster = false; } catch(e) {} }
  if (typeof win.credentialless === 'undefined') { try { win.credentialless = false; } catch(e) {} }
  if (typeof win.viewport === 'undefined') { try { win.viewport = {}; } catch(e) {} }
  if (typeof win.fence === 'undefined') { try { win.fence = {}; } catch(e) {} }
  if (typeof win.speechSynthesis === 'undefined') {
    try {
      win.speechSynthesis = {
        speak: () => {}, cancel: () => {}, pause: () => {}, resume: () => {},
        getVoices: () => [], pending: false, speaking: false, paused: false,
        addEventListener: () => {}, removeEventListener: () => {}
      };
    } catch(e) {}
  }
  if (typeof win.fetchLater === 'undefined') { try { win.fetchLater = {}; } catch(e) {} }
  if (typeof win.queryLocalFonts === 'undefined') { try { win.queryLocalFonts = () => Promise.resolve([]); } catch(e) {} }
  if (typeof win.getScreenDetails === 'undefined') { try { win.getScreenDetails = () => Promise.resolve({}); } catch(e) {} }
  if (typeof win.showOpenFilePicker === 'undefined') { try { win.showOpenFilePicker = () => Promise.resolve([]); } catch(e) {} }
  if (typeof win.showSaveFilePicker === 'undefined') { try { win.showSaveFilePicker = () => Promise.resolve({}); } catch(e) {} }
  if (typeof win.showDirectoryPicker === 'undefined') { try { win.showDirectoryPicker = () => Promise.resolve({}); } catch(e) {} }

  // ===== markNative：函数原生性伪装 =====
  [
    'atob', 'btoa', 'setTimeout', 'setInterval', 'clearTimeout', 'clearInterval',
    'requestAnimationFrame', 'cancelAnimationFrame', 'getComputedStyle', 'matchMedia',
    'queueMicrotask', 'parseInt', 'parseFloat', 'isNaN', 'isFinite', 'decodeURI',
    'decodeURIComponent', 'encodeURI', 'encodeURIComponent', 'escape', 'unescape', 'eval',
    'fetch', 'open', 'close', 'alert', 'confirm', 'prompt', 'print', 'postMessage',
    'structuredClone', 'createImageBitmap', 'reportError'
  ].forEach(n => { try { const v = win[n]; if (typeof v === 'function') markNative(v); } catch (e) {} });
  try {
    ['log', 'table', 'clear', 'warn', 'error', 'info', 'debug', 'dir', 'trace', 'count',
     'group', 'groupEnd', 'time', 'timeEnd', 'assert'].forEach(m => {
      if (typeof win.console[m] === 'function') markNative(win.console[m]);
    });
  } catch (e) {}

  const protoMethods = [
    [Object.prototype, ['toString', 'valueOf', 'hasOwnProperty', 'isPrototypeOf', 'propertyIsEnumerable']],
    [Array.prototype, ['push', 'pop', 'shift', 'unshift', 'slice', 'splice', 'join', 'concat', 'indexOf',
      'forEach', 'map', 'filter', 'reduce', 'sort', 'reverse', 'keys', 'values', 'entries',
      'every', 'some', 'find', 'findIndex', 'includes', 'flat']],
    [String.prototype, ['charAt', 'charCodeAt', 'indexOf', 'slice', 'substring', 'toLowerCase',
      'toUpperCase', 'trim', 'replace', 'split', 'concat', 'includes', 'startsWith', 'endsWith',
      'repeat', 'match', 'search']],
    [Number.prototype, ['toString', 'toFixed', 'toPrecision', 'valueOf']],
    [Date.prototype, ['getTime', 'getFullYear', 'getMonth', 'getDate', 'getHours', 'getMinutes',
      'getSeconds', 'getMilliseconds', 'toString', 'toISOString', 'valueOf', 'getTimezoneOffset']],
    [Math, ['abs', 'ceil', 'floor', 'round', 'max', 'min', 'pow', 'sqrt', 'random', 'trunc',
      'sign', 'log', 'exp', 'sin', 'cos', 'tan', 'atan', 'hypot', 'cbrt', 'imul']],
    [JSON, ['parse', 'stringify']],
    [RegExp.prototype, ['exec', 'test', 'toString']],
    [Function.prototype, ['call', 'apply', 'bind', 'toString']],
    [Error.prototype, ['toString']],
    [Promise.prototype, ['then', 'catch', 'finally']],
    [Uint8Array.prototype, ['slice', 'subarray', 'set', 'fill']]
  ];
  for (const [obj, methods] of protoMethods) {
    for (const m of methods) {
      try { const v = obj[m]; if (typeof v === 'function') markNative(v); } catch (e) {}
    }
  }

  // ===== plugins/mimeTypes 精确模拟（Chrome 结构）=====
  const pluginNames = ['PDF Viewer', 'Chrome PDF Viewer', 'Chromium PDF Viewer', 'Microsoft Edge PDF Viewer', 'WebKit built-in PDF'];
  const mimeTypesList = ['application/pdf', 'text/pdf'];
  // Chrome 风格 MimeType：type/suffixes/description 在原型（ownKeys=0）
  const makeMimeProto = (type) => {
    const proto = {};
    Object.defineProperty(proto, 'type', { value: type, enumerable: true, configurable: true });
    Object.defineProperty(proto, 'suffixes', { value: 'pdf', enumerable: true, configurable: true });
    Object.defineProperty(proto, 'description', { value: 'Portable Document Format', enumerable: true, configurable: true });
    return proto;
  };
  const makePlugin = (name) => {
    const p = {};
    const m0 = Object.create(makeMimeProto('application/pdf'));
    const m1 = Object.create(makeMimeProto('text/pdf'));
    Object.defineProperty(m0, 'enabledPlugin', { value: p, enumerable: true, configurable: true });
    Object.defineProperty(m1, 'enabledPlugin', { value: p, enumerable: true, configurable: true });
    p[0] = m0;
    p[1] = m1;
    mimeTypesList.forEach((m, i) => {
      Object.defineProperty(p, m, { value: p[i], enumerable: false, configurable: true, writable: true });
    });
    ['name', 'filename', 'description', 'length', 'item', 'namedItem', 'enabledPlugin'].forEach(k => {
      Object.defineProperty(p, k, {
        value: k === 'length' ? 2 : k === 'name' ? name : k === 'filename' ? 'internal-pdf-viewer' : k === 'description' ? 'Portable Document Format' : k === 'item' ? (i) => p[i] || null : k === 'namedItem' ? (n) => p[n] || null : k === 'enabledPlugin' ? p : null,
        enumerable: false, configurable: true, writable: true
      });
    });
    return p;
  };
  const pluginArray = {};
  const pluginsList = [];
  pluginNames.forEach((name, i) => {
    const p = makePlugin(name);
    pluginArray[i] = p;
    pluginsList.push(p);
    Object.defineProperty(pluginArray, name, { value: p, enumerable: false, configurable: true, writable: true });
  });
  ['length', 'item', 'namedItem'].forEach(k => {
    Object.defineProperty(pluginArray, k, {
      value: k === 'length' ? 5 : k === 'item' ? (i) => pluginArray[i] || null : (n) => pluginArray[n] || null,
      enumerable: false, configurable: true, writable: true
    });
  });
  const mimeArray = {};
  mimeTypesList.forEach((m, i) => {
    mimeArray[i] = {};
    Object.defineProperty(mimeArray, m, { value: mimeArray[i], enumerable: false, configurable: true, writable: true });
  });
  ['length', 'item', 'namedItem'].forEach(k => {
    Object.defineProperty(mimeArray, k, {
      value: k === 'length' ? 2 : k === 'item' ? (i) => mimeArray[i] || null : (n) => mimeArray[n] || null,
      enumerable: false, configurable: true, writable: true
    });
  });
  Object.defineProperty(nav, 'plugins', { get: () => pluginArray, configurable: true });
  Object.defineProperty(nav, 'mimeTypes', { get: () => mimeArray, configurable: true });

  // ===== navigator 指纹 =====
  Object.defineProperty(nav, 'userAgent', { get: () => UA, configurable: true });
  Object.defineProperty(nav, 'appVersion', { get: () => '5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', configurable: true });
  Object.defineProperty(nav, 'platform', { get: () => 'MacIntel', configurable: true });
  Object.defineProperty(nav, 'vendor', { get: () => 'Google Inc.', configurable: true });
  Object.defineProperty(nav, 'product', { get: () => 'Gecko', configurable: true });
  Object.defineProperty(nav, 'productSub', { get: () => '20030107', configurable: true });
  Object.defineProperty(nav, 'appCodeName', { get: () => 'Mozilla', configurable: true });
  Object.defineProperty(nav, 'vendorSub', { get: () => '', configurable: true });
  Object.defineProperty(nav, 'language', { get: () => 'zh-CN', configurable: true });
  Object.defineProperty(nav, 'languages', { get: () => ['zh-CN', 'zh'], configurable: true });
  Object.defineProperty(nav, 'maxTouchPoints', { get: () => 0, configurable: true });
  Object.defineProperty(nav, 'hardwareConcurrency', { get: () => 8, configurable: true });
  Object.defineProperty(nav, 'deviceMemory', { get: () => 8, configurable: true });
  Object.defineProperty(nav, 'webdriver', { get: () => false, configurable: true });
  Object.defineProperty(nav, 'onLine', { get: () => true, configurable: true });
  Object.defineProperty(nav, 'cookieEnabled', { get: () => true, configurable: true });
  Object.defineProperty(nav, 'doNotTrack', { get: () => null, configurable: true });
  Object.defineProperty(nav, 'webkitTemporaryStorage', {
    get: () => ({ queryUsageAndQuota: cb => cb && cb(0, 0), requestQuota: () => {} }),
    configurable: true
  });
  try {
    Object.defineProperty(nav, 'userAgentData', {
      get: () => ({
        brands: [{ brand: 'Chromium', version: '150' }, { brand: 'Google Chrome', version: '150' }, { brand: 'Not.A/Brand', version: '24' }],
        mobile: false, platform: 'macOS',
        toJSON: () => ({ brands: [{ brand: 'Chromium', version: '150' }], mobile: false, platform: 'macOS' })
      }),
      configurable: true
    });
  } catch (e) {}

  // ===== performance.now 修复（大值，模拟浏览器）=====
  try {
    const perf = win.performance;
    const navStart = Date.now() - 86887;
    perf.now = function () {
      // 模拟浏览器真实 perf.now：从导航开始的大浮点数（毫秒级）
      return 86887 + (Date.now() - navStart) % 1000;
    };
    Object.defineProperty(perf, 'timeOrigin', { value: navStart, configurable: true });
    perf.timing = { navigationStart: navStart, loadEventEnd: Date.now() };
    perf.navigation = { type: 0, redirectCount: 0 };
  } catch (e) {}

  // ===== window 属性 =====
  try { Object.defineProperty(win, 'length', { get: () => 2, configurable: true }); } catch (e) {}
  try { Object.defineProperty(win, 'frames', { get: () => ({ length: 2, item: (i) => i < 2 ? win : null, [Symbol.iterator]: function* () { yield win; yield win; } }), configurable: true }); } catch (e) {}
  try { Object.defineProperty(win, 'history', { get: () => ({ length: 2, back: () => {}, forward: () => {}, go: () => {}, pushState: () => {}, replaceState: () => {} }), configurable: true }); } catch (e) {}
  try { Object.defineProperty(win, 'opener', { get: () => null, configurable: true }); } catch (e) {}
  try { Object.defineProperty(win, 'closed', { get: () => false, configurable: true }); } catch (e) {}
  try { Object.defineProperty(win, 'status', { get: () => '', configurable: true }); } catch (e) {}
  try { Object.defineProperty(win, 'name', { get: () => '', configurable: true }); } catch (e) {}
  try { Object.defineProperty(win, 'isSecureContext', { get: () => true, configurable: true }); } catch (e) {}
  try { Object.defineProperty(win, 'crossOriginIsolated', { get: () => false, configurable: true }); } catch (e) {}
  const screen = win.screen;
  Object.defineProperty(screen, 'width', { get: () => 2560, configurable: true });
  Object.defineProperty(screen, 'height', { get: () => 1440, configurable: true });
  Object.defineProperty(screen, 'availWidth', { get: () => 2560, configurable: true });
  Object.defineProperty(screen, 'availHeight', { get: () => 1440, configurable: true });
  Object.defineProperty(win, 'devicePixelRatio', { get: () => 1, configurable: true });
  Object.defineProperty(win, 'outerWidth', { get: () => 1200, configurable: true });
  Object.defineProperty(win, 'outerHeight', { get: () => 1366, configurable: true });
  Object.defineProperty(win, 'innerWidth', { get: () => 1200, configurable: true });
  Object.defineProperty(win, 'innerHeight', { get: () => 1279, configurable: true });
  try {
    Object.defineProperty(win, 'chrome', {
      get: () => ({ loadTimes: () => ({}), csi: () => ({}), runtime: {}, app: { isInstalled: false }, webstore: {} }),
      configurable: true
    });
  } catch (e) {}
  try { win.localStorage.setItem('no-debug-uuid', 'uuid-50efa8tpNEnrLfauiHZhb'); } catch (e) {}
  try {
    win.Audio = function () {
      return { play: () => {}, pause: () => {}, volume: 1, currentTime: 0, duration: 0, addEventListener: () => {}, src: '' };
    };
  } catch (e) {}
  try {
    win.Image = function () {
      return { src: '', width: 0, height: 0, naturalWidth: 0, naturalHeight: 0, complete: false, addEventListener: () => {} };
    };
  } catch (e) {}

  // ===== canvas =====
  try {
    const fakeCtxFactory = () => ({
      measureText: () => ({ width: 10 }),
      getImageData: (x, y, w, h) => ({ data: new Uint8ClampedArray((w || 1) * (h || 1) * 4), width: w || 1, height: h || 1 }),
      fillText: () => {}, fillRect: () => {}, clearRect: () => {}, beginPath: () => {},
      arc: () => {}, stroke: () => {}, moveTo: () => {}, lineTo: () => {}, restore: () => {},
      save: () => {}, translate: () => {}, scale: () => {}, rotate: () => {}, drawImage: () => {},
      setTransform: () => {}, transform: () => {}, clip: () => {}, quadraticCurveTo: () => {},
      bezierCurveTo: () => {}, closePath: () => {}, rect: () => {}, strokeRect: () => {},
      fill: () => {}, putImageData: () => {}, createLinearGradient: () => ({ addColorStop: () => {} }),
      createRadialGradient: () => ({ addColorStop: () => {} }), createPattern: () => null,
      strokeStyle: '', fillStyle: '', lineWidth: 1, font: '10px sans-serif', textAlign: 'start',
      globalCompositeOperation: 'source-over', globalAlpha: 1, shadowBlur: 0,
      shadowColor: 'rgba(0,0,0,0)', shadowOffsetX: 0, shadowOffsetY: 0,
      imageSmoothingEnabled: true, lineCap: 'butt', lineJoin: 'miter', miterLimit: 10
    });
    Object.defineProperty(win.HTMLCanvasElement.prototype, 'getContext', {
      value: function (type) {
        if (type === '2d') { const ctx = fakeCtxFactory(); ctx.canvas = this; return ctx; }
        return null;
      },
      configurable: true, writable: true
    });
    Object.defineProperty(win.HTMLCanvasElement.prototype, 'toDataURL', {
      value: function () {
        return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      },
      configurable: true, writable: true
    });
    Object.defineProperty(win.HTMLCanvasElement.prototype, 'width', { get: () => 300, configurable: true });
    Object.defineProperty(win.HTMLCanvasElement.prototype, 'height', { get: () => 150, configurable: true });
  } catch (e) {}

  return win;
}

/**
 * 生成 __zp_stoken__
 * @param {string} seed 探针返回的 seed
 * @param {number} ts 探针返回的 ts
 * @returns {string} stoken（URL 编码前原始 base64）
 */
function generateToken(seed, ts) {
  const win = buildEnv(seed, ts);
  const src = fs.readFileSync(SECURITY_JS_PATH, 'utf8');
  win.eval(src);
  const ABC = win.ABC;
  if (typeof ABC !== 'function') {
    throw new Error('ABC not function: ' + typeof ABC);
  }
  const tsAdj = parseInt(ts, 10) + 60 * (480 + new Date().getTimezoneOffset()) * 1000;
  const token = new ABC().z(seed, tsAdj);
  if (!token) throw new Error('token generation returned empty');
  return token;
}

module.exports = { generateToken };
