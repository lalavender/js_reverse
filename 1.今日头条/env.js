/* ==========================================================================
 * env.js — bdms.js (a_bogus V 1.0.1.7, 今日头条) Node.js 环境补全
 *
 * 用途: 在 Node 中模拟浏览器环境, 使 bdms.js 的 JSVMP 正常执行并生成 a_bogus
 * 用法: require("./env") 必须在 require("./bdms") 之前执行
 * 关键点:
 *   - bdms.js 末段 VM 的 env 表按需读取: window/localStorage/XMLHttpRequest/
 *     URL/JSON/Date/navigator/requestAnimationFrame/document/performance/
 *     Request/location/setTimeout/setInterval/RegExp
 *   - 5284 行补丁写入全局 `windows.a_bogus`, 故必须提供全局 `windows`
 *   - location.href 是 a_bogus 的输入 URL(请求 API 的完整 URL, 不含 a_bogus 参数)
 * ========================================================================== */

"use strict";

// --------------------------------------------------------------------------
// 1. 基础常量: UA 必须与 main.py 请求头保持一致
// --------------------------------------------------------------------------
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36";

// a_bogus 的输入 URL: 与 main.py 的 params 一致 (a_bogus 参数本身不参与计算)
const FEED_URL =
  "https://www.toutiao.com/api/pc/list/feed" +
  "?channel_id=3189398999" +
  "&min_behot_time=0" +
  "&offset=0" +
  "&refresh_count=1" +
  "&category=pc_profile_channel" +
  "&client_extra_params=%7B%22short_video_item%22%3A%22filter%22%7D" +
  "&aid=24" +
  "&app_name=toutiao_web" +
  "&msToken=zsd4sIGVXrz-v_FCY9GLbwv4HtLgTc-ahXG0Rm9yGEo1FtIxHAXutAQ1yvrj0IVBbbm8lwlvTDjgEHtNYEPEw3TVuEOLoprVeP1sCmy-gAggV4-sDv1ie2sQJBxP19g=";

// --------------------------------------------------------------------------
// 2. location
// --------------------------------------------------------------------------
const location = {
  href: FEED_URL,
  origin: "https://www.toutiao.com",
  protocol: "https:",
  host: "www.toutiao.com",
  hostname: "www.toutiao.com",
  port: "",
  pathname: "/api/pc/list/feed",
  search: FEED_URL.slice(FEED_URL.indexOf("?")),
  hash: "",
  ancestorOrigins: [],
  assign() {},
  reload() {},
  replace() {},
  toString() {
    return this.href;
  },
};

// --------------------------------------------------------------------------
// 3. localStorage / sessionStorage (Map 内存实现)
// --------------------------------------------------------------------------
function makeStorage() {
  const store = new Map();
  return {
    get length() {
      return store.size;
    },
    key(i) {
      return [...store.keys()][i] ?? null;
    },
    getItem(k) {
      return store.has(String(k)) ? store.get(String(k)) : null;
    },
    setItem(k, v) {
      store.set(String(k), String(v));
    },
    removeItem(k) {
      store.delete(String(k));
    },
    clear() {
      store.clear();
    },
  };
}
const localStorage = makeStorage();
const sessionStorage = makeStorage();

// --------------------------------------------------------------------------
// 4. document (cookie / referrer / canvas 指纹相关)
// --------------------------------------------------------------------------
let _cookie = "";

