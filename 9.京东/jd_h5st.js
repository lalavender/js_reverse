/**
 * 京东 PC 首页 jsfbox_feed_tab 接口 h5st 签名 —— 黑盒可用版（Node.js 独立运行，无需浏览器）
 *
 * 原理（本次逆向的核心结论）：
 *  1. h5st = 10 段分号拼接；seg4/seg8 为签名（SHA256 链），seg7 为环境指纹段
 *  2. seg7 编码算法（已还原）：
 *       seg7 = 每4字符组反转( customB64( 按3字节块反转( envJSON + 填充 ) ) )
 *       字符表 rqponmlkjihgfedcbaZYXWVUTSRQPONMLKJIHGFEDCBA-_9876543210zyxwvuts
 *       填充 = 3 - (envJSON长度 % 3)，值 = 填充数
 *  3. 服务端解码 seg7 校验 env JSON 字段，403 根因是三个字段与真实浏览器不符：
 *       extend.bu3 = 45   （jsdom 原生为 -1/1）
 *       extend.bu6 = 29   （jsdom 原生为 -1）
 *       extend.bu13 = "Fd"（只应含行为标记，不得混入 pFlag）
 *     修复方式：patch SDK 内 _$P8（extend 构造器）+ 注入 JDst_behavior_flag
 *  4. fp/tk：SDK 自举（自生成 fp、自请求 cactus.jd.com/request_algo 拿 tk03+algo）
 *
 * 验证结果：HTTP 200 + code 605（"the request needs to authenticate"，与真实浏览器同级别响应；
 *           605 为账号级风控验证状态，非签名问题；403 已消除）
 *
 * 依赖：npm i（jsdom、@napi-rs/canvas、canvas->@napi-rs/canvas 的 shim）
 */

const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { instrument } = require('./utils/instrument');
const { patchEnvironment } = require('./utils/env_patch');

const SDK_FILE = path.join(__dirname, 'config', 'js_security_v3.js');
const COOKIE_FILE = path.join(__dirname, 'config', 'cookies.txt');
const OUT_FILE = path.join(__dirname, 'config', 'h5st_node_ok.txt');

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// bu2/bu3（window 层）伪装成 Chrome（虽不在 seg7 内，但保持与真实浏览器一致）
function deepPatch(win) {
  try { win.Window.toString = function() { return 'function Window() { [native code] }'; }; } catch(e) {}
  const RealError = win.Error;
  const FakeError = function(message) {
    const e = new RealError(message);
    Object.defineProperty(e, 'stack', { get: () => 'Error: ' + message + '\n    at Object.<anonymous> (https://storage.360buyimg.com/webcontainer/js_security_v3_0.1.4.js?v=20240117:5:71901)', configurable: true });
    return e;
  };
  FakeError.prototype = RealError.prototype;
  FakeError.captureStackTrace = RealError.captureStackTrace;
  try { win.Error = FakeError; } catch(e) {}
}

let _dom = null;
let _signer = null;

function createSigner() {
  const sdk = instrument(fs.readFileSync(SDK_FILE, 'utf8'));
  const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
    url: 'https://www.jd.com/',
    pretendToBeVisual: true,
    runScripts: 'dangerously',
    beforeParse: (win) => { patchEnvironment(win, UA); deepPatch(win); },
  });
  _dom = dom;
  const win = dom.window;
  // 注入行为标记（extend.bu13 = "Fd"，与真实浏览器一致）；不注入 pFlag（SDK 自管理）
  const now0 = Date.now();
  win.localStorage.setItem('JDst_behavior_flag', JSON.stringify([{ t: now0, e: 3600, v: 'Fd' }]));
  win.eval(sdk);
  _signer = new win.ParamsSign({ appId: 'b5216' });
  return _signer;
}

function signOnce(win, bodyObj) {
  const bodyRaw = JSON.stringify(bodyObj);
  const bodyHash = crypto.createHash('sha256').update(bodyRaw).digest('hex');
  const t = Date.now();
  const params = {
    appid: 'www-jd-com',
    clientVersion: '1.0.0',
    client: 'pc',
    functionId: 'jsfbox_feed_tab',
    t,
    body: bodyHash,
  };
  const r = _signer.signSync(params);
  return { h5st: r.h5st, params, bodyRaw, bodyHash, t };
}

