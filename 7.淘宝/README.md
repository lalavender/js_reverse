# 淘宝 PC 搜索接口逆向（7.淘宝）

## 目标

还原 `POST https://s.taobao.com/search?...` 请求头 `sign` 的生成算法，Node.js 脱离浏览器独立请求成功。

## 分析结论（证据驱动）

### 1. 目标请求的归属

你抓到的请求格式（`clientPreloadId=preload_<ts>` + `preLoadOrigin` + `initiative_id=tbindexz_20170306` + `ssid=s5-e` + `sourceId=tb.index` + `spm=a21bo.jianhua/a.search_hover.0`）与当前首页搜索框「悬停预加载」参数格式一致。

### 2. 当前线上代码已不发送该请求 —— 全部走 mtop

对当前全部线上资产做了源码级排查，搜索数据请求一律走：

```
POST https://h5api.m.taobao.com/h5/mtop.relationrecommend.wirelessrecommend.recommend/2.0/
```

| 资产 | 版本 | 数据请求方式 | 证据 |
|---|---|---|---|
| 首页搜索框组件 | `new-search-suggest/2.14.6/bundle.js` | mtop（`Te`→`window.lib.mtop.request`） | 源码 `_preloadData` |
| 搜索页 | `main-search/pc-search-2024/1.8.49/js/main.js` | mtop（`c0`→`cC.request`，appId 34385） | 源码 @3382455/@3351002 |
| 搜索页（旧） | 1.8.27（2025-12 存档） | mtop | Wayback 存档 |
| 搜索页（初代 React） | `pc-main-search/0.0.51`（2024-05） | mtop | Wayback 存档 |
| 旧 tsrp 搜索页 | `tb/tsrp/1.70.29`（2023） | GET jsonp（`srp/_5` requester） | Wayback 存档 |

浏览器实测（登录/未登录、首页悬停/提交、搜索页直开）：
- 未登录：`h5api.m.taobao.com` mtop + AWSC 滑块验证
- 登录态（注入 main.py 的 41 个 cookie）：依旧只发 mtop

### 3. 直连 POST /search 路由状态

从本机对 `POST https://s.taobao.com/search` 做了多组探测：无 sign / 32 位 hex / 40 / 64 / 128 位 / mtop 风格 MD5 / 不同 body —— **全部 404**（Tengine 通用 404）。GET 正常返回页面 HTML。

结论：该直连路由要么已下线，要么按「合法 sign」才路由。**单凭黑盒探测无法区分**，需要一个真实请求样本（含合法 sign 值）来验证算法。

## 交付内容

### 当前可用版（已运行验证）

`main.js` —— 通过当前线上生效的 mtop 接口获取搜索数据：

```
node main.js [关键词] [页码]      # 默认 紫砂壶 第1页
```

签名算法（页面源码原样还原）：

```
sign = md5(token + "&" + t + "&" + appKey + "&" + data)
  token   = cookie _m_h5_tk 下划线前部分（缺失时自动向 h5api 首请求获取）
  t       = 13 位毫秒时间戳
  appKey  = 12574478
  data    = JSON.stringify({appId:"34385", params: JSON.stringify(搜索参数)})
```

- 依赖：零（纯 Node 内置 `https`/`crypto`），可在无浏览器 Docker 容器运行
- 验证：连续 5 页请求全部 `SUCCESS::调用成功`，每页 50 条商品

### 文件结构

```
7.淘宝/
├── main.js            # 主脚本（mtop 版搜索）
├── utils/
│   ├── sign.js        # mtop 签名 + token 提取
│   └── request.js     # https 请求封装（Set-Cookie 合并）
├── config/
│   ├── cookies.json   # 登录态（从原 main.py 提取）
│   └── main.js        # 搜索页源码（分析用，4.4MB）
└── README.md
```

## 完成 /search 直连 sign 所需信息

若必须复现你抓到的 `POST /search` + 请求头 sign，需要你从浏览器 DevTools 提供一次该请求的：

1. **完整 Request Headers**（重点：`sign` 的值、是否有 `t`/时间戳、`bx-ua` 等其他动态头）
2. **Request Payload**（请求体原文）
3. **Response 状态码 + 开头内容**

有了合法 sign 样本即可离线反推拼接规则（token&t&appKey&data / 参数序列化 / 其他盐值），并以该样本 + 端点行为交叉验证。