// WebGL 指纹 (真实 Chrome + SwiftShader 采集值, 与 bdms.js 的 WebGL 指纹 VM 对齐)
const WEBGL_PARAMS = {
  3362: "8", // BLUE_BITS
  3417: "24", // DEPTH_BITS
  3363: "8", // GREEN_BITS
  35661: "64", // MAX_COMBINED_TEXTURE_IMAGE_UNITS
  34076: "16384", // MAX_CUBE_MAP_TEXTURE_SIZE
  36349: "4096", // MAX_FRAGMENT_UNIFORM_VECTORS
  34024: "8192", // MAX_RENDERBUFFER_SIZE
  34930: "32", // MAX_TEXTURE_IMAGE_UNITS
  3379: "8192", // MAX_TEXTURE_SIZE
  36348: "31", // MAX_VARYING_VECTORS
  34921: "16", // MAX_VERTEX_ATTRIBS
  35660: "32", // MAX_VERTEX_TEXTURE_IMAGE_UNITS
  36347: "4096", // MAX_VERTEX_UNIFORM_VECTORS
  35724: "WebGL GLSL ES 1.0 (OpenGL ES GLSL ES 1.0 Chromium)", // SHADING_LANGUAGE_VERSION
  3415: "0", // STENCIL_BITS
  7938: "WebGL 1.0 (OpenGL ES 2.0 Chromium)", // VERSION
  37446: "ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (LLVM 10.0.0) (0x0000C0DE)), SwiftShader driver)", // UNMASKED_RENDERER_WEBGL
  37445: "Google Inc. (Google)", // UNMASKED_VENDOR_WEBGL
  34047: "16", // MAX_TEXTURE_MAX_ANISOTROPY_EXT
};

const WEBGL_EXTENSIONS = [
  "ANGLE_instanced_arrays",
  "EXT_blend_minmax",
  "EXT_color_buffer_float",
  "EXT_color_buffer_half_float",
  "EXT_float_blend",
  "EXT_frag_depth",
  "EXT_shader_texture_lod",
  "EXT_texture_compression_bptc",
  "EXT_texture_compression_rgtc",
  "EXT_texture_filter_anisotropic",
  "EXT_texture_mirror_clamp_to_edge",
  "KHR_parallel_shader_compile",
  "OES_element_index_uint",
  "OES_fbo_render_mipmap",
  "OES_standard_derivatives",
  "OES_texture_float",
  "OES_texture_float_linear",
  "OES_texture_half_float",
  "OES_texture_half_float_linear",
  "OES_vertex_array_object",
  "OVR_multiview2",
  "WEBGL_angle_instanced_arrays",
  "WEBGL_blend_func_extended",
  "WEBGL_color_buffer_float",
  "WEBGL_compressed_texture_astc",
  "WEBGL_compressed_texture_etc",
  "WEBGL_compressed_texture_etc1",
  "WEBGL_compressed_texture_pvrtc",
  "WEBGL_compressed_texture_s3tc",
  "WEBGL_compressed_texture_s3tc_srgb",
  "WEBGL_debug_renderer_info",
  "WEBGL_debug_shaders",
  "WEBGL_depth_texture",
  "WEBGL_draw_buffers",
  "WEBGL_lose_context",
  "WEBGL_multi_draw",
];

function webglCtx(canvas) {
  const gl = {
    canvas,
    drawingBufferWidth: 300,
    drawingBufferHeight: 150,
    // WebGL 1.0 常量
    BLUE_BITS: 3362,
    DEPTH_BITS: 3417,
    GREEN_BITS: 3363,
    RED_BITS: 3410,
    MAX_COMBINED_TEXTURE_IMAGE_UNITS: 35661,
    MAX_CUBE_MAP_TEXTURE_SIZE: 34076,
    MAX_FRAGMENT_UNIFORM_VECTORS: 36349,
    MAX_RENDERBUFFER_SIZE: 34024,
    MAX_TEXTURE_IMAGE_UNITS: 34930,
    MAX_TEXTURE_SIZE: 3379,
    MAX_VARYING_VECTORS: 36348,
    MAX_VERTEX_ATTRIBS: 34921,
    MAX_VERTEX_TEXTURE_IMAGE_UNITS: 35660,
    MAX_VERTEX_UNIFORM_VECTORS: 36347,
    SHADING_LANGUAGE_VERSION: 35724,
    STENCIL_BITS: 3415,
    VERSION: 7938,
    UNMASKED_RENDERER_WEBGL: 37446,
    UNMASKED_VENDOR_WEBGL: 37445,
    MAX_TEXTURE_MAX_ANISOTROPY_EXT: 34047,
    getContextAttributes() {
      return {
        alpha: true,
        antialias: true,
        depth: true,
        desynchronized: false,
        failIfMajorPerformanceCaveat: false,
        powerPreference: "default",
        premultipliedAlpha: true,
        preserveDrawingBuffer: false,
        stencil: false,
        xrCompatible: false,
      };
    },
    getParameter(p) {
      const v = WEBGL_PARAMS[p];
      if (v === undefined) return null;
      const n = Number(v);
      return Number.isNaN(n) || n.toString() !== v ? v : n;
    },
    getExtension(name) {
      if (name === "WEBGL_debug_renderer_info") {
        return {
          UNMASKED_RENDERER_WEBGL: 37446,
          UNMASKED_VENDOR_WEBGL: 37445,
        };
      }
      if (name === "EXT_texture_filter_anisotropic") {
        return { MAX_TEXTURE_MAX_ANISOTROPY_EXT: 34047 };
      }
      if (WEBGL_EXTENSIONS.includes(name)) return {};
      return null;
    },
    getSupportedExtensions() {
      return WEBGL_EXTENSIONS.slice();
    },
    getContextError() {
      return null;
    },
  };
  return gl;
}

