/**
 * 缺失函数检测器
 * 
 * 在 Node.js 中运行代码前/后，自动检测哪些函数/属性缺失。
 * 
 * 使用方式:
 *   1. require('./detector') 在 env.js 之前或之后
 *   2. 调用 diff() 对比两次快照
 *   3. 或直接运行 node detector.js 查看内置测试
 */

const fs = require('fs');
const path = require('path');

// ============ 快照 ============

/**
 * 保存当前环境的快照
 * @param {string} label - 快照标签（如 "加载前", "加载后"）
 * @returns {object} 快照数据
 */
function snapshot(label) {
  const keys = Object.keys(globalThis).sort();
  const funcKeys = keys.filter(k => typeof globalThis[k] === 'function');
  const undefinedKeys = keys.filter(k => typeof globalThis[k] === 'undefined');
  const objectKeys = keys.filter(k => typeof globalThis[k] === 'object' && globalThis[k] !== null);
  
  // 对每个 key 采样类型和值
  const details = {};
  keys.forEach(k => {
    const val = globalThis[k];
    let type = typeof val;
    let sample = '';
    if (val === null) { type = 'null'; }
    else if (type === 'function') { sample = val.name || '(anonymous)'; }
    else if (type === 'object') { 
      try {
        if (Array.isArray(val)) sample = 'Array(' + val.length + ')';
        else if (val.constructor && val.constructor.name) sample = val.constructor.name;
        else sample = 'Object';
      } catch(e) { sample = '(error)'; }
    }
    else if (type === 'string') { sample = '"' + val.substring(0, 30) + '"'; }
    else if (type === 'number') { sample = String(val); }
    else if (type === 'boolean') { sample = String(val); }
    else if (type === 'undefined') { sample = 'undefined'; }
    details[k] = { type, sample };
  });
  
  return {
    label,
    time: Date.now(),
    totalKeys: keys.length,
    functionCount: funcKeys.length,
    undefinedCount: undefinedKeys.length,
    keys,
    details,
  };
}

// ============ 差异对比 ============

/**
 * 对比两个快照，找出新增、删除、类型变化的 key
 * @param {object} before - snapshot() 结果
 * @param {object} after  - snapshot() 结果
 * @returns {object} 差异报告
 */
function diff(before, after) {
  const added = after.keys.filter(k => !before.keys.includes(k));
  const removed = before.keys.filter(k => !after.keys.includes(k));
  
  const typeChanged = [];
  before.keys.forEach(k => {
    if (after.keys.includes(k)) {
      const bType = before.details[k]?.type;
      const aType = after.details[k]?.type;
      if (bType && aType && bType !== aType) {
        typeChanged.push({ key: k, before: bType, after: aType });
      }
    }
  });
  
  // 查找"可能缺失"的函数（code.js 访问但返回 undefined 的属性）
  const potentialMissing = [];
  if (before.details && after.details) {
    // 如果一个属性在 before 中不存在（undefined），在 after 中也不存在
    // 这可能意味着代码访问了它但没有设置
    // 这个功能需要 watch() 代理的日志配合
  }
  
  return {
    totalBefore: before.totalKeys,
    totalAfter: after.totalKeys,
    added: added.length,
    removed: removed.length,
    typeChanged: typeChanged.length,
    addedKeys: added,
    removedKeys: removed,
    typeChangedKeys: typeChanged,
    newFunctions: added.filter(k => typeof globalThis[k] === 'function'),
    newObjects: added.filter(k => typeof globalThis[k] === 'object' && globalThis[k] !== null),
  };
}

// ============ 缺失检测器（配合 watch Proxy 使用） ============

/**
 * 创建一个 watch Proxy，记录所有 get/set/apply 操作
 * 自动检测访问了但值为 undefined 的属性（可能缺失）
 * 
 * @param {object} obj - 要代理的对象
 * @param {string} name - 对象名（日志用）
 * @param {object} options
 * @param {boolean} options.logAll - 是否打印所有操作（默认 false）
 * @param {boolean} options.logMissingOnly - 只打印 undefined 的访问（默认 true）
 * @returns {Proxy}
 * 
 * @example
 *   const detector = createDetector();
 *   window = detector.watch(window, 'window');
 *   // 运行 code.js...
 *   console.log(detector.getMissingReport());
 */
