/**
 * run_jsdom.cjs — jsdom 版本
 */
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

console.log('=== 1. 使用 jsdom ===');
const dom = new JSDOM('<!DOCTYPE html><html><head></head><body></body></html>', {
  url: 'https://www.xiaohongshu.com/explore',
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:153.0) Gecko/20100101 Firefox/153.0',
  pretendToBeVisual: true,
});

const win = dom.window;
globalThis.window = win;
globalThis.self = win;
globalThis.top = win;
globalThis.parent = win;
globalThis.document = win.document;
globalThis.navigator = win.navigator;
globalThis.location = win.location;
globalThis.screen = win.screen;
globalThis.performance = win.performance;
globalThis.crypto = win.crypto;
globalThis.XMLHttpRequest = win.XMLHttpRequest;
globalThis.localStorage = win.localStorage;
globalThis.sessionStorage = win.sessionStorage;
globalThis.Math = Math;
globalThis.Set = Set;
globalThis.Map = Map;
globalThis.Reflect = Reflect;
globalThis.Promise = Promise;
globalThis.TextEncoder = require('util').TextEncoder;
globalThis.TextDecoder = require('util').TextDecoder;
globalThis.InstallTrigger = null;
globalThis.chrome = undefined;

// Patch navigator with real Firefox values
const nav = win.navigator;
Object.defineProperty(nav, 'webdriver', { get: () => false });
Object.defineProperty(nav, 'hardwareConcurrency', { get: () => 8 });
Object.defineProperty(nav, 'maxTouchPoints', { get: () => 0 });
Object.defineProperty(nav, 'oscpu', { get: () => 'Intel Mac OS X 10.15' });
Object.defineProperty(nav, 'buildID', { get: () => '20181001000000' });
Object.defineProperty(nav, 'productSub', { get: () => '20100101' });
Object.defineProperty(nav, 'vendor', { get: () => '' });
Object.defineProperty(nav, 'vendorSub', { get: () => '' });
Object.defineProperty(nav, 'plugins', { get: () => ({ length: 5, item: () => null }) });
Object.defineProperty(nav, 'mimeTypes', { get: () => ({ length: 2, item: () => null }) });
Object.defineProperty(nav, 'deviceMemory', { get: () => 8 });
Object.defineProperty(nav, 'connection', { get: () => ({ effectiveType: '4g' }) });

// WASM
const wasmBuf = fs.readFileSync(path.join(__dirname, 'wasm_module.wasm'));
let wasmInstance;
try {
  wasmInstance = new WebAssembly.Instance(new WebAssembly.Module(wasmBuf));
  console.log('✅ WASM 预编译');
} catch(e) {
  console.error('❌ WASM:', e.message);
}

console.log(`环境就绪`);

// Load code
console.log('\n=== 2. 加载 mnsv2 ===');
const code = fs.readFileSync(path.join(__dirname, 'signv2_code.js'), 'utf8');
const autoCallIdx = code.indexOf("var glb=typeof window==='undefined'?global:window;");
const codeBody = code.substring(0, autoCallIdx);
eval(codeBody);
console.log(`_AUuXfEG27Xa3x: ${typeof win._AUuXfEG27Xa3x}`);

// Build env
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

console.log('=== 3. 初始化 ===');
try {
  const ret = win._AUuXfEG27Xa3x(__$c, env);
  console.log(`返回: ${ret}`);
} catch(e) {
  console.error('❌', e.message);
}

const hashFns = Object.getOwnPropertyNames(globalThis)
  .filter(k => k.startsWith('_') && k.length === 33 && typeof globalThis[k] === 'function');
console.log(`Hash 函数: ${hashFns.length}`);

if (hashFns.length > 0) {
  const fn = globalThis[hashFns[0]];
  console.log(`IIΙ: ${fn.IIΙ} (期望 27188)`);
  console.log(`IΙI: ${fn.IΙI} (期望 26)`);
  
  const crypto = require('crypto');
  const C = '/api/sns/web/unread_count';
  const U = crypto.createHash('md5').update(C).digest('hex');
  const r = fn(C, U, '98b4ad672328ab89ff2347fa2fccedd8');
  console.log(`结果: ${JSON.stringify(r)}`);
}