function canvas2dCtx() {
  const ctx = {
    fillStyle: "#000000",
    strokeStyle: "#000000",
    font: "10px sans-serif",
    lineWidth: 1,
    textAlign: "start",
    fillRect() {},
    strokeRect() {},
    clearRect() {},
    fillText() {},
    strokeText() {},
    measureText(t) {
      return { width: String(t).length * 6 };
    },
    beginPath() {},
    closePath() {},
    moveTo() {},
    lineTo() {},
    arc() {},
    rect() {},
    fill() {},
    stroke() {},
    clip() {},
    save() {},
    restore() {},
    scale() {},
    rotate() {},
    translate() {},
    transform() {},
    setTransform() {},
    drawImage() {},
    createLinearGradient() {
      return { addColorStop() {} };
    },
    createRadialGradient() {
      return { addColorStop() {} };
    },
    createPattern() {
      return null;
    },
    getImageData() {
      return { data: new Uint8ClampedArray(4), width: 1, height: 1 };
    },
    putImageData() {},
    canvas: null,
  };
  return ctx;
}

const document = {
  cookie: "",
  referrer: "",
  title: "",
  URL: location.href,
  documentURI: location.href,
  location,
  characterSet: "UTF-8",
  charset: "UTF-8",
  contentType: "text/html",
  compatMode: "CSS1Compat",
  readyState: "complete",
  visibilityState: "visible",
  hidden: false,
  designMode: "off",
  dir: "ltr",
  all: { length: 0 },
  forms: { length: 0 },
  images: { length: 0 },
  links: { length: 0 },
  scripts: { length: 0 },
  styleSheets: { length: 0 },
  documentElement: {
    tagName: "HTML",
    nodeName: "HTML",
    nodeType: 1,
    clientWidth: 1440,
    clientHeight: 900,
    offsetWidth: 1440,
    offsetHeight: 900,
    scrollWidth: 1440,
    scrollHeight: 900,
    style: {},
    attributes: [],
    getAttribute() {
      return null;
    },
    setAttribute() {},
    removeAttribute() {},
    addEventListener() {},
    removeEventListener() {},
    appendChild() {},
    insertBefore() {},
  },
  head: {
    nodeType: 1,
    tagName: "HEAD",
    getAttribute() {
      return null;
    },
    setAttribute() {},
  },
  body: {
    nodeType: 1,
    tagName: "BODY",
    clientWidth: 1440,
    clientHeight: 900,
    offsetWidth: 1440,
    offsetHeight: 900,
    getAttribute() {
      return null;
    },
    setAttribute() {},
    appendChild() {},
    addEventListener() {},
  },
  get cookie() {
    return _cookie;
  },
  set cookie(v) {
    _cookie = String(v);
  },
  getElementById() {
    return null;
  },
  getElementsByTagName(tag) {
    return tag === "canvas" ? [] : [];
  },
  getElementsByClassName() {
    return [];
  },
  getElementsByName() {
    return [];
  },
  querySelector() {
    return null;
  },
  querySelectorAll() {
    return { length: 0, item() { return null; } };
  },
  createElement(tag) {
    if (String(tag).toLowerCase() === "canvas") {
      const canvas = {
        nodeType: 1,
        tagName: "CANVAS",
        width: 300,
        height: 150,
        style: {},
        getContext(type) {
          const t = String(type).toLowerCase();
          if (t === "webgl" || t === "experimental-webgl" || t === "webgl2") {
            return webglCtx(canvas);
          }
          const ctx = canvas2dCtx();
          ctx.canvas = canvas;
          return ctx;
        },
        toDataURL() {
          return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
        },
        toBlob() {},
        getBoundingClientRect() {
          return { x: 0, y: 0, width: 300, height: 150, top: 0, left: 0, right: 300, bottom: 150 };
        },
        addEventListener() {},
        removeEventListener() {},
        getAttribute() {
          return null;
        },
        setAttribute() {},
        setAttributeNS() {},
      };
      return canvas;
    }
    return {
      nodeType: 1,
      style: {},
      getAttribute() {
        return null;
      },
      setAttribute() {},
      setAttributeNS() {},
      appendChild() {},
      addEventListener() {},
      removeEventListener() {},
      getBoundingClientRect() {
        return { x: 0, y: 0, width: 0, height: 0, top: 0, left: 0, right: 0, bottom: 0 };
      },
      offsetWidth: 0,
      offsetHeight: 0,
    };
  },
  createElementNS() {
    return null;
  },
  createTextNode(t) {
    return { nodeType: 3, nodeValue: t, textContent: t };
  },
  createEvent() {
    return {
      initEvent() {},
      addEventListener() {},
      removeEventListener() {},
    };
  },
  addEventListener() {},
  removeEventListener() {},
  dispatchEvent() {
    return true;
  },
  hasFocus() {
    return true;
  },
  getSelection() {
    return {
      toString() {
        return "";
      },
    };
  },
  elementFromPoint() {
    return null;
  },
  importNode(n) {
    return n;
  },
  write() {},
  writeln() {},
  open() {},
  close() {},
};

