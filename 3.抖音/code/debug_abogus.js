// 真实浏览器调试: 注入带日志断点的 bdms.js, 观察 var m = n.apply(d, e) 处的 a_bogus
// 用法: node debug_abogus.js
// 预期输出: [page] [vm-bogus] <a_bogus值> (VM 以 ("a_bogus", value) 调用
//   URLSearchParams.prototype.append), 最终 window.a_bogus 被设置
const puppeteer = require('/Users/lavender/node_modules/puppeteer-core');
const os = require('os');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: 'new',
    userDataDir: fs.mkdtempSync(path.join(os.tmpdir(), 'abogus-')),
    args: ['--no-sandbox', '--disable-blink-features=AutomationControlled', '--window-size=1440,900'],
    defaultViewport: { width: 1440, height: 900 },
  });
  const page = await browser.newPage();
  await page.setUserAgent(
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'
  );

  const patched = fs.readFileSync(path.join(__dirname, 'bdms.js'), 'utf8');
  await page.setRequestInterception(true);
  page.on('request', (req) => {
    if (/bdms_1\.0\.1\.19_fix\.js/.test(req.url())) {
      req.respond({ status: 200, contentType: 'application/javascript', body: patched });
    } else {
      req.continue();
    }
  });

  let bogusCount = 0;
  page.on('console', (msg) => {
    const t = msg.text();
    if (t.indexOf('[vm-bogus]') === 0) {
      bogusCount++;
      if (bogusCount <= 5) console.log('[page]', t.slice(0, 200));
    }
  });

  console.log('[nav] 打开 douyin.com ...');
  await page.goto('https://www.douyin.com/', { waitUntil: 'networkidle2', timeout: 90000 });
  await new Promise((r) => setTimeout(r, 20000));

  const state = await page.evaluate(() => ({
    a_bogus: window.a_bogus,
    bdms: typeof window.bdms,
    acKeys: window.byted_acrawler ? Object.keys(window.byted_acrawler) : null,
  }));
  console.log('[state]', JSON.stringify(state));
  console.log('[total vm-bogus]', bogusCount);
  await browser.close();
})().catch((e) => {
  console.error('[fatal]', e);
  process.exit(1);
});
