const fs = require('fs');
function findEnd(s, start) {
  let depth = 0, i = start, quote = null;
  for (; i < s.length; i++) {
    const c = s[i];
    if (quote) { if (c === '\\') { i++; continue; } if (c === quote) quote = null; continue; }
    if (c === '"' || c === "'") { quote = c; continue; }
    if (c === '{') depth++;
    else if (c === '}') { depth--; if (depth === 0) return i; }
  }
  throw new Error('not found from ' + start);
}
function instrument(sdk, opts = {}) {
  let out = sdk;
  const ptDef = 'function _$PT(_$Pd){';
  const ptAt = out.indexOf(ptDef);
  if (ptAt === -1) throw new Error('_$PT def not found');
  const ptBodyEnd = findEnd(out, ptAt + ptDef.length - 1);
  const hashLog =
    'window.__LOG__=[];' +
    'var _$F4_ORIG_=_$f4.format;_$f4.format=function(){var _r=_$F4_ORIG_.apply(_$f4,arguments);' +
    'try{var _a=arguments[0];window.__LOG__.push({t:"f4",len:_a&&_a.length,args:String(_a).slice(0,200),out:String(_r).slice(0,80)})}catch(e){}return _r;};' +
    'var _$F2_ORIG_=_$f2;_$f2=function(){var _r=_$F2_ORIG_.apply(this,arguments);' +
    'try{var _a=arguments[0];window.__LOG__.push({t:"f2",len:_a&&_a.length,args:String(_a).slice(0,200),out:String(_r).slice(0,80)})}catch(e){}return _r;};';
  out = out.slice(0, ptBodyEnd + 1) +
    'window.__PT_FN__=_$PT;window.__P9__=_$P9;window.__FX__=_$fx;window.__FY__=_$fy;window.__FI__=_$fi;' +
    'window.__P8_ORIG__=_$P8;window.__PT_INPUTS__=[];window.__HASH__={f2:_$f2,fV:_$fV,fc:_$fc,f4:_$f4,fb:_$fb};' +
    hashLog +
    out.slice(ptBodyEnd + 1);
  out = out.replace(ptDef, ptDef + 'window.__PT_INPUT__=_$Pd;try{window.__PT_INPUTS__.push(_$Pd)}catch(e){};');
  if (opts.patchFx) {
    const fxDef = 'function _$fx(){';
    const fxAt = out.indexOf(fxDef);
    if (fxAt === -1) throw new Error('_$fx def not found');
    const fxEnd = findEnd(out, fxAt + fxDef.length - 1);
    out = out.slice(0, fxEnd + 1) +
      'var _$FX_ORIG_=_$fx;_$fx=function(){var _v=window.__FX_FIXED__;if(_v){return _v;}return _$FX_ORIG_();};' +
      out.slice(fxEnd + 1);
  }
  if (opts.patchExtend !== false) {
    const p8Def = 'function _$P8(){';
    const p8At = out.indexOf(p8Def);
    if (p8At === -1) throw new Error('_$P8 def not found');
    const p8End = findEnd(out, p8At + p8Def.length - 1);
    out = out.slice(0, p8End + 1) +
      'var _$P8_ORIG_=_$P8;_$P8=function(){var _o=_$P8_ORIG_();_o.wk=0;_o.bu3=45;_o.bu4=0;_o.bu6=29;_o.bu8=0;return _o;};' +
      out.slice(p8End + 1);
  }
  return out;
}
module.exports = { instrument };