// --------------------------------------------------------------------------
// 5. navigator (与 UA 自洽)
// --------------------------------------------------------------------------
const navigator = {
  userAgent: UA,
  appVersion: UA.replace("Mozilla/", ""),
  platform: "MacIntel",
  vendor: "Google Inc.",
  vendorSub: "",
  product: "Gecko",
  productSub: "20030107",
  language: "zh-CN",
  languages: ["zh-CN", "zh"],
  cookieEnabled: true,
  onLine: true,
  webdriver: false,
  deviceMemory: 8,
  hardwareConcurrency: 8,
  maxTouchPoints: 0,
  pdfViewerEnabled: true,
  doNotTrack: null,
  plugins: {
    length: 5,
    0: {
      name: "PDF Viewer",
      filename: "internal-pdf-viewer",
      description: "Portable Document Format",
      length: 1,
      0: { type: "application/pdf", suffixes: "pdf", description: "Portable Document Format" },
      item(i) {
        return this[i] ?? null;
      },
      namedItem() {
        return null;
      },
    },
    1: {
      name: "Chrome PDF Viewer",
      filename: "mhjfbmdgcfjbbpaeojofohoefgiehjai",
      description: "Portable Document Format",
      length: 1,
      0: { type: "application/pdf", suffixes: "pdf", description: "Portable Document Format" },
      item(i) {
        return this[i] ?? null;
      },
      namedItem() {
        return null;
      },
    },
    2: {
      name: "Chromium PDF Viewer",
      filename: "internal-pdf-viewer",
      description: "Portable Document Format",
      length: 1,
      0: { type: "application/pdf", suffixes: "pdf", description: "Portable Document Format" },
      item(i) {
        return this[i] ?? null;
      },
      namedItem() {
        return null;
      },
    },
    3: {
      name: "Microsoft Edge PDF Viewer",
      filename: "mhjfbmdgcfjbbpaeojofohoefgiehjai",
      description: "Portable Document Format",
      length: 1,
      0: { type: "application/pdf", suffixes: "pdf", description: "Portable Document Format" },
      item(i) {
        return this[i] ?? null;
      },
      namedItem() {
        return null;
      },
    },
    4: {
      name: "WebKit built-in PDF",
      filename: "internal-pdf-viewer",
      description: "Portable Document Format",
      length: 1,
      0: { type: "application/pdf", suffixes: "pdf", description: "Portable Document Format" },
      item(i) {
        return this[i] ?? null;
      },
      namedItem() {
        return null;
      },
    },
    item(i) {
      return this[i] ?? null;
    },
    namedItem() {
      return null;
    },
    refresh() {},
  },
  mimeTypes: {
    length: 1,
    0: { type: "application/pdf", suffixes: "pdf", description: "Portable Document Format" },
    item(i) {
      return this[i] ?? null;
    },
    namedItem() {
      return null;
    },
  },
  userAgentData: {
    brands: [
      { brand: "Chromium", version: "150" },
      { brand: "Not;A=Brand", version: "8" },
      { brand: "Google Chrome", version: "150" },
    ],
    mobile: false,
    platform: "macOS",
    getHighEntropyValues() {
      return Promise.resolve({
        architecture: "x86",
        bitness: "64",
        model: "",
        platformVersion: "10.15.7",
        uaFullVersion: "150.0.0.0",
        fullVersionList: [
          { brand: "Chromium", version: "150.0.0.0" },
          { brand: "Not;A=Brand", version: "8.0.0.0" },
          { brand: "Google Chrome", version: "150.0.0.0" },
        ],
        wow64: false,
      });
    },
    toJSON() {
      return { brands: this.brands, mobile: this.mobile, platform: this.platform };
    },
  },
  getBattery() {
    return Promise.resolve({ charging: true, chargingTime: 0, dischargingTime: Infinity, level: 1, onchargingchange: null, onchargingtimechange: null, ondischargingtimechange: null, onlevelchange: null });
  },
  sendBeacon() {
    return true;
  },
  javaEnabled() {
    return false;
  },
  getGamepads() {
    return [null, null, null, null];
  },
  vibrate() {
    return false;
  },
};

