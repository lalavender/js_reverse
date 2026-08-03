// 通过 CDP (puppeteer-core + 本机 Chrome) 分析抖音页面 SDK 初始化条件
const puppeteer = require('/Users/lavender/node_modules/puppeteer-core');
const os = require('os');
const fs = require('fs');
const path = require('path');

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

async function main() {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'douyin-cdp-'));
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    userDataDir: profile,
    args: [
      '--no-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--window-size=1440,900',
      '--lang=zh-CN',
    ],
    defaultViewport: { width: 1440, height: 900 },
  });

  const page = await browser.newPage();
  await page.setUserAgent(
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'
  );

  // 捕获所有相关脚本 URL
  page.on('response', async (r) => {
    const u = r.url();
    if (/webmssdk|bdms|secsdk|sdk-glue|glue|mssdk|rc-client-security|security/i.test(u)) {
      console.log('[net]', r.status(), u.slice(0, 220));
    }
  });

  // 捕获带 a_bogus / X-Bogus / __ac_signature 的请求
  page.on('request', (r) => {
    const u = r.url();
    if (/a_bogus|X-Bogus|__ac_signature|_signature/i.test(u)) {
      console.log('[req]', u.slice(0, 300));
      globalThis.__signedUrl = globalThis.__signedUrl || u;
    }
  });

  // 捕获真实 frontierSign 的入参与返回值
  await page.evaluateOnNewDocument(() => {
    const prev = window.__captured;
    const hookAc = () => {
      const ac = window.byted_acrawler;
      if (ac && typeof ac.frontierSign === 'function' && !ac.__hookedFs) {
        ac.__hookedFs = true;
        const orig = ac.frontierSign;
        ac.frontierSign = function (url) {
          const r = orig.apply(this, arguments);
          window.__captured.fsCalls = window.__captured.fsCalls || [];
          window.__captured.fsCalls.push({ url: url, result: r });
          return r;
        };
      }
    };
    const iv = setInterval(hookAc, 200);
    setTimeout(() => clearInterval(iv), 30000);

    // 包裹 _$webrt_1668687510, 记录所有调用
    const hookWebrt = () => {
      const w = window._$webrt_1668687510;
      if (typeof w === 'function' && !w.__hooked) {
        w.__hooked = true;
        window.__webrtOrig = w;
        window._$webrt_1668687510 = function (hex) {
          const r = window.__webrtOrig.apply(this, arguments);
          window.__captured.webrtCalls = window.__captured.webrtCalls || [];
          window.__captured.webrtCalls.push({
            inLen: hex ? hex.length : 0,
            inHead: hex ? hex.slice(0, 40) : null,
            outType: typeof r,
            outLen: typeof r === 'string' ? r.length : (r && r.length) || 0,
            outHead: typeof r === 'string' ? r.slice(0, 30) : (r && r.slice ? r.slice(0, 30) : null),
            stack: new Error().stack.split('\n').slice(1, 4).join(' | '),
          });
          return r;
        };
      }
    };
    const iv2 = setInterval(hookWebrt, 200);
    setTimeout(() => clearInterval(iv2), 40000);

    // 捕获 registToModule / registToGlobal 调用
    const hookRegist = () => {
      const w = window;
      if (typeof w.registToModule === 'function' && !w.registToModule.__hooked) {
        const orig = w.registToModule;
        w.registToModule.__hooked = true;
        w.registToModule = function (name, mod) {
          window.__captured.registrations = window.__captured.registrations || [];
          let desc = null;
          try {
            desc = JSON.stringify(mod, (k, v) => {
              if (typeof v === 'function') return 'fn:' + (v.name || 'anon');
              if (v && typeof v === 'object' && v.length === undefined) return '[obj]';
              return v;
            });
          } catch (e) { desc = 'json-err:' + e.message; }
          window.__captured.registrations.push({ name: name, type: typeof mod, keys: mod && typeof mod === 'object' ? Object.keys(mod).slice(0, 30) : null, desc: (desc || '').slice(0, 1500) });
          return orig.apply(this, arguments);
        };
      }
      if (typeof w.registToGlobal === 'function' && !w.registToGlobal.__hooked) {
        const orig = w.registToGlobal;
        w.registToGlobal.__hooked = true;
        w.registToGlobal = function (name, mod) {
          window.__captured.globalRegs = window.__captured.globalRegs || [];
          window.__captured.globalRegs.push({ name: name, type: typeof mod, fnName: typeof mod === 'function' ? mod.name : null });
          return orig.apply(this, arguments);
        };
      }
    };
    const iv3 = setInterval(hookRegist, 100);
    setTimeout(() => clearInterval(iv3), 50000);

    // 在赋值瞬间包裹 _$webrt_1668687510 (webmssdk.es5.js 一加载就赋值)
    let _webrtVal = undefined;
    Object.defineProperty(window, '_$webrt_1668687510', {
      configurable: true,
      enumerable: true,
      get() { return _webrtVal; },
      set(v) {
        if (typeof v === 'function' && !v.__hooked2) {
          v.__hooked2 = true;
          _webrtVal = function (hex) {
            let r;
            try { r = v.apply(this, arguments); } catch (e) { r = 'THREW:' + e.message; }
            window.__captured.webrtCalls2 = window.__captured.webrtCalls2 || [];
            window.__captured.webrtCalls2.push({
              inLen: hex ? hex.length : 0,
              inHead: hex ? hex.slice(0, 50) : null,
              outLen: typeof r === 'string' ? r.length : (r && r.length) || 0,
              outHead: typeof r === 'string' ? r.slice(0, 40) : null,
              stack: new Error().stack.split('\n').slice(2, 5).join(' | '),
            });
            return r;
          };
        } else {
          _webrtVal = v;
        }
      },
    });

    // 用 Proxy 包裹 byted_acrawler, 赋值 frontierSign 时立即包装
    let _acVal = undefined;
    Object.defineProperty(window, 'byted_acrawler', {
      configurable: true,
      enumerable: true,
      get() { return _acVal; },
      set(v) {
        if (v && typeof v === 'object' && !v.__proxied) {
          v.__proxied = true;
          _acVal = new Proxy(v, {
            set(target, prop, value) {
              if (prop === 'frontierSign' && typeof value === 'function' && !value.__hookedAc) {
                value.__hookedAc = true;
                const orig = value;
                value = function (url) {
                  let r;
                  try { r = orig.apply(this, arguments); } catch (e) { r = { __err: e.message }; }
                  window.__captured.acCalls = window.__captured.acCalls || [];
                  window.__captured.acCalls.push({
                    urlHead: String(url).slice(0, 120),
                    urlLen: String(url).length,
                    out: r,
                    stack: new Error().stack.split('\n').slice(2, 5).join(' | '),
                  });
                  return r;
                };
              }
              return Reflect.set(target, prop, value);
            },
          });
        } else {
          _acVal = v;
        }
      },
    });

    // 记录 fetch/XHR 最终 URL 是否带 a_bogus 及调用栈
    const origOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function () {
      const u = String(arguments[1] || '');
      if (/a_bogus/.test(u)) {
        window.__captured.xhrSigned = window.__captured.xhrSigned || [];
        window.__captured.xhrSigned.push({ url: u, stack: new Error().stack.split('\n').slice(1, 6).join(' | ') });
      }
      return origOpen.apply(this, arguments);
    };
  });

  // 页面加载前注入属性钩子, 捕获 SDK 初始化配置
  await page.evaluateOnNewDocument(() => {
    window.__captured = { glueInit: null, bdmsInit: null, acInit: null };
    const hook = (name, apply) => {
      let val;
      Object.defineProperty(window, name, {
        configurable: true,
        enumerable: true,
        get() { return val; },
        set(v) { val = apply(v); },
      });
    };
    hook('_SdkGlueInit', (fn) => {
      if (typeof fn !== 'function') return fn;
      return function (config) {
        window.__captured.glueInit = config;
        return fn.apply(this, arguments);
      };
    });
    hook('bdms', (obj) => {
      if (obj && typeof obj.init === 'function') {
        const orig = obj.init;
        obj.init = function (cfg) {
          window.__captured.bdmsInit = cfg;
          return orig.apply(this, arguments);
        };
      }
      return obj;
    });
    hook('byted_acrawler', (obj) => {
      if (obj && typeof obj.init === 'function') {
        const orig = obj.init;
        obj.init = function (cfg) {
          window.__captured.acInit = cfg;
          return orig.apply(this, arguments);
        };
      }
      return obj;
    });
  });

  console.log('[nav] goto douyin ...');
  await page.goto('https://www.douyin.com/', {
    waitUntil: 'networkidle2',
    timeout: 90000,
  });
  console.log('[nav] loaded, title=', await page.title());

  await new Promise((r) => setTimeout(r, 8000));

  const state = await page.evaluate(() => {
    const cap = window.__captured || {};
    const out = {
      glueInit: cap.glueInit,
      bdmsInit: cap.bdmsInit,
      acInit: cap.acInit,
      fsCalls: cap.fsCalls || null,
      webrtCalls: (cap.webrtCalls || []).slice(0, 12),
      webrtCalls2: (cap.webrtCalls2 || []).slice(0, 12),
      acCalls: (cap.acCalls || []).slice(0, 12),
      xhrSigned: cap.xhrSigned || null,
      registrations: cap.registrations || null,
      globalRegs: cap.globalRegs || null,
    };
    out.globals = {
      SdkGlueInit: typeof window._SdkGlueInit,
      SdkGlueInitSrc: typeof window._SdkGlueInit === 'function' ? String(window._SdkGlueInit).slice(0, 500) : null,
      sdkGlueVersionMap: window._sdkGlueVersionMap,
      jsvmprt: typeof window._$jsvmprt,
      webrt: typeof window._$webrt_1668687510,
      webrtLen: typeof window._$webrt_1668687510 === 'function' ? window._$webrt_1668687510.length : null,
      webrtSrc: typeof window._$webrt_1668687510 === 'function' ? String(window._$webrt_1668687510).slice(0, 200) : null,
      bdms: typeof window.bdms,
      acrawler: typeof window.byted_acrawler,
      bdmsKeys: window.bdms ? Object.keys(window.bdms) : null,
      acKeys: window.byted_acrawler ? Object.keys(window.byted_acrawler) : null,
      onwheelx: typeof window.onwheelx,
      SECURE_VERSION: window.$SECURE_VERSION,
    };
    return out;
  });
  console.log('[state]', JSON.stringify(state, null, 2));

  // 输出一条完整带 a_bogus 的 URL
  const signed = await page.evaluate(() => globalThis.__signedUrl || null);
  if (signed) console.log('[signed]', signed);

  // 读取 SDK 内部状态: loadMap 等 (通过 bdms 内部无法直接访问, 尝试抓取 block 相关全局)
  const extra = await page.evaluate(() => {
    const keys = Object.getOwnPropertyNames(window);
    const interesting = keys.filter((k) => /sdk|glue|sec|load|strategy|runtime|bogus|sign/i.test(k));
    return interesting.slice(0, 80);
  });
  console.log('[globals]', extra.join(','));

  // 等一段时间观察首页自动请求是否带 a_bogus
  await new Promise((r) => setTimeout(r, 15000));
  console.log('[done]');
  await browser.close();
}

main().catch((e) => {
  console.error('[fatal]', e);
  process.exit(1);
});
