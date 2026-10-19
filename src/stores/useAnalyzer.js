/**
 * useAnalyzer.js —— 全局共享状态 / 控制器（单例）。
 * 把原 H:\hex_analyzer\common.js 的全局变量与业务方法收敛为一个模块级 reactive 单例，
 * 各组件仅做「视图 + 调用方法」，逻辑全部集中在此。
 */
import { reactive, computed, markRaw } from 'vue'
import {
    Type,
    bytesToHex,
    hexToBytes,
    HEX2,
    unPack,
    pack,
    writeValue,
    ipv4ToBytes,
    Buffer,
    PALETTE_LEN,
} from '@/utils/hex/parser'
import {
    rowsFromCode,
    codeFromRows,
    validateRows,
    genLineToRow,
    listPreamble,
} from '@/utils/hex/schema'
import { SAMPLES } from '@/utils/hex/samples'
import { valPreview, truncStr, hex8, escHtml } from '@/utils/hex/format'

export const RENDER_CAP = 524288 // 单次渲染上限 512KB

/* ===================== 状态 ===================== */
const state = reactive({
    hexInput: '',
    code: '',
    startOffset: 0,
    isNameLen: false,

    bytes: null,
    currentFields: [],
    lineMap: [],

    hlField: -2,
    pinField: -1,
    activeLine: -1,
    viewVersion: 0,

    schemaMode: 'code', // 'code' | 'list'
    listRows: [],
    genLineToRow: {},

    resViewMode: 'table', // 'table' | 'json'
    layout: 'tri', // 'lr' | 'rl' | 'tb' | 'tri'
    activeView: 'hex', // 'hex' | 'ascii'

    parsedStart: 0,
    parsedConsumed: 0,
    replaceCount: 0,

    dataStat: '',
    parseStat: '',
    resStat: '',
    infoHtml: '',
    errMsg: '',
    showErr: false,

    outHex: '',
    outStat: '',

    gotoOffset: '',
    encSel: 'ascii',

    samples: SAMPLES,

    listPreamble: '',

    repOpen: false,
    repIdx: -1,
})

/* ===================== 非响应式辅助 ===================== */
let cov = null // Int16Array：字节 -> 字段索引（-1 表示无）
let editorApi = { scrollToLine: null, flashRow: null }
let hexApi = { scrollToOffset: null, flashOffset: null }
let toastShow = null
let saveTimer = null
let listTimer = null
const LS_KEY = 'hexan.v2'

export function getCov() {
    return cov
}

export function registerEditor(api) {
    editorApi = api
}
export function registerHex(api) {
    hexApi = api
}
export function registerToast(fn) {
    toastShow = fn
}

/* ===================== 基础工具 ===================== */
function showToast(msg) {
    if (toastShow) toastShow(msg)
}

function fallbackCopy(t) {
    const x = document.createElement('textarea')
    x.value = t
    x.style.position = 'fixed'
    x.style.opacity = '0'
    document.body.appendChild(x)
    x.select()
    try {
        document.execCommand('copy')
    } catch (e) {
        /* noop */
    }
    document.body.removeChild(x)
}

function copyText(t, label) {
    const done = () => showToast(label || '已复制')
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(t).then(done, () => {
            fallbackCopy(t)
            done()
        })
    } else {
        fallbackCopy(t)
        done()
    }
}

function parseHexInput(str) {
    const clean = String(str).replace(/0x/gi, '').replace(/[^0-9a-fA-F]/g, '')
    if (!clean.length) throw new Error('未检测到有效的十六进制字符')
    const odd = clean.length % 2 === 1
    return { bytes: hexToBytes(clean), odd }
}

// 大数组用 markRaw 包裹，避免深度响应式代理带来的性能损耗
function setBytes(u8) {
    state.bytes = u8 == null ? null : markRaw(u8)
}

function concatBytes() {
    let total = 0
    for (let i = 0; i < arguments.length; i++) total += arguments[i].length
    const out = new Uint8Array(total)
    let o = 0
    for (let i = 0; i < arguments.length; i++) {
        out.set(arguments[i], o)
        o += arguments[i].length
    }
    return out
}

function bumpView() {
    state.viewVersion++
}

