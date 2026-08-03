# env.js vs demo.js 深度分析

## 概述

两个文件的目标相同：在 Node.js 中模拟浏览器环境，让 `code.js`（小红书混淆签名算法）可以正常运行。

| 维度 | env.js | demo.js |
|------|--------|---------|
| 行数 | ~430 行 | ~1265 行 |
| 架构 | 直接全局赋值 | IIFE + 构造函数体系 |
| 状态 | ✅ 可用 | ❌ 不可用 |
| 策略 | 极简主义 — 只补需要的 | 全面主义 — 尽可能模拟完整 DOM |

---

## 架构对比

### env.js（简约模式）

```js
window = globalThis                          // window 就是 Node.js global
function Document(){}                        // 空构造函数
document = new Document()                    // 直接实例化
document.cookie = '...'                      // 直接设置属性
```

- 所有 `window.xxx = yyy` 直接写到 `globalThis` 上
- 构造函数只是占位符，没有原型链
- `watch()` Proxy 只做日志，不影响值
- **够用就停，不多补一个 API**

### demo.js（完整模式）

```js
window = (function(){
  // v_saf: 注册函数并保存 toString
  // v_new_toggle: 构造函数调用锁
  // _inherits: 原型链继承
  // Object.defineProperty(Object.prototype, Symbol.toStringTag, ...)
  // Date 覆写（ftime）
  // ... 大量 DOM API 模拟
  return window
})()
```

- 完整 DOM 原型链：`Document → Node → EventTarget`
- `v_new_toggle` 机制：防止直接 `new Xxx()`，必须通过 `v_new()`
- `Date` 被覆写：返回 `ftime()` 而非真实时间
- 所有 API 都用 `v_saf()` 注册到 native toString 缓存

---

## 导致 demo.js 不可用的根因

### 根因 1：`Date` 覆写（★★★★★）

**demo.js** 中（L1208-1236）：
```js
var v_Date = Date;           // 保存原始 Date
var v_base_time = +new Date; // 记录基准时间
function ftime(){
  return new v_Date() - v_base_time + v_to_time
}
Date = function(_Date) {     // 覆写 Date
  // 内部的 Date() 构造函数返回 ftime()
  function Date() {
    var date = instantiate(_Date, [ftime()]);
    return date;
  }
  Date.prototype = _Date.prototype
  return Date;
}(Date);
```

**code.js 大量使用 `Date.now()` 和 `new Date()` 做时间相关计算**。如果 `Date` 被覆写后返回值不稳定或与预期不符，初始化流程可能中断。

**env.js** 中：`window.Date = Date`（直接使用 Node.js 原生 Date），无覆盖。

### 根因 2：`v_new_toggle` 构造函数锁（★★★★）

**demo.js** 中每个构造函数都检查：
```js
function Window() {
  if (!v_new_toggle) { throw TypeError("Illegal constructor") }
}
```

虽然 L1240 设置了 `v_new_toggle = false`，但 **code.js 内部可能尝试 `new Object()` 或通过自定义构造函数创建对象**。如果 code.js 内部用的构造函数也检查了类似锁机制，会直接抛错。但 `v_new_toggle` 只影响 demo.js 定义的构造函数，不影响 `code.js` 自身定义的函数。

**真正的问题更微妙**：`v_new_toggle = false` 后，`v_console_log` 不再输出（L20），但这不影响功能。

### 根因 3：`Object.prototype[Symbol.toStringTag]` 覆写（★★★）

**demo.js** L9-11：
```js
Object.defineProperty(Object.prototype, Symbol.toStringTag, {
  get() { return Object.getPrototypeOf(this).constructor.name },
  configurable: true,
});
```

这会改变所有对象的 `Object.prototype.toString.call(obj)` 结果。code.js 中对某些对象做 `toString` 检测时，可能得到与浏览器不一致的结果。

例如，一个普通对象 `{}` 在浏览器中是 `[object Object]`，在 demo.js 中也是 `[object Object]`（因为 `{}.constructor.name === 'Object'`）。但某些特殊内置对象（如 Promise、Map、Set）的 `constructor.name` 不同，code.js 可能检测这些。

### 根因 4：`require`/`module`/`exports`/`Buffer` 被删除（★★）

**demo.js** L738-743：
```js
if (typeof require != 'undefined'){ require = undefined }
if (typeof Buffer != 'undefined'){ Buffer = undefined }
```

虽然这些变量在 IIFE 内被设为 `undefined`，不影响 module 级别的 require，但 **code.js 可能检测 `typeof require === 'undefined'` 来判断是否在 Node.js 环境**。

如果 code.js 检测到 `require` 不存在 → 认为是浏览器 → 继续执行。所以**删除 require 反而是正确的**。

但如果 code.js 期望在浏览器中 `require` 是 `undefined`，而 **env.js 保留 require**，这反而可能让 code.js 识别出 Node.js 环境而拒绝工作...

但事实是 env.js + code.js 工作，所以 code.js 并不检查 `require`。

---

## 已确认可工作的最小环境

从 env.js 总结出 code.js 需要的**最小环境**：

```
必需:
├── window = globalThis
├── document.cookie (有值的 cookie)
├── navigator.userAgent (任意合理值)
├── location.href (https://www.xiaohongshu.com/)
├── performance.now() (返回数字)
├── crypto.getRandomValues() (Node.js crypto)
├── btoa() (Base64 编码)
├── insight.sessionId (任意 UUID)
└── xhsFingerprintV3 (有 getV18/getCurMiniUa 等方法)

不需要:
├── WebGL（没用到）
├── Canvas 指纹（没用全）
├── DOM 原型链（EventTarget/Node）
├── CSSStyleDeclaration
├── PluginArray / MimeTypeArray
├── Date 覆写
└── 复杂的事件系统
```

---

## 修改建议

### 让 demo.js 工作的修改清单（已做）

1. **L745-751**: 用 `window = __globalThis__` 替换 Window Proxy ✓
2. **L628**: `performance.now` 添加 `writable: true` ✓
3. **L1242-1258**: 添加 `insight` 和 `xhsFingerprintV3` ✓
4. **L753**: 添加 `History` 构造函数 ✓
5. **L14-19**: 注释掉 console.log 拦截 ✓

### 仍需修改

6. **L1208-1236**: 注释掉 Date 覆写，使用原生 Date
   ```js
   // 注释掉整个 Date 覆写块
   // 或者只在需要时启用
   ```

7. **L9-11**: 注释掉 `Object.prototype[Symbol.toStringTag]` 覆写
   ```js
   // Object.defineProperty(Object.prototype, Symbol.toStringTag, { ... });
   ```

8. **L1210-1236**: 整个 `v_Date`/`ftime()`/Date 覆写需要移除或改为条件启用
   ```js
   // 改为: 不覆写 Date
   // 删除 var v_Date = Date 到 Date.now = ... 整个块
   ```

---

## 结论

**env.js 成功**是因为它采用了"按需补充，不多给"的策略。code.js 做环境检测时检查的属性有限（cookie、performance、insight、xhsFingerprintV3），env.js 精准地提供了这些。

**demo.js 失败**是因为它做了太多"多余"的事：
1. 覆写 `Date` → 破坏了 code.js 的时间计算
2. 覆写 `Object.prototype[Symbol.toStringTag]` → 可能破坏类型检测
3. `v_new_toggle` 锁机制 → 不必要的复杂度

**教训：补环境时，先让代码跑起来，再逐步添加缺失的 API。不要一次性模拟整个浏览器。**