// --------------------------------------------------------------------------
// 6. XMLHttpRequest 桩
// --------------------------------------------------------------------------
class EventSourceStub {
  constructor(url, eventSourceInitDict) {
    this.url = String(url);
    this.withCredentials = !!(eventSourceInitDict && eventSourceInitDict.withCredentials);
    this.readyState = 0; // CONNECTING
    this.onopen = null;
    this.onmessage = null;
    this.onerror = null;
    this._listeners = {};
    // 保持 CONNECTING 状态即可; 若 VM 等待 open 事件则置为 OPEN
    setTimeout(() => {
      this.readyState = 1; // OPEN
      if (typeof this.onopen === "function") this.onopen({});
    }, 5);
  }
  addEventListener(type, cb) {
    (this._listeners[type] = this._listeners[type] || []).push(cb);
    if (type === "open") {
      setTimeout(() => {
        this.readyState = 1;
        cb({});
      }, 5);
    }
  }
  removeEventListener(type, cb) {
    const arr = this._listeners[type] || [];
    const i = arr.indexOf(cb);
    if (i >= 0) arr.splice(i, 1);
  }
  dispatchEvent(ev) {
    const arr = this._listeners[ev.type] || [];
    arr.forEach((cb) => cb(ev));
    return true;
  }
  close() {
    this.readyState = 2; // CLOSED
  }
}
EventSourceStub.CONNECTING = 0;
EventSourceStub.OPEN = 1;
EventSourceStub.CLOSED = 2;
class ImageStub {
  constructor(width, height) {
    this.width = width || 300;
    this.height = height || 150;
    this.naturalWidth = 300;
    this.naturalHeight = 150;
    this._src = "";
    this.crossOrigin = null;
    this.complete = true;
    this.currentSrc = "";
    this.decoding = "async";
    this.loading = "eager";
    this.alt = "";
    this.onload = null;
    this.onerror = null;
    this.onabort = null;
    const img = this;
    Object.defineProperty(this, "src", {
      get() {
        return img._src;
      },
      set(v) {
        img._src = v;
        img.currentSrc = v;
        if (v) {
          setTimeout(() => {
            img.complete = true;
            if (typeof img.onload === "function") img.onload();
          }, 10);
        }
      },
      configurable: true,
    });
  }
  addEventListener(type, cb) {
    if (type === "load" && typeof cb === "function") this.onload = cb;
    if (type === "error" && typeof cb === "function") this.onerror = cb;
  }
  removeEventListener() {}
}
class XMLHttpRequestUploadStub {
  constructor() {
    this.onloadstart = null;
    this.onprogress = null;
    this.onabort = null;
    this.onerror = null;
    this.onload = null;
    this.ontimeout = null;
    this.onloadend = null;
  }
  addEventListener() {}
  removeEventListener() {}
  dispatchEvent() {
    return true;
  }
}
class XMLHttpRequestStub {
  constructor() {
    this.readyState = 0;
    this.status = 0;
    this.response = "";
    this.responseText = "";
    this.responseType = "";
    this.responseURL = "";
    this.responseXML = null;
    this.timeout = 0;
    this.withCredentials = false;
    this.upload = new XMLHttpRequestUploadStub();
    this.onreadystatechange = null;
    this.onload = null;
    this.onerror = null;
    this.onabort = null;
    this.ontimeout = null;
    this.onloadstart = null;
    this.onprogress = null;
    this.onloadend = null;
    this._headers = {};
  }
  open(method, url) {
    this.readyState = 1;
    this._url = url;
  }
  setRequestHeader(k, v) {
    this._headers[k] = v;
  }
  getResponseHeader() {
    return null;
  }
  getAllResponseHeaders() {
    return "";
  }
  send() {
    this.readyState = 4;
    this.status = 200;
    this.responseText = "";
    this.response = "";
    this.onreadystatechange && this.onreadystatechange();
    this.onload && this.onload();
  }
  abort() {
    this.readyState = 0;
    this.onabort && this.onabort();
  }
  overrideMimeType() {}
  addEventListener() {}
  removeEventListener() {}
  dispatchEvent() {
    return true;
  }
  setAttributionReporting() {}
  setPrivateToken() {}
  get statusText() {
    return this.status === 200 ? "OK" : "";
  }
}
XMLHttpRequestStub.prototype.UNSENT = 0;
XMLHttpRequestStub.prototype.OPENED = 1;
XMLHttpRequestStub.prototype.HEADERS_RECEIVED = 2;
XMLHttpRequestStub.prototype.LOADING = 3;
XMLHttpRequestStub.prototype.DONE = 4;
Object.defineProperty(XMLHttpRequestStub.prototype, "SDKNativeWebApi", { value: true, configurable: true });

