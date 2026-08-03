// Minimal test - just run code.js directly
require("./code");

const C = "/api/redcaptcha/v2/getconfig{}";
const U = "701d7db129f79737abc1c57cc97e69da";
const P = "040a1d360bddd5d9c6fe7097ff1437e0";

console.log("typeof window.mnsv2:", typeof window.mnsv2);
if (typeof window.mnsv2 === 'function') {
  const sign = window.mnsv2(C, U, P);
  console.log("签名:", sign);
} else {
  console.log("mnsv2 =", window.mnsv2);
}
