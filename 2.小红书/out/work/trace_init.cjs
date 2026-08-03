/**
 * trace_init.cjs — 追踪 mnsv2 init 期间发生了什么
 * 拦截 _AUuXfEG27Xa3x 函数，记录关键行为
 */
const fs = require('fs');
const path = require('path');

// 1. 加载环境
require(path.join(__dirname, 'env_full.js'));

// 2. 加载代码
const code = fs.readFileSync(path.join(__dirname, 'signv2_code.js'), 'utf8');
const autoCallIdx = code.indexOf("var glb=typeof window==='undefined'?global:window;");
const codeBody = code.substring(0, autoCallIdx);
eval(codeBody);

// 3. 先保存原始函数
const originalInit = window._AUuXfEG27Xa3x;

// 4. 构建 env
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

// 5. 包装 init 函数来追踪
window._AUuXfEG27Xa3x = function(...args) {
  console.log('=== _AUuXfEG27Xa3x 被调用 ===');
  console.log('参数个数:', args.length);
  console.log('arg0 (__$c) 类型:', typeof args[0], '长度:', args[0]?.length);
  console.log('arg1 (env) 类型:', typeof args[1], '长度:', args[1]?.length);
  console.log('arg2 类型:', typeof args[2]);
  
  // 检查参数
  const bytecode = args[0];
  const envArr = args[1];
  
  // 监视字符串中的关键属性访问
  // 拦截所有 window 属性访问
  const handler = {
    get(target, prop, receiver) {
      if (prop === 'mnsv2') {
        console.log(`  ⚡ 访问 window.mnsv2 (读取操作)`);
      }
      if (prop === 'ΙII' || prop === 'IIΙ' || prop === 'IΙI') {
        console.log(`  ⚡ 访问 window.${prop}`);
      }
      return Reflect.get(target, prop, receiver);
    },
    set(target, prop, value) {
      if (prop === 'mnsv2' || typeof prop === 'string' && (prop.startsWith('Ι') || prop.startsWith('IΙ'))) {
        console.log(`  ⚡ 设置 window.${prop} = ${typeof value === 'function' ? 'function' : typeof value}`);
      }
      return Reflect.set(target, prop, value);
    }
  };
  
  // Proxy on window
  const origWindow = globalThis;
  
  try {
    const result = originalInit.apply(this, args);
    console.log('=== _AUuXfEG27Xa3x 返回 ===');
    console.log('返回值:', result);
    return result;
  } catch (e) {
    console.error('=== _AUuXfEG27Xa3x 抛出异常 ===');
    console.error('异常:', e.message);
    console.error('堆栈:', e.stack?.substring(0, 1000));
    throw e;
  }
};

// 6. 调用 init
console.log('\n开始调用 init...\n');
try {
  const result = window._AUuXfEG27Xa3x(__$c, env);
  console.log('\ninit 返回:', result);
  console.log('window.mnsv2:', typeof window.mnsv2);
} catch (e) {
  console.error('init 异常:', e.message);
}