function hideErr() {
    state.showErr = false
    state.errMsg = ''
}
function showErr(msg) {
    state.errMsg = msg
    state.showErr = true
}

/* ===================== 数据加载 ===================== */
function loadData() {
    hideErr()
    let r
    try {
        r = parseHexInput(state.hexInput)
        state.bytes = r.bytes
    } catch (e) {
        setBytes(null)
        state.dataStat = e.message
        cov = null
        bumpView()
        return
    }
    state.dataStat =
        '已加载 ' + state.bytes.length + ' 字节' + (r.odd ? '（末尾丢弃 1 个半字节）' : '')
    cov = new Int16Array(state.bytes.length).fill(-1)
    state.currentFields = []
    state.lineMap = []
    state.hlField = -2
    state.pinField = -1
    bumpView()
    updateOutHex()
    saveState()
    if (state.code.indexOf('schema') >= 0) runParse()
}

function readFile(f) {
    const r = new FileReader()
    r.onload = () => {
        const buf = new Uint8Array(r.result)
        if (/\.(hex|txt)$/i.test(f.name)) state.hexInput = new TextDecoder().decode(buf)
        else state.hexInput = bytesToHex(buf)
        loadData()
    }
    r.readAsArrayBuffer(f)
}

function clearData() {
    state.hexInput = ''
    setBytes(null)
    state.currentFields = []
    state.lineMap = []
    cov = null
    state.dataStat = ''
    state.parseStat = ''
    state.resStat = ''
    hideErr()
    bumpView()
    updateOutHex()
    saveState()
}

function applySample(idx) {
    const s = state.samples[idx]
    state.hexInput = s.hex
    state.code = s.schema
    if (state.schemaMode === 'list') {
        const rows = rowsFromCode(s.schema)
        if (rows) state.listRows = rows
    }
    state.startOffset = 0
    state.isNameLen = false
    state.activeLine = -1
    loadData()
}

/* ===================== 解析 ===================== */
function evalSchemaCode(code) {
    const f = new Function(
        'Type',
        'unPack',
        'pack',
        'ipv4ToBytes',
        'Buffer',
        'console',
        code + '\n;return (typeof schema !== "undefined") ? schema : null;',
    )
    return f(Type, unPack, pack, ipv4ToBytes, Buffer, console)
}

function mapFieldToLines(code, schema) {
    const lines = code.split('\n')
    const map = []
    let from = 0
    for (let i = 0; i < schema.length; i++) {
        const item = schema[i]
        let line = -1
        if (typeof item.name === 'string' && item.name) {
            const l1 = "'" + item.name + "'"
            const l2 = '"' + item.name + '"'
            for (let j = from; j < lines.length; j++) {
                if (lines[j].indexOf(l1) >= 0 || lines[j].indexOf(l2) >= 0) {
                    line = j
                    break
                }
            }
        }
        if (line < 0) {
            for (let k = from; k < lines.length; k++) {
                if (/type\s*:/.test(lines[k])) {
                    line = k
                    break
                }
            }
        }
        if (line >= 0) from = line + 1
        map.push(line)
    }
    return map
}

