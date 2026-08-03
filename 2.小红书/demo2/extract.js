// Script to extract the signing function using Puppeteer
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function extract() {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Set a realistic user agent
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  
  // Load the page
  await page.goto('about:blank');
  
  // Inject the code.js
  const codeJs = fs.readFileSync(path.join(__dirname, 'code.js'), 'utf8');
  await page.evaluate(codeJs);
  
  // Check if mnsv2 is available
  const hasMnsv2 = await page.evaluate(() => {
    return typeof window.mnsv2 !== 'undefined' && typeof window.mnsv2 === 'function';
  });
  
  console.log('mnsv2 available:', hasMnsv2);
  
  if (hasMnsv2) {
    // Test it
    const C = "/api/redcaptcha/v2/getconfig{}";
    const U = "701d7db129f79737abc1c57cc97e69da";
    const P = "040a1d360bddd5d9c6fe7097ff1437e0";
    
    const sign = await page.evaluate((c, u, p) => {
      return window.mnsv2(c, u, p);
    }, C, U, P);
    
    console.log('签名:', sign);
    
    // Try to serialize the function
    const funcStr = await page.evaluate(() => {
      return window.mnsv2.toString();
    });
    console.log('Function source length:', funcStr.length);
    console.log('Function source (first 500 chars):');
    console.log(funcStr.substring(0, 500));
  } else {
    console.log('mnsv2 is not available as a function');
    console.log('typeof mnsv2:', await page.evaluate(() => typeof window.mnsv2));
  }
  
  await browser.close();
}

extract().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