// 等待 SDK 自举：request_algo 下发 tk03（seg3 从 tk06 变为 tk03）
async function getSigner(bodyObj) {
  if (_signer) return _signer;
  createSigner();
  const win = _dom.window;
  for (let i = 0; i < 30; i++) {
    await sleep(300);
    try {
      const h5st = signOnce(win, bodyObj).h5st;
      const seg3 = h5st.split(';')[3] || '';
      if (seg3.startsWith('tk03')) return _signer;
    } catch (e) {}
  }
  throw new Error('SDK 自举超时（未拿到 tk03）');
}

const UUID = '76161171.17856965200941994191475.1785696520.1785696520.1785696521.1';

function buildUrl({ h5st, bodyRaw, t }) {
  const urlBody = JSON.stringify({
    appid: 'www-jd-com',
    body: bodyRaw,
    clientVersion: '1.0.0',
    client: 'pc',
    functionId: 'jsfbox_feed_tab',
    t,
    uuid: UUID,
    loginType: 3,
    source: 'pc-home',
  });
  const url = new URL('https://api.m.jd.com/');
  const query = {
    appid: 'www-jd-com', client: 'pc', clientVersion: '1.0.0', t,
    uuid: UUID,
    body: urlBody, method: 'get', functionId: 'jsfbox_feed_tab', h5st,
    'x-api-eid-token': '', loginType: '3',
  };
  Object.entries(query).forEach(([k, v]) => url.searchParams.append(k, v));
  return url.toString();
}

function getCookie() {
  if (!fs.existsSync(COOKIE_FILE)) return '';
  return fs.readFileSync(COOKIE_FILE, 'utf8').trim();
}

async function request(urlStr, method = 'GET') {
  const res = await fetch(urlStr, {
    method,
    headers: {
      'accept': 'application/json, text/plain, */*',
      'origin': 'https://www.jd.com',
      'referer': 'https://www.jd.com/',
      'user-agent': UA,
      'x-referer-page': 'https://www.jd.com/',
      'x-rp-client': 'h5_2.2.0',
      'cookie': getCookie(),
    },
  });
  const text = await res.text();
  return { status: res.status, text };
}

const DEFAULT_BODY = {
  type: '5', page: 1, limit: 25, pin: 'jd_5cc1079ecc5ae',
  uuid: '17856965200941994191475', source: 'pc-home',
  groupId: '24487345', area: '27-2376-0-0', tabType: 0, productSwitch: false,
};

async function main() {
  console.log('[1/3] jsdom 加载 SDK，等待自举（fp 生成 + request_algo 领 tk03）...');
  await getSigner(DEFAULT_BODY);
  const win = _dom.window;
  console.log('      自举完成。');

  console.log('[2/3] signSync 生成 h5st...');
  const signed = signOnce(win, DEFAULT_BODY);
  const segs = signed.h5st.split(';');
  console.log('      seg0:', segs[0]);
  console.log('      seg1:', segs[1]);
  console.log('      seg3:', segs[3].slice(0, 30) + '...');
  console.log('      seg7 len:', (segs[7] || '').length, 'head:', (segs[7] || '').slice(0, 26));
  fs.writeFileSync(OUT_FILE, signed.h5st);
  console.log('      h5st 已存', OUT_FILE);

  const url = buildUrl(signed);
  console.log('[3/3] 请求 api.m.jd.com (POST)...');
  const resp = await request(url, 'GET');
  console.log('      HTTP', resp.status, resp.text.slice(0, 160));
  console.log('      （200+605 = 签名有效，账号级风控验证状态；403 = 签名无效）');
  return { signed, resp };
}

if (require.main === module) {
  main().catch((e) => { console.error('FAIL:', e.message); process.exit(1); });
}

module.exports = { signOnce, buildUrl, request, main, getSigner, DEFAULT_BODY };
