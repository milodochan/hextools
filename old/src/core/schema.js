/**
 * schema.js —— Schema「代码模式」与「列表模式」的双向互转逻辑。
 * 移植自 H:\hex_analyzer\common.js 第 5.5 节。
 * 列表模式每一行是 { name, type, length, endian, offset, remark, raw }，
 * 代码模式是 `const schema = [ ... ]` 字符串。
 */
import { Type, unPack, pack, ipv4ToBytes, Buffer } from './parser.js'

export const TYPE_OPTIONS = [
  'int8',
  'uint8',
  'int16',
  'uint16',
  'int32',
  'uint32',
  'float',
  'double',
  'bytes',
  'utf16le',
  'hex',
]

// 列表 -> 代码 时的 preamble（schema 定义之前的辅助代码，切模式时保留）
export let listPreamble = ''
// 生成代码行号 -> 列表行号
export let genLineToRow = {}

export function escAttr(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}
export function q(s) {
  return "'" + String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'"
}
export function isFnSrc(s) {
  if (/^(?:async\s+)?function\b/.test(s)) return true
  return s.indexOf('=>') >= 0 && /^(?:\(|[A-Za-z_$][\w$]*\s*=>|async\s)/.test(s)
}

/* ---------- 行 -> 代码 ---------- */
export function rowToCode(r, last) {
  if (r.raw != null) return last ? r.raw : r.raw + ','
  const p = []
  const nm = (r.name || '').trim()
  if (nm) {
    if (nm.charAt(0) === '=') p.push('name: (' + nm.slice(1).trim() + ')')
    else if (isFnSrc(nm)) p.push('name: ' + nm)
    else p.push('name: ' + q(nm))
  }
  p.push('type: Type.' + String(r.type || '').toUpperCase())
  let ln = (r.length || '').trim()
  if (ln.charAt(0) === '=') ln = ln.slice(1).trim() // = 前缀：强制按表达式处理
  if (ln) {
    if (/^\d+$/.test(ln)) p.push('length: ' + ln)
    else if (isFnSrc(ln)) p.push('length: ' + ln)
    else p.push('length: (d) => (' + ln + ')')
  }
  if (r.endian === 'be') p.push('endian: false')
  const off = (r.offset || '').trim()
  if (off) p.push('offset: ' + (/^\d+$/.test(off) ? off : '(' + off + ')'))
  let line = '    { ' + p.join(', ') + ' }'
  if (!last) line += ','
  const rm = (r.remark || '').trim()
  if (rm) line += ' // ' + rm.replace(/[\r\n]+/g, ' ')
  return line
}
export function codeFromRows(listRows) {
  genLineToRow = {}
  const out = []
  if (listPreamble) out.push(listPreamble.replace(/\s+$/, ''), '')
  out.push('const schema = [')
  const base = out.length
  for (let i = 0; i < listRows.length; i++) {
    genLineToRow[base + i] = i
    out.push(rowToCode(listRows[i], i === listRows.length - 1))
  }
  out.push(']')
  return out.join('\n')
}
export function validateRows(listRows) {
  for (let i = 0; i < listRows.length; i++)
    if (listRows[i].raw == null && !listRows[i].type) return i + 1
  return 0
}

/* ---------- 代码 -> 行 ---------- */
/* 按顶层逗号切分数组元素，跳过字符串/注释，元素后的行注释回贴到该元素末尾 */
function splitArrayElements(src) {
  const elems = []
  let cur = ''
  let depth = 1
  let i = 0
  const n = src.length
  let str = null
  let com = null
  function wsOnly(s) {
    return !/\S/.test(s)
  }
  while (i < n) {
    const c = src[i]
    const c2 = i + 1 < n ? src[i + 1] : ''
    if (com === '//') {
      if (c === '\n') {
        com = null
        cur += c
        i++
        continue
      }
      if (wsOnly(cur) && elems.length) elems[elems.length - 1] += c
      else cur += c
      i++
      continue
    }
    if (com === '/*') {
      if (c === '*' && c2 === '/') {
        com = null
        cur += c2
        i += 2
        continue
      }
      cur += c
      i++
      continue
    }
    if (str) {
      cur += c
      if (c === '\\') {
        cur += c2
        i += 2
        continue
      }
      if (c === str) str = null
      i++
      continue
    }
    if (c === "'" || c === '"' || c === '`') {
      str = c
      cur += c
      i++
      continue
    }
    if (c === '/' && c2 === '/') {
      com = '//'
      if (wsOnly(cur) && elems.length) elems[elems.length - 1] += '//'
      else cur += '//'
      i += 2
      continue
    }
    if (c === '/' && c2 === '*') {
      com = '/*'
      cur += c + c2
      i += 2
      continue
    }
    if (c === '{' || c === '[' || c === '(') {
      depth++
      cur += c
      i++
      continue
    }
    if (c === '}' || c === ')' || c === ']') {
      depth--
      if (depth === 0) break // schema 数组的 ]
      cur += c
      i++
      continue
    }
    if (c === ',' && depth === 1) {
      elems.push(cur)
      cur = ''
      i++
      continue
    }
    cur += c
    i++
  }
  if (cur.trim()) elems.push(cur)
  return elems
}
/* 从元素文本末尾切出行注释 */
function splitTrailingComment(text) {
  let i = 0
  const n = text.length
  let str = null
  while (i < n) {
    const c = text[i]
    const c2 = i + 1 < n ? text[i + 1] : ''
    if (str) {
      if (c === '\\') {
        i += 2
        continue
      }
      if (c === str) str = null
      i++
      continue
    }
    if (c === "'" || c === '"' || c === '`') {
      str = c
      i++
      continue
    }
    if (c === '/' && c2 === '/')
      return { code: text.slice(0, i), comment: text.slice(i + 2).trim() }
    if (c === '/' && c2 === '*') {
      const e = text.indexOf('*/', i + 2)
      i = e < 0 ? n : e + 2
      continue
    }
    i++
  }
  return { code: text, comment: '' }
}
export function rowsFromCode(code) {
  const m = /\bschema\s*=\s*\[/.exec(code)
  if (!m) return null
  // 保留 schema 定义之前的辅助代码（去掉行尾的 const/let/var 声明关键字）
  listPreamble = code
    .slice(0, m.index)
    .replace(/\s*\b(?:const|let|var)\b\s*(?:\/\/[^\n]*)?$/, '')
  const elems = splitArrayElements(code.slice(m.index + m[0].length))
  const rows = []
  for (let i = 0; i < elems.length; i++) {
    const sp = splitTrailingComment(elems[i].trim())
    const codePart = sp.code.trim()
    if (!codePart) continue
    let obj = null
    try {
      obj = new Function(
        'Type',
        'unPack',
        'pack',
        'ipv4ToBytes',
        'Buffer',
        'console',
        (listPreamble ? listPreamble + '\n' : '') + 'return (' + codePart + ')',
      )(Type, unPack, pack, ipv4ToBytes, Buffer, console)
    } catch (e) {
      obj = null
    }
    let tkey = ''
    if (obj && typeof obj === 'object') {
      for (const k in Type) if (Type[k] === obj.type) { tkey = k.toLowerCase(); break }
    }
    let unsupported = false
    if (obj && typeof obj === 'object') {
      for (const pk in obj)
        if (pk !== 'name' && pk !== 'type' && pk !== 'length' && pk !== 'endian' && pk !== 'offset')
          unsupported = true
      if (obj.endian !== undefined && typeof obj.endian !== 'boolean') unsupported = true
      if (obj.offset !== undefined && typeof obj.offset !== 'number') unsupported = true
    }
    if (!tkey || unsupported) {
      rows.push({ raw: codePart, remark: sp.comment })
      continue
    }
    const row = { name: '', type: tkey, length: '', endian: 'le', offset: '', remark: sp.comment || '', raw: null }
    let bail = false
    if (typeof obj.name === 'string') row.name = obj.name
    else if (typeof obj.name === 'function') row.name = String(obj.name)
    else if (obj.name != null) bail = true
    if (typeof obj.length === 'number') row.length = String(obj.length)
    else if (typeof obj.length === 'function') row.length = String(obj.length)
    else if (obj.length != null) bail = true
    if (obj.endian === false) row.endian = 'be'
    if (typeof obj.offset === 'number') row.offset = String(obj.offset)
    if (bail) {
      rows.push({ raw: codePart, remark: sp.comment })
      continue
    }
    rows.push(row)
  }
  return rows
}

export function typeOptions(cur) {
  return TYPE_OPTIONS.map((t) => ({ label: t.toUpperCase(), value: t }))
}
