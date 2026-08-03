/**
 * 知乎 search_v3 搜索接口 - 纯协议 Node.js 客户端
 *
 * 还原参数：请求头 x-zse-96（签名）
 * 生成方式：utils/sign.js —— 提取自 heifetz/4876.app.*.js 模块 1514（JSVMP）
 *
 * 运行：node main.js
 */

const https = require('https');
const { signXZse96 } = require('./utils/sign');

// ============ 配置区 ============
const COOKIE = [
  '_xsrf=XX34DnMrNld38fKjUbnDh58ACVs6hgSt',
  'd_c0=66TZv0MjrxyPTqcdwBhE8pBjX0_HYeyF-2A=|1785569632',
  'z_c0=2|1:0|10:1785569656|4:z_c0|92:Mi4xRW53MkJ3QUFBQURycE5tX1F5T3ZIQ1lBQUFCZ0FsVk5kLTlhYXdBWHBHRmJramxxSlo4Y0JQQ0Q4bkt5VldUdUV3|4d38701d44dbff9863ecb5262e134a4a7ee71c942596f8cbba5bcb78c6c2e6f4'
].join('; ');

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36';
const HOST = 'www.zhihu.com';
const API_PATH = '/api/v4/search_v3';
const QUERY = {
  gk_version: 'gz-gaokao',
  t: 'general',
  q: 'python',
  correction: '1',
  offset: '0',
  limit: '20',
  filter_fields: '',
  lc_idx: '0',
  show_all_topics: '0',
  search_source: 'Normal',
  zhida_source: 'ai_search_general'
};

// ============ 请求封装 ============
function buildPath(query) {
  const qs = Object.entries(query)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
  return `${API_PATH}?${qs}`;
}

function request(path, headers) {
  return new Promise((resolve, reject) => {
    const req = https.request(
      { hostname: HOST, path, method: 'GET', headers },
      (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
      }
    );
    req.on('error', reject);
    req.end();
  });
}

function getDC0() {
  const m = COOKIE.match(/d_c0=([^;]+)/);
  return m ? m[1] : '';
}

// ============ 主流程 ============
async function main() {
  const path = buildPath(QUERY);
  const dc0 = getDC0();

  // 1. 生成签名
  const xZse96 = signXZse96(path, dc0);
  console.log('[sign] x-zse-96 =', xZse96);

  // 2. 构造请求头
  const headers = {
    accept: '*/*',
    'accept-language': 'zh-CN,zh;q=0.9',
    'user-agent': UA,
    referer: `https://www.zhihu.com/search?type=content&q=${encodeURIComponent(QUERY.q)}`,
    'x-api-version': '3.0.91',
    'x-app-za': 'OS=Web',
    'x-requested-with': 'fetch',
    'x-zse-93': '101_3_3.0',
    'x-zse-96': xZse96,
    cookie: COOKIE
  };

  // 3. 请求接口
  const res = await request(path, headers);
  console.log('[http] status =', res.status);
  try {
    const json = JSON.parse(res.body);
    const items = (json.data || []).map((d) => {
      const obj = d.object || {};
      return { type: d.type, title: obj.title || obj.question?.title || obj.name || '', url: obj.url || '' };
    });
    console.log(`[data] 共 ${items.length} 条结果（前 3 条）：`);
    items.slice(0, 3).forEach((it) => console.log('  -', it.type, '|', (it.title || '').slice(0, 60)));
    if (json.paging) console.log('[data] is_end =', json.paging.is_end);
  } catch (e) {
    console.log('[http] body =', res.body.slice(0, 300));
  }
}

main().catch((e) => {
  console.error('[error]', e.message);
  process.exit(1);
});
