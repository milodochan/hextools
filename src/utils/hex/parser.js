/**
 * parser.js —— 浏览器/Node 通用移植版
 * 语义与 BNSAtomix gameServer/src/test/parser.js 完全一致。
 * 提供：Type 枚举、read/write value、unPack、pack、ipv4ToBytes、UTF-16 编解码、
 * hex<->bytes 互转、以及 Node Buffer 垫片（schema 代码里可能用到 Buffer.from/alloc/concat）。
 */

export const Type = {
  INT8: 'int8',
  UINT8: 'uint8',
  INT16: 'int16',
  UINT16: 'uint16',
  INT32: 'int32',
  UINT32: 'uint32',
  FLOAT: 'float',
  DOUBLE: 'double',
  BYTES: 'bytes',
  UTF16LE: 'utf16le',
  HEX: 'hex',
}

export const readDefaultLength = new Map([
  [Type.INT8, 1],
  [Type.UINT8, 1],
  [Type.INT16, 2],
  [Type.UINT16, 2],
  [Type.INT32, 4],
  [Type.UINT32, 4],
  [Type.FLOAT, 4],
  [Type.DOUBLE, 8],
])

export const HEX2 = []
for (let i = 0; i < 256; i++) HEX2.push(i.toString(16).padStart(2, '0'))

export function bytesToHex(u8) {
  const n = u8.length
  const out = new Array(n)
  for (let i = 0; i < n; i++) out[i] = HEX2[u8[i]]
  return out.join('')
}

export function hexToBytes(h) {
  h = String(h).replace(/[^0-9a-fA-F]/g, '')
  if (h.length % 2) h = h.slice(0, -1)
  const n = h.length / 2
  const u8 = new Uint8Array(n)
  for (let i = 0; i < n; i++) u8[i] = parseInt(h.substr(i * 2, 2), 16)
  return u8
}

const td16 = new TextDecoder('utf-16le')
export function decodeUtf16(u8, le) {
  if (le) return td16.decode(u8)
  const c = u8.slice()
  for (let i = 0; i + 1 < c.length; i += 2) {
    const t = c[i]
    c[i] = c[i + 1]
    c[i + 1] = t
  }
  return td16.decode(c)
}
export function encodeUtf16(s, le) {
  const u = new Uint8Array(s.length * 2)
  const dv = new DataView(u.buffer)
  for (let i = 0; i < s.length; i++) dv.setUint16(i * 2, s.charCodeAt(i), le !== false)
  return u
}

export function readValue(type, u8, le) {
  const dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength)
  switch (type) {
    case Type.INT8:
      return dv.getInt8(0)
    case Type.UINT8:
      return dv.getUint8(0)
    case Type.INT16:
      return le ? dv.getInt16(0, true) : dv.getInt16(0, false)
    case Type.UINT16:
      return le ? dv.getUint16(0, true) : dv.getUint16(0, false)
    case Type.INT32:
      return le ? dv.getInt32(0, true) : dv.getInt32(0, false)
    case Type.UINT32:
      return le ? dv.getUint32(0, true) : dv.getUint32(0, false)
    case Type.FLOAT:
      return le ? dv.getFloat32(0, true) : dv.getFloat32(0, false)
    case Type.DOUBLE:
      return le ? dv.getFloat64(0, true) : dv.getFloat64(0, false)
    case Type.BYTES:
      return u8.slice()
    case Type.UTF16LE:
      return decodeUtf16(u8, le)
    case Type.HEX:
      return bytesToHex(u8)
    default:
      throw new Error('No reader function for type ' + type)
  }
}

export function writeValue(type, data, le) {
  switch (type) {
    case Type.BYTES:
      return data instanceof Uint8Array ? data : Uint8Array.from(data)
    case Type.INT8: {
      const a = new Uint8Array(1)
      new DataView(a.buffer).setInt8(0, data | 0)
      return a
    }
    case Type.UINT8: {
      const b = new Uint8Array(1)
      b[0] = data & 0xff
      return b
    }
    case Type.INT16: {
      const c = new Uint8Array(2)
      new DataView(c.buffer).setInt16(0, data | 0, le)
      return c
    }
    case Type.UINT16: {
      const d = new Uint8Array(2)
      new DataView(d.buffer).setUint16(0, data >>> 0, le)
      return d
    }
    case Type.INT32: {
      const e = new Uint8Array(4)
      new DataView(e.buffer).setInt32(0, data | 0, le)
      return e
    }
    case Type.UINT32: {
      const f = new Uint8Array(4)
      new DataView(f.buffer).setUint32(0, data >>> 0, le)
      return f
    }
    case Type.FLOAT: {
      const g = new Uint8Array(4)
      new DataView(g.buffer).setFloat32(0, +data, le)
      return g
    }
    case Type.DOUBLE: {
      const h = new Uint8Array(8)
      new DataView(h.buffer).setFloat64(0, +data, le)
      return h
    }
    case Type.UTF16LE:
      return encodeUtf16(String(data), le)
    case Type.HEX:
      return hexToBytes(data)
    default:
      throw new Error('No writer function for type ' + type)
  }
}

