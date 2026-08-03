// 抖音 a_bogus Node 本地生成演示
// 环境: env.js (最小浏览器环境 + VM 配置) + bdms.js (加密 VM)
require("./env");
require("./bdms");

try {
  document.cookie = "__ac_nonce=06a6b6b9e00bcd9c641cb";

  // 1. bdms VM 签名配置 (CDP 捕获自真实页面, 含 387 条未转义路径规则)
  window.bdms.init(window.__sdkVmConfig);

  var vm = window.__bdms;
  console.log("[vm]", "Z=" + vm.Z.length, "z=" + vm.z.length, "Y=" + vm.Y.size);
  console.log("[vm]", "onwheelx._Ax=" + window.onwheelx?._Ax);

  // 2. 手动安装 VM 的 XHR 加签钩子
  //    Node 环境里 VM boot 不会自动把它挂到 XMLHttpRequest.prototype 上,
  //    但模块根帧 (42 槽) 已存在。按浏览器安装时的帧结构重建:
  //    [根帧, 状态对象, XHR原型, open, send, setRequestHeader]
  var V = vm.V, D = vm.D;
  var root = null;
  for (var entry of V) {
    var r = entry[1] && entry[1][1];
    if (r && Array.isArray(r) && r.length === 42) { root = r; break; }
  }
  if (!root) throw new Error("VM root frame not found");
  root[8] = D(2, root); // 与浏览器一致: 模块局部 slot8 = z=2
  var proto = XMLHttpRequest.prototype;
  var vmFrame = [root, {}, proto, proto.open, proto.send, proto.setRequestHeader];

  // 3. 生成 a_bogus: 走 VM 的 XHR 签名路径 (105 open -> 106 setRequestHeader -> 107 send)
  function signAbogus(url) {
    globalThis.a_bogus = undefined;
    var xhr = new XMLHttpRequest();
    D(105, vmFrame).call(xhr, "GET", url, true);
    D(106, vmFrame).call(xhr, "content-type", "application/json");
    D(107, vmFrame).call(xhr, null);
    var bogus = globalThis.a_bogus;
    var signedUrl = bogus
      ? url + (url.indexOf("?") >= 0 ? "&" : "?") + "a_bogus=" + encodeURIComponent(bogus)
      : url;
    return { a_bogus: bogus, url: signedUrl };
  }

  var target = "https://www.douyin.com/aweme/v1/web/aweme/detail/?device_platform=webapp&aid=6383&aweme_id=7123456789012345678";
  var r1 = signAbogus(target);
  console.log("[sign]", "a_bogus =", r1.a_bogus);
  console.log("[sign]", "a_bogus.length =", r1.a_bogus ? r1.a_bogus.length : 0);
  console.log("[sign]", "signed URL =", r1.url);

  // 4. 不同 URL 生成不同 a_bogus (含时间/随机分量, 与真实页面一致)
  var r2 = signAbogus("https://www.douyin.com/aweme/v1/web/aweme/detail/?device_platform=webapp&aid=6383&aweme_id=999");
  console.log("[sign]", "url2 a_bogus differs =", r1.a_bogus !== r2.a_bogus);
} catch (e) {
  console.log("[error]", e.message);
  console.log(e.stack);
}

process.exit(0);
