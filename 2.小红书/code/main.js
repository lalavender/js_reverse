/**
 * 小红书 mnsv2 签名 — 主入口
 * 
 * 运行: node main.js
 * 依赖: env.js + code.js
 */

require("./env");
require("./code");

const C = '/api/redcaptcha/v2/getconfig{}';
const U = '701d7db129f79737abc1c57cc97e69da';
const P = '040a1d360bddd5d9c6fe7097ff1437e0';

console.log('mnsv2:', typeof window.mnsv2);

if (typeof window.mnsv2 === 'function') {
  const sign = window.mnsv2(C, U, P);
  console.log('签名:', sign);
  console.log('签名长度:', sign ? sign.length : 0);
  console.log('签名前缀:', sign ? sign.substring(0, 15) : '无');
} else {
  console.log('❌ window.mnsv2 未定义');
}