function runParse() {
    hideErr()
    if (!state.bytes || !state.bytes.length) {
        showErr('请先加载数据')
        return
    }
    let code = state.code
    if (state.schemaMode === 'list') {
        const bad = validateRows(state.listRows)
        if (bad) {
            showErr('第 ' + bad + ' 行未选择字段类型')
            return
        }
        code = state.code = codeFromRows(state.listRows)
        state.genLineToRow = { ...genLineToRow }
    }
    let schema
    try {
        schema = evalSchemaCode(code)
    } catch (e) {
        showErr('Schema 求值错误: ' + e.message)
        return
    }
    if (!Array.isArray(schema)) {
        showErr('未找到 schema 数组，请定义：const schema = [ ... ]')
        return
    }

    let start = parseInt(state.startOffset, 10)
    if (isNaN(start) || start < 0) start = 0
    if (start >= state.bytes.length) {
        showErr('起始偏移超出数据范围（总长 ' + state.bytes.length + '）')
        return
    }

    let result
    try {
        result = unPack(state.bytes.subarray(start), schema, state.isNameLen)
    } catch (e) {
        showErr('解析错误: ' + e.message)
        return
    }
    state.parsedStart = start
    state.parsedConsumed = result.length

    state.currentFields = result.fields.map((f) => ({
        name: f.name,
        type: f.type,
        start: f.start + start,
        length: f.length,
        offset: f.offset,
        value: f.value,
    }))
    state.lineMap = mapFieldToLines(code, schema)

    if (cov && cov.length === state.bytes.length) cov.fill(-1)
    else cov = new Int16Array(state.bytes.length).fill(-1)
    for (let i = 0; i < state.currentFields.length; i++) {
        const f = state.currentFields[i]
        for (let b = f.start; b < f.start + f.length && b < state.bytes.length; b++) cov[b] = i
    }

    state.hlField = -2
    state.pinField = -1
    bumpView()

    const consumed = state.currentFields.length
        ? state.currentFields[state.currentFields.length - 1].start +
        state.currentFields[state.currentFields.length - 1].length -
        start
        : 0
    const remain = state.bytes.length - consumed
    state.parseStat =
        '字段 ' +
        state.currentFields.length +
        ' · 消费 ' +
        consumed +
        '/' +
        state.bytes.length +
        ' 字节' +
        (remain > 0 ? ' · 剩余 ' + remain : '')
    state.resStat =
        '起始偏移 0x' + start.toString(16) + ' · 共 ' + state.currentFields.length + ' 个字段'
    saveState()
}

/* ===================== 高亮联动 ===================== */
function setHoverField(f) {
    state.hlField = f
}
function onViewMove(off) {
    const f = cov ? cov[off] : -1
    setHoverField(f)
    return { off, f }
}
function onViewLeave() {
    setHoverField(state.pinField)
}
function onViewClick(off) {
    const f = cov ? cov[off] : -1
    state.pinField = f
    state.hlField = f
    setInfo(off, f)
    if (f >= 0 && state.lineMap[f] >= 0) {
        state.activeLine = state.lineMap[f]
        if (state.schemaMode === 'list') {
            const ri = state.genLineToRow[state.lineMap[f]]
            if (ri !== undefined && editorApi.flashRow) editorApi.flashRow(ri)
        } else if (editorApi.scrollToLine) {
            editorApi.scrollToLine(state.lineMap[f])
        }
    }
}

function locateField(i) {
    const fld = state.currentFields[i]
    if (!fld) return
    state.pinField = i
    state.hlField = i
    state.activeView = 'hex'
    if (hexApi.scrollToOffset) hexApi.scrollToOffset(fld.start)
    setInfo(fld.start, i)
    if (state.lineMap[i] >= 0) {
        state.activeLine = state.lineMap[i]
        if (state.schemaMode === 'list') {
            const ri = state.genLineToRow[state.lineMap[i]]
            if (ri !== undefined && editorApi.flashRow) editorApi.flashRow(ri)
        } else if (editorApi.scrollToLine) {
            editorApi.scrollToLine(state.lineMap[i])
        }
    }
}

function setInfo(off, f) {
    if (!state.bytes) return
    const b = state.bytes[off]
    let s = '<b>0x' + hex8(off) + '</b> (' + off + ') · 字节 <b>0x' + HEX2[b] + '</b> (' + b + ')'
    if (f >= 0 && state.currentFields[f]) {
        const fld = state.currentFields[f]
        s +=
            ' · 字段 <b>[' +
            f +
            '] ' +
            escHtml(fld.name) +
            '</b> (' +
            fld.type +
            ', ' +
            fld.length +
            'B) · 值 ' +
            escHtml(truncStr(valPreview(fld), 80))
    } else {
        s += ' · 无关联字段'
    }
    state.infoHtml = s
}

function tipText(off, f) {
    if (f >= 0 && state.currentFields[f]) {
        const fld = state.currentFields[f]
        return '[' + f + '] ' + fld.name + ' · ' + fld.type + ' · ' + truncStr(valPreview(fld), 90)
    }
    return '偏移 ' + off + ' (0x' + off.toString(16) + ') · 无关联字段'
}

function scrollToOffset(off) {
    if (hexApi.scrollToOffset) hexApi.scrollToOffset(off)
}

