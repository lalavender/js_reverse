const crypto = require('crypto');

const APP_KEY = '12574478';

function md5(str) {
  return crypto.createHash('md5').update(str, 'utf8').digest('hex');
}

/**
 * mtop 签名（当前搜索页真实使用，源码位于
 * g.alicdn.com/main-search/pc-search-2024/1.8.49/js/main.js 的 WindVane 请求层：
 *   sign = md5(token + "&" + t + "&" + appKey + "&" + data)
 * token 取自 cookie _m_h5_tk（下划线前部分）
 */
function mtopSign(token, t, appKey, data) {
  return md5(token + '&' + t + '&' + appKey + '&' + data);
}

/** 从 _m_h5_tk cookie 取值取 "_" 前部分作为 token */
function extractToken(cookieString) {
  const m = /(?:^|;\s*)_m_h5_tk=([^;]+)/.exec(cookieString);
  if (!m) return '';
  return m[1].split('_')[0];
}

function cookieObjToStr(cookies) {
  return Object.entries(cookies).map(([k, v]) => k + '=' + v).join('; ');
}

module.exports = { APP_KEY, md5, mtopSign, extractToken, cookieObjToStr };
