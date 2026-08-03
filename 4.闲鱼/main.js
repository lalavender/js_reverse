'use strict';

/**
 * 闲鱼 H5 MTOP 接口黑盒可用版（纯协议 Node.js，零第三方依赖）
 *
 * 签名还原结论（已用 3 份真实样本 + 页面 SDK 源码双重验证）：
 *   token = _m_h5_tk cookie 中 '_' 之前的部分
 *   t     = Date.now()
 *   sign  = md5(token + "&" + t + "&" + appKey + "&" + data)
 *           （data 为 POST body 中 data 参数的原始 JSON 字符串）
 *
 * Token 自动刷新链路（与 mtop.js __processToken 一致）：
 *   ret 含 FAIL_SYS_TOKEN_EMPTY / FAIL_SYS_TOKEN_EXOIRED / FAIL_SYS_TOKEN_ILLEGAL
 *   → 从响应 Set-Cookie 提取新 _m_h5_tk → 更新 Cookie → 重试（默认最多 3 次）
 *
 * 用法：
 *   node main.js                 # 请求首页 feed（第 1 页）
 *   node main.js 3               # 请求第 3 页
 */

const https = require('https');
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');
const { md5 } = require('./lib/md5');

const HOST = 'h5api.m.goofish.com';
const API = 'mtop.taobao.idlehome.home.webpc.feed';
const VERSION = '1.0';
const APP_KEY = '34839810';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36';
const TOKEN_RE = /(?:^|;\s*)_m_h5_tk=([^;]+)/;
const TOKEN_ERROR_RE = /TOKEN_(EMPTY|EXOIRED|ILLEGAL)/;

const COOKIE_FILE = path.join(__dirname, 'config', 'cookies.json');

function loadCookies() {
  const obj = JSON.parse(fs.readFileSync(COOKIE_FILE, 'utf8'));
  return Object.entries(obj).map(([k, v]) => `${k}=${v}`).join('; ');
}

function saveCookies(cookieStr) {
  const obj = {};
  cookieStr.split('; ').forEach(kv => {
    const idx = kv.indexOf('=');
    if (idx > 0) obj[kv.slice(0, idx)] = kv.slice(idx + 1);
  });
  fs.writeFileSync(COOKIE_FILE, JSON.stringify(obj, null, 2));
}

function getToken(cookieStr) {
  const m = cookieStr.match(TOKEN_RE);
  return m ? m[1].split('_')[0] : '';
}

function mergeSetCookie(cookieStr, setCookie) {
  const map = {};
  cookieStr.split('; ').forEach(kv => {
    const idx = kv.indexOf('=');
    if (idx > 0) map[kv.slice(0, idx)] = kv.slice(idx + 1);
  });
  (setCookie || []).forEach(c => {
    const kv = c.split(';')[0];
    const idx = kv.indexOf('=');
    if (idx > 0) map[kv.slice(0, idx)] = kv.slice(idx + 1);
  });
  return Object.entries(map).map(([k, v]) => `${k}=${v}`).join('; ');
}

function buildUrl(params) {
  return `/h5/${API}/${VERSION}/?${new URLSearchParams(params)}`;
}

function request(params, cookieStr, bodyData) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      host: HOST,
      path: buildUrl(params),
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/x-www-form-urlencoded',
        'origin': 'https://www.goofish.com',
        'referer': 'https://www.goofish.com/',
        'user-agent': UA,
        'accept-encoding': 'gzip, deflate, br',
        'cookie': cookieStr,
      },
    }, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const buf = Buffer.concat(chunks);
        const enc = res.headers['content-encoding'];
        let text;
        try {
          text = enc === 'gzip' ? zlib.gunzipSync(buf).toString()
               : enc === 'deflate' ? zlib.inflateSync(buf).toString()
               : enc === 'br' ? zlib.brotliDecompressSync(buf).toString()
               : buf.toString();
        } catch (e) {
          return reject(new Error('响应解压失败: ' + e.message));
        }
        resolve({ status: res.statusCode, text, setCookie: res.headers['set-cookie'] });
      });
    });
    req.on('error', reject);
    req.end('data=' + encodeURIComponent(bodyData));
  });
}

/** 单次请求：计算 sign 并发送 */
async function sendOnce(cookieStr, data, pageNumber) {
  const bodyData = JSON.stringify({ ...data, pageNumber });
  const t = Date.now();
  const token = getToken(cookieStr);
  const sign = md5(`${token}&${t}&${APP_KEY}&${bodyData}`);

  const params = {
    jsv: '2.7.2',
    appKey: APP_KEY,
    t,
    sign,
    v: VERSION,
    type: 'originaljson',
    accountSite: 'xianyu',
    dataType: 'json',
    timeout: '20000',
    api: API,
    sessionOption: 'AutoLoginOnly',
    spm_cnt: 'a21ybx.home.0.0',
  };

  const res = await request(params, cookieStr, bodyData);
  return { body: JSON.parse(res.text), setCookie: res.setCookie, tokenUsed: token, t };
}

/** 带 token 自动刷新的完整调用（对齐 mtop.js __processToken 重试语义） */
async function fetchFeed(pageNumber = 1, maxRetries = 3) {
  let cookieStr = loadCookies();
  const data = { itemId: '', pageSize: 30, pageNumber, machId: '' };
  const seenTokens = new Set();

  for (let attempt = 0; attempt < maxRetries + 1; attempt++) {
    const token = getToken(cookieStr);
    if (seenTokens.has(token)) {
      throw new Error(`token 刷新循环：${token}`);
    }
    seenTokens.add(token);

    const r = await sendOnce(cookieStr, data, pageNumber);

    const ret = (r.body.ret || []).join(',');
    if (ret.indexOf('SUCCESS') !== -1) {
      if (r.setCookie) {
        cookieStr = mergeSetCookie(cookieStr, r.setCookie);
        saveCookies(cookieStr);
      }
      return { data: r.body.data, sign: `${r.tokenUsed}&${r.t}&${APP_KEY}&...`, raw: r.body };
    }

    if (TOKEN_ERROR_RE.test(ret)) {
      console.warn(`[token 刷新] attempt=${attempt} ret=${ret}`);
      if (!r.setCookie || !r.setCookie.find(c => c.startsWith('_m_h5_tk='))) {
        throw new Error('token 失效但服务端未下发新 _m_h5_tk: ' + ret);
      }
      cookieStr = mergeSetCookie(cookieStr, r.setCookie);
      saveCookies(cookieStr);
      continue;
    }

    throw new Error('接口调用失败: ' + ret);
  }
  throw new Error('token 刷新超过最大重试次数');
}

async function main() {
  const pageNumber = Number(process.argv[2]) || 1;
  const { data, raw } = await fetchFeed(pageNumber);

  const cards = (data && data.cardList) || [];
  console.log(`ret: ${raw.ret}`);
  console.log(`page: ${pageNumber} | cards: ${cards.length} | nextPage: ${data && data.nextPage} | feedsCount: ${data && data.feedsCount}`);
  console.log('---');
  cards.slice(0, 10).forEach(card => {
    const d = card.cardData || {};
    console.log(`[${d.itemId}] ${(d.titleSummary && d.titleSummary.text) || d.detailParams && d.detailParams.title || ''} | ¥${d.priceInfo && d.priceInfo.price} | 已售${d.soldPrice}`);
  });
}

main().catch(e => {
  console.error('FAIL:', e.message);
  process.exit(1);
});