// --------------------------------------------------------------------------
// 7. window 对象 (含 bdms 依赖的 sessionStorage/localStorage/cookie 等)
// --------------------------------------------------------------------------
function requestAnimationFrame(cb) {
  return setTimeout(() => cb(Date.now()), 16);
}
function cancelAnimationFrame(id) {
  clearTimeout(id);
}
const window = {
  location,
  document,
  navigator,
  localStorage,
  sessionStorage,
  screen: {
    width: 1440,
    height: 900,
    availWidth: 1440,
    availHeight: 877,
    colorDepth: 24,
    pixelDepth: 24,
    availLeft: 0,
    availTop: 0,
    orientation: {
      type: "landscape-primary",
      angle: 0,
    },
    onchange: null,
  },
  devicePixelRatio: 2,
  innerWidth: 1440,
  innerHeight: 877,
  outerWidth: 1440,
  outerHeight: 877,
  screenX: 0,
  screenY: 0,
  screenLeft: 0,
  screenTop: 0,
  pageXOffset: 0,
  pageYOffset: 0,
  scrollX: 0,
  scrollY: 0,
  visualViewport: {
    width: 1440,
    height: 877,
    offsetLeft: 0,
    offsetTop: 0,
    pageLeft: 0,
    pageTop: 0,
    scale: 1,
    addEventListener() {},
    removeEventListener() {},
  },
  length: 0,
  frames: {},
  self: null, // 见下方循环引用修正
  top: null,
  parent: null,
  opener: null,
  closed: false,
  name: "",
  status: "",
  defaultStatus: "",
  origin: "https://www.toutiao.com",
  isSecureContext: true,
  crossOriginIsolated: false,
  originAgentCluster: false,
  caches: {
    open() {
      return Promise.resolve({ keys() { return Promise.resolve([]); }, match() { return Promise.resolve(undefined); } });
    },
    keys() {
      return Promise.resolve([]);
    },
    match() {
      return Promise.resolve(undefined);
    },
    has() {
      return Promise.resolve(false);
    },
  },
  cookieStore: {
    get() {
      return Promise.resolve(null);
    },
    getAll() {
      return Promise.resolve([]);
    },
    set() {
      return Promise.resolve();
    },
    delete() {
      return Promise.resolve();
    },
  },
  chrome: {
    loadTimes() {
      return {
        commitLoadTime: 0,
        connectionInfo: "h2",
        finishDocumentLoadTime: 0,
        finishLoadTime: 0,
        firstPaintAfterLoadTime: 0,
        firstPaintTime: 0,
        firstPaintAfterLoadTime: 0,
        navigationType: "Other",
        npnNegotiatedProtocol: "h2",
        requestTime: 0,
        startLoadTime: 0,
        wasAlternateProtocolAvailable: false,
        wasFetchedViaSpdy: true,
        wasNpnNegotiated: true,
      };
    },
    csi() {
      return { e: {}, s: 0, t: { a: 0, b: 0, c: 0, d: 0, e: 0 } };
    },
    runtime: {},
    app: {},
    webstore: {},
  },
  getComputedStyle() {
    return {
      getPropertyValue() {
        return "";
      },
      cssFloat: "",
      cssText: "",
      parentRule: null,
      length: 0,
    };
  },
  matchMedia() {
    return {
      matches: false,
      media: "",
      onchange: null,
      addListener() {},
      removeListener() {},
      addEventListener() {},
      removeEventListener() {},
      dispatchEvent() {
        return false;
      },
    };
  },
  getSelection() {
    return { toString() { return ""; }, rangeCount: 0, removeAllRanges() {} };
  },
  requestAnimationFrame,
  cancelAnimationFrame,
  fetch(input, init) {
    return globalThis.fetch(input, init);
  },
  setTimeout,
  setInterval,
  clearTimeout,
  clearInterval,
  addEventListener() {},
  removeEventListener() {},
  dispatchEvent() {
    return true;
  },
  postMessage() {},
  atob: (s) => Buffer.from(s, "base64").toString("binary"),
  btoa: (s) => Buffer.from(s, "binary").toString("base64"),
  structuredClone: (v) => JSON.parse(JSON.stringify(v)),
  queueMicrotask,
  createImageBitmap() {
    return Promise.resolve({});
  },
  reportError() {},
  scroll() {},
  scrollTo() {},
  scrollBy() {},
  focus() {},
  blur() {},
  open() {
    return null;
  },
  close() {},
  stop() {},
  alert() {},
  confirm() {
    return true;
  },
  prompt() {
    return null;
  },
  print() {},
};

