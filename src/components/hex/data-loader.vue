<script setup>
import { ref, computed, watch } from 'vue'
import { useAnalyzer } from '@/stores/useAnalyzer'

const { state, loadData, clearData, readFile, applySample, loadFromHistory, deleteHistory, saveCurrent } = useAnalyzer()

const fileInput = ref(null)
const dragging = ref(false)
// Select 当前选中值：'s:示例idx' 或 'h:历史id'
const selectedVal = ref('')

// 「保存」弹窗：输入历史名称后把当前数据写入下拉
const saveDialog = ref(false)
const saveName = ref('')

// 扁平下拉：示例（不可删）+ 历史（可删，按时间命名）。不再用分组，避免组标题占行、宽度锁死。
const selectOptions = computed(() => {
    const samples = state.samples.map((s, i) => ({
        label: s.label,
        value: 's:' + i,
        kind: 'sample'
    }))
    const history = state.dataHistory.map((e) => ({
        label: e.name,
        value: 'h:' + e.id,
        kind: 'history',
        id: e.id
    }))
    return [...samples, ...history]
})

let inputTimer = null
// 在 textarea 内编辑/粘贴只做解析预览，不写入历史；历史只由「加载」按钮或选文件创建
function onInput() {
    clearTimeout(inputTimer)
    inputTimer = setTimeout(() => loadData({ silent: true }), 500)
}
function onSelect(e) {
    const v = e && e.value
    if (!v) return
    if (v.startsWith('s:')) {
        state.activeHistoryId = null
        applySample(+v.slice(2))
    } else if (v.startsWith('h:')) loadFromHistory(v.slice(2))
}

// 当前选中项跟随 state.activeHistoryId：新建/加载历史 -> 高亮该条；删除/清空 -> 复位
watch(
    () => state.activeHistoryId,
    (id) => {
        selectedVal.value = id ? 'h:' + id : ''
    }
)
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
function openSave() {
    saveName.value = ''
    saveDialog.value = true
}
function confirmSave() {
    const ok = saveCurrent(saveName.value)
    if (ok) {
        saveDialog.value = false
        saveName.value = ''
    }
}
</script>

<template>
    <div class="w-full h-full p-1 flex flex-col gap-1">
        <Toolbar class="p-5" style="padding: 5px">
            <template #start>
                <span>Hex 数据</span>
            </template>

            <template #center>
                <Select v-model="selectedVal" :options="selectOptions" optionLabel="label" optionValue="value" placeholder="示例或历史数据…" class="w-[140px] text-xs" size="small" @change="onSelect">
                    <template #option="{ option }">
                        <div class="flex w-full items-center justify-between gap-2">
                            <span class="text-xs">{{ option.label }}</span>
                            <button v-if="option.kind === 'history'" type="button" class="pi pi-times shrink-0 text-gray-400 hover:text-rose-500" title="删除该条数据" @click.stop="deleteHistory(option.id)"></button>
                        </div>
                    </template>
                </Select>
            </template>

            <template #end>
                <div class="flex gap-1">
                    <Button label="保存" icon="pi pi-save" severity="primay" size="small" @click="openSave" />
                    <Button label="文件" icon="pi pi-upload" severity="info" size="small" @click="pickFile" />
                    <Button label="清空" icon="pi pi-trash" severity="warn" size="small" @click="clearData" />
                </div>
            </template>
        </Toolbar>

        <Textarea
            v-model="state.hexInput"
            class="h-full resize-none font-mono text-[12.5px]"
            :class="dragging ? 'ring-2 ring-blue-500/70' : ''"
            fluid
            placeholder="在此粘贴十六进制文本（可含空格 / 0x），或拖拽 .bin/.hex/.txt 文件…"
            spellcheck="false"
            @input="onInput"
            @dragover.prevent="dragging = true"
            @dragleave.prevent="dragging = false"
            @drop.prevent="onDrop"
        />
        <input ref="fileInput" type="file" hidden @change="onFile" />
        <!-- <Message v-if="state.showErr" severity="error">{{ state.errMsg }}</Message> -->
        <Message severity="secondary">粘贴或拖拽文件 / hex 文本加载预览，点击「保存」将其加入下拉历史</Message>

        <!-- 保存为历史数据：弹窗输入名称 -->
        <Dialog v-model:visible="saveDialog" header="保存为历史数据" :modal="true" :style="{ width: '22rem' }">
            <div class="flex flex-col gap-2">
                <label class="text-xs text-gray-500">为当前数据输入一个名称（留空则使用时间命名）</label>
                <InputText v-model="saveName" placeholder="例如：登录包-6600" fluid size="small" @keyup.enter="confirmSave" autofocus />
            </div>
            <template #footer>
                <div class="flex justify-end gap-2">
                    <Button label="取消" severity="secondary" size="small" text @click="saveDialog = false" />
                    <Button label="保存" icon="pi pi-save" size="small" @click="confirmSave" />
                </div>
            </template>
        </Dialog>
    </div>
</template>
