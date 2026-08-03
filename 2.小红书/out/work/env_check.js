const env = require('./work/env.js');
env.setupGlobal();

console.log("环境变量检查:");
const checks = [
  'window','document','navigator','location','screen','performance','crypto',
  'globalThis',
  'encodeURIComponent','TextEncoder','Array','Date','Math','Uint8Array',
  'setTimeout','RegExp','unescape','parseInt','Object',
  'InstallTrigger','Set','Function','String','Error',
  'chrome','Event','Reflect'
];
for (const c of checks) {
  console.log(`  ${c}:`, globalThis[c] !== undefined ? typeof globalThis[c] : 'UNDEFINED');
}

console.log("\n加载 code.js...");
try {
  require('./code');
  console.log("✓ code.js 加载成功");
} catch(e) {
  console.error("✗ 加载失败:", e.message.substring(0, 300));
  console.error(e.stack?.substring(0, 200));
}

console.log("\n初始化后:");
console.log("  window.mnsv2:", typeof window.mnsv2);
console.log("  window._AUuXfEG27Xa3x:", typeof window._AUuXfEG27Xa3x);

// Check for hash-named functions
const hashFuncs = Object.keys(window).filter(k => 
  typeof window[k] === 'function' && k.startsWith('_') && 
  !['_globalProxy','_globalObject','_AUuXfEG27Xa3x'].includes(k)
);
console.log("  哈希函数数量:", hashFuncs.length);
if (hashFuncs.length > 0) {
  console.log("  第一个:", hashFuncs[0], "参数:", window[hashFuncs[0]].length);
}

// Try signing
if (typeof window.mnsv2 === 'function') {
  const C = '/api/redcaptcha/v2/getconfig{}';
  const U = '701d7db129f79737abc1c57cc97e69da';
  const P = '040a1d360bddd5d9c6fe7097ff1437e0';
  console.log("\n=== 签名测试 ===");
  try {
    const r = window.mnsv2(C, U, P);
    console.log("结果:", r);
  } catch(e) {
    console.error("签名失败:", e.message.substring(0, 200));
  }
} else {
  console.log("\n⚠ window.mnsv2 未定义，检查是否需要额外加载模块");
}
