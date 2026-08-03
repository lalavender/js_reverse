# BOSS直聘 __zp_stoken__ 签名还原

## 目标

还原 `https://www.zhipin.com/wapi/zpgeek/job/detail.json` 请求头 cookie 中的
`__zp_stoken__` 生成算法，Node.js 脱离浏览器独立请求成功。

## 已破解协议

```
探针 POST detail.json（无 stoken）→ 37 + zpData{seed, ts, name}
→ token = (new ABC).z(seed, parseInt(ts) + 60*(480+getTimezoneOffset())*1000)
   # 中国时区(UTC+8)下 tsAdj = ts + 0
→ 同步 4 个 cookie：__zp_sseed__=seed / __zp_sname__=name / __zp_sts__=ts / __zp_stoken__=token
→ 重新请求 → code 0 Success
```

关键点：
- **seed 单次挑战**：每次 37 响应返回新 seed，旧 seed 生成的 token 必失败（code 38）
- **stoken 有效期 26.7 天**（TOKEN_EXPIRE_TIME = 2304e5 ms）：生成一次可长期复用
- **IP 风控**：请求频率过高触发 code 35（IP 地址存在异常行为），需降低频率或换 IP

## 签名生成

### 方案一：缓存复用（默认，推荐）

浏览器辅助生成一次 token（`gen-token.html` 或从浏览器 cookie 提取），存入
`config/cookies.json`，Node 端独立请求 26.7 天内无需重新生成。

已验证：`node main.js` → code 0，返回职位数据。

### 方案二：jsdom 环境伪装（utils/sign.js，进行中）

jsdom 完整模拟浏览器环境执行原始 security-js（`config/security-60fcde2c.js`）。

**已定位的环境指纹**（全部已实现于 sign.js）：
1. `Object.getOwnPropertyNames(window)` + `Object.keys(window)` 遍历
   （jsdom 494 个 vs Chrome 984 个 → hook 返回 Chrome 属性集）
2. navigator 7 项：deviceMemory/hardwareConcurrency/languages/mimeTypes/plugins/webdriver/webkitTemporaryStorage
3. plugins 精确结构：5 个插件 × 2 个 MIME（application/pdf + text/pdf），
   含插件名属性、enabledPlugin 循环引用
4. Function.prototype.toString 原生性检测（markNative）
5. canvas.getContext('2d') 非 null
6. performance.now 大值（模拟浏览器导航时长）
7. UA 全家桶 + window 尺寸

**当前状态**：jsdom 生成的 token 被服务端拒（code 38）——环境指纹中仍有
jsdom 引擎级差异未匹配（涉及 DOM/V8 底层实现，无法通过 JS 层完全模拟）。

## 反调试/反爬体系（vendors~app.daefb1ca.js + security-js）

### security-js（60fcde2c.js，322KB 深度混淆）
- 函数级分发混淆：所有业务函数包装为 `l.apply(this, [id, ...args])`
- 字符串加密：`B()` 函数（字符替换 + XOR + base64）
- token = `(new ABC).z(seed, tsAdj)`，ABC 为脚本暴露的构造器

### F12 反调试（另有专门交付 boss-f12-fix.user.js）
- 7 个检测器（DateToString/FuncToString/DefineId/RegToString/Performance/Der/pA）
- 通过隔离 iframe `__xbcw`/`contentWindow` 取干净 console 做检测
- 命中后无条件闪退

## 使用

```bash
# 依赖
npm install jsdom

# 请求职位详情（用缓存 token）
node main.js <securityId> <lid>

# 刷新 token：浏览器打开 zhipin.com 页面，执行 gen-token.html 脚本
# 或从浏览器 Cookie 提取 __zp_stoken__ 填入 config/cookies.json
```

## 文件

- `main.js` — 完整协议请求（探针 → 生成/缓存 → 请求）
- `utils/sign.js` — jsdom 环境伪装 + security-js 执行
- `gen-token.html` — 浏览器辅助生成 token 工具
- `config/security-60fcde2c.js` — security-js 源码
- `config/chrome-window-keys.json` — Chrome window 属性集（环境指纹）
- `config/cookies.json` — 缓存 token
- `job_list.py` / `job_details.py` — 原始抓包参考
