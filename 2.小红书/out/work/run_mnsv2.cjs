/**
 * run_mnsv2.cjs — 加载完整环境，执行 mnsv2 初始化，调用签名
 * 
 * 用法: node run_mnsv2.cjs
 */
const fs = require('fs');
const path = require('path');

console.log('='.repeat(60));
console.log('1️⃣  加载浏览器环境模拟...');
require(path.join(__dirname, 'env_full.js'));

console.log('='.repeat(60));
console.log('2️⃣  加载 mnsv2 代码...');

const code = fs.readFileSync(path.join(__dirname, 'signv2_code.js'), 'utf8');
console.log(`   代码长度: ${(code.length/1024).toFixed(1)}KB`);

// 找到 auto-call 并移除
const autoCallMarker = "var glb=typeof window==='undefined'?global:window;";
const autoCallIdx = code.indexOf(autoCallMarker);
if (autoCallIdx === -1) {
  console.error('❌ 找不到 auto-call marker');
  process.exit(1);
}

const codeBody = code.substring(0, autoCallIdx);
console.log(`   去除 auto-call 后: ${(codeBody.length/1024).toFixed(1)}KB`);

// 加载 mnsv2 工厂代码
console.log('\n3️⃣  执行 mnsv2 工厂定义...');
try {
  eval(codeBody);
  console.log('   ✅ 工厂定义成功');
  console.log(`   __$c 存在: ${typeof __$c === 'string'} (长度: ${__$c ? __$c.length : 0})`);
  console.log(`   _AUuXfEG27Xa3x: ${typeof window._AUuXfEG27Xa3x}`);
} catch (e) {
  console.error('❌ 工厂定义失败:', e.message);
  process.exit(1);
}

// 构建 env 数组（必须与 auto-call 完全一致）
console.log('\n4️⃣  构建 env 依赖数组...');
const env = [
  , // idx 0: empty (becomes undefined)
  , // idx 1: empty
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
console.log(`   env 数组长度: ${env.length}`);

// 调用初始化
console.log('\n5️⃣  调用 mnsv2 初始化 _AUuXfEG27Xa3x(__$c, env)...');
try {
  const initResult = window._AUuXfEG27Xa3x(__$c, env);
  console.log(`   初始化返回: ${initResult}`);
} catch (e) {
  console.error('❌ 初始化失败:', e.message);
  console.error(e.stack ? e.stack.substring(0, 800) : 'no stack');
  process.exit(1);
}

// 检查 mnsv2
console.log('\n6️⃣  检查 mnsv2...');
console.log(`   typeof window.mnsv2: ${typeof window.mnsv2}`);
console.log(`   typeof globalThis.mnsv2: ${typeof globalThis.mnsv2}`);

// 输出所有 mnsv2 相关属性
const mnsv2Props = Object.getOwnPropertyNames(window).filter(p => 
  p.toLowerCase().includes('mnsv') || p.toLowerCase().includes('sign')
);
console.log(`   含 mnsv/sign 的属性: ${mnsv2Props.length > 0 ? mnsv2Props.join(', ') : '无'}`);

// 尝试签名
console.log('\n7️⃣  测试签名...');
if (typeof window.mnsv2 === 'function') {
  try {
    const C = '/api/redcaptcha/v2/getconfig{}';
    const U = '701d7db129f79737abc1c57cc97e69da';
    const P = '040a1d360bddd5d9c6fe7097ff1437e0';
    const sign = window.mnsv2(C, U, P);
    console.log(`   ✅ 签名: ${sign}`);
    console.log(`   长度: ${sign.length}`);
  } catch (e) {
    console.error('❌ 签名出错:', e.message);
    console.error(e.stack ? e.stack.substring(0, 500) : 'no stack');
  }
} else {
  console.log('   ⚠️  window.mnsv2 不可用，检查 window 上的函数名...');
  
  // 列出刚创建的所有函数
  const fns = Object.getOwnPropertyNames(window)
    .filter(p => typeof window[p] === 'function')
    .filter(p => p.length > 3 && p.length < 20);
  console.log(`   非内置函数: ${fns.join(', ')}`);
}

console.log('\n' + '='.repeat(60));
console.log('完成!');