function locateByLine(line) {
    if (line == null || line < 0) return
    state.activeLine = line
    if (editorApi.scrollToLine) editorApi.scrollToLine(line)
}

/* ===================== 视图切换 ===================== */
function switchTab(name) {
    state.activeView = name
}
function switchResView(name) {
    state.resViewMode = name
    saveState()
}

function setLayout(l) {
    if (l && l !== state.layout) {
        state.layout = l
        saveState()
    }
}

/* ===================== Schema 模式 ===================== */
function regenCode() {
    state.code = codeFromRows(state.listRows)
    state.genLineToRow = { ...genLineToRow }
}
function onListInput() {
    clearTimeout(listTimer)
    listTimer = setTimeout(onListChange, 250)
}
function onListChange() {
    const bad = validateRows(state.listRows)
    if (bad) {
        showErr('第 ' + bad + ' 行未选择字段类型')
        return
    }
    hideErr()
    runParse()
}
function addListRow() {
    state.listRows.push({
        name: '',
        type: 'uint8',
        length: '',
        endian: 'le',
        offset: '',
        remark: '',
        raw: null,
    })
    onListChange()
}
function moveListRow(idx, dir) {
    const j = idx + dir
    if (j < 0 || j >= state.listRows.length) return
    const t = state.listRows[idx]
    state.listRows[idx] = state.listRows[j]
    state.listRows[j] = t
    onListChange()
}
function delListRow(idx) {
    state.listRows.splice(idx, 1)
    onListChange()
}
function setSchemaMode(mode) {
    if (mode === state.schemaMode) return
    if (mode === 'list') {
        const rows = rowsFromCode(state.code)
        if (!rows) {
            showToast('未找到 schema 数组，无法转换为列表模式')
            return
        }
        state.listRows = rows
    } else {
        regenCode()
    }
    state.schemaMode = mode
    if (mode === 'list') runParse()
    else runParse()
    saveState()
}

