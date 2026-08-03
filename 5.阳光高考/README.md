# 5. 阳光高考 (gaokao.chsi.com.cn)

瑞数 6 代站点：412 挑战 + JSVMP + 无限 debugger + URL 后缀签名（p3LORH7S）

## 最终方案：sdenv 纯 Node（已打通）

```bash
cd production/rs6-debugger-bypass
node main.js                # 层级遍历（门类→学科→专业）真实数据
node main.js --search 计算机  # 专业搜索
```

原理：sdenv V8 层环境模拟 → RS JSVMP 真实执行 → cookie + 签名全自动（dom 内 XHR 拦截器生成 p3LORH7S）。

## 关键结论

| 问题 | 结论 |
|---|---|
| 无限 debugger | 静态代码（解释器源码），JS hook 无效；CDP 改写触发反篡改；**DevTools Ignore List `*c69d89a.js*` 是唯一调试方案** |
| 手动 jsdom 补环境 | 不可行（身份层检测 → 降级 T → 400），sdenv 是唯一纯 Node 路径 |
| cookie 机制 | S 服务端下发 + T 客户端生成（`"0"+Base64URL`，Huffman→XOR→AES-CBC→CRC32→AES-CBC 链） |
| 签名 | 非独立算法，RS XHR 拦截器动态生成，无需还原 |

## 目录

- `production/ANALYSIS.md` — 完整逆向分析文档（机制/方案对比/踩坑）
- `production/rs6-debugger-bypass/` — 最终交付（main.js + README）
- `production/cookie_analysis_samples.json` — cookie 样本
