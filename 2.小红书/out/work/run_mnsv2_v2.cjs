/**
 * run_mnsv2_v2.cjs — 加载环境 + 注入 WASM + 完整 mnsv2 初始化
 * 
 * 解决思路：
 * 1. mnsv2 初始化需要 WASM 模块参与，但 init 字节码（__$c）不含 WASM
 * 2. WASM 模块需要从外部导入（实际是 mnsv2.ΙIΙ.$1[114]）
 * 3. 浏览器里 WASM 在 mnsv2 初始化时动态编译
 * 4. 我们需要把预提取的 WASM 注入到环境，让 init 能找到它
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ========== 1. 加载环境 ==========
console.log('1. 加载浏览器环境模拟...');
require(path.join(__dirname, 'env_full.js'));

// ========== 2. 预编译 WASM ==========
console.log('2. 预编译 WASM 模块...');
const wasmPath = path.join(__dirname, 'wasm_module.wasm');
if (!fs.existsSync(wasmPath)) {
  console.error('❌ WASM 模块不存在:', wasmPath);
  process.exit(1);
}
const wasmBuffer = fs.readFileSync(wasmPath);
console.log(`   WASM 大小: ${wasmBuffer.length} bytes`);

let wasmInstance;
try {
  const wasmModule = new WebAssembly.Module(wasmBuffer);
  wasmInstance = new WebAssembly.Instance(wasmModule);
  console.log(`   编译成功! 导出: ${Object.keys(wasmInstance.exports).join(', ')}`);
} catch (e) {
  console.error('❌ WASM 编译失败:', e.message);
  process.exit(1);
}

// ========== 3. 把 WASM 注入环境 ==========
// 从 env.js 快照知道: mnsv2.ΙIΙ = {0: env_obj, 1: env_obj, $0: [...], $1: {...}, $2: {...}}
// $1[114] 是 WASM 模块的引用
// 在初始化时，init 代码会读取 $1[114] 来编译 WASM
// 所以我们需要在全局环境创建一个 $1 数组，并让 init 能找到它

// 方法：创建一个全局对象模拟 mnsv2 的存储结构
globalThis.__mnsv2_storage = {
  $0: [],
  $1: [],
  $2: [],
  // WASM 模块放在 $1[114] 位置
};
globalThis.__mnsv2_storage.$1[114] = wasmInstance;

// 另外，WASM 的内存需要可访问
if (wasmInstance.exports.memory) {
  globalThis.__wasm_memory = wasmInstance.exports.memory;
}

// 关键: 把 WASM 的导出函数注入到全局
// 从 env.js 快照: $1[35]-[44] 是函数引用 (_0x30ce91)
// 这些是 WASM 导出的包装函数
const wasmExports = wasmInstance.exports;
for (const key of Object.keys(wasmExports)) {
  if (typeof wasmExports[key] === 'function') {
    globalThis['__wasm_' + key] = wasmExports[key];
  }
}

// ========== 4. 加载 mnsv2 代码 ==========
console.log('3. 加载 mnsv2 工厂代码...');
const code = fs.readFileSync(path.join(__dirname, 'signv2_code.js'), 'utf8');
const autoCallMarker = "var glb=typeof window==='undefined'?global:window;";
const autoCallIdx = code.indexOf(autoCallMarker);
if (autoCallIdx === -1) {
  console.error('❌ 找不到 auto-call marker');
  process.exit(1);
}
const codeBody = code.substring(0, autoCallIdx);
console.log(`   代码长度: ${(codeBody.length/1024).toFixed(1)}KB`);

// ========== 5. 包装 init 函数 ==========
// 先执行代码（不含 auto-call）
eval(codeBody);

// 保存原始 init
const originalInit = window._AUuXfEG27Xa3x;

// 构建 env 数组
const env = [
  ,,
  typeof globalThis !== 'undefined' ? globalThis : undefined,
  typeof undefined !== 'undefined' ? undefined : undefined,
  typeof performance !== 'undefined' ? performance : undefined,
  typeof encodeURIComponent !== 'undefined' ? encodeURIComponent : undefined,
  typeof Array !== 'undefined' ? Array : undefined,
  typeof TextEncoder !== 'undefined' ? TextEncoder : undefined,
  typeof Date !== 'undefined' ? Date : undefined,
  typeof Math !== 'undefined' ? Math : undefined,
  typeof Uint8Array !== 'undefined' ? Uint8Array : undefined,
  typeof document !== 'undefined' ? document : undefined,
  typeof setTimeout !== 'undefined' ? setTimeout : undefined,
  typeof RegExp !== 'undefined' ? RegExp : undefined,
  typeof unescape !== 'undefined' ? unescape : undefined,
  typeof parseInt !== 'undefined' ? parseInt : undefined,
  typeof Object !== 'undefined' ? Object : undefined,
  typeof navigator !== 'undefined' ? navigator : undefined,
  typeof InstallTrigger !== 'undefined' ? InstallTrigger : undefined,
  typeof Set !== 'undefined' ? Set : undefined,
  typeof Function !== 'undefined' ? Function : undefined,
  typeof String !== 'undefined' ? String : undefined,
  typeof Error !== 'undefined' ? Error : undefined,
  typeof chrome !== 'undefined' ? chrome : undefined,
  typeof Event !== 'undefined' ? Event : undefined,
  typeof Reflect !== 'undefined' ? Reflect : undefined,
];

// ========== 6. 调用 init ==========
console.log('4. 调用 mnsv2 初始化...');
try {
  const result = originalInit(__$c, env);
  console.log(`   初始化返回: ${result}`);
} catch (e) {
  console.error('❌ 初始化异常:', e.message);
  console.error(e.stack?.substring(0, 500));
  process.exit(1);
}

// ========== 7. 检查 mnsv2 实例 ==========
console.log('\n5. 查找可用的 mnsv2 实例...');
const hashFns = Object.getOwnPropertyNames(globalThis)
  .filter(k => k.startsWith('_') && k.length === 33 && typeof globalThis[k] === 'function');
console.log(`   找到 ${hashFns.length} 个 hash 实例`);

// 找一个函数测试
if (hashFns.length === 0) {
  console.error('❌ 没有可用的 mnsv2 实例');
  process.exit(1);
}

const testFn = globalThis[hashFns[0]];
console.log(`   函数属性: ${Object.getOwnPropertyNames(testFn).join(', ')}`);

// ========== 8. 对比测试 ==========
console.log('\n6. 签名测试...');
const C = '/api/sns/web/unread_count';
const U = crypto.createHash('md5').update(C).digest('hex');
const P = '98b4ad672328ab89ff2347fa2fccedd8';

console.log(`   C: ${C}`);
console.log(`   U: ${U}`);
console.log(`   P: ${P}`);

const signResult = testFn(C, U, P);
console.log(`   结果类型: ${typeof signResult}`);
console.log(`   结果: ${Array.isArray(signResult) ? JSON.stringify(signResult) : signResult}`);
if (typeof signResult === 'string') {
  console.log(`   长度: ${signResult.length}`);
  console.log(`   前缀: ${signResult.substring(0, 20)}`);
}

// ========== 9. 测试所有实例 ==========
if (hashFns.length > 1) {
  console.log('\n7. 测试所有实例...');
  for (const name of hashFns) {
    try {
      const r = globalThis[name](C, U, P);
      const type = typeof r;
      const preview = type === 'string' ? r.substring(0, 30) : JSON.stringify(r).substring(0, 30);
      console.log(`   ${name.substring(0, 16)}...: ${type} = ${preview}`);
    } catch(e) {
      console.log(`   ${name.substring(0, 16)}...: ERROR ${e.message.substring(0, 50)}`);
    }
  }
}

console.log('\n✅ 完成');
