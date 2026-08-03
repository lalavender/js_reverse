# 阳光高考 RS6 纯 Node 方案（sdenv）

瑞数 6 代（412 + JSVMP + 无限 debugger + URL 签名）纯 Node 数据获取。

## 原理

```
sdenv（魔改 jsdom + C++ V8 addon）加载页面
→ RS JSVMP 真实执行 → 自动完成 412 挑战（生成 cookie T）
→ RS XHR 拦截器劫持 dom 内请求 → 自动追加 p3LORH7S 签名
→ dom 内发请求 = cookie + 签名全自动
```

## 使用

```bash
npm install        # 安装 sdenv（含 canvas 原生模块）
node main.js                 # 分类 + 层级遍历（门类→学科→专业）
node main.js --search 计算机   # 专业搜索（POST zymc=）
```

## 代码（main.js 核心）

```js
const client = new RSClient();
await client.init();                       // sdenv 加载 + RS 挑战
const r = await client.request('/zyk/zybk/ccCategory');                          // GET
const s = await client.request('/zyk/zybk/specialityesByZymc', { zymc: '计算机' }, { method: 'POST', headers: {'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'} });  // POST
```

`RSClient.request(path, params, {method, headers})` 支持任意接口，自动签名。

## 调试辅助

```bash
./start-chrome.sh    # 启动真实 Chrome（9223，独立 profile）
# DevTools Ignore List 添加 *c69d89a.js* 可绕静态 debugger
```

## 已知限制

- sdenv 为异步环境，高频请求需自行控制频率
- RS 服务端可随时更新检测项；若 cookie 失效需升级 sdenv 版本

完整分析见 `../ANALYSIS.md`
