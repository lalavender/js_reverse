/**
 * 自动从 Chrome 获取京东 cookies（CDP 方案，含 HttpOnly，全自动）
 *
 * 背景：Chrome 136+ 禁止对默认 user-data-dir 启用 --remote-debugging-port，
 *       因此本脚本将用户 profile 的关键文件（Local State + Cookies 库）复制到
 *       临时目录，用独立 user-data-dir 启动调试 Chrome（登录态保留），
 *       CDP 拉取 cookies 后清理临时目录并恢复用户 Chrome。
 *
 * 流程：
 *  1. 优雅退出用户 Chrome
 *  2. 复制 profile 关键文件到临时目录
 *  3. 启动调试 Chrome（--user-data-dir=临时目录 --remote-debugging-port=9222）
 *  4. CDP Network.getAllCookies 拉取 cookies → 过滤京东域 → 写 config/cookies.txt
 *  5. 退出调试 Chrome，清理临时目录，恢复用户 Chrome
 *  6. 自动运行 python3 main.py 验证
 *
 * 用法：node get_cookies_cdp.js [--no-verify]
 */

const { execFileSync, spawnSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const http = require('http');

const PORT = 9222;
const CHROME_BIN = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const CHROME_DIR = path.join(os.homedir(), 'Library', 'Application Support', 'Google', 'Chrome');
const OUT_FILE = path.join(__dirname, 'config', 'cookies.txt');
const DOMAINS = ['jd.com', '360buyimg.com', '3.cn'];
const TMP_PROFILE = path.join(os.tmpdir(), 'jd-chrome-profile');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function getJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let d = '';
      res.on('data', (c) => (d += c));
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch (e) { reject(e); } });
    }).on('error', reject);
  });
}

function chromeRunning() {
  try { execFileSync('pgrep', ['-x', 'Google Chrome'], { stdio: 'ignore' }); return true; } catch (e) { return false; }
}

async function quitChrome() {
  if (!chromeRunning()) return;
  try { execFileSync('osascript', ['-e', 'tell application "Google Chrome" to quit'], { stdio: 'ignore' }); } catch (e) {}
  for (let i = 0; i < 60 && chromeRunning(); i++) await sleep(500);
}

function prepareTempProfile() {
  fs.rmSync(TMP_PROFILE, { recursive: true, force: true });
  fs.mkdirSync(path.join(TMP_PROFILE, 'Default'), { recursive: true });
  // 只需登录态关键文件，Chrome 会自动补全其余
  fs.copyFileSync(path.join(CHROME_DIR, 'Local State'), path.join(TMP_PROFILE, 'Local State'));
  const cookies = path.join(CHROME_DIR, 'Default', 'Cookies');
  fs.copyFileSync(cookies, path.join(TMP_PROFILE, 'Default', 'Cookies'));
  for (const ext of ['-journal', '-wal', '-shm']) {
    const f = cookies + ext;
    if (fs.existsSync(f)) fs.copyFileSync(f, path.join(TMP_PROFILE, 'Default', 'Cookies' + ext));
  }
}

function startDebugChrome() {
  const child = spawn(CHROME_BIN, [
    `--user-data-dir=${TMP_PROFILE}`,
    `--remote-debugging-port=${PORT}`,
    '--no-first-run', '--no-default-browser-check',
    'about:blank',
  ], { stdio: 'ignore', detached: true });
  child.unref(); // 不阻塞主进程
}

async function waitPort(timeoutMs = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const v = await getJson(`http://127.0.0.1:${PORT}/json/version`);
      if (v && v.webSocketDebuggerUrl) return v;
    } catch (e) {}
    await sleep(500);
  }
  throw new Error('Chrome 调试端口未就绪');
}

async function cdpGetCookies() {
  const list = await getJson(`http://127.0.0.1:${PORT}/json/list`);
  const page = list.find((t) => t.type === 'page') || list[0];
  if (!page || !page.webSocketDebuggerUrl) throw new Error('无可用页面 target');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  let msgId = 0;
  const send = (method, params = {}) => new Promise((resolve) => {
    const id = ++msgId;
    const onMsg = (ev) => {
      const m = JSON.parse(ev.data);
      if (m.id === id) { ws.removeEventListener('message', onMsg); resolve(m); }
    };
    ws.addEventListener('message', onMsg);
    ws.send(JSON.stringify({ id, method, params }));
  });
  try {
    await send('Network.enable');
    const r = await send('Network.getAllCookies');
    if (r.error) throw new Error(JSON.stringify(r.error));
    return r.result.cookies;
  } finally {
    try { ws.close(); } catch (e) {}
  }
}

function filterCookies(cookies) {
  const now = Date.now() / 1000;
  const hit = cookies.filter((c) =>
    DOMAINS.some((d) => (c.domain || '').includes(d)) &&
    (c.expires === -1 || c.expires > now)
  );
  const sorted = [...hit].sort((a, b) => (b.domain || '').length - (a.domain || '').length);
  const seen = new Set();
  const parts = [];
  for (const c of sorted) {
    if (seen.has(c.name)) continue;
    seen.add(c.name);
    parts.push(`${c.name}=${c.value}`);
  }
  return { hit, str: parts.join('; ') };
}

async function main() {
  const noVerify = process.argv.includes('--no-verify');

  console.log('[1/6] 退出用户 Chrome ...');
  await quitChrome();

  console.log('[2/6] 复制 profile 关键文件到临时目录 ...');
  prepareTempProfile();

  console.log('[3/6] 启动调试 Chrome（独立 profile，登录态保留）...');
  startDebugChrome();
  await waitPort();
  console.log('      调试 Chrome 已就绪');

  console.log('[4/6] CDP 拉取 cookies ...');
  const cookies = await cdpGetCookies();
  const { hit, str } = filterCookies(cookies);
  if (hit.length === 0) throw new Error('未找到京东相关 cookie（Chrome 中需已登录 www.jd.com）');
  fs.writeFileSync(OUT_FILE, str);
  const names = [...new Set(hit.map((c) => c.name))];
  console.log('      京东相关', hit.length, '条（去重', names.length, '个字段）');
  console.log('      字段:', names.join(', '));
  console.log('      已写入', OUT_FILE);

  console.log('[5/6] 退出调试 Chrome，清理临时目录，恢复用户 Chrome ...');
  await quitChrome();
  fs.rmSync(TMP_PROFILE, { recursive: true, force: true });
  execFileSync('open', ['-a', 'Google Chrome']);

  if (!noVerify) {
    console.log('[6/6] 运行 python3 main.py 验证 ...');
    const r = spawnSync('python3', ['main.py'], { stdio: 'inherit', cwd: __dirname, timeout: 90000 });
    process.exit(r.status === null ? 1 : r.status);
  }
}

main().catch((e) => {
  console.error('FAIL:', e.message);
  try { fs.rmSync(TMP_PROFILE, { recursive: true, force: true }); } catch (err) {}
  process.exit(1);
});
