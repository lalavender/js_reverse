// main.js — 生成 a_bogus（纯 Node，无浏览器、无网络请求）
// 依赖: env.js（环境补全）+ bdms.js（JSVMP 签名引擎，已插桩捕获 windows.a_bogus）
// 用法: node main.js [目标URL]   缺省使用 feed 接口 URL
// 输出: a_bogus 字符串（stdout 单行）
"use strict";

require("./env");

// ── JSVMP 包装器调用（内联自 tools/jsvmp-call.js）──
// bdms.js 的 JSVMP 函数形如:
//   function e(){var r=e._v;return(0,e._u)(r[0],arguments,r[1],r[2],this)}
//   e._v = [bytecodeOffset, argCount, scopeChain]
//   e._u = JSVMP 解释器 function e(r, t, a, n, c)
function jsvmpCall(fn, thisArg, ...args) {
  if (typeof fn !== "function" || !fn._u || !fn._v) {
    throw new TypeError("jsvmpCall: 不是 JSVMP 包装器函数");
  }
  const [bytecodeOffset, argCount, scopeChain] = fn._v;
  const argsObj = (function () {
    return arguments;
  })(...args);
  return fn._u(bytecodeOffset, argsObj, argCount, scopeChain, thisArg);
}

const DEFAULT_URL =
  "https://www.toutiao.com/api/pc/list/feed" +
  "?channel_id=3189398999" +
  "&min_behot_time=0" +
  "&offset=0" +
  "&refresh_count=1" +
  "&category=pc_profile_channel" +
  "&client_extra_params=%7B%22short_video_item%22%3A%22filter%22%7D" +
  "&aid=24" +
  "&app_name=toutiao_web" +
  "&msToken=zsd4sIGVXrz-v_FCY9GLbwv4HtLgTc-ahXG0Rm9yGEo1FtIxHAXutAQ1yvrj0IVBbbm8lwlvTDjgEHtNYEPEw3TVuEOLoprVeP1sCmy-gAggV4-sDv1ie2sQJBxP19g=";

const TARGET_URL = process.argv[2] || DEFAULT_URL;
const cfg = {
  aid: 24,
  paths: ["/api/pc/list/feed", "/api/pc/list/user/feed"],
  pageId: 6457,
};

// ── 哨兵 fetch：必须在 bdms 加载/初始化之前安装 ──
// bdms 的 JSVMP 拦截器会包装此函数，并在调用时生成 a_bogus（写入 windows.a_bogus）。
// 哨兵不发起真实网络请求。
globalThis.fetch = function (input) {
  return Promise.resolve({ url: String(input), status: 200, ok: true });
};
window.fetch = globalThis.fetch;

require("./bdms");

(async () => {
  // 初始化（注入拦截路径，激活 JSVMP）
  jsvmpCall(window.bdms.init, window.bdms, cfg);

  // 触发签名生成（哨兵 fetch，不联网）
  await window.fetch(TARGET_URL, { credentials: "include" });

  // 从 bdms.js 插桩捕获点读取
  const ab = globalThis.windows.a_bogus;
  if (!ab || ab.length !== 168) {
    process.stderr.write(
      "a_bogus 生成失败（len=" + (ab ? ab.length : 0) + "）\n",
    );
    process.exit(1);
  }
  process.stdout.write(ab + "\n");
  process.exit(0); // bdms 内部定时器会挂起事件循环，显式退出
})().catch((e) => {
  process.stderr.write("ERR: " + e.message + "\n");
  process.exit(1);
});
