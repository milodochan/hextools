<script setup>
import { ref, computed } from 'vue'
import { useAnalyzer } from '@/stores/useAnalyzer'

const { state, loadData, clearData, readFile, applySample, runParse, saveState } = useAnalyzer()

const fileInput = ref(null)
const dragging = ref(false)
const sampleOptions = computed(() => state.samples.map((s, i) => ({ label: s.label, idx: i })))

let inputTimer = null
function onInput() {
    clearTimeout(inputTimer)
    inputTimer = setTimeout(() => loadData(), 500)
}
function onOffsetChange() {
    saveState()
    if (state.bytes) runParse()
}
function onNameLenChange() {
    saveState()
    if (state.bytes) runParse()
}
function onSample(e) {
    const idx = e.value
    if (idx != null && state.samples[idx]) applySample(idx)
}
function pickFile() {
    fileInput.value && fileInput.value.click()
}
function onFile(e) {
    const f = e.target.files && e.target.files[0]
    if (f) readFile(f)
    e.target.value = ''
}
function onDrop(e) {
    dragging.value = false
    const f = e.dataTransfer.files && e.dataTransfer.files[0]
    if (f) readFile(f)
}
</script>

<template>
    <div class="w-full h-full p-1 flex flex-col gap-1">
        <Toolbar class="p-5" style="padding: 5px;">
            <template #start>
                <span>Hex 数据</span>
            </template>

            <template #center>
                <div class="flex flex-wrap items-center justify-center gap-3">
                    <label class="inline-flex items-center gap-1 text-[11.5px] text-gray-600 dark:text-gray-300">
                        起始偏移
                        <InputText class="w-[78px] font-mono text-[12px]" v-model="state.startOffset" @change="onOffsetChange"
                            placeholder="0" size="small" />
                    </label>
                    <label class="inline-flex items-center gap-1 text-[11.5px] text-gray-600 dark:text-gray-300">
                        <Checkbox v-model="state.isNameLen" :binary="true" @change="onNameLenChange" size="small" />
                        命名长度
                    </label>
                    <Select :options="sampleOptions" optionLabel="label" optionValue="idx" placeholder="载入示例…"
                        class="min-w-[150px] text-xs" size="small" @change="onSample" />
                </div>
            </template>

            <template #end>
                <div class="flex gap-1">
                    <Button label="加载" icon="pi pi-play" severity="primay" size="small" @click="loadData" />
                    <Button label="文件" icon="pi pi-upload" severity="info" size="small" @click="pickFile" />
                    <Button label="清空" icon="pi pi-trash" severity="warn" size="small" @click="clearData" />
                </div>
            </template>
        </Toolbar>

        <Textarea v-model="state.hexInput" class="h-full resize-none font-mono text-[12.5px]"
            :class="dragging ? 'ring-2 ring-blue-500/70' : ''" fluid
            placeholder="在此粘贴十六进制文本（可含空格 / 0x），或拖拽 .bin/.hex/.txt 文件…" spellcheck="false" @input="onInput"
            @dragover.prevent="dragging = true" @dragleave.prevent="dragging = false" @drop.prevent="onDrop" />
        <input ref="fileInput" type="file" hidden @change="onFile" />
        <Message v-if="state.showErr" severity="error">{{ state.errMsg }}</Message>
        <Message v-else severity="secondary">粘贴或拖拽文件 / hex 文本至此</Message>
    </div>
</template>