function createDetector(options = {}) {
  const { logAll = false, logMissingOnly = true } = options;
  
  // 记录所有 get/set 操作
  const accessLog = {
    gets: {},    // { 'objName.prop': count }
    sets: {},
    calls: {},
    undefinedGets: [],  // 访问但为 undefined 的属性
  };
  
  function recordGet(objName, prop, val) {
    const key = `${objName}.${String(prop)}`;
    accessLog.gets[key] = (accessLog.gets[key] || 0) + 1;
    if (val === undefined && logMissingOnly) {
      accessLog.undefinedGets.push({ key, time: Date.now() });
      if (logMissingOnly) {
        console.log(`[缺失检测] 访问了 ${key} => undefined ⚠️`);
      }
    }
  }
  
  function recordSet(objName, prop, val) {
    const key = `${objName}.${String(prop)}`;
    accessLog.sets[key] = (accessLog.sets[key] || 0) + 1;
  }
  
  function recordCall(objName, args) {
    accessLog.calls[objName] = (accessLog.calls[objName] || 0) + 1;
  }
  
  function watch(obj, name) {
    const handler = {
      get(target, prop, receiver) {
        const val = Reflect.get(target, prop, receiver);
        if (prop !== Symbol.toStringTag && prop !== 'constructor') {
          recordGet(name, prop, val);
          if (logAll) console.log(`[watch] 取值: ${name}.${String(prop)} =>`, val);
        }
        return val;
      },
      set(target, prop, value, receiver) {
        recordSet(name, prop, value);
        if (logAll) console.log(`[watch] 设置: ${name}.${String(prop)} =`, value);
        return Reflect.set(target, prop, value, receiver);
      },
      apply(target, thisArg, args) {
        recordCall(name, args);
        if (logAll) console.log(`[watch] 调用: ${name}()`, args);
        return Reflect.apply(target, thisArg, args);
      }
    };
    return new Proxy(obj, handler);
  }
  
  function getMissingReport() {
    // 合并统计
    const allProps = new Set();
    Object.keys(accessLog.gets).forEach(k => allProps.add(k));
    Object.keys(accessLog.sets).forEach(k => allProps.add(k));
    
    // 找出访问了但值为 undefined 的属性
    const missing = accessLog.undefinedGets
      .filter((item, index, self) => self.findIndex(i => i.key === item.key) === index)
      .map(item => item.key);
    
    // 找出被设置但从未被 get 的属性（可能是 code.js 内部创建的）
    const setOnly = Object.keys(accessLog.sets)
      .filter(k => !accessLog.gets[k]);
    
    return {
      summary: {
        totalGets: Object.keys(accessLog.gets).length,
        totalSets: Object.keys(accessLog.sets).length,
        totalCalls: Object.keys(accessLog.calls).length,
        missingCount: missing.length,
      },
      mostAccessed: Object.entries(accessLog.gets)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .map(([key, count]) => ({ key, count })),
      missingProperties: missing,
      setButNeverGet: setOnly,
    };
  }
  
  return { watch, getMissingReport, accessLog };
}

// ============ 命令行使用 ============

if (require.main === module) {
  console.log('=== 环境快照工具 ===\n');
  
  // 用法示例
  console.log('用法:');
  console.log('  1. 在 env.js 中引入:');
  console.log('     const detector = require("./detector");');
  console.log('     const before = detector.snapshot("env前");');
  console.log('     // ... 加载代码 ...');
  console.log('     const after = detector.snapshot("env后");');
  console.log('     console.log(detector.diff(before, after));\n');
  
  console.log('  2. 使用缺失检测:');
  console.log('     const d = detector.createDetector({logMissingOnly: true});');
  console.log('     window = d.watch(window, "window");');
  console.log('     // ... 运行 code.js ...');
  console.log('     console.log(d.getMissingReport());\n');
  
  // 演示
  console.log('=== 当前环境快照 ===');
  const s = snapshot('当前');
  console.log('总属性数:', s.totalKeys);
  console.log('函数数:', s.functionCount);
  console.log('undefined 数:', s.undefinedCount);
}

// ============ 导出 ============
module.exports = { snapshot, diff, createDetector };
