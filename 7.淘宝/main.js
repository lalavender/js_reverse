#!/usr/bin/env node
/**
 * 淘宝 PC 搜索接口自动化（当前线上生效版）
 *
 * 说明：2026-08 起 s.taobao.com 搜索数据接口已整体迁移到 mtop：
 *   POST https://h5api.m.taobao.com/h5/mtop.relationrecommend.wirelessrecommend.recommend/2.0/
 * sign 为 URL 查询参数：md5(token & "&" & t & "&" & appKey & "&" & data)
 *   - token = cookie _m_h5_tk 下划线前部分（可由 h5api 首请求下发）
 *   - t     = 13 位毫秒时间戳
 *   - appKey = 12574478
 *   - data  = 序列化后的业务参数 JSON 字符串
 *
 * 用法：
 *   node main.js [关键词] [页码]    默认关键词 紫砂壶
 */
const fs = require('fs');
const path = require('path');
const { mtopSign, extractToken } = require('./utils/sign');
const { request } = require('./utils/request');

const API = 'https://h5api.m.taobao.com/h5/mtop.relationrecommend.wirelessrecommend.recommend/2.0/';
const APP_KEY = '12574478';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36';

function loadCookies() {
  const p = path.join(__dirname, 'config', 'cookies.json');
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

/** 组装搜索业务参数（与页面 c$ 组装器对齐，字段为浏览器真实抓包结构） */
function buildSearchParams(q, page, extra = {}) {
  const now = Date.now();
  return {
    appId: '34385',
    params: JSON.stringify({
      q,
      page,
      n: 48,
      pageSize: '49',
      totalPage: '100',
      totalResults: '4800',
      tab: 'all',
      qSource: 'url',
      pageSource: 'a21bo.jianhua/a.search_hover.0',
      sort: '_coefp',
      sourceS: '0',
      bcoffset: '',
      ntoffset: '',
      filterTag: '',
      service: '',
      prop: '',
      loc: '',
      start_price: null,
      end_price: null,
      startPrice: null,
      endPrice: null,
      itemIds: null,
      p4pIds: null,
      p4pS: null,
      categoryp: '',
      ha3Kvpairs: null,
      myCNA: '',
      screenResolution: '1920x1080',
      viewResolution: '1905x3264',
      userAgent: UA,
      areaCode: 'CN',
      countryNum: '156',
      m: 'pc',
      vm: 'nw',
      clientType: 'h5',
      isNewDomainAb: 'false',
      forceOldDomain: 'false',
      ...extra,
    }),
  };
}

async function ensureToken(cookies) {
  if (extractToken(cookieHeader(cookies))) return cookies;
  // 首次无 token：先打一次 mtop 拿 _m_h5_tk（响应 Set-Cookie 下发）
  const t = String(Date.now());
  const data = JSON.stringify({ appId: '34385', params: '{}' });
  const url = API + '?jsv=2.7.2&appKey=' + APP_KEY + '&t=' + t + '&sign=' + mtopSign('', t, APP_KEY, data) +
    '&api=mtop.relationrecommend.WirelessRecommend.recommend&v=2.0&type=originaljson&dataType=jsonp&data=' + encodeURIComponent(data);
  const res = await request('GET', url, { cookies });
  if (res.cookies['_m_h5_tk']) {
    cookies['_m_h5_tk'] = res.cookies['_m_h5_tk'];
    fs.writeFileSync(path.join(__dirname, 'config', 'cookies.json'), JSON.stringify(cookies, null, 2));
    console.log('[token] 已获取新 _m_h5_tk:', res.cookies['_m_h5_tk']);
  }
  return cookies;
}

function cookieHeader(cookies) {
  return Object.entries(cookies).map(([k, v]) => k + '=' + v).join('; ');
}

/** 单次 mtop 搜索请求 */
async function searchOnce(cookies, q, page, extra) {
  const token = extractToken(cookieHeader(cookies));
  const t = String(Date.now());
  const data = JSON.stringify(buildSearchParams(q, page, extra));
  const sign = mtopSign(token, t, APP_KEY, data);

  const qs = new URLSearchParams({
    jsv: '2.7.2',
    appKey: APP_KEY,
    t,
    sign,
    api: 'mtop.relationrecommend.WirelessRecommend.recommend',
    v: '2.0',
    timeout: 10000,
    type: 'originaljson',
    dataType: 'jsonp',
    data,
  });

  const res = await request('GET', API + '?' + qs.toString(), {
    cookies,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });

  const json = JSON.parse(res.body);
  const ret = (json.ret || []).join(',');
  if (ret.includes('TOKEN_EXPIRED') || ret.includes('TOKEN_EMPTY') || ret.includes('ILLEGAL_ACCESS')) {
    return { expired: true, json };
  }
  return { expired: false, json };
}

async function main() {
  const q = process.argv[2] || '紫砂壶';
  const page = Number(process.argv[3] || 1);

  let cookies = loadCookies();
  cookies = await ensureToken(cookies);

  let { expired, json } = await searchOnce(cookies, q, page);
  if (expired) {
    console.log('[token] 失效，尝试刷新后重试...');
    delete cookies['_m_h5_tk'];
    cookies = await ensureToken(cookies);
    ({ expired, json } = await searchOnce(cookies, q, page));
    if (expired) throw new Error('token 刷新后仍失败: ' + (json.ret || []).join(','));
  }

  const ret = (json.ret || []).join(',');
  if (!ret.includes('SUCCESS')) {
    console.error('接口失败:', ret);
    return;
  }

  const d = json.data || {};
  const items = d.itemsArray || [];
  console.log(`ret: ${ret} | 关键词: ${q} | 第${page}页 | 命中 ${items.length} 条`);
  console.log('='.repeat(70));
  for (const it of items.slice(0, 10)) {
    const title = (it.title || '').replace(/<[^>]+>/g, '');
    console.log(`[${it.isP4p ? 'AD' : '  '}] ¥${it.price || ''} | ${title.slice(0, 50)} | id=${it.item_id}`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
