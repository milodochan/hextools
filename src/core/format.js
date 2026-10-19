/**
 * format.js —— 视图渲染用的纯格式化辅助函数（无副作用，组件与 store 共用）。
 */
import { bytesToHex, HEX2, PALETTE_LEN } from './parser.js'

export function escHtml(s) {
  return String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]))
}

export function hex8(n) {
  return n.toString(16).padStart(8, '0')
}

export function fieldCls(i) {
  return i >= 0 ? ' f' + (i % PALETTE_LEN) : ''
}

export function asciiChar(b) {
  if (b >= 0x20 && b <= 0x7e) return escHtml(String.fromCharCode(b))
  return '.'
}

export function utf16Char(u8, i) {
  // 延迟引入 decodeUtf16 避免循环依赖
  const ch = decodeUtf16Safe(u8.subarray(i, i + 2), true)
  const c = ch ? ch.charAt(0) : ''
  if (!c) return '.'
  const code = c.charCodeAt(0)
  if ((code >= 0x20 && code <= 0x7e) || (code >= 0x4e00 && code <= 0x9fff)) return escHtml(c)
  return '·'
}

// 轻量 UTF-16LE 解码（仅取首字符），不依赖 parser 的 TextDecoder 包裹
import { decodeUtf16 } from './parser.js'
function decodeUtf16Safe(u8, le) {
  try {
    return decodeUtf16(u8, le)
  } catch (e) {
    return ''
  }
}

export function valPreview(f) {
  const v = f.value
  if (v instanceof Uint8Array) return bytesToHex(v)
  if (typeof v === 'number') {
    if (f.type && f.type.indexOf('int') === 0) {
      const h = (v >>> 0).toString(16)
      return v + ' (0x' + h + ')'
    }
    return String(v)
  }
  return JSON.stringify(v)
}

export function truncStr(s, n) {
  s = String(s)
  return s.length > n ? s.slice(0, n) + '…' : s
}

export { HEX2 }
