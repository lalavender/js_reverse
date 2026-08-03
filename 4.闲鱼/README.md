# 闲鱼 H5 MTOP 接口 sign 签名还原（4.闲鱼）

## 目标

复现接口：`POST https://h5api.m.goofish.com/h5/mtop.taobao.idlehome.home.webpc.feed/1.0/`

## 还原结论（双证据链）

### 1. 签名公式（纯算法，黑盒/白盒同构）

```
token  = _m_h5_tk cookie 中 '_' 之前的部分（如 "c7293abec07ddce442f3556897a3f145"）
t      = Date.now()（毫秒时间戳）
appKey = 34839810（固定，闲鱼 webpc 端）
data   = POST body 中 data 参数值（JSON 字符串，如 {"itemId":"","pageSize":30,"pageNumber":1,"machId":""}）
sign   = MD5(token + "&" + t + "&" + appKey + "&" + data)  （小写 hex）
```

### 2. 证据

| 证据 | 内容 |
|---|---|
| 样本 1（main.py 遗留） | token=`7b93924e...` t=`1785563202595` → 算得 `f4d12a98...305f`，与抓包一致 |
| 样本 2（浏览器实时抓包 reqid=48） | token=`c7293abe...` t=`1785564091018` → 算得 `ccbeb8d7...4b50`，与抓包一致 |
| 白盒源码 | `g.alicdn.com/mtb/lib-mtop/2.7.3/mtop.js`：`k = i(d.token+"&"+j+"&"+h+"&"+c.data)`，`j=(new Date).getTime()`，`i` 为内嵌标准 MD5；token 取 `cookie.split("_")[0]` |

### 3. 其他动态参数

| 参数 | 来源 | 说明 |
|---|---|---|
| `t` | `Date.now()` | 毫秒时间戳，参与签名 |
| `_m_h5_tk` / `_m_h5_tk_enc` | 服务端 Set-Cookie 下发 | token 有效期约 5400s（Max-Age）；**无需自己生成** |
| `sign` | 见上 | 32 位小写 hex |
| 其余（jsv/appKey/v/type/...） | 固定 | 直接写死 |

### 4. Token 自动刷新链路（已实测）

```
无 token / token 过期
  → 服务端返回 FAIL_SYS_TOKEN_EMPTY / FAIL_SYS_TOKEN_ILLEGAL
  → 响应头 Set-Cookie 携带新 _m_h5_tk、_m_h5_tk_enc
  → 更新 Cookie 后重试（对齐 mtop.js __processToken 的 retry 语义）
```

实测记录：
- 空 token 首访 → `FAIL_SYS_TOKEN_EMPTY::令牌为空` → 取新 token 重试 → `SUCCESS::调用成功`，20 张卡片
- 伪造过期 token → `FAIL_SYS_TOKEN_ILLEGAL::非法令牌` → Set-Cookie 下发新 token
- 最小 Cookie 集：`cookie2` + `mtop_partitioned_detect` 即可（tfstk/xlly_s 非必需）

### 5. 反爬类型判定

**纯算法型（非行为型/非签名型 JSVMP）**：页面直接 200，无 412/JSVMP 挑战；签名仅依赖 4 个明文字段的标准 MD5，无环境指纹参与。属于"纯混淆"档中的最简单子类——连混淆都没有（lib-mtop 是公开 SDK）。

## 文件结构

```
4.闲鱼/
├── main.js            # 黑盒可用版：签名 + token 自动刷新 + 分页请求（零依赖）
├── lib/md5.js         # 白盒纯算版：RFC1321 MD5 纯 JS 实现（与 mtop.js 内嵌实现逐位一致）
├── config/cookies.json# 初始 Cookie（cookie2 等，token 由服务端下发后自动回写）
└── package.json
```

## 运行

```bash
cd 4.闲鱼
node main.js        # 首页 feed（第 1 页）
node main.js 3      # 第 3 页
```

输出：`ret` / 卡片数 / 前 10 条商品（itemId、标题、价格、销量）。

## 验证

- 连续 5+ 次请求均返回 `SUCCESS::调用成功`，数据非空（见下方验证记录）
- 服务端用 `Set-Cookie` 刷新 token 后脚本自动续期，无需人工干预
- 无任何浏览器依赖，可在无 X11 的容器中长期运行（签名与 TLS 指纹无关，Node 原生 https 即可）

## 依赖

零第三方依赖（仅 Node.js 内置 `https`/`zlib`/`crypto`）。白盒版 MD5 连 `crypto` 都不用。
