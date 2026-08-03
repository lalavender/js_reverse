# 阳光高考 (gaokao.chsi.com.cn) 逆向分析文档

> 分析日期：2026-08-01
> 目标站点：https://gaokao.chsi.com.cn/zyk/zybk/（专业知识库）
> 反爬类型：瑞数 6 代（RS6）——412 挑战 + JSVMP + 无限 debugger + URL 后缀签名

---

## 1. 站点概况

| 项 | 值 |
|---|---|
| 挑战机制 | 首次请求返回 HTTP 412，响应体为精简 HTML |
| 412 结构 | `<meta id="A2Kal8hczzgd" content="动态token">` + 内联 `$_ts{nsd, cd}` 配置 + RS JS 引用 + 入口调用 `_$xx()` |
| RS JS | 路径目录/文件名随机（如 `/NJ7TNwcMIDHl/xQaW6eAgumZY.c69d89a.js`），版本号 `.c69d89a.js` 固定 |
| RS JS 变体 | 同文件名下内容交替（x1/x2 两种），实验必须锁定样本排除干扰 |
| JSVMP | 202KB 压缩单行，`while(1)` opcode 循环，变量 `_$` 前缀随机字母 |
| 完成挑战 | 携带 `acw_tc + S + T` 三个关键 cookie 重新请求 → 200 |

### 数据接口（均为 RS 签名域内）

| 接口 | 方法 | 参数 | 说明 |
|---|---|---|---|
| `/zyk/zybk/ccCategory` | GET | - | 学历层次分类 |
| `/zyk/zybk/mlCategory/{code}` | GET | - | 学科门类（1050=本科普通教育） |
| `/zyk/zybk/xkCategory/{code}` | GET | - | 学科类 |
| `/zyk/zybk/specialityesByCategory/{code}` | GET | - | 专业列表（含评分 `zymyd`） |
| `/zyk/zybk/specialityesByZymc` | **POST** | body `zymc=专业名` | 专业搜索（按名称） |

---

## 2. Cookie 生成机制

### 2.1 服务端下发（HttpOnly，JS 不可见）

| Cookie | 特征 | 说明 |
|---|---|---|
| `acw_tc` | 62 hex | 阿里云 WAF 会话 |
| `aliyungf_tc` | 64 hex | 阿里云 WAF |
| `CHSICC01` | 81 字符，`!` 开头 | 站点自有会话 |
| `35067579362dd9cd78` | 动态名 16 hex + 32 hex 值 | RS 服务端会话标记 |
| `goaYXsyEWlxdO`（S） | 88 字符，10 年有效期 | **RS 服务端标识，cookie 名随挑战动态变化** |

### 2.2 客户端生成（T cookie：`goaYXsyEWlxdP`）

- **命名**：S 名末位字母 +1（O→P）
- **格式**：`"0" + Base64(URL-safe)`，字符集 `[A-Za-z0-9._-]`
- **长度**：279 字符即可通过校验（sdenv 产物），真实浏览器 428-471（环境数据更多）
- **加密链**（经验库已验证）：
  ```
  basearr(TLV 环境指纹, ~154B, 8种type)
  → Huffman 编码 → XOR → AES-128-CBC
  → 追加 CRC32 → AES-128-CBC → Base64(URL-safe)
  ```
- **密钥**：从 412 内联 `$_ts.cd`（约 2400 字符）经 XOR offset 推导 45 组，**每次挑战动态变化**
- **写入机制**：不走 `document.cookie` 标准 setter（Hook 零捕获），JSVMP 内部机制写入

### 2.3 URL 后缀签名（p3LORH7S）

- 数据接口 URL 带 `p3LORH7S=0...` 参数
- **由 RS XHR 拦截器在请求发出时动态计算追加**（非独立算法，无需还原）
- 结论：在 RS 运行环境内发请求即可自动带签名（"喂入-截出"）

---

## 3. 调试方案探索（无限 debugger 全记录）

RS6 反调试组合拳：

| 反调试 | 触发条件 | 结论 |
|---|---|---|
| 静态 `debugger` | JSVMP 解释器源码内 `if(cond)debugger;else`，**DevTools 打开即暂停** | JS hook 无效（不走 Function/eval/定时器），实测动态路径零命中 |
| 时间差检测 | `new Date(); debugger; new Date()-a > 100ms` → 判定调试器 | 依赖 debugger 暂停，暂停消失即失效 |
| 反篡改惩罚 | 检测原生函数被改 / 源码完整性（debugger 被移除）| 覆写 `webdriver`、CDP 改写源码 → **死循环卡死或拒发 cookie** |