/* ===================== 字段替换 ===================== */
function parseInputForType(type, raw) {
    raw = raw == null ? '' : String(raw)
    switch (type) {
        case 'int8': {
            const i8 = Math.trunc(+raw)
            if (!isFinite(i8) || i8 < -128 || i8 > 127) throw new Error('int8 范围 -128 ~ 127')
            return i8
        }
        case 'uint8': {
            const u8 = Math.trunc(+raw)
            if (!isFinite(u8) || u8 < 0 || u8 > 255) throw new Error('uint8 范围 0 ~ 255')
            return u8
        }
        case 'int16': {
            const i16 = Math.trunc(+raw)
            if (!isFinite(i16) || i16 < -32768 || i16 > 32767) throw new Error('int16 范围 -32768 ~ 32767')
            return i16
        }
        case 'uint16': {
            const u16 = Math.trunc(+raw)
            if (!isFinite(u16) || u16 < 0 || u16 > 65535) throw new Error('uint16 范围 0 ~ 65535')
            return u16
        }
        case 'int32': {
            const i32 = Math.trunc(+raw)
            if (!isFinite(i32) || i32 < -2147483648 || i32 > 2147483647) throw new Error('int32 越界')
            return i32
        }
        case 'uint32': {
            const u32 = Math.trunc(+raw)
            if (!isFinite(u32) || u32 < 0 || u32 > 4294967295) throw new Error('uint32 越界')
            return u32
        }
        case 'float': {
            const fl = +raw
            if (!isFinite(fl)) throw new Error('非法浮点数')
            return fl
        }
        case 'double': {
            const db = +raw
            if (!isFinite(db)) throw new Error('非法浮点数')
            return db
        }
        case 'hex': {
            const h = raw.replace(/0x/gi, '').replace(/[^0-9a-fA-F]/g, '')
            if (h.length % 2) throw new Error('hex 需偶数位')
            return h.toLowerCase()
        }
        case 'bytes': {
            const hb = raw.replace(/0x/gi, '').replace(/[^0-9a-fA-F]/g, '')
            if (hb.length % 2) throw new Error('hex 需偶数位')
            return hexToBytes(hb)
        }
        case 'utf16le': {
            if (raw === '') throw new Error('字符串不能为空')
            return raw
        }
        default:
            throw new Error('未知类型 ' + type)
    }
}
function displayFieldValue(f) {
    const v = f.value
    if (v instanceof Uint8Array) return bytesToHex(v)
    if (f.type === 'hex') return v
    return valPreview(f)
}
function editFieldValue(f) {
    const v = f.value
    if (v instanceof Uint8Array) return bytesToHex(v)
    if (f.type === 'hex' || f.type === 'utf16le') return v
    return String(v)
}
function typeHint(type) {
    if (type === 'hex' || type === 'bytes') return '十六进制（可含空格 / 0x）'
    if (type === 'utf16le') return '字符串（UTF-16LE）'
    if (type === 'float' || type === 'double') return '十进制小数'
    if (type.indexOf('int') === 0 || type.indexOf('uint') === 0) return '十进制整数'
    return ''
}
function replaceFieldValue(idx, raw) {
    const f = state.currentFields[idx]
    if (!f) return { error: '字段不存在' }
    let schema = evalSchemaCode(state.code)
    if (!Array.isArray(schema)) return { error: '未找到 schema 数组' }
    if (!schema[idx]) return { error: 'schema 索引丢失' }
    const item = schema[idx]
    const endian = item.endian === undefined ? true : item.endian
    let newVal
    try {
        newVal = parseInputForType(f.type, raw, endian)
    } catch (e) {
        return { error: e.message }
    }
    let nb
    try {
        nb = writeValue(f.type, newVal, endian)
    } catch (e) {
        return { error: '编码失败: ' + e.message }
    }
    const off = f.offset || 0
    const vStart = f.start + off
    const vLen = f.length - off
    if (nb.length === vLen) {
        setBytes(
            concatBytes(
                state.bytes.subarray(0, vStart),
                nb,
                state.bytes.subarray(vStart + vLen),
            ),
        )
        state.currentFields[idx].value = newVal
        state.replaceCount++
        bumpView()
        updateOutHex()
        return { ok: true }
    }
    for (let s = 0; s < schema.length; s++)
        if (schema[s].offset) return { error: '该字段含 offset，无法变更长度（请保持长度一致）' }
    const data = {}
    for (let k = 0; k < state.currentFields.length; k++)
        data[state.currentFields[k].name] = state.currentFields[k].value
    data[f.name] = newVal
    if (typeof item.length === 'function') {
        const lsrc = item.length.toString()
        let mm
        const lr = /data\.([A-Za-z_$][\w$]*)/g
        while ((mm = lr.exec(lsrc))) {
            const nm = mm[1]
            if (nm !== f.name && nm in data)
                data[nm] = f.type === 'utf16le' ? String(newVal).length : nb.length
        }
    }
    const packSchema = schema.map((it, i) =>
        it.name == null ? Object.assign({}, it, { name: state.currentFields[i].name }) : it,
    )
    let repacked
    try {
        repacked = pack(data, packSchema)
    } catch (e) {
        return { error: '重建失败: ' + e.message }
    }
    setBytes(
        concatBytes(
            state.bytes.subarray(0, state.parsedStart),
            repacked,
            state.bytes.subarray(state.parsedStart + state.parsedConsumed),
        ),
    )
    state.replaceCount++
    runParse()
    updateOutHex()
    return { ok: true }
}

function updateOutHex() {
    if (!state.bytes) {
        state.outHex = ''
        state.outStat = ''
        return
    }
    state.outHex = bytesToHex(state.bytes)
    state.outStat =
        state.bytes.length +
        ' 字节' +
        (state.replaceCount ? ' · 已替换 ' + state.replaceCount + ' 处' : '')
}
function resetOutput() {
    if (!state.hexInput.trim()) {
        showToast('无原始数据')
        return
    }
    try {
        const r = parseHexInput(state.hexInput)
        setBytes(r.bytes)
        state.replaceCount = 0
        state.currentFields = []
        state.lineMap = []
        cov = null
        bumpView()
        if (state.code.indexOf('schema') >= 0) runParse()
        else {
            /* result cleared implicitly */
        }
        updateOutHex()
        showToast('已重置为原始数据')
    } catch (e) {
        showToast(e.message)
    }
}

