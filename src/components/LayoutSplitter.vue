<template>
  <div class="layout-root">
    <!-- lr：数据 | (结果 / 编辑器) -->
    <Splitter v-if="layout === 'lr'" class="root-split" @resize-end="(e) => onResize('lr', e)">
      <SplitterPanel :size="psize('lr', 0, 38)" :minSize="20">
        <DataLoaderPanel />
      </SplitterPanel>
      <SplitterPanel :size="psize('lr', 1, 62)" :minSize="30">
        <Splitter layout="vertical" class="nested-split" @resize-end="(e) => onResize('lr-n', e)">
          <SplitterPanel :size="psize('lr-n', 0, 55)" :minSize="20">
            <ResultPanel />
          </SplitterPanel>
          <SplitterPanel :size="psize('lr-n', 1, 45)" :minSize="20">
            <SchemaEditorPanel />
          </SplitterPanel>
        </Splitter>
      </SplitterPanel>
    </Splitter>

    <!-- rl：(结果 / 编辑器) | 数据 -->
    <Splitter v-else-if="layout === 'rl'" class="root-split" @resize-end="(e) => onResize('rl', e)">
      <SplitterPanel :size="psize('rl', 0, 62)" :minSize="30">
        <Splitter layout="vertical" class="nested-split" @resize-end="(e) => onResize('rl-n', e)">
          <SplitterPanel :size="psize('rl-n', 0, 55)" :minSize="20">
            <ResultPanel />
          </SplitterPanel>
          <SplitterPanel :size="psize('rl-n', 1, 45)" :minSize="20">
            <SchemaEditorPanel />
          </SplitterPanel>
        </Splitter>
      </SplitterPanel>
      <SplitterPanel :size="psize('rl', 1, 38)" :minSize="20">
        <DataLoaderPanel />
      </SplitterPanel>
    </Splitter>

    <!-- tb：数据 / (结果 | 编辑器) -->
    <Splitter v-else-if="layout === 'tb'" layout="vertical" class="root-split" @resize-end="(e) => onResize('tb', e)">
      <SplitterPanel :size="psize('tb', 0, 42)" :minSize="20">
        <DataLoaderPanel />
      </SplitterPanel>
      <SplitterPanel :size="psize('tb', 1, 58)" :minSize="30">
        <Splitter class="nested-split" @resize-end="(e) => onResize('tb-n', e)">
          <SplitterPanel :size="psize('tb-n', 0, 50)" :minSize="25">
            <ResultPanel />
          </SplitterPanel>
          <SplitterPanel :size="psize('tb-n', 1, 50)" :minSize="25">
            <SchemaEditorPanel />
          </SplitterPanel>
        </Splitter>
      </SplitterPanel>
    </Splitter>

    <!-- tri：数据 | 编辑器 | 结果 -->
    <Splitter v-else class="root-split" @resize-end="(e) => onResize('tri', e)">
      <SplitterPanel :size="psize('tri', 0, 25)" :minSize="18">
        <DataLoaderPanel />
      </SplitterPanel>
      <SplitterPanel :size="psize('tri', 1, 40)" :minSize="18">
        <SchemaEditorPanel />
      </SplitterPanel>
      <SplitterPanel :size="psize('tri', 2, 35)" :minSize="18">
        <ResultPanel />
      </SplitterPanel>
    </Splitter>
  </div>
</template>

<script setup>
import Splitter from 'primevue/splitter'
import SplitterPanel from 'primevue/splitterpanel'
import DataLoaderPanel from './DataLoaderPanel.vue'
import ResultPanel from './ResultPanel.vue'
import SchemaEditorPanel from './SchemaEditorPanel.vue'

const props = defineProps({
  layout: { type: String, default: 'tri' },
})

// 面板尺寸缓存：从 localStorage 读取（非响应式，仅作初始值，避免拖动时回写引发抖动）
const LS_SIZES = 'hexan.sizes.v1'
function loadSizes() {
  try {
    return JSON.parse(localStorage.getItem(LS_SIZES)) || {}
  } catch (e) {
    return {}
  }
}
const sizes = loadSizes()

// 取某布局某面板序号的初始尺寸；未缓存则用 fallback
function psize(key, idx, fallback) {
  const arr = sizes[key]
  return arr && typeof arr[idx] === 'number' ? arr[idx] : fallback
}

// 拖动结束：写入内存与 localStorage
function onResize(key, e) {
  if (!e || !e.sizes) return
  sizes[key] = e.sizes
  try {
    localStorage.setItem(LS_SIZES, JSON.stringify(sizes))
  } catch (e) {
    /* noop */
  }
}

void props
</script>

<style scoped>
.layout-root {
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
}

.root-split,
.nested-split {
  flex: 1;
  min-width: 0;
  min-height: 0;
}
</style>
