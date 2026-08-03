/**
 * 阳光高考 (gaokao.chsi.com.cn) RS6 纯 Node 方案
 *
 * 原理:
 *   1. sdenv (魔改 jsdom + C++ V8 addon) 加载页面 -> RS JSVMP 执行 -> 自动生成 cookie (T)
 *   2. RS 拦截器劫持 dom 内 XHR -> 请求时自动计算 URL 后缀签名 (p3LORH7S)
 *   3. 在 sdenv dom 内发请求 = cookie + 签名全自动，返回真实数据
 *
 * 用法:
 *   node main.js                          # 默认拉取专业分类 + 本科专业列表
 *   node main.js --search 计算机          # 搜索专业
 *   node main.js --cat 1050               # 按学科门类拉取
 *
 * 依赖: npm install sdenv
 */
const { jsdomFromUrl } = require("sdenv");

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36";
const ENTRY = "https://gaokao.chsi.com.cn/zyk/zybk/specialityesByZymcPage";

class RSClient {
  constructor({ entry = ENTRY, userAgent = UA } = {}) {
    this.entry = entry;
    this.ua = userAgent;
    this.dom = null;
    this.w = null;
  }

  async init() {
    const dom = await jsdomFromUrl(this.entry, {
      userAgent: this.ua,
      consoleConfig: {
        error: () => {},
        log: () => {},
        info: () => {},
        warn: () => {},
        debug: () => {},
      },
      notLoadCssFile: true,
      notLoadImgFile: true,
    });
    this.dom = dom;
    this.w = dom.window;
    await new Promise((resolve) => {
      try {
        this.w.addEventListener("sdenv:exit", () => resolve());
      } catch (e) {
        resolve();
      }
      setTimeout(resolve, 8000);
    });
    return this;
  }

  get cookies() {
    try {
      return this.dom.cookieJar.getCookieStringSync(this.entry);
    } catch (e) {
      return "";
    }
  }

  /**
   * 在 sdenv dom 内发起请求（RS 拦截器自动追加 p3LORH7S 签名）
   * @param {string} pathOrUrl  如 '/zyk/zybk/ccCategory' 或完整 URL
   * @param {object} params     查询参数（GET 拼 query；POST 走 body）
   * @param {object} opts       { method: 'GET'|'POST', headers }
   */
  async request(pathOrUrl, params = {}, opts = {}) {
    const { method = "GET", headers = {} } = opts;
    const base = pathOrUrl.startsWith("http")
      ? pathOrUrl
      : `https://gaokao.chsi.com.cn${pathOrUrl}`;
    let url = base;
    let body = null;
    if (method === "GET") {
      const qs = Object.entries(params)
        .filter(([, v]) => v !== undefined && v !== null)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join("&");
      if (qs) url = `${base}?${qs}`;
    } else {
      body = Object.entries(params)
        .filter(([, v]) => v !== undefined && v !== null)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join("&");
    }
    const res = await this.w.eval(`new Promise(function(resolve){
      try {
        var xhr = new XMLHttpRequest();
        xhr.open('${method}', ${JSON.stringify(url)}, true);
        xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
        ${Object.entries(headers)
          .map(
            ([k, v]) =>
              `xhr.setRequestHeader(${JSON.stringify(k)}, ${JSON.stringify(v)});`,
          )
          .join("\n        ")}
        xhr.onload = function(){ resolve({status: xhr.status, body: xhr.responseText}); };
        xhr.onerror = function(){ resolve({status: 'ERR', body: ''}); };
        xhr.send(${body ? JSON.stringify(body) : "null"});
        setTimeout(function(){ resolve({status: 'TIMEOUT', body: ''}); }, ${opts.timeout || 10000});
      } catch(e){ resolve({status: 'EXC', body: String(e)}); }
    })`);
    if (res.status === 200) {
      try {
        return JSON.parse(res.body);
      } catch (e) {
        return res.body;
      }
    }
    return res;
  }

  close() {
    try {
      this.dom.window.close();
    } catch (e) {}
  }
}

async function main() {
  const argv = process.argv.slice(2);
  const opt = (k, d) => {
    const i = argv.indexOf(k);
    return i > -1 ? argv[i + 1] : d;
  };

  const client = new RSClient();
  console.log("[init] sdenv 加载", ENTRY);
  await client.init();
  console.log(
    "[init] cookie:",
    client.cookies
      .split(";")
      .map((c) => c.split("=")[0].trim())
      .join(", "),
  );

  const search = opt("--search");
  const cat = opt("--cat", "1050");

  // 1. 专业分类
  console.log("\n=== 专业分类 ===");
  const cc = await client.request("/zyk/zybk/ccCategory");
  console.log(JSON.stringify(cc.msg, null, 1));

  // 2. 搜索或层级遍历
  if (search) {
    console.log(`\n=== 搜索专业: ${search} ===`);
    const r = await client.request(
      "/zyk/zybk/specialityesByZymc",
      { zymc: search },
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        },
      },
    );
    const list = r.msg && Array.isArray(r.msg) ? r.msg : null;
    console.log("flag:", r.flag);
    if (list) {
      console.log("共", list.length, "个:");
      list
        .slice(0, 10)
        .forEach((p) =>
          console.log(
            `  ${p.zydm || ""} ${p.zymc || p.name || ""} (${p.zymyd || ""})`,
          ),
        );
    } else {
      console.log(
        "msg:",
        typeof r.msg === "string" ? r.msg : JSON.stringify(r.msg).slice(0, 400),
      );
    }
  } else {
    console.log(`\n=== 层级遍历: 门类 ${cat} ===`);
    const ml = await client.request(`/zyk/zybk/mlCategory/${cat}`);
    for (const m of (ml.msg || []).slice(0, 3)) {
      console.log(`\n[门类] ${m.key} ${m.name}`);
      const xk = await client.request(`/zyk/zybk/xkCategory/${m.key}`);
      for (const x of (xk.msg || []).slice(0, 2)) {
        console.log(`  [学科] ${x.key} ${x.name}`);
        const sp = await client.request(
          `/zyk/zybk/specialityesByCategory/${x.key}`,
        );
        console.log("    专业数:", (sp.msg || []).length);
        (sp.msg || [])
          .slice(0, 5)
          .forEach((p) =>
            console.log(`      ${p.zydm} ${p.zymc} (${p.zymyd})`),
          );
      }
    }
  }

  client.close();
}

main().catch((e) => {
  console.error("[err]", e);
  process.exit(1);
});
