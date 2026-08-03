/**
 * x-zse-96 签名器（纯 Node.js，无浏览器依赖）
 *
 * 算法还原说明：
 * 知乎 search_v3 等 API 需要请求头 x-zse-96（签名）。
 * 签名核心在 static.zhihu.com/heifetz/4876.app.*.js 的 webpack 模块 1514 中，
 * 该模块是一个 JSVMP（JS 虚拟机保护）：自定义字节码解释器 l.prototype.O，
 * 模块加载时执行 (new l).O("ABt7CAAUS...") 解码字节码，动态生成 __g._encrypt。
 *
 * 签名流程：
 *   source = [x-zse-93值("101_3_3.0"), url的path+query, d_c0, body(若有), xZst81]
 *            .filter(Boolean).join("+")
 *   md5hex = md5(source)
 *   x-zse-96 = "2.0_" + vmEncrypt(md5hex)
 *
 * 其中 vmEncrypt 内部为 SM4 变体分组加密（S盒 zb、轮密钥 zk、IV/key zm 等表
 * 由 VM 初始化生成），输出经自定义 base64（+ 替换为 =）得到 64 字符。
 * 注意：签名每次生成不同（VM 内部含时间因子），服务端验证的是可解密格式。
 *
 * 环境依赖：VM 初始化时会 eval 检测 document/navigator/location/history/screen
 * 及 HTMLDocument/Navigator/History/Screen 等浏览器对象，缺失会导致签名无效
 * （403 code 10003），因此需要下方环境补丁。
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ============ 环境补丁（VM 环境指纹检测所需） ============
function patchEnvironment() {
  if (typeof globalThis.window === 'undefined') {
    globalThis.window = globalThis;
  }
  if (typeof globalThis.document === 'undefined') {
    globalThis.document = {
      cookie: '', title: '', readyState: 'complete', hidden: false, visibilityState: 'visible',
      createElement: function () { return { style: {}, setAttribute: function () {}, getContext: function () { return null; } }; },
      querySelector: function () { return null; }, querySelectorAll: function () { return []; },
      getElementsByTagName: function () { return []; }, getElementById: function () { return null; },
      documentElement: { clientWidth: 1440, clientHeight: 900, style: {} },
      body: { clientWidth: 1440, clientHeight: 900, style: {}, appendChild: function () {} },
      head: { appendChild: function () {} }, addEventListener: function () {}, removeEventListener: function () {},
      createTextNode: function () { return {}; }, createDocumentFragment: function () { return {}; },
      location: { href: 'https://www.zhihu.com/search?type=content&q=python' }
    };
  }
  if (typeof globalThis.navigator === 'undefined') {
    globalThis.navigator = {
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',
      platform: 'MacIntel', language: 'zh-CN', languages: ['zh-CN'], cookieEnabled: true,
      onLine: true, hardwareConcurrency: 8, maxTouchPoints: 0, webdriver: false,
      plugins: { length: 0 }, mimeTypes: { length: 0 }, vendor: 'Google Inc.',
      appVersion: '5.0 (Macintosh)', doNotTrack: null, productSub: '20030107', product: 'Gecko'
    };
  }
  if (typeof globalThis.location === 'undefined') {
    globalThis.location = {
      href: 'https://www.zhihu.com/search?type=content&q=python',
      host: 'www.zhihu.com', hostname: 'www.zhihu.com', protocol: 'https:',
      pathname: '/search', search: '?type=content&q=python', hash: '', origin: 'https://www.zhihu.com'
    };
  }
  if (typeof globalThis.history === 'undefined') {
    globalThis.history = { length: 1 };
  }
  if (typeof globalThis.screen === 'undefined') {
    globalThis.screen = { width: 1440, height: 900, availWidth: 1440, availHeight: 900, colorDepth: 24, pixelDepth: 24 };
  }
  // DOM 构造器（VM eval 检测 typeof HTMLDocument 等）
  const ctors = ['HTMLDocument', 'Navigator', 'History', 'Screen', 'Location', 'HTMLElement', 'HTMLCanvasElement'];
  for (const c of ctors) {
    if (typeof globalThis[c] === 'undefined') {
      globalThis[c] = function () {};
    }
  }
}

// ============ 简易 webpack 运行时 ============
const moduleCache = {};
const moduleFns = {};

function loadModule(id, src) {
  src = String(src).replace(/^\d+:/, '').trim();
  if (!src.startsWith('(')) src = '(' + src + ')';
  moduleFns[id] = new Function('module', 'exports', 'require', 'return ' + src);
}

function webpackRequire(id) {
  if (moduleCache[id]) return moduleCache[id].exports;
  const mod = { exports: {} };
  moduleCache[id] = mod;
  const wrapper = moduleFns[id];
  if (!wrapper) throw new Error('module not found: ' + id);
  // wrapper 返回模块函数，需再调用一次执行模块体
  const fn = wrapper(mod, mod.exports, webpackRequire);
  fn(mod, mod.exports, webpackRequire);
  return mod.exports;
}

let vmLoaded = false;
function ensureVm() {
  if (vmLoaded) return;
  const dir = path.join(__dirname, '..');
  // 模块 74185: tslib typeof helper（VM 依赖 _type_of）
  loadModule(74185, fs.readFileSync(path.join(dir, 'config/mod74185.js'), 'utf8'));
  // 模块 10261: md5（备用，main 用 node:crypto 亦可）
  loadModule(10261, fs.readFileSync(path.join(dir, 'config/mod10261.js'), 'utf8'));
  // 模块 1514: JSVMP 签名虚拟机（核心）
  loadModule(1514, fs.readFileSync(path.join(dir, 'config/mod1514.js'), 'utf8'));
  vmLoaded = true;
}

/**
 * 生成 x-zse-96 签名头值
 * @param {string} urlPathWithQuery 例如 /api/v4/search_v3?gk_version=...
 * @param {string} dc0 d_c0 cookie 值
 * @param {object} opts { zse93: '101_3_3.0', body: 可选, xZst81: 可选 }
 * @returns {string} 完整 x-zse-96 头值，如 "2.0_xxxx"
 */
function signXZse96(urlPathWithQuery, dc0, opts = {}) {
  patchEnvironment();
  ensureVm();
  const m1514 = webpackRequire(1514);
  const zse93 = opts.zse93 || '101_3_3.0';
  const body = opts.body && opts.body.length <= 4096 ? opts.body : null;
  const parts = [zse93, urlPathWithQuery, dc0, body, opts.xZst81].filter(Boolean);
  const source = parts.join('+');
  const md5hex = crypto.createHash('md5').update(source).digest('hex');
  const sig = m1514.ZP(md5hex);
  return '2.0_' + sig;
}

module.exports = { signXZse96, patchEnvironment };