// 循环引用修正
window.self = window;
window.top = window;
window.parent = window;
window.frames = window;
window.window = window;
window.getComputedStyle = window.getComputedStyle; // 已在对象字面量中定义

// 浏览器全局补全 (VM 会对 window 上的标准属性做存在性/原生性检测)
window.eval = eval;
window.Function = Function;
window.isNaN = isNaN;
window.parseInt = parseInt;
window.parseFloat = parseFloat;
window.encodeURIComponent = encodeURIComponent;
window.decodeURIComponent = decodeURIComponent;
window.escape = escape;
window.unescape = unescape;
window.btoa = typeof btoa !== "undefined" ? btoa : (s) => Buffer.from(s, "binary").toString("base64");
window.setTimeout = setTimeout;
window.clearTimeout = clearTimeout;
window.setInterval = setInterval;
window.clearInterval = clearInterval;
window.queueMicrotask = queueMicrotask;
window.crypto = typeof crypto !== "undefined" ? crypto : require("crypto").webcrypto;
window.performance = typeof performance !== "undefined" ? performance : undefined;
window.fetch = typeof fetch !== "undefined" ? fetch : undefined;
window.Request = typeof Request !== "undefined" ? Request : undefined;
window.Headers = typeof Headers !== "undefined" ? Headers : undefined;
window.Response = typeof Response !== "undefined" ? Response : undefined;
window.URL = URL;
window.URLSearchParams = URLSearchParams;
window.Blob = typeof Blob !== "undefined" ? Blob : undefined;
window.FormData = typeof FormData !== "undefined" ? FormData : undefined;
window.AbortController = typeof AbortController !== "undefined" ? AbortController : undefined;
window.AbortSignal = typeof AbortSignal !== "undefined" ? AbortSignal : undefined;
window.TextEncoder = typeof TextEncoder !== "undefined" ? TextEncoder : undefined;
window.TextDecoder = typeof TextDecoder !== "undefined" ? TextDecoder : undefined;
window.Promise = Promise;
window.Symbol = Symbol;
window.Object = Object;
window.Array = Array;
window.String = String;
window.Number = Number;
window.Boolean = Boolean;
window.Date = Date;
window.JSON = JSON;
window.Math = Math;
window.Reflect = Reflect;
window.Proxy = Proxy;
window.RegExp = RegExp;
window.Error = Error;
window.TypeError = TypeError;
window.ReferenceError = ReferenceError;
window.Promise = Promise;
window.setTimeout = setTimeout;
window.matchMedia =
  window.matchMedia ||
  (() => ({ matches: false, media: "", onchange: null, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent() { return false; } }));
