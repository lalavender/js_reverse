/**
 * jsdom 环境补丁 —— 与真实浏览器（Chrome 150 macOS）对齐
 * 依据：浏览器 evaluate_js 采集的真实值
 */
function patchEnvironment(win, UA) {
  const browserValues = {
    language: 'zh-CN',
    languages: ['zh-CN', 'zh'],
    mimeTypesLen: 2,
    pluginsLen: 5,
    appVersion: '5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',
    screenW: 2560,
    screenH: 1440,
    outerW: 2043,
    outerH: 1366,
    devicePixelRatio: 1,
    hardwareConcurrency: 8,
    deviceMemory: 8,
    referrer: 'https://www.jd.com/',
  };

  // --- navigator ---
  const nav = win.navigator;
  const defineNav = (key, val) => {
    try { Object.defineProperty(nav, key, { get: () => val, configurable: true }); } catch (e) {}
  };
  defineNav('userAgent', UA);
  defineNav('platform', 'MacIntel');
  defineNav('vendor', 'Google Inc.');
  defineNav('language', browserValues.language);
  defineNav('languages', browserValues.languages);
  defineNav('appVersion', browserValues.appVersion);
  defineNav('hardwareConcurrency', browserValues.hardwareConcurrency);
  defineNav('deviceMemory', browserValues.deviceMemory);
  defineNav('webdriver', false);

  // plugins：构造 PluginArray（5 个插件）
  try {
    const pluginNames = ['PDF Viewer', 'Chrome PDF Viewer', 'Chromium PDF Viewer', 'Microsoft Edge PDF Viewer', 'WebKit built-in PDF'];
    const items = pluginNames.map((name, i) => {
      const p = { name, filename: `internal-pdf-viewer-${i}`, description: 'Portable Document Format', length: 0, item: () => null, namedItem: () => null, 0: null };
      return p;
    });
    Object.defineProperty(nav.plugins, 'length', { get: () => pluginNames.length, configurable: true });
    for (let i = 0; i < pluginNames.length; i++) {
      Object.defineProperty(nav.plugins, i, { get: () => items[i], configurable: true });
    }
  } catch (e) {}

  // mimeTypes：独立 try（Chrome 为 2）
  try {
    Object.defineProperty(nav.mimeTypes, 'length', { get: () => browserValues.mimeTypesLen, configurable: true });
    const items = [
      { type: 'application/pdf', suffixes: 'pdf', description: 'Portable Document Format', enabledPlugin: nav.plugins[0] },
      { type: 'text/pdf', suffixes: 'pdf', description: 'Portable Document Format', enabledPlugin: nav.plugins[0] },
    ];
    for (let i = 0; i < browserValues.mimeTypesLen; i++) {
      Object.defineProperty(nav.mimeTypes, i, { get: () => items[i], configurable: true });
    }
  } catch (e) {}

  // --- screen ---
  const sc = win.screen;
  for (const [k, v] of [['width', browserValues.screenW], ['height', browserValues.screenH], ['availWidth', browserValues.screenW], ['availHeight', browserValues.screenH], ['colorDepth', 24], ['pixelDepth', 24]]) {
    try { Object.defineProperty(sc, k, { get: () => v, configurable: true }); } catch (e) {}
  }

  // --- window ---
  for (const [k, v] of [['outerWidth', browserValues.outerW], ['outerHeight', browserValues.outerH], ['innerWidth', 2043], ['innerHeight', 1205], ['devicePixelRatio', browserValues.devicePixelRatio]]) {
    try { Object.defineProperty(win, k, { get: () => v, configurable: true }); } catch (e) {}
  }

  // chrome 对象
  if (!win.chrome) {
    try {
      win.chrome = { runtime: {}, loadTimes: () => ({}), csi: () => ({}), app: {} };
    } catch (e) {}
  }

  // document.referrer（location 只读，referrer 可覆写）
  // 浏览器主页面 referrer 为 www.jd.com/（首页直入时）
  try { Object.defineProperty(win.document, 'referrer', { get: () => browserValues.referrer, configurable: true }); } catch (e) {}

  // cookie 基础（SDK 通过 document.cookie 读 pwdt_id/pt_pin/pinId 等）
  // 浏览器实测：pwdt_id/pt_pin 为空，pin/pinId 有值（pp 只含 p2）
  try {
    const cookies = [
      'pin=jd_5cc1079ecc5ae',
      'pinId=_BR-i6nGip6cVUMdjlE_erV9-x-f3wj7',
      '__jdu=17856965200941994191475',
      'unick=%E4%B9%84%E4%B8%80%E5%8F%B6%E7%9F%A5%E7%A7%8B%E4%B9%84',
      'ceshi3.com=201',
    ];
    // 始终覆写 cookie getter（jsdom 默认空）
    Object.defineProperty(win.document, 'cookie', {
      get: () => cookies.join('; '),
      set: () => {},
      configurable: true,
    });
  } catch (e) {}
}

module.exports = { patchEnvironment };
