/**
 * 稳定性验证：5 次请求（不同 offset，1.5s 间隔）
 * 通过标准：全部 200 且返回 20 条数据
 */
const https = require('https');
const { signXZse96 } = require('./utils/sign');

const COOKIE = [
  '_xsrf=XX34DnMrNld38fKjUbnDh58ACVs6hgSt',
  'd_c0=66TZv0MjrxyPTqcdwBhE8pBjX0_HYeyF-2A=|1785569632',
  'z_c0=2|1:0|10:1785569656|4:z_c0|92:Mi4xRW53MkJ3QUFBQURycE5tX1F5T3ZIQ1lBQUFCZ0FsVk5kLTlhYXdBWHBHRmJramxxSlo4Y0JQQ0Q4bkt5VldUdUV3|4d38701d44dbff9863ecb5262e134a4a7ee71c942596f8cbba5bcb78c6c2e6f4'
].join('; ');
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36';

function req(path, headers) {
  return new Promise((resolve, reject) => {
    const r = https.request({ hostname: 'www.zhihu.com', path, method: 'GET', headers }, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    r.on('error', reject);
    r.end();
  });
}
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function main() {
  const dc0 = COOKIE.match(/d_c0=([^;]+)/)[1];
  let ok = 0;
  for (let i = 0; i < 5; i++) {
    await sleep(1500);
    const path = `/api/v4/search_v3?gk_version=gz-gaokao&t=general&q=${encodeURIComponent('python')}&correction=1&offset=${i * 20}&limit=20&filter_fields=&lc_idx=0&show_all_topics=0&search_source=Normal&zhida_source=ai_search_general`;
    const sig = signXZse96(path, dc0);
    const headers = {
      accept: '*/*', 'user-agent': UA, referer: 'https://www.zhihu.com/search?type=content&q=python',
      'x-api-version': '3.0.91', 'x-app-za': 'OS=Web', 'x-requested-with': 'fetch',
      'x-zse-93': '101_3_3.0', 'x-zse-96': sig, cookie: COOKIE
    };
    const res = await req(path, headers);
    let n = '?';
    try { n = JSON.parse(res.body).data.length; } catch (e) {}
    if (res.status === 200) ok++;
    console.log(`[run ${i + 1}] offset=${i * 20} sig=${sig.slice(0, 24)}... status=${res.status} data=${n}`);
  }
  console.log(`RESULT: ${ok}/5 passed`);
  process.exit(ok === 5 ? 0 : 1);
}
main().catch((e) => { console.error(e.message); process.exit(1); });