window.requestAnimationFrame = requestAnimationFrame;
window.cancelAnimationFrame = cancelAnimationFrame;
window.getComputedStyle =
  window.getComputedStyle ||
  (() => ({
    getPropertyValue() { return ""; },
    getPropertyPriority() { return ""; },
    length: 0,
    cssText: "",
  }));
window.addEventListener = window.addEventListener || (() => {});
window.removeEventListener = window.removeEventListener || (() => {});
window.dispatchEvent = window.dispatchEvent || (() => false);
window.postMessage = window.postMessage || (() => {});

// --------------------------------------------------------------------------
// 8. 注入全局 (顺序: window/windows 必须在 bdms.js 之前)
// --------------------------------------------------------------------------
globalThis.window = window;
globalThis.windows = window; // 补丁 5284 行写入 windows.a_bogus
globalThis.location = location;
globalThis.document = document;
try {
  globalThis.navigator = navigator;
} catch (e) {
  Object.defineProperty(globalThis, "navigator", { value: navigator, configurable: true, writable: true });
}
try {
  globalThis.localStorage = localStorage;
} catch (e) {
  Object.defineProperty(globalThis, "localStorage", { value: localStorage, configurable: true, writable: true });
}
globalThis.sessionStorage = sessionStorage;
globalThis.XMLHttpRequest = XMLHttpRequestStub;
globalThis.Image = ImageStub;
globalThis.EventSource = EventSourceStub;
globalThis.window.Image = ImageStub;
globalThis.window.EventSource = EventSourceStub;
globalThis.window.XMLHttpRequest = XMLHttpRequestStub;
globalThis.windows.Image = ImageStub;
globalThis.windows.EventSource = EventSourceStub;
globalThis.windows.XMLHttpRequest = XMLHttpRequestStub;
globalThis.requestAnimationFrame = window.requestAnimationFrame;
globalThis.cancelAnimationFrame = window.cancelAnimationFrame;
globalThis.screen = window.screen;
globalThis.devicePixelRatio = 2;
globalThis.chrome = window.chrome;
globalThis.__ac_referer = "";
window.__ac_referer = "";

module.exports = {
  window,
  windows: window,
  location,
  document,
  navigator,
  localStorage,
  sessionStorage,
  XMLHttpRequest: XMLHttpRequestStub,
};

// --------------------------------------------------------------------------
// 9. Promise 观测 (仅调试, 定位悬空 await)
// --------------------------------------------------------------------------
if (process.env.PROM_DEBUG === "1") {
  const OPromise = Promise;
  const OResolve = OPromise.resolve;
  const OThen = OPromise.prototype.then;
  let seq = 0;
  OPromise.prototype.then = function (onFul, onRej) {
    const p = OThen.call(this, onFul, onRej);
    if (typeof onFul === "function" || typeof onRej === "function") {
      const id = ++seq;
      console.log("[PROM] then#" + id + " onFul=" + (typeof onFul) + " onRej=" + (typeof onRej) + " src=" + (this && this.constructor ? this.constructor.name : "?"));
      OThen.call(p, (v) => console.log("[PROM] resolved#" + id + " val=" + String(v).slice(0, 80)), (e) => console.log("[PROM] rejected#" + id + " err=" + e));
    }
    return p;
  };
  console.log("[PROM] observer installed");
}
