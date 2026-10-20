<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useAnalyzer, getCov, registerHex } from '@/stores/useAnalyzer'
import { HEX2, asciiChar } from '@/utils/hex/format'
import { FIELD_BG, PALETTE_LEN } from '@/utils/hex/palette'

const { state, switchTab, onViewMove, onViewLeave, onViewClick, scrollToOffset } = useAnalyzer()

const stateOptions = ref([
    { label: 'HEX', value: 'hex' },
    { label: 'ASCII', value: 'ascii' }
])

const ROW_H = 19
const BUFFER = 8

const scroller = ref(null)
const scrollTop = ref(0)
const viewH = ref(420)
const flashRow = ref(-1)
// 当前鼠标悬停的字节（-1 表示未悬停）
const hoverOff = ref(-1)
const hoverFld = ref(-1)

const totalRows = computed(() => (state.bytes ? Math.ceil(state.bytes.length / 16) : 0))
const firstRow = computed(() => Math.max(0, Math.floor(scrollTop.value / ROW_H) - BUFFER))
const lastRow = computed(() => Math.min(totalRows.value, Math.ceil((scrollTop.value + viewH.value) / ROW_H) + BUFFER))
const visibleRows = computed(() => {
    const arr = []
    if (!state.bytes) return arr
    for (let r = firstRow.value; r < lastRow.value; r++) {
        const start = r * 16
        const end = Math.min(start + 16, state.bytes.length)
        const bytes = []
        for (let i = start; i < end; i++) bytes.push(state.bytes[i])
        arr.push({ row: r, bytes })
    }
    return arr
})

function offStr(off) {
    return (off >>> 0).toString(16).padStart(8, '0')
}

