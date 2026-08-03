# 逆向账本（findings ledger · SQLite 持久化 · 跨会话累积 · 每轮注入上下文）

## ✅ 已确认事实（3）
- mnsv2 架构确认：JSVMP + WASM 双引擎。JSVMP dispatcher _0x1233dd (29885 bytes) 引用 _0x5ae8(184个字符串)/_0xc8b2 解码表；WASM 模块 $1[114] 长度36414字节，零 imports，13个导出含6个hash命名函数。环境在初始化时预采集进 ΙIΙ[0] (348属性) 和 ΙIΙ[1]，运行时不再读浏览器。  〔证据:page_eval 导出 mnsv2 属性 + run_node 编译 WASM 零 imports 成功 + 代码搜索确定 JSVMP 依赖链 _0x5ae8→_0xc8b2→_0x1233dd〕
- vendor-dynamic.9d66b1ff.js (1.3MB) 是 webpack chunk 格式，bundler-runtime.da4451f9.js 提供 __webpack_require__。mnsv2 工厂在模块 x73 中 (51KB)，需 _0x5ae8 解码数组和 _0xc8b2 解码函数才能执行。在 vm 中直接执行工厂函数超时(需要正确 bytecode 输入)。  〔证据:vendor-dynamic 开头 (self.webpackChunkxhs_pc_web...) 确认 webpack chunk；code_search/run_node 确认模块 x73 包含完整 mnsv2 工厂；vm 中执行超时〕
- 完成 window.mnsv2 执行后环境快照提取并保存到 env.js：包含(1) mnsv2.ΙIΙ[0] 的201个window属性快照（环境对象引用清单），(2) browser环境实际值（navigator 20项/screen 13项/location 7项/document 9项），(3) mnsv2_extra辅助数据（d=2, $0/$1/$2）。env.js 为 Node.js 模块(13906B)，require('./env.js')可直接用。  〔证据:run_node 验证 require('./env.js') 成功，module.exports 含 _meta/mnsv2_env/mnsv2_extra/browser 四个顶级键〕

## ⛔ 已否决 · 别重试（0）
（暂无）