function openReplace(idx) {
    const f = state.currentFields[idx]
    if (!f) {
        showToast('请先解析出字段')
        return
    }
    state.repIdx = idx
    state.repOpen = true
}
function closeReplace() {
    state.repOpen = false
    state.repIdx = -1
}

/* ===================== 复制 ===================== */
function copyHex() {
    if (!state.bytes) {
        showToast('无数据')
        return
    }
    copyText(bytesToHex(state.bytes), '已复制 ' + state.bytes.length + ' 字节 hex')
}
function copyJson() {
    if (!state.currentFields.length) {
        showToast('无解析结果')
        return
    }
    const obj = {}
    for (let i = 0; i < state.currentFields.length; i++) {
        const v = state.currentFields[i].value
        obj[state.currentFields[i].name] = v instanceof Uint8Array ? bytesToHex(v) : v
    }
    copyText(JSON.stringify(obj, null, 4), '已复制 JSON')
}

/* ===================== 持久化 ===================== */
function saveState() {
    clearTimeout(saveTimer)
    saveTimer = setTimeout(() => {
        try {
            if (state.hexInput.length + state.code.length > 3e6) return
            localStorage.setItem(
                LS_KEY,
                JSON.stringify({
                    data: state.hexInput,
                    code: state.code,
                    start: state.startOffset,
                    namelen: state.isNameLen,
                    layout: state.layout,
                    resView: state.resViewMode,
                    mode: state.schemaMode,
                    listPreamble: listPreamble,
                }),
            )
        } catch (e) {
            /* noop */
        }
    }, 400)
}
function loadState() {
    try {
        const s = localStorage.getItem(LS_KEY)
        return s ? JSON.parse(s) : null
    } catch (e) {
        return null
    }
}

/* ===================== 初始化 ===================== */
function init() {
    const saved = loadState()
    if (saved) {
        state.hexInput = saved.data || ''
        state.code = saved.code || ''
        state.startOffset = saved.start || 0
        state.isNameLen = !!saved.namelen
        state.schemaMode = saved.mode === 'list' ? 'list' : 'code'
        state.resViewMode = saved.resView || 'table'
        state.layout = saved.layout || 'tri'
        state.listPreamble = saved.listPreamble || ''
        if (state.schemaMode === 'list') {
            const rows = rowsFromCode(state.code)
            if (rows) state.listRows = rows
            else state.schemaMode = 'code'
        }
        if (state.hexInput.trim()) loadData()
        else applySample(0)
    } else {
        applySample(0)
    }
}

/* ===================== 解析结果展示（DataTable 用） ===================== */
const resultRows = computed(() =>
    state.currentFields.map((f, i) => ({
        i,
        idx: i + 1,
        line: state.lineMap[i] >= 0 ? state.lineMap[i] + 1 : '—',
        hasLine: state.lineMap[i] >= 0,
        name: f.name,
        type: f.type,
        off: '0x' + f.start.toString(16).padStart(4, '0'),
        len: f.length,
        val: valPreview(f),
        colorIdx: i % PALETTE_LEN,
    })),
)

/* ===================== 导出 ===================== */
export function useAnalyzer() {
    return {
        state,
        RENDER_CAP,
        // 基础
        getCov,
        registerEditor,
        registerHex,
        registerToast,
        showToast,
        copyText,
        // 数据
        loadData,
        readFile,
        clearData,
        applySample,
        // 解析
        runParse,
        // 高亮联动
        setHoverField,
        onViewMove,
        onViewLeave,
        onViewClick,
        locateField,
        setInfo,
        tipText,
        scrollToOffset,
        locateByLine,
        // 视图
        switchTab,
        switchResView,
        setLayout,
        // schema
        regenCode,
        onListInput,
        onListChange,
        addListRow,
        moveListRow,
        delListRow,
        setSchemaMode,
        // 替换
        parseInputForType,
        displayFieldValue,
        editFieldValue,
        typeHint,
        replaceFieldValue,
        updateOutHex,
        resetOutput,
        openReplace,
        closeReplace,
        // 复制
        copyHex,
        copyJson,
        // 生命周期
        init,
        // 计算
        resultRows,
    }
}
