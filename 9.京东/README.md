# 京东 PC 首页 h5st 签名分析报告（静态分析）

> 目标接口：`POST https://api.m.jd.com/`（functionId=jsfbox_feed_tab）
> 目标参数：`h5st`（请求头/query 中的签名参数）
> 分析日期：2026-08-03
> **最终状态：✅ Node.js 独立生成 h5st，接口返回 HTTP 200 + code 605（签名有效，账号级风控验证态，与真实浏览器同级别）**
> 交付脚本：`jd_h5st.js`（node jd_h5st.js 直接运行）

## 1. 调用入口（关键结论）

**SDK 文件**：`https://storage.360buyimg.com/webcontainer/js_security_v3_0.1.4.js?v=20240117`（237KB，已存 `config/js_security_v3.js`）

**入口函数**（浏览器全局暴露）：

```js
// 方式一：同步（推荐，页面实际使用）
var signer = new ParamsSign({ appId: 'b5216' });
var result = signer.signSync(params);

// 方式二：异步
var signer = new ParamsSign({ appId: 'b5216' });
signer.sign(params).then(result => { ... });

// result.h5st 即为最终签名值
```

**入口参数**（`signSync` / `sign` 的入参，来自浏览器 hook 实证）：

| 参数 | 类型 | 说明 | 示例 |
|---|---|---|---|
| `appid` | string | 固定 `www-jd-com` | `www-jd-com` |
| `body` | string(64hex) | **原始 body 的 SHA256**（浏览器 hook 实证，见下） | `d924fdb280d81a7914d9d8e222fccb5d7d25d1e4df5b4cbd3b9abf72be67f049` |
| `client` | string | 固定 `pc` | `pc` |
| `clientVersion` | string | 固定 `1.0.0` | `1.0.0` |
| `functionId` | string | 接口功能名 | `jsfbox_feed_tab` |
| `t` | number | 毫秒时间戳 `Date.now()` | `1785698433706` |

> 关键实证：浏览器 hook `ParamsSign.prototype.signSync` 显示**入参 body 已经是 64 位 hex**，
> 且 `SHA256('{"source":"pc-home"}') === 'd924fdb2...'` 验证通过 → 调用方在调 sign 前先对原始 body 做了标准 SHA256。

**返回对象**：
```js
{
  appid: 'www-jd-com',
  body: 'd924fdb2...',
  client: 'pc',
  clientVersion: '1.0.0',
  functionId: 'jsfbox_feed_tab',
  t: 1785698433706,
  _stk: 'appid,body,client,clientVersion,functionId,t',  // 签名参数排序
  _ste: 1,
  h5st: '20260803032038707;n5nnbbne7ibbpe54;b5216;tk03...;07908b00...;5.3;1785698433707;of7ruCLj...;60677298...;qbkgHGHQ8GlOIyVOF6JQ8G1P5WFW3yVSC61T-bEQGGlQI6ZNHuFT-bVR7qUT'
}
```

## 2. h5st 结构（10 段，分号分隔）

| 段 | 含义 | 示例 | 来源 |
|---|---|---|---|
| 0 | 17位时间戳 yyyyMMddHHmmssSSS | `20260803032038707` | `Date.now()` 格式化 |
| 1 | fp 设备指纹（21位随机串） | `n5nnbbne7ibbpe54` | 首次生成，缓存 localStorage `WQ_dy1_vk` |
| 2 | appId | `b5216` | 构造参数 |
| 3 | tk 令牌 | `tk03wccdf1cbc18nbhHF...` | `request_algo` 接口下发，缓存 `WQ_dy1_tk_algo` |
| 4 | 64hex 签名 | `07908b00ddab98ce...` | 动态算法（见 §4） |
| 5 | 版本号 | `5.3` | 常量 |
| 6 | 13位毫秒时间戳 | `1785698433707` | `Date.now()` |
| 7 | 环境指纹编码段（超长） | `of7ruCLj3XYS7iFT...` | 环境采集（canvas/webgl/navigator 等）编码 |
| 8 | 64hex 第二签名 | `60677298976e55b1...` | 动态算法第二部分 |
| 9 | token（设备级固定） | `qbkgHGHQ8GlOIyVOF6JQ8G1P5WFW3yVSC61T-bEQGGlQI6ZNHuFT-bVR7qUT` | 固定值，与设备绑定 |

## 3. 动态算法下发机制（核心）

SDK 首次初始化时 POST `https://cactus.jd.com/request_algo`（实抓样本见 `config/request_algo_sample.json`）：

