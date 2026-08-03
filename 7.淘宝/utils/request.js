const https = require('https');
const http = require('http');
const { URL } = require('url');

function buildCookieHeader(cookies) {
  return Object.entries(cookies).map(([k, v]) => k + '=' + v).join('; ');
}

function parseSetCookieHeaders(rawHeaders) {
  const out = {};
  for (let i = 0; i < rawHeaders.length; i += 2) {
    if (rawHeaders[i].toLowerCase() === 'set-cookie') {
      const parts = rawHeaders[i + 1].split(';');
      const kv = parts[0].split('=');
      if (kv.length >= 2) out[kv[0].trim()] = kv.slice(1).join('=');
    }
  }
  return out;
}

/** 通用请求：返回 { status, headers, body }，自动处理 Set-Cookie 合并 */
function request(method, urlStr, { headers = {}, body = null, cookies = {} } = {}) {
  const url = new URL(urlStr);
  const mod = url.protocol === 'https:' ? https : http;
  const cookieStr = buildCookieHeader(cookies);

  return new Promise((resolve, reject) => {
    const req = mod.request(url, {
      method,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Accept-Language': 'zh-CN,zh;q=0.9',
        'Referer': 'https://s.taobao.com/',
        ...(cookieStr ? { Cookie: cookieStr } : {}),
        ...headers,
      },
    }, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const bodyBuf = Buffer.concat(chunks);
        const newCookies = parseSetCookieHeaders(res.rawHeaders);
        resolve({
          status: res.statusCode,
          headers: res.headers,
          cookies: newCookies,
          body: bodyBuf.toString('utf8'),
        });
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

module.exports = { request, buildCookieHeader };
