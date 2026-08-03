# 知乎 search_v3 接口 x-zse-96 签名还原

## 目标信息

| 项 | 值 |
|---|---|
| 站点 | https://www.zhihu.com/ |
| 接口 | GET https://www.zhihu.com/api/v4/search_v3?gk_version=gz-gaokao&t=general&q=python&... |
| 还原参数 | 请求头 `x-zse-96`（签名）+ `x-zse-93`（版本） |
| 其他动态参数 | `x-zst-81`（登录态返回，可选）、`d_c0`（cookie，参与签名） |

## 签名算法还原

签名核心位于 `static.zhihu.com/heifetz/4876.app.0c80d2d99cfe9eb64fb6.js`（2.2MB）的 webpack **模块 1514**。

### 模块结构

- **93823**：组装器 —— `$8()` 生成 `["101_3_3.0", "x-zse-93", "x-zse-96"]`，`nT()` 返回 `{encrypt: 1514.ZP, version: "3.0"}`
- **1514**：JSVMP（JS 虚拟机保护）
  - `l` 类：自定义字节码解释器（`l.prototype.O`，case 27-506 指令集）
  - 模块加载时 `(new l).O("ABt7CAAUS...")` 执行 11.8KB 混淆字节码（atob + XOR 解码）
  - 动态生成 `__g._encrypt`（嵌套 VM 闭包）+ 填充加密表 `h.zb`(S盒 256B)、`h.zk`(轮密钥 32×32bit)、`h.zm`(key 16B)
  - 导出 `XL="3.0"`、`ZP = (er) => __g._encrypt(encodeURIComponent(er))`
- **88545**（Web 版签名中间件）：
  ```
  source = [x-zse-93值, url的path+query, d_c0, body(≤4096B), xZst81].filter(Boolean).join("+")
  signature = encrypt( md5(source) )        // encrypt = 1514.ZP
  x-zse-96 = "2.0_" + signature
  ```

### 加密内幕（黑盒视角）

- 输入：md5 的 hex 串（32 字符）
- 加密：SM4 变体分组密码（CBC），S盒/轮密钥由 VM 初始化生成
- 输出：64 字符自定义 base64（`+` → `=` 替换），**每次调用结果不同**（VM 内部含时间因子），服务端按格式解密验证
- 环境检测：VM 通过 `eval` 探测 `document/navigator/location/history/screen` 及 `HTMLDocument/Navigator/History/Screen` 构造器，缺失时签名无效（403 code 10003）

### 服务端当前校验策略（实测矩阵）

| 场景 | 结果 |
|---|---|
| 未登录 + 任意签名 | 401 ZERR_NOT_LOGIN（登录检查优先） |
| 登录 + 正确格式签名 | 200 |
| 登录 + 无签名 | 403 code 10003（签名异常） |
| 登录 + 假签名 | 200（宽松校验，格式正确即可） |
| 连续快速请求 | 偶发 403 code 10003（风控抖动，同一签名重试即 200） |

> 注：当前服务端对 x-zse-96 为宽松校验（登录态下格式正确即放行），
> 但签名实现完整复刻浏览器算法，可抗未来收紧。

### 验证结果

```
node verify.js  → RESULT: 5/5 passed（5 次翻页全部 200 + 20 条数据）
```

## 运行方式

```bash
npm init -y 2>/dev/null  # 无第三方依赖，可不执行
node main.js            # 搜索 python 第一页
node verify.js          # 5 次翻页稳定性验证
```

## 项目结构

```
6.知乎/
├── main.js            # 主脚本：签名 + 搜索请求
├── verify.js          # 稳定性验证（5 次请求）
├── utils/
│   └── sign.js        # 签名器：环境补丁 + webpack 运行时 + VM 加载
├── config/
│   ├── mod1514.js     # 提取的 JSVMP 签名虚拟机（核心）
│   ├── mod74185.js    # tslib typeof helper
│   └── mod10261.js    # md5 模块（备用）
└── analysis/          # 分析过程产物（trace 脚本、提取记录）
```

## 关键经验

1. **JSVMP 不反编译字节码**：走"提取 VM 纯 JS 执行"路线（等价纯 JS 实现，无浏览器依赖）
2. **webpack 模块提取**：`new Function` 包裹模块体后需调用两次（wrapper 返回模块函数，再执行模块体）
3. **环境补丁是关键**：VM 用 eval 探测浏览器对象，Node 中必须补 `document/navigator/location/history/screen` + DOM 构造器，否则签名被服务端拒绝
4. **签名非确定性**：每次生成不同（时间因子），验证格式而非固定值
5. **`=` 出现在 base64 中间**：是 `+` 被替换的结果，非标准 padding