/**
 * 按 schema 解包 buffer。
 * 额外返回 fields 数组（含 start/length/value），供 Hex 视图标记字段覆盖范围。
 */
export function unPack(buffer, schema, isNameLen) {
  isNameLen = !!isNameLen
  const data = {}
  const fields = []
  const usedNames = new Set()
  function genName() {
    let r
    do {
      r = 'key_' + Math.random().toString(36).slice(2, 10)
    } while (usedNames.has(r))
    usedNames.add(r)
    return r
  }
  let cursor = 0
  for (let s = 0; s < schema.length; s++) {
    const item = schema[s]
    const fn = typeof item.length === 'function' ? item.length : ''
    const length = fn ? fn(data) : item.length
    let len = length || 0
    if (len <= 0) len = readDefaultLength.get(item.type) || 0
    if (len === 0) throw new Error('Invalid length for type ' + item.type)
    if (cursor + len > buffer.length)
      throw new Error(
        '字段超出数据范围: offset=' + cursor + ', length=' + len + ', total=' + buffer.length,
      )
    const rb = buffer.subarray(cursor, cursor + len)
    let name = typeof item.name === 'function' ? item.name(rb, data) : item.name
    if (!name || usedNames.has(name)) name = isNameLen ? 'key_' : genName()
    const offset = item.offset || 0
    let rb2 = rb
    if (offset > 0) rb2 = rb.subarray(offset)
    const endian = item.endian === undefined ? true : item.endian
    const val = readValue(item.type, rb2, endian)
    if (isNameLen) name += '(' + cursor + ')'
    usedNames.add(name)
    data[name] = val
    fields.push({
      name,
      type: item.type,
      start: cursor,
      length: len,
      offset,
      value: val,
    })
    cursor += len
  }
  return { data, fields, length: cursor }
}

export function pack(obj, schema) {
  if (!obj) return new Uint8Array(0)
  const arrs = []
  for (let s = 0; s < schema.length; s++) {
    const item = schema[s]
    if (!item.length && !item.type)
      throw new Error('Invalid schema type and length: ' + JSON.stringify(item))
    const fn = typeof item.length === 'function' ? item.length : ''
    const length = fn ? fn(obj) : item.length
    let len = length || 0
    if (len <= 0) len = readDefaultLength.get(item.type) || 0
    if (len === 0) throw new Error('Invalid length for type ' + item.type)
    const endian = item.endian === undefined ? true : item.endian
    arrs.push(writeValue(item.type, obj[item.name], endian))
  }
  let len = 0
  for (let i = 0; i < arrs.length; i++) len += arrs[i].length
  const out = new Uint8Array(len)
  let o = 0
  for (let j = 0; j < arrs.length; j++) {
    out.set(arrs[j], o)
    o += arrs[j].length
  }
  return out
}

export function ipv4ToBytes(str) {
  const parts = String(str)
    .split('.')
    .map((x) => Number(x) & 0xff)
  return Uint8Array.from([parts[0] || 0, parts[1] || 0, parts[2] || 0, parts[3] || 0])
}

/* ==================================================================
 * Buffer 兼容垫片（schema 代码里可能用到 Buffer.from/alloc/concat）
 * ================================================================== */
export const Buffer = {
  from(a, b) {
    if (typeof a === 'string') {
      if (b === 'hex') return hexToBytes(a)
      if (b === 'utf16le') return encodeUtf16(a, true)
      if (b === 'base64') {
        const bin = atob(a)
        const u = new Uint8Array(bin.length)
        for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i)
        return u
      }
      return new TextEncoder().encode(a)
    }
    if (a instanceof ArrayBuffer) return new Uint8Array(a)
    if (Array.isArray(a)) return Uint8Array.from(a)
    if (a instanceof Uint8Array) return a.slice()
    throw new Error('Buffer.from: 不支持的参数')
  },
  alloc(n, fill) {
    const u = new Uint8Array(n)
    if (fill != null) u.fill(fill)
    return u
  },
  concat(list) {
    let len = 0
    for (let i = 0; i < list.length; i++) len += list[i].length
    const out = new Uint8Array(len)
    let o = 0
    for (let j = 0; j < list.length; j++) {
      out.set(list[j], o)
      o += list[j].length
    }
    return out
  },
  isBuffer(x) {
    return x instanceof Uint8Array
  },
}

/* 让 u8.toString('hex' / 'utf16le' / 'utf8') 可用 */
const _u8ts = Uint8Array.prototype.toString
Uint8Array.prototype.toString = function (enc) {
  if (enc === 'hex') return bytesToHex(this)
  if (enc === 'utf16le') return decodeUtf16(this, true)
  if (enc === 'utf8') return new TextDecoder().decode(this)
  return _u8ts.call(this, enc)
}

export const PALETTE_LEN = 10
