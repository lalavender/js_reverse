/**
 * 京东 PC 首页 jsfbox_feed_tab 接口 h5st 签名 —— 黑盒可用版（主入口）
 *
 * 所有动态值本地生成（不依赖浏览器抓包）：
 *   - t       ：Date.now() 毫秒时间戳
 *   - uuid    ：本地生成（或从 cookies.txt 的 __jda 提取，保持一致）
 *   - body    ：接口内层 body（JSON 字符串）
 *   - h5st    ：jsdom + 官方 SDK 本地生成（fp/tk 自举 + extend 修复 + 真实 canvas）
 *
 * 用法：
 *   node main.js            # 生成签名并直接请求（验证用）
 *   node main.js --json     # 仅输出 JSON（含 url/cookie/h5st 等），供 main.py 调用
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

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ---------- uuid 本地生成（与 __jda 同格式，优先取 cookies.txt 中的 __jda） ---------- */
function localUuid() {
  try {
    const cookie = getCookie();
    const m = cookie.match(/(?:^|;\s*)__jda=([^;]+)/);
    if (m && m[1]) return m[1];
  } catch (e) {}
  const t = Date.now();
  const rand = () => Math.floor(Math.random() * 1e5).toString();
  const jdu = String(Date.now()) + String(Math.floor(Math.random() * 1e5)).padStart(5, '0');
  return `${rand()}.${jdu}.${t}.${t}.${t + 1}.1`;
}

/* ---------- 环境伪装（与真实 Chrome 对齐） ---------- */
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
  // 行为标记（extend.bu13="Fd"）；pFlag 不注入，由 SDK 自管理
  win.localStorage.setItem('JDst_behavior_flag', JSON.stringify([{ t: Date.now(), e: 3600, v: 'Fd' }]));
  win.eval(sdk);
  _signer = new win.ParamsSign({ appId: 'b5216' });
  return _signer;
}

async function getSigner(bodyObj) {
  if (_signer) return _signer;
  createSigner();
  const win = _dom.window;
  for (let i = 0; i < 30; i++) {
    await sleep(300);
    try {
      const h5st = signOnce(win, bodyObj).h5st;
      if ((h5st.split(';')[3] || '').startsWith('tk03')) return _signer;
    } catch (e) {}
  }
  throw new Error('SDK 自举超时（未拿到 tk03）');
}

function signOnce(win, bodyObj, uuid) {
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
  return { h5st: r.h5st, params, bodyRaw, bodyHash, t, uuid };
}

function buildUrl({ h5st, bodyRaw, t, uuid }) {
  const urlBody = JSON.stringify({
    appid: 'www-jd-com',
    body: bodyRaw,
    clientVersion: '1.0.0',
    client: 'pc',
    functionId: 'jsfbox_feed_tab',
    t,
    uuid,
    loginType: 3,
    source: 'pc-home',
  });
  const url = new URL('https://api.m.jd.com/');
  const query = {
    appid: 'www-jd-com', client: 'pc', clientVersion: '1.0.0', t,
    uuid,
    body: urlBody, method: 'get', functionId: 'jsfbox_feed_tab', h5st,
    'x-api-eid-token': '', loginType: '3',
  };
  Object.entries(query).forEach(([k, v]) => url.searchParams.append(k, v));
  return { url: url.toString(), urlBody };
}

function getCookie() {
  if (!fs.existsSync(COOKIE_FILE)) return '';
  return fs.readFileSync(COOKIE_FILE, 'utf8').trim();
}

async function request(urlStr) {
  const res = await fetch(urlStr, {
    method: 'GET',
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

async function gen() {
  await getSigner(DEFAULT_BODY);
  const win = _dom.window;
  const uuid = localUuid();
  const signed = signOnce(win, DEFAULT_BODY, uuid);
  const { url, urlBody } = buildUrl(signed);
  return { ...signed, url, urlBody, uuid, cookie: getCookie() };
}

async function main() {
  const isJson = process.argv.includes('--json');
  const data = await gen();
  if (isJson) {
    // stdout 只输出 JSON（日志走 stderr）
    process.stderr.write(`[sign] h5st len=${data.h5st.length} seg7 head=${data.h5st.split(';')[7].slice(0, 26)}\n`);
    process.stdout.write(JSON.stringify({
      h5st: data.h5st,
      t: data.t,
      uuid: data.uuid,
      bodyRaw: data.bodyRaw,
      url: data.url,
      cookie: data.cookie,
    }));
    return;
  }
  console.log('t    :', data.t);
  console.log('uuid :', data.uuid);
  console.log('h5st :', data.h5st.slice(0, 60) + '...');
  console.log('请求 api.m.jd.com ...');
  const resp = await request(data.url);
  console.log('HTTP', resp.status, resp.text.slice(0, 200));
  return { data, resp };
}

if (require.main === module) {
  main().catch((e) => { console.error('FAIL:', e.message); process.exit(1); });
}

module.exports = { gen, signOnce, buildUrl, request, localUuid, DEFAULT_BODY };