### 方案对比

| 方案 | 结果 | 结论 |
|---|---|---|
| Tampermonkey/脚本猫 JS hook（Function/eval/定时器）| 静态 debugger 无效 | ❌ 放弃 |
| CDP Fetch 改写 RS JS 源码（debugger→void 0）| 部分变体触发源码完整性检测 → 卡死/不生成 cookie | ❌ 放弃 |
| **DevTools Ignore List** `*c69d89a.js*` | 不改源码、RS 无感知，零暂停 | ✅ **调试用唯一可靠方案** |

### 调试环境（分析用）

```
start-chrome.sh   # 启动真实 Chrome（9223 端口，独立 profile ~/.chrome-rs6-debug）
                  # 真实浏览器 webdriver=false 才能通过 RS 指纹校验（MCP 自动 Chrome 400）
```

---

## 4. 扣代码 + 本地补环境实验（失败实录）

尝试在 Node 中扣 RS JS + jsdom 补环境执行，**结论：RS6 手动补环境不可行**。

| 实验 | 结果 |
|---|---|
| jsdom 加载 RS JS（UA only） | 好变体：T 生成（279）✅；恶劣变体：RangeError（惩罚路径） |
| 逐组补 navigator/webdriver/plugins/screen/chrome/performance/hasFocus | T 恒 279 |
| 注入真实 canvas 指纹 + 真实 WebGL 值（真实 Chrome 采集）| T 恒 279 |
| navigator 18 项真实值 + userAgentData 全量注入 | T 恒 279 |
| 分离变量验证（真实 cookie 集 Node 请求）| 200 → 链路无问题 |
| 真实 S + 本地 T | 400 → **T 内容无效是唯一原因** |

**失败根因**：
1. T 恒 279 vs 真实 428+ —— RS 检测到环境异常走**降级路径**（跳过指纹采集）
2. 任何属性层补丁不生效 —— 检测点在**身份层/行为层**（window 构造器链、原生函数身份、`document.all` 集合行为），JS 层无法模拟
3. 覆写 `navigator.webdriver`、移除 `debugger` 均触发**反篡改惩罚**
4. 恶劣变体在任何 jsdom 环境下直接惩罚（RangeError 死循环，`Array.push` 溢出）

**注意**：jsdom 24 的 `typeof document.all === "undefined"` 天然通过（老坑已不存在），但后续身份层检测仍无法通过。

---

## 5. 最终方案：sdenv（纯 Node）

**原理**：sdenv = 魔改 jsdom + C++ V8 addon（`ObjectTemplate::MarkAsUndetectable()` 实现真实 `document.all` 行为），环境保真到 V8 层 → RS JSVMP 真实执行 → 完整采集指纹 → 有效 cookie。

**关键突破**：sdenv dom 内 XHR 被 RS 拦截器劫持，**自动追加 p3LORH7S 签名** → 数据接口直接可用（喂入-截出）。

```
node main.js                # 分类 + 层级遍历（门类→学科→专业）
node main.js --search 计算机  # 专业搜索（POST zymc）
```

验证：cookie 5/5 稳定生成，页面 200，全部接口真实数据。

### 与经验库案例的差异（本项目新增）

1. sdenv 生成的 T 为 279 字符（经验库样本更长）——**长度不影响校验**，内容正确即可
2. 本站在 cookie 之外还需 **URL 后缀签名**（经验库：sdenv 只能生成 cookie）——**实际由 RS XHR 拦截器自动生成**，dom 内发请求即可绕过，无需额外处理
3. RS 源码完整性反篡改：debugger 移除会触发惩罚（CDP 改写方案失效）

---

## 6. 文件结构

```
production/
├── ANALYSIS.md                        # 本文档
├── cookie_analysis_samples.json       # 412 配置 + cookie 样本
├── session-logs/                      # 会话日志
└── rs6-debugger-bypass/               # 最终交付（sdenv 方案）
    ├── main.js                        # RSClient：init + request(GET/POST)
    ├── package.json / package-lock.json
    ├── start-chrome.sh                # 调试 Chrome 启动（DevTools 分析用）
    ├── README.md                      # 方案使用说明
    └── node_modules/                  # jsdom + canvas + sdenv
```
