/**
 * 小红书 mnsv2 签名测试 v2
 * 
 * code.js 定义 window['_AUuXfEG27Xa3x'] 并自调用初始化。
 * 检查哪个属性是真正的签名器。
 */

const TIMEOUT_MS = 20000;
const timeout = setTimeout(() => {
  console.error(`[超时] 超过 ${TIMEOUT_MS}ms`);
  process.exit(2);
}, TIMEOUT_MS);

// 1. 加载环境
const env = require('./env.js');
env.setupGlobal();

console.log("=== 环境就绪 ===");

// 2. 加载 code.js（定义 + 初始化）
console.log("加载 code.js...");
require('../code');
console.log("code.js 加载完成");

// 3. 检查所有可能的目标
const allKeys = Object.keys(window);
const funcKeys = allKeys.filter(k => typeof window[k] === 'function' && k.startsWith('_'));
console.log("\n=== 检查所有哈希命名的函数 ===");
console.log("哈希函数数量:", funcKeys.length);
funcKeys.forEach(k => {
  console.log(`  ${k}: ${window[k].length} 个参数`);
});

// 4. 检查 window._AUuXfEG27Xa3x 是不是就是签名器
const C = '/api/redcaptcha/v2/getconfig{}';
const U = '701d7db129f79737abc1c57cc97e69da';
const P = '040a1d360bddd5d9c6fe7097ff1437e0';

console.log("\n=== 尝试通过 _AUuXfEG27Xa3x 签名 ===");
const signer = window._AUuXfEG27Xa3x;
if (typeof signer === 'function') {
  console.log("_AUuXfEG27Xa3x 参数个数:", signer.length);
  console.log("_AUuXfEG27Xa3x 调用...");
  try {
    const result = signer(C, U, P);
    console.log("结果:", result);
    console.log("类型:", typeof result);
  } catch(e) {
    console.error("调用失败:", e.message);
    // 可能参数不对，打印更多
    console.log("toString:", signer.toString().substring(0, 500));
  }
} else {
  console.log("_AUuXfEG27Xa3x 不是函数");
}

// 5. 遍历所有哈希函数尝试调用（谨慎：只试前2个）
console.log("\n=== 尝试前2个哈希函数（验证是否是签名器）===");
for (let i = 0; i < Math.min(2, funcKeys.length); i++) {
  const fn = window[funcKeys[i]];
  if (fn.length === 3) {
    try {
      const r = fn(C, U, P);
      console.log(`${funcKeys[i]} 返回:`, r);
    } catch(e) {
      console.log(`${funcKeys[i]} 失败:`, e.message.substring(0, 100));
    }
  }
}

// 6. 检查 window 上是否有 mnsv2（可能 jsdom 晚了没注册上）
console.log("\n=== 全部 window 属性搜索 mnsv2 ===");
const mnsv2Like = allKeys.filter(k => k.toLowerCase().includes('mnsv') || k.includes('sign'));
console.log("mnsv2/sign 相关:", mnsv2Like);

clearTimeout(timeout);
