// ==UserScript==
// @name         BOSS直聘 F12 防闪退补丁
// @namespace    zhipin-f12-fix
// @version      2.0.0
// @description  BOSS直聘(zhipin.com) 打开 DevTools/F12 页面闪退修复：伪造隔离环境 console，使两套反调试 SDK 检测器全部失效
// @author       reverse-engineer
// @match        https://www.zhipin.com/*
// @match        https://*.zhipin.com/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // ============================================================
    // BOSS直聘反调试机制（两套独立 SDK，均用 console 序列化做检测）
    // ------------------------------------------------------------
    // SDK-1: zhipin-sign/v5312/vendors~app.daefb1ca.js（登录页/全站）
    //   X() 创建隔离 iframe → parent.__xbcw = iframe.window
    //   console.log/table 来自 window.__xbcw（页面自身 hook 不到）
    //
    // SDK-2: zhipin-geek-spa/v6717/vendor-1.0535618d.js（职位页 SPA）
    //   Z() 创建隔离 iframe → 直接读 r.contentWindow 取 console
    //   不走 __xbcw 中转，且 onDevToolOpen 惩罚无条件执行
    //
    // 检测器（每 500ms 循环 XCID）：
    //   DateToString:  console.log(date) 触发 date.toString ≥2 次
    //   FuncToString:  console.log(func) 触发 func.toString ≥2 次
    //   DefineId:      console.log(div) 触发 div.id getter
    //   RegToString:   console.log(reg) 触发 reg.toString
    //   Performance:   console.table 大对象耗时 > 10×console.log 耗时 ×3
    //   Der:           执行暂停 >100ms（debugger 断点，iOS）
    //   pA/ty:         eruda/devTools.isShow / #__vconsole 元素
    //
    // 惩罚链：XCID 命中 → onDevToolOpen
    //   → fA()：原生方法被改则内存炸弹；否则 window.open("","_self")
    //     + close() + history.back() + body清空 + location.href="" → 闪退
    //   → geek-spa 版：无论原生方法状态如何都执行闪退
    //
    // 绕过原理：
    //   1) 冻结 window.__xbcw = 伪造对象（console 全 no-op）
    //      → SDK-1 的 X() 拿到无害 console，检测器永不触发
    //   2) 覆盖 HTMLIFrameElement.prototype.contentWindow getter
    //      返回 Proxy（仅 console 拦截为 no-op，其余透传真实 iframe）
    //      → SDK-2 的 Z() 拿到无害 console，检测器永不触发
    //      → 且不破坏 zhipinFrame 签名 iframe（contentWindow.ABC 等透传）
    // ============================================================

    // ---- 伪造 console（两套 SDK 的检测器依赖点）----
    var noopConsole = {
        log: function () {},
        table: function () {},
        clear: function () {},
        warn: function () {},
        error: function () {}
    };

    // ---- 补丁 1：覆盖 iframe.contentWindow getter（SDK-2: geek-spa）----
    try {
        var cwDesc = Object.getOwnPropertyDescriptor(HTMLIFrameElement.prototype, 'contentWindow');
        if (cwDesc && cwDesc.get && cwDesc.configurable) {
            var origGet = cwDesc.get;
            Object.defineProperty(HTMLIFrameElement.prototype, 'contentWindow', {
                get: function () {
                    var real;
                    try { real = origGet.call(this); } catch (e) { return undefined; }
                    if (real && real.console) {
                        return new Proxy(real, {
                            get: function (t, p) {
                                if (p === 'console') { return noopConsole; }
                                return t[p];
                            }
                        });
                    }
                    return real;
                },
                configurable: true
            });
        }
    } catch (e) { /* 覆盖失败则仅靠补丁 2 */ }

    // ---- 补丁 2：冻结 __xbcw（SDK-1: zhipin-sign）----
    var fake = {
        console: noopConsole,
        clearTimeout: window.clearTimeout.bind(window),
        setTimeout: window.setTimeout.bind(window),
        performance: window.performance,
        requestAnimationFrame: window.requestAnimationFrame.bind(window),
        Location: window.Location,
        alert: function () {},
        confirm: function () { return true; },
        prompt: function () { return null; }
    };

    function lockXbcw() {
        try {
            var d = Object.getOwnPropertyDescriptor(window, '__xbcw');
            if (!d || d.writable !== false || window.__xbcw !== fake) {
                Object.defineProperty(window, '__xbcw', {
                    value: fake,
                    writable: false,
                    configurable: false
                });
            }
        } catch (e) { /* iframe srcdoc 赋值冲突时静默 */ }
    }

    lockXbcw();
    // 守护：防止页面后续代码重定义 __xbcw
    setInterval(lockXbcw, 50);
})();
