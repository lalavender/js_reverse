// 抖音 a_bogus Node 本地签名模块
// 用法:
//   const sign = require('./sign');
//   const r = sign.signAbogus('https://www.douyin.com/aweme/v1/web/aweme/detail/?aweme_id=...');
//   // r = { a_bogus: '...', url: '...&a_bogus=...' }
require('./env');
require('./bdms');

var _ready = false;
var _D = null, _frame = null;

function ensureReady() {
  if (_ready) return;
  var vm = window.__bdms;
  if (!vm) throw new Error('bdms VM not loaded');

  // bdms.init 使用 CDP 捕获的真实页面 VM 配置 (387 条未转义路径规则)
  window.bdms.init(window.__sdkVmConfig);

  var V = vm.V, D = vm.D;
  var root = null;
  for (var entry of V) {
    var r = entry[1] && entry[1][1];
    if (r && Array.isArray(r) && r.length === 42) { root = r; break; }
  }
  if (!root) throw new Error('VM root frame not found');
  root[8] = D(2, root); // 与浏览器一致: 模块局部 slot8 = z=2
  var proto = XMLHttpRequest.prototype;
  _D = D;
  _frame = [root, {}, proto, proto.open, proto.send, proto.setRequestHeader];
  _ready = true;
}

/**
 * 生成 a_bogus
 * @param {string} url 完整请求 URL (host + path + query)
 * @returns {{a_bogus: string, url: string}} 签名值 + 带 a_bogus 参数的 URL
 */
function signAbogus(url) {
  ensureReady();
  globalThis.a_bogus = undefined;
  var xhr = new XMLHttpRequest();
  _D(105, _frame).call(xhr, 'GET', String(url), true);
  _D(106, _frame).call(xhr, 'content-type', 'application/json');
  _D(107, _frame).call(xhr, null);
  var bogus = globalThis.a_bogus;
  if (!bogus) throw new Error('a_bogus generation failed');
  var signedUrl = String(url) + (String(url).indexOf('?') >= 0 ? '&' : '?') + 'a_bogus=' + encodeURIComponent(bogus);
  return { a_bogus: bogus, url: signedUrl };
}

module.exports = { signAbogus };