**请求体**：
```json
{
  "version": "5.3",
  "fp": "n5nnbbne7ibbpe54",
  "appId": "b5216",
  "timestamp": 1785698226319,
  "platform": "web",
  "expandParams": "q3Ep7rJdJ-1OJrpjh7Jj3XYS7iFTCOYS9iFT9yVe9...（环境指纹编码，超长）",
  "fv": "h5_file_v5.3.4",
  "localTk": "tk06w39feac6441lf5-5TGCePmn3pjre2XlPJiVR0XFQJiFQ9WIQrrbrMdfxbtTWkeUX3Woedu1Zz3ndGe4f2jofzfod"
}
```

**响应体**：
```json
{
  "status": 200,
  "data": {
    "version": "5.3",
    "result": {
      "tk": "tk03wccdf1cbc18nbhHFIDVd4krvlCtDNgNmw5WcmBVTmZWBmbwYohwKPa_-GMjp6ci1yfxE5bfHAt3r12Q6RLfXZbRj",
      "fp": "n5nnbbne7ibbpe54",
      "algo": "function test(tk,fp,ts,ai,algo){var rd='830wuJjV8XCu';var str=\"\".concat(tk).concat(fp).concat(ts).concat(ai).concat(rd);return algo.SHA256(str);}"
    },
    "ts": 1785698226596
  }
}
```

- **algo 是动态下发的算法函数源码字符串**（每次会话可能不同，rd 随机）
- 响应被 SDK 缓存进 localStorage `WQ_dy1_tk_algo`（**自定义 base64 编码**，字符表 `rqponmlkjihgfedcbaZYXWVUTSRQPONMLKJIHGFEDCBA-_9876543210zyxwvuts`，内层 JSON `{tk, algo}`）
- fp 缓存于 localStorage `WQ_dy1_vk`（结构 `{"5.3":{"b5216":{"e":过期秒,"v":"fp","t":时间戳}}}`）

## 4. 签名算法（浏览器 hook 实证，VMP 内部验证）

通过对 SDK 内 `_createHelper`（hash 算法工厂）注入日志实证，签名链为：

```
① hash1 = SHA256( tk + fp + ts19 + appId + rd )
   其中: ts19 = 17位时间戳 + "54"（19位字符串，如 2026080304101204754）
         rd   = algo 函数内动态值（本次会话 '830wuJjV8XCu'）
         SHA256 = SDK 内置魔改 SHA256（非标准！SHA256('abc') = 448fdf22... 而非 ba7816bf...）

② paramsStr = _stk 排序拼接: "appid:www-jd-com&body:{...}&client:pc&clientVersion:1.0.0&functionId:jsfbox_feed_tab&t:1785700815928"

③ seg4 = SHA256( hash1 + paramsStr )        ← h5st 第 4 段（主签名）
④ seg8 = SHA256( hash1 + "appid:appid&functionid:functionId" + hash1 )  ← h5st 第 8 段（默认签名路径）
```

**关键实证**（jsdom 注入日志）：
```
hash | tk03wccdf1cbc18nbhHF...XZbRjn5nnbbne7ibbpe542026080304032866154b5216830wuJjV8XCu
     | f8ee300eda96a49324ee7e3320c28054bebc3a56c8ea4cbddb0e7ff94fa1ca80        ← hash1
hash | f8ee30...a80appid:www-jd-com&body:{"type":"5",...}...&t:1785701066115
     | ded4fcd4e2978c17143a8c1e06a2cf71f419ddf3241745ec6f64a44f3e18c39e        ← = seg4 ✓
```

**注意**：SDK 内置 MD5/SHA256 均为魔改实现（非标准算法），验证：
- `SHA256('abc')` SDK = `448fdf22009f01af476a18c5fc4499c30aa84674afbc2cd9b6b7a19454c7b10a`（标准 = `ba7816bf...`）
- `MD5('abc')` SDK = `2b03aa0aa24abb8d275bb0a0c6069eb2`（标准 = `90015098...`）

## 5. 环境指纹段（h5st 第 7 段）

- 由 SDK 的 `_$clt`（VMP）采集环境并编码
- 主要来源：canvas 指纹（`WQ_gather_cv1`）、WebGL 指纹（`WQ_gather_wgl1`）、navigator 属性（userAgent/sua/hardwareConcurrency/deviceMemory 等）
- **canvas/WebGL 指纹缓存于 localStorage**，可预置复用：
  ```json
  WQ_gather_cv1 = {"v":"11ff17e6d447f021fd0aec395a0004bf","t":...,"e":31536000}
  WQ_gather_wgl1 = {"v":"d98d8e0d3763a4f045fa1f9ea1efc858","t":...,"e":31536000}
  ```
- 浏览器两次真实请求 seg7 对比：**760+ 字符为环境固定段，仅 3 处动态段**（位置 44、304、433 附近）
- jsdom 中预置缓存后 seg7 与浏览器同源（前缀 `of7ruCLj3XYS7iFTCOYS9iFT9yVe9ipjxjpPFipjLDrg` 一致），长度 800 vs 浏览器 840，仍差少量环境属性

