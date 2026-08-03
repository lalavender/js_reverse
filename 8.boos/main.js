#!/usr/bin/env node
/**
 * BOSS直聘 job/detail.json 纯协议请求（Node.js 独立运行）
 *
 * 协议流程（已破解并多次验证）：
 * 1. 探针请求（无 stoken）→ 37 + zpData{seed, ts, name}
 * 2. 生成 __zp_stoken__（jsdom 或缓存，见下）
 * 3. 同步 cookie：__zp_sseed__/__zp_sname__/__zp_sts__/__zp_stoken__
 * 4. 正式请求 → code 0 Success
 *
 * token 生成方式（两级）：
 * ① 缓存复用：config/cookies.json 中的 token 有效期内直接使用（26.7 天）
 * ② jsdom 生成：utils/sign.js 环境伪装执行 security-js
 *    若 jsdom 生成被服务端拒（38），说明环境指纹未完全匹配，
 *    需手动刷新缓存（见 README）
 *
 * 注意：
 * - 每次 37 响应返回新 seed，必须用最新 seed 生成 token
 * - 请求频率过高触发 IP 风控（code 35），请控制频率
 */
const https = require('https');
const fs = require('fs');
const path = require('path');
const { generateToken } = require('./utils/sign');

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36';

const BASE_COOKIE = [
  'isOHPC=1',
  '__g=-',
  '__c=' + Math.floor(Date.now() / 1000),
  '__a=14965481.' + Math.floor(Date.now() / 1000) + '..' + Math.floor(Date.now() / 1000) + '.1.1.1.1',
  'lastCity=101110100'
].join('; ');

const SECURITY_ID = process.argv[2] ||
  'XnHYo7u8Nl-ho-z1dRZiCc42VopBai7usAotMJx4uvkl97KU_AvLR0kWCsYgB4Z-GbUHpxR5wfVByYODcB1DVn8OhIYREVkyGJ4jIFaa21F7zR8t6EugalWl_ZnDgHJDmjpjHYIlpCqZ_-KB-DUnpo6XrrN6DqUj2Zu8q2u6zWT09fC3CdY__jqdEq14Ple8vZLAfygr0A4DdILqCM8vyZZtanIazH1Vj7u3Y7j7';
const LID = process.argv[3] || '6VurF5o3MY6.search.1';
const COOKIES_PATH = path.join(__dirname, 'config', 'cookies.json');

function request(urlPath, headers, body) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'www.zhipin.com',
      path: urlPath,
      method: 'POST',
      headers
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.end(body || '{}');
  });
}

async function api(urlPath, cookie) {
  return JSON.parse(await request(urlPath, {
    'accept': 'application/json, text/plain, */*',
    'content-type': 'application/json',
    'x-requested-with': 'XMLHttpRequest',
    'origin': 'https://www.zhipin.com',
    'referer': 'https://www.zhipin.com/job_detail/index.html',
    'user-agent': UA,
    'cookie': cookie
  }, '{}'));
}

function buildPath() {
  return `/wapi/zpgeek/job/detail.json?securityId=${encodeURIComponent(SECURITY_ID)}&lid=${encodeURIComponent(LID)}&_=${Date.now()}`;
}

function loadCached() {
  try {
    const cfg = JSON.parse(fs.readFileSync(COOKIES_PATH, 'utf8'));
    if (cfg.__zp_stoken__ && cfg.expireAt && Date.now() < cfg.expireAt) return cfg;
  } catch (e) {}
  return null;
}

function saveCached(token, encToken) {
  fs.writeFileSync(COOKIES_PATH, JSON.stringify({
    __zp_stoken__: token,
    __zp_stoken_encoded__: encToken,
    expireAt: Date.now() + 26 * 24 * 3600 * 1000
  }, null, 2));
}

async function main() {
  console.log('[1] 探针获取最新挑战...');
  const probeResp = await api(buildPath(), BASE_COOKIE);
  if (probeResp.code === 0) {
    console.log('    探针直接成功（已有有效 stoken）');
    return probeResp;
  }
  if (probeResp.code === 35) {
    console.error('    IP 被风控（code 35），请降低频率或更换 IP');
    process.exit(1);
  }
  const { seed, ts, name } = probeResp.zpData;
  console.log(`    获取 seed=${seed.slice(0, 20)}... ts=${ts} name=${name}`);

  console.log('[2] 生成 stoken...');
  let token, encToken;
  const cached = loadCached();
  if (cached) {
    token = cached.__zp_stoken__;
    encToken = cached.__zp_stoken_encoded__ || encodeURIComponent(token);
    console.log('    使用缓存 token（有效期内）');
  } else {
    token = generateToken(seed, ts);
    encToken = encodeURIComponent(token);
    console.log(`    jsdom 生成: ${encToken.slice(0, 30)}...`);
  }

  const fullCookie = [
    BASE_COOKIE,
    `__zp_stoken__=${encToken}`,
    `__zp_sseed__=${encodeURIComponent(seed)}`,
    `__zp_sname__=${name}`,
    `__zp_sts__=${ts}`
  ].join('; ');

  console.log('[3] 正式请求...');
  const resp = await api(buildPath(), fullCookie);
  console.log('    code:', resp.code, '| message:', resp.message);
  if (resp.code === 0) {
    const job = resp.zpData && resp.zpData.jobInfo;
    console.log('    职位:', job ? job.jobName : 'n/a');
    console.log('    公司:', resp.zpData && resp.zpData.bossInfo ? resp.zpData.bossInfo.name : 'n/a');
    saveCached(token, encToken);
    console.log('    token 已缓存（26.7 天有效）');
  } else if (resp.code === 38 && !cached) {
    console.error('    jsdom 生成被拒（38）：环境指纹未完全匹配。');
    console.error('    请在浏览器执行 gen-token.html 或从浏览器 cookie 提取 __zp_stoken__ 存入 config/cookies.json');
  }
  return resp;
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
