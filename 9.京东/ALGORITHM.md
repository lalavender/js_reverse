# 京东 h5st 签名算法整理（jsfbox_feed_tab / api.m.jd.com）

> 依据：VMP 解释器逐指令追踪 + 浏览器/本地样本双向验证（HTTP 200 + code:0 Success）

## 1. 总体流程

```
准备参数 → 获取 tk → 生成 h5st（10 段）→ GET 请求 api.m.jd.com
```

- 动态参数：`t`（毫秒时间戳）、`uuid`、`body`（内层 JSON）、`h5st` 全部本地生成
- 唯一外部依赖：`tk03`（`cactus.jd.com/request_algo` 下发，24h 有效）与登录 cookies

## 2. h5st 10 段结构（分号分隔）

| 段 | 含义 | 生成方式 |
|---|---|---|
| 0 | 17 位时间戳 `yyyyMMddHHmmssSSS` | `Date.now()` 格式化 |
| 1 | fp 设备指纹（17 位，custom 字符表随机串） | 首次生成后缓存 |
| 2 | appId | 固定 `b5216` |
| 3 | tk 令牌 | `request_algo` 下发 `tk03...` |
| 4 | 第一签名 | `SHA256(hash1 + paramsStr)`（见 §5） |
| 5 | 版本号 | 固定 `5.3` |
| 6 | 13 位毫秒时间戳 | `Date.now()` |
| 7 | 环境指纹段（840 字符） | 见 §6 |
| 8 | 第二签名 | `SHA256(hash1 + "appid:appid&functionid:functionId" + hash1)` |
| 9 | 参数名编码段 | `customB64("appid,body,client,clientVersion,functionId,t")`（固定） |

## 3. 字符表与编码原语

```
CHARSET = "rqponmlkjihgfedcbaZYXWVUTSRQPONMLKJIHGFEDCBA-_9876543210zyxwvuts"
customB64(bytes) = 标准 base64 位流，字符表替换为 CHARSET（'=' 补齐）
```

- fp 随机串、tk_algo 缓存、seg7、seg9 均使用该字符表
- SDK 内 SHA256/MD5 为魔改实现（常量表被替换），黑盒版直接复用 SDK；纯算版需复刻

## 4. tk 获取（request_algo）

```
POST https://cactus.jd.com/request_algo
Content-Type: application/json

{
  "version": "5.3",
  "fp": "<17位指纹>",
  "appId": "b5216",
  "timestamp": <ms>,
  "platform": "web",
  "fv": "h5_file_v5.3.4"
}

响应: { status:200, data:{ result:{ tk:"tk03...", fp:"...", algo:"function test(tk,fp,ts,ai,algo){var rd='xxxx';...SHA256(...)}" } } }
```

- `algo` 内嵌动态随机 `rd`（每次下发不同），参与 hash1 计算
- tk 有效期 24h，缓存于 localStorage（customB64 编码）

## 5. 签名链（seg4 / seg8）

```
ts19  = seg0 + "54"                    // 19 位字符串
hash1 = SHA256( tk + fp + ts19 + appId + rd )

paramsStr = 按 _stk 排序拼接:
  _stk = "appid,body,client,clientVersion,functionId,t"
  paramsStr = "appid:www-jd-com&body:<body的SHA256hex>&client:pc&clientVersion:1.0.0&functionId:jsfbox_feed_tab&t:<ms>"

seg4 = SHA256( hash1 + paramsStr )
seg8 = SHA256( hash1 + "appid:appid&functionid:functionId" + hash1 )
```

- 入参 body = `SHA256(原始bodyJSON)` 的 64 位 hex
- 算法正确性已由混合实验证实（本地 seg4/seg8 + 浏览器 seg7 → 通过）

## 6. seg7 环境指纹段（核心，已完整还原）

```
seg7 = 每4字符组反转( customB64( 按3字节块反转( envJSON字节 + 填充 ) ) )
```

- **编码**：
  1. `envJSON` = `_$PT` 白名单 11 字段 + `t` + `fp` 的 pretty-print JSON
  2. 填充：`3 - (envJSON长度 % 3)` 个字节，字节值 = 填充数（凑成 3 的倍数）
  3. 按 3 字节块切分，**块顺序反转**
  4. `customB64` 编码
  5. 每 4 字符组**反转** → seg7

- **解码**（任意 seg7 → envJSON）：4 字符组反转 → customB64 解码 → 3 字节块反转 → 去尾部填充

- **envJSON 字段**（白名单，顺序固定）：

```json
{
  "sua": "Macintosh; Intel Mac OS X 10_15_7",
  "pp": { "p2": "jd_5cc1079ecc5ae" },        // 来自 cookie pin
  "extend": { "wd":0, "l":0, "ls":5, "wk":0, "bu1":"0.1.4", "bu3":45,
              "bu4":0, "bu5":0, "bu6":29, "bu7":0, "bu8":0,
              "random":"<10位随机>", "bu12":-8, "bu10":14, "bu11":4,
              "bu13":"Fd" },                  // 行为标记
  "pf": "MacIntel",
  "random": "<10位随机>",
  "v": "h5_file_v5.3.4",
  "bu4": "0",
  "canvas": "<32hex canvas指纹>",
  "webglFp": "<32hex webgl指纹>",
  "ccn": 8,
  "bu14": "<pFlag相关轮换值>",
  "t": <ms>,
  "fp": "<seg1同值>"
}
```

## 7. 服务端校验与修复点（403 根因）

服务端解码 seg7 校验 envJSON 字段。jsdom 环境与真实浏览器存在差异，曾导致 403：

| 字段 | 浏览器真实值 | jsdom 原生值 | 修复 |
|---|---|---|---|
| `extend.bu3` | 43~45 | -1 / 1 | patch 为 45 |
| `extend.bu6` | 29 | -1 | patch 为 29 |
| `extend.bu13` | `"Fd"` | 缺失/误混 pFlag | 只注入 `JDst_behavior_flag` |
| `extend.wk/bu4/bu8` | 0/0/0 | 64/8/1 | patch 为 0 |

其余字段（canvas/webgl/bu14 等）服务端只做一致性校验（与 request_algo 的 expandParams 同源），自洽即可。

## 8. 请求

```
GET https://api.m.jd.com/?appid=www-jd-com&client=pc&clientVersion=1.0.0&t=<ms>
  &uuid=<本地生成/__jda>&body=<外层JSON>&method=get&functionId=jsfbox_feed_tab
  &h5st=<10段>&x-api-eid-token=&loginType=3
```

- **必须 GET**（POST 返回 HttpStatus=405）
- 外层 body = `{"appid","body":<原始bodyJSON字符串>,"clientVersion","client","functionId","t","uuid","loginType":3,"source":"pc-home"}`
- 携带 Chrome 登录 cookies（`node get_cookies_cdp.js` 自动获取）
- 成功：`{"code":0,"msg":"Success","data":{...}}`

## 9. 实现文件

| 文件 | 作用 |
|---|---|
| `main.js` | 本地生成 h5st（`--json` 输出供 Python） |
| `main.py` | requests 请求端（subprocess 调 main.js） |
| `jd_h5st.js` | 同逻辑独立版 |
| `get_cookies_cdp.js` | 自动从 Chrome 获取 cookies |
| `utils/instrument.js` | SDK 源码插桩 + extend patch |
| `utils/env_patch.js` | jsdom 环境伪装 |