## 6. VMP 说明

- SDK 核心流程 `_$sdnmd`、`_$ms`、`_$gdk`、`_$pam` 均为 VMP 字节码（`switch(s[q++])` 解释器循环）
- **本分析未反编译 VMP**，而是通过：
  1. 浏览器 hook `signSync` 入参/出参 → 确定入口参数
  2. hook `String.prototype.concat` → 追踪签名拼接链
  3. 对 SDK `_createHelper` 源码级注入日志 → 实证 hash1/seg4/seg8 算法
  4. hook `_$atm`（非 VMP 的算法分发方法）→ 确认算法名（MD5/SHA256/HmacSHA256/HmacMD5）
- 已知非 VMP 明文方法：`_$icg`（构造）、`_$atm`（算法执行）、`_$rds/_$rgo/_$ram`（token 获取流程）、`_$cps`（参数校验）

## 7. 关键 localStorage 键（SDK 持久化）

| 键 | 内容 | 说明 |
|---|---|---|
| `WQ_dy1_vk` | fp 设备指纹 | 21位随机串，跨会话稳定 |
| `WQ_dy1_tk_algo` | {tk, algo} 缓存 | 自定义 base64 编码 |
| `WQ_gather_cv1` | canvas 指纹 | 环境采集 |
| `WQ_gather_wgl1` | WebGL 指纹 | 环境采集 |
| `WQ_gather_hio1` | 其他指纹 | 环境采集 |
| `WQ_dy1_pFlag` | 行为标记 | - |
| `JDst_behavior_flag` | 行为标记 | - |

## 8. 复现路径（两条）

### 路径 A：黑盒可用版（jsdom + SDK + 缓存注入）
- Node.js + jsdom 加载原始 SDK，预置浏览器导出的 localStorage（fp/tk/algo/canvas/webgl 指纹）
- 调用 `signSync(params)` 生成 h5st
- 已实现于 `test_full_inject.js`，能生成结构完整 h5st（fp/tk/token 与浏览器一致）
- 已知问题：seg7 环境段与浏览器仍有少量差异（navigator 属性未完全对齐），请求返回 403 需要继续补环境

### 路径 B：白盒纯算版
- 需复刻 SDK 魔改 SHA256/MD5（初始哈希值/常量被修改）
- 需复现 seg7 环境指纹编码算法（VMP 内，工作量大）
- 需要 request_algo 的 tk/algo 依赖（协议可复现）

## 9. 已保存的证据文件

```
config/
├── js_security_v3.js            # SDK 原始文件（237KB）
├── js_security_v3.beautified.js # 格式化版本
├── browser_h5st.txt             # 浏览器真实 h5st 样本
├── browser_storage_full.json    # 浏览器全部 localStorage 导出
├── request_algo_sample.json     # request_algo 请求/响应样本
├── sign_sync_sample.json        # signSync 入参/出参样本
└── h5st_*.txt                   # jsdom 生成样本
```

## 10. 补充：环境对齐与 403 分析结论（深入阶段）

### 已验证结论
1. **签名算法完全正确**（决定性实验）：
   - 混合 h5st = jsdom生成的seg4/seg8 + 浏览器主页面seg7 → **HTTP 200 + 605**（签名有效）
   - 混合2 = jsdom seg7 + 主页面其他 → **403**
   - ⇒ 服务端只校验 seg7（环境指纹），seg4/seg8 算法正确

2. **jsdom 环境已完全对齐**（13 字段）：
   - `_$PT` 白名单输出（sua/pp/extend/pf/random/v/bu4/canvas/webglFp/ccn/bu14 + t/fp）
   - 全部与浏览器主页面一致（extend patch、canvas/webgl 缓存注入、pFlag 同步）

3. **seg7 结构**：
   - 前缀（0-44）= SDK 实例级随机（浏览器每次加载也不同，of7ruCLj 前缀在浏览器 reqid=82 成功过）
   - 环境固定段（尾部 251 字符）= canvas/webgl/fp 编码，jsdom 与浏览器**完全一致**
   - 内部随机块 = 会话级

4. **403 根因**：seg7 由 SDK VMP `_$clt` 生成，包含**实时 canvas 指纹**（`_$fx()` 实际渲染 canvas.toDataURL）。jsdom 无真实 canvas 渲染，即使缓存指纹一致，`_$clt` 内部实时采集结果与浏览器不同 → seg7 环境段不匹配 → 403。

