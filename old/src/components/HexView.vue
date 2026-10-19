<template>
  <div class="view-wrap">
    <div class="tabs">
      <button class="tab" :class="{ active: state.activeView === 'hex' }" @click="switchTab('hex')">
        Hex
      </button>
      <button class="tab" :class="{ active: state.activeView === 'ascii' }" @click="switchTab('ascii')">
        ASCII
      </button>
      <div class="tabs-right">
        <span v-if="state.currentFields.length" class="stat">
          {{ state.currentFields.length }} 字段已覆盖
        </span>
        <input class="goto" v-model="state.gotoOffset" placeholder="偏移(0x/dec)" @keydown.enter="doGoto" />
      </div>
    </div>

    <div class="hexview" ref="scroller" @scroll="onScroll" @mousemove="onMove" @mouseleave="onLeave" @click="onClick">
      <div class="hex-inner" :style="{ height: totalH + 'px' }">
        <div v-for="r in visibleRows" :key="r.row" class="hrow" :class="{ flash: r.row === flashRow }"
          :style="{ top: r.row * ROW_H + 'px' }">
          <span class="hoff">{{ offStr(r.row * 16) }}</span>
          <template v-if="state.activeView === 'hex'">
            <span v-for="(b, i) in r.bytes" :key="'h' + i" class="hb" :data-off="r.row * 16 + i"
              :class="[byteClass(r.row * 16 + i), i === 7 ? 'mid' : '']">{{ HEX2[b] }}</span>
          </template>
          <template v-else>
            <span v-for="(b, i) in r.bytes" :key="'c' + i" class="ha" :data-off="r.row * 16 + i"
              :class="byteClass(r.row * 16 + i)">{{ asciiChar(b) }}</span>
          </template>
        </div>
      </div>
    </div>

    <div class="infobar" v-html="state.infoHtml || '移动鼠标查看字节 / 字段信息，点击可定位并钉住字段'"></div>
    <div id="tooltip" v-show="tip.show" :style="{ left: tip.x + 'px', top: tip.y + 'px' }">
      {{ tip.text }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useAnalyzer, getCov, registerHex } from '../store/useAnalyzer.js'
import { HEX2, asciiChar } from '../core/format.js'

const { state, switchTab, setHoverField, onViewMove, onViewLeave, onViewClick, setInfo, tipText, scrollToOffset } =
  useAnalyzer()

const ROW_H = 19
const BUFFER = 8

const scroller = ref(null)
const scrollTop = ref(0)
const viewH = ref(420)
const flashRow = ref(-1)
const tip = ref({ show: false, x: 0, y: 0, text: '' })

const totalRows = computed(() => (state.bytes ? Math.ceil(state.bytes.length / 16) : 0))
const totalH = computed(() => totalRows.value * ROW_H)
const firstRow = computed(() => Math.max(0, Math.floor(scrollTop.value / ROW_H) - BUFFER))
const lastRow = computed(() =>
  Math.min(totalRows.value, Math.ceil((scrollTop.value + viewH.value) / ROW_H) + BUFFER),
)
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

// 字节所属字段的着色 / 高亮类。依赖 viewVersion 以保证解析后重算覆盖。
function byteClass(off) {
  void state.viewVersion // 触发重算
  if (!state.bytes || off >= state.bytes.length) return ''
  const cov = getCov()
  const f = cov ? cov[off] : -1
  let cls = f >= 0 ? 'f' + (f % 10) : ''
  if (f === state.hlField && state.hlField >= 0) cls += ' hl'
  if (f === state.pinField && state.pinField >= 0) cls += ' pin'
  return cls
}

function onScroll() {
  if (scroller.value) scrollTop.value = scroller.value.scrollTop
}
function onMove(e) {
  const el = e.target
  const off = el && el.dataset ? el.dataset.off : undefined
  if (off === undefined) {
    onViewLeave()
    tip.value.show = false
    return
  }
  const o = +off
  const { f } = onViewMove(o)
  setInfo(o, f)
  tip.value.text = tipText(o, f)
  tip.value.x = e.clientX + 14
  tip.value.y = e.clientY + 14
  tip.value.show = true
}
function onLeave() {
  onViewLeave()
  tip.value.show = false
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