function esc(s) {
    return String(s == null ? '' : s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
}

// 字节所属字段的着色 / 高亮类。依赖 viewVersion 以保证解析后重算覆盖。
function byteClass(off) {
    void state.viewVersion // 触发重算
    if (!state.bytes || off >= state.bytes.length) return []
    const cov = getCov()
    const f = cov ? cov[off] : -1
    const cls = []
    if (f >= 0) cls.push(FIELD_BG[f % PALETTE_LEN])
    if (f === state.hlField && state.hlField >= 0) cls.push('underline decoration-2 underline-offset-2 decoration-amber-500')
    if (f === state.pinField && state.pinField >= 0) cls.push('ring-2 ring-inset ring-rose-500')
    return cls
}

// 该字节归属的字段序号（-1 = 无关联字段）
function fieldIndexOf(off) {
    void state.viewVersion
    const cov = getCov()
    return cov ? cov[off] : -1
}

// 悬浮提示内容：仅字段名 / 类型，不含字段值
function byteTip(off) {
    const f = fieldIndexOf(off)
    if (f >= 0 && state.currentFields[f]) {
        const fld = state.currentFields[f]
        return '[' + f + '] ' + fld.name + ' · ' + fld.type
    }
    return '偏移 ' + off + ' (0x' + off.toString(16) + ') · 无关联字段'
}

// 底部 Message 展示的内容：优先显示悬停字节，其次显示已钉住字段
const infoHtml = computed(() => {
    if (hoverOff.value >= 0) {
        const off = hoverOff.value
        const b = state.bytes ? state.bytes[off] : 0
        let s = '<b>0x' + offStr(off) + '</b> (' + off + ') · 字节 <b>0x' + HEX2[b] + '</b> (' + b + ')'
        const f = hoverFld.value
        if (f >= 0 && state.currentFields[f]) {
            const fld = state.currentFields[f]
            s +=
                ' · 字段 <b>[' +
                f +
                '] ' +
                esc(fld.name) +
                '</b> (' +
                fld.type +
                ', ' +
                fld.length +
                'B)'
        } else {
            s += ' · 无关联字段'
        }
        return s
    }
    const p = state.pinField
    if (p >= 0 && state.currentFields[p]) {
        const fld = state.currentFields[p]
        return (
            '已钉住 字段 <b>[' +
            p +
            '] ' +
            esc(fld.name) +
            '</b> (' +
            fld.type +
            ', ' +
            fld.length +
            'B) · 偏移 <b>0x' +
            offStr(fld.start) +
            '</b> (' +
            fld.start +
            ')'
        )
    }
    return '移动鼠标查看字节 / 字段信息，点击可定位并钉住字段'
})

function onScroll() {
    if (scroller.value) scrollTop.value = scroller.value.scrollTop
}

function onMove(e) {
    const el = e.target
    const off = el && el.dataset ? el.dataset.off : undefined
    if (off === undefined) {
        onViewLeave()
        hoverOff.value = -1
        hoverFld.value = -1
        return
    }
    const o = +off
    const { f } = onViewMove(o)
    hoverOff.value = o
    hoverFld.value = f
}

function onLeave() {
    onViewLeave()
    hoverOff.value = -1
    hoverFld.value = -1
}

function onClick(e) {
    const el = e.target
    const off = el && el.dataset ? el.dataset.off : undefined
    if (off === undefined) return
    onViewClick(+off)
}

function doGoto() {
    const raw = String(state.gotoOffset || '').trim()
    if (!raw) return
    let off
    if (/^0x/i.test(raw)) off = parseInt(raw.slice(2), 16)
    else if (/^[-+]?0x/i.test(raw)) off = parseInt(raw, 16)
    else if (/^[-+]?\d+$/.test(raw)) off = parseInt(raw, 10)
    else return
    if (!isFinite(off) || off < 0) return
    scrollToOffset(off)
}

function scrollToOffsetLocal(off) {
    if (!scroller.value) return
    const row = Math.floor(off / 16)
    scroller.value.scrollTop = row * ROW_H
    flashRow.value = row
    setTimeout(() => {
        if (flashRow.value === row) flashRow.value = -1
    }, 900)
}

let ro = null
onMounted(() => {
    if (scroller.value) viewH.value = scroller.value.clientHeight
    ro = new ResizeObserver(() => {
        if (scroller.value) viewH.value = scroller.value.clientHeight
    })
    if (scroller.value) ro.observe(scroller.value)
    // 把 hexApi 暴露给 store（结果表 / 字段行点击定位时用）
    registerHex({ scrollToOffset: scrollToOffsetLocal, flashOffset: scrollToOffsetLocal })
})
onBeforeUnmount(() => {
    if (ro) ro.disconnect()
})
</script>

<template>
    <div class="w-full h-full p-1 flex flex-col gap-1">
        <Toolbar style="padding: 5px;">
            <template #start>
                <span>Hex 视图</span>
            </template>

            <template #center>
                <InputText v-model="state.gotoOffset" placeholder="偏移(0x/dec)" size="small" @keydown.enter="doGoto" />
            </template>

            <template #end>
                <div class="flex items-center gap-2">
                    <span v-if="state.currentFields.length" class="text-[11.5px] text-gray-500 dark:text-gray-400">
                        {{ state.currentFields.length }} 字段已覆盖
                    </span>
                    <SelectButton :modelValue="state.activeView" :options="stateOptions" optionLabel="label"
                        optionValue="value" aria-labelledby="basic" size="small" @change="switchTab($event.value)" />
                </div>
            </template>
        </Toolbar>
        <div ref="scroller" @scroll="onScroll"
            class="w-full h-full min-h-0 flex-1 border-1 rounded-md border-gray-300 dark:border-gray-700 flex flex-col overflow-hidden pt-2">
            <div class="flex flex-col gap-1" @mousemove="onMove" @mouseleave="onLeave" @click="onClick">
                <div v-for="r in visibleRows" :key="r.row" class="flex flex-row">
                    <span
                        class="w-[92px] shrink-0 pr-2 text-right select-none dark:text-gray-600 text-sm text-gray-500 font-bold">
                        {{ offStr(r.row * 16) }}
                    </span>

                    <div class="flex flex-row gap-1" v-if="state.activeView === 'hex'">
                        <span v-for="(b, i) in r.bytes" :key="'h' + i" :data-off="r.row * 16 + i"
                            v-tooltip="byteTip(r.row * 16 + i)"
                            class="inline-block w-[20px] shrink-0 rounded-sm text-center text-gray-700 dark:text-gray-200 text-sm font-bold"
                            style="width: 20px;" :class="[...byteClass(r.row * 16 + i), i === 7 ? 'mr-[5px]' : '']">
                            {{ HEX2[b] }}
                        </span>
                    </div>
                    <div class="flex flex-row gap-1" v-if="state.activeView !== 'hex'">
                        <span v-for="(b, i) in r.bytes" :key="'c' + i" :data-off="r.row * 16 + i"
                            v-tooltip="byteTip(r.row * 16 + i)"
                            class="inline-block w-[11px] shrink-0 rounded-sm text-center text-gray-700 dark:text-gray-200 text-sm font-bold"
                            style="width: 18px;" :class="byteClass(r.row * 16 + i)">
                            {{ asciiChar(b) }}
                        </span>
                    </div>
                </div>
            </div>
        </div>

        <Message v-if="state.showErr" severity="error">{{ state.errMsg }}</Message>
        <!-- 注意：Message 组件 inheritAttrs=false，根元素只绑 ptm('root')，
             外部 class 不会落到根元素，因此字号类放在内部 span 上 -->
        <Message v-else severity="secondary">
            <span class="text-[12px]" v-html="infoHtml"></span>
        </Message>
    </div>
</template>