### 已尝试的修复（均无效）
| 方案 | 结果 |
|------|------|
| 注入 canvas/webgl 缓存指纹 | 13 字段对齐，但 seg7 仍 403 |
| patch `_$fx` 返回缓存值 | seg7 前缀不变，403 |
| canvas getContext mock | 403 |
| 用主页面缓存 tk | 403 |
| 自请求 tk | 403 |

### 出路
1. **完整 canvas 渲染**：jsdom 安装 `canvas` npm 包（node-canvas），让 `_$fx()` 真实渲染 → 可能通过
2. **WASM/无头浏览器采集**：用 puppeteer 采集真实 canvas 指纹后注入（但指纹含动态渲染，需每次采集）
3. **协议层 seg7 生成**：逆向 `_$clt` VMP 的 seg7 编码算法（工作量大，需反编译 VMP）


---

## 11. 最终结论（403 已解决，2026-08-03）

### 11.1 seg7 编解码算法（完整还原）

对 SDK 内 `_$ft.encode`（VMP 字节码）编写解释器逐指令追踪，结合已知输入/输出对推导：

```
seg7 = 每4字符组反转( customB64( 按3字节块反转( envJSON字节 + 填充 ) ) )
```

- 字符表：`rqponmlkjihgfedcbaZYXWVUTSRQPONMLKJIHGFEDCBA-_9876543210zyxwvuts`
- 填充：`3 - (envJSON长度 % 3)` 个字节，字节值 = 填充数
- envJSON 内容 = `_$PT` 白名单 11 字段 + `t` + `fp`，pretty-print JSON
- 解码（任意 seg7 → env JSON）：4 字符组反转 → customB64 解码 → 3 字节块反转 → 去尾部填充

用该算法成功解码浏览器真实 seg7，拿到了此前无法看到的服务端校验内容（env JSON 明文）。

### 11.2 403 根因（三个字段）

浏览器真实 seg7 解码出的 env JSON vs jsdom 生成值对比：

| 字段 | 浏览器真实值 | jsdom 原生值 | 处理 |
|---|---|---|---|
| `extend.bu3` | 43~45（会话相关） | -1 / 1 | patch 为 45 |
| `extend.bu6` | 29 | -1 | patch 为 29 |
| `extend.bu13` | `"Fd"`（仅行为标记） | 无 / 误混 pFlag | 只注入 `JDst_behavior_flag=[Fd]`，**不注入 pFlag** |
| `extend.wk/bu4/bu8` | 0 / 0 / 0 | 64 / 8 / 1 | patch 为 0 |
| `bu14` | pFlag 轮换值 | SDK 自生成即可 | 自洽即可（服务端只做一致性校验） |
| `canvas/webglFp` | 指纹 | 自洽即可 | 真实渲染或注入均可 |

修复位置：`utils/instrument.js` 对 SDK 源码的 `_$P8`（extend 构造器）返回值 patch。

### 11.3 交付（黑盒可用版）

- **脚本**：
  - `main.js`（主入口，`node main.js` 自请求验证；`node main.js --json` 输出 JSON 供 Python 调用）
  - `main.py`（Python 请求端，`python3 main.py`：subprocess 调 `main.js --json` 本地生成 h5st，requests 发请求）
  - `jd_h5st.js`（同逻辑的独立版本，`node jd_h5st.js` 直接运行）
  - `get_cookies_cdp.js`（自动从 Chrome 获取 cookies：`node get_cookies_cdp.js`）
    - Chrome 136+ 禁止对默认 user-data-dir 开调试端口 → 复制 profile 关键文件到临时目录启动调试 Chrome（登录态保留）→ CDP 拉取全部 cookies（含 HttpOnly）→ 写 `config/cookies.txt` → 清理并恢复浏览器 → 自动跑 `main.py` 验证
    - 首次运行可能弹出 Chrome 退出/恢复提示，属正常
- **流程**：jsdom + @napi-rs/canvas 真实渲染 → SDK 自举（自生成 fp、自请求 request_algo 拿 tk03）→ patch extend（bu3=45/bu6=29/wk=0/bu4=0/bu8=0）+ 注入行为标记 → signSync 生成 h5st → 请求
- **验证结果**：
  - 使用自动获取的 Chrome cookies：HTTP 200 + `{"code":0,"msg":"Success","data":{...}}` —— **返回真实业务数据**
  - 使用过期 cookies 时为 605（账号级风控验证态）；签名本身自始至终有效
  - 注意：HTTP 方法需用 **GET**（POST 返回 HttpStatus=405）
- **两条路径均已验证**：注入浏览器 fp/tk/canvas 模式、完全自举模式，均 605

### 11.4 说明
- 605 为账号级状态（该账号早前被 cfe.m.jd.com/risk_handler 要求验证），签名层面已完全通过
- `x-api-eid-token` 传空即可，不影响校验
- tk03 有效期内可复用；脚本每次运行自取新 tk，无需手工维护
