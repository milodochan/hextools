<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useAnalyzer } from '@/stores/useAnalyzer'
import { TYPE_OPTIONS } from '@/utils/hex/schema'
import CodeEditor from './code-editor.vue'

const { state, setSchemaMode, runParse, onListInput, addListRow, moveListRow, delListRow, registerEditor } = useAnalyzer()

const codeRef = ref(null)
const listWrapRef = ref(null)
const flashIdx = ref(-1)
let flashTimer = null

const modeOpts = [
    { label: '列表', value: 'list' },
    { label: '代码', value: 'code' }
]
const typeOptions = TYPE_OPTIONS.map((t) => ({ label: t.toUpperCase(), value: t }))
const endianOptions = [
    { label: 'LE', value: 'le' },
    { label: 'BE', value: 'be' }
]

/* 列宽/列序：交由 DataTable 原生的 resizableColumns + reorderableColumns 处理。
   不做 stateStorage 持久化——持久化的列序在表结构改动后容易残留旧 columnKey，
   导致 restoreState 把列序打乱甚至丢失编辑器插槽，表现为「整表无法编辑」。 */

// 当前「被钉住字段」对应的列表行（hex 点击后 state.pinField 即该字段序号）。
// genLineToRow: 代码行号 -> 列表行序号；lineMap: 字段序号 -> 代码行号。
const activeRow = computed(() => {
    const f = state.pinField
    if (f == null || f < 0) return -1
    const ln = state.lineMap ? state.lineMap[f] : undefined
    if (ln == null || ln < 0) return -1
    const ri = state.genLineToRow ? state.genLineToRow[ln] : undefined
    return ri == null ? -1 : ri
})
// 用「行数据引用」匹配：PrimeVue v4 的 rowClass 不再回传 index（只传 rowData），
// 原先 flashIdx === index 永远为假，导致高亮失效、只剩定位（滚动）。
const activeRowItem = computed(() => (activeRow.value >= 0 ? state.listRows[activeRow.value] : null))
const flashRowItem = computed(() => (flashIdx.value >= 0 ? state.listRows[flashIdx.value] : null))

function rowCls(data) {
    const c = []
    if (data.raw != null) c.push('bg-gray-100 dark:bg-gray-800/60')
    // 点击瞬间的脉冲反馈
    if (flashRowItem.value && data === flashRowItem.value) c.push('shadow-[inset_3px_0_0_#f43f5e]')
    // hex 点击后钉住的字段：整行持续高亮（与 hex 视图 pinField 的 rose ring 呼应）
    if (activeRowItem.value && data === activeRowItem.value) c.push('ring-2 ring-inset ring-rose-500 bg-rose-50 dark:bg-rose-500/10')
    return c.join(' ')
}

function onMode(v) {
    if (!v) return
    setSchemaMode(v)
}
function onCellEditComplete(e) {
    // PrimeVue v4 的 cell-edit 不会自动把编辑值写回数据源：
    // 编辑时它在内部克隆了一份 rowData（editingMeta），编辑器 v-model 只改动了克隆体，
    // completeEdit 把克隆体放在 e.newData 抛出、并保留 e.data 为原始行（同一响应式引用）。
    // 必须在这里把克隆体合并回原始行，编辑结果才会真正持久。
    if (e && e.data && e.newData) {
        Object.assign(e.data, e.newData)
    }
    // 重新生成代码 + 解析
    onListInput()
}
function onCodeEdit() {
    if (state.bytes) runParse()
}

function scrollListTo(idx) {
    const wrap = listWrapRef.value
    if (!wrap || idx == null) return
    const sc = wrap.querySelector('.p-datatable-scrollable-body') || wrap.querySelector('.p-datatable-body') || wrap
    const row = sc.querySelector('tbody tr:nth-child(' + (idx + 1) + ')')
    if (row) row.scrollIntoView({ block: 'center' })
}
function flashListRow(idx) {
    if (idx == null) return
    flashIdx.value = idx
    scrollListTo(idx)
    clearTimeout(flashTimer)
    flashTimer = setTimeout(() => {
        if (flashIdx.value === idx) flashIdx.value = -1
    }, 1000)
}

onMounted(() => {
    // 清理可能残留的旧列序持久化（曾用 stateStorage="local"），避免旧 columnKey 干扰当前渲染导致无法编辑
    try {
        localStorage.removeItem('hexan.schemaCols.v4')
    } catch (e) {
        /* noop */
    }

    registerEditor({
        scrollToLine(line) {
            if (state.schemaMode === 'list') {
                const ri = state.genLineToRow[line]
                scrollListTo(ri)
            } else {
                codeRef.value && codeRef.value.scrollToLine(line)
            }
        },
        flashRow(idx) {
            if (state.schemaMode === 'list') flashListRow(idx)
        }
    })
})
onBeforeUnmount(() => {
    clearTimeout(flashTimer)
})
</script>

<template>
    <div class="w-full h-full p-1 flex flex-col gap-1">
        <Toolbar style="padding: 5px">
            <template #start>
                <span>Schema 编辑器</span>
            </template>

            <template #center>
                <IconField>
                    <InputIcon>
                        <i class="pi pi-search" />
                    </InputIcon>
                    <InputText placeholder="查找" size="small" />
                </IconField>
            </template>

            <template #end>
                <div class="flex justify-items-center content-center gap-1">
                    <SelectButton :modelValue="state.schemaMode" :options="modeOpts" optionLabel="label" style="height: 28px; line-height: 28px" optionValue="value" aria-labelledby="basic" size="small" @change="onMode($event.value)" />
                    <Button label="新增" icon="pi pi-plus" severity="primay" size="small" @click="addListRow" />
                    <Button label="解析" icon="pi pi-cog" severity="info" size="small" @click="runParse" />
                </div>
            </template>
        </Toolbar>

        <!-- 代码模式 -->
        <div v-show="state.schemaMode === 'code'" class="min-h-[160px] flex-1 overflow-hidden border-1 rounded-md border-gray-300 dark:border-gray-700">
            <CodeEditor ref="codeRef" v-model="state.code" @edit="onCodeEdit" />
        </div>

        <!-- 列表模式 -->
        <div v-show="state.schemaMode === 'list'" id="listMode" class="min-h-0 flex-1 overflow-hidden">
            <div ref="listWrapRef" class="h-full overflow-auto border-1 rounded-md border-gray-300 dark:border-gray-700">
                <DataTable
                    :value="state.listRows"
                    editMode="cell"
                    @cell-edit-complete="onCellEditComplete"
                    resizableColumns
                    columnResizeMode="fit"
                    reorderableColumns
                    size="small"
                    scrollable
                    scrollHeight="flex"
                    stripedRows
                    showGridlines
                    :rowClass="rowCls"
                    class="list-dt"
                >
                    <Column header="#" columnKey="idx" :style="{ width: '42px' }" :reorderableColumn="false" :resizeable="false">
                        <template #body="{ index }">{{ index + 1 }}</template>
                    </Column>
                    <Column field="name" header="名称" columnKey="name" :style="{ width: '150px' }">
                        <template #body="{ data }">
                            <span v-if="data.raw != null" class="font-mono text-[12px] text-gray-600 dark:text-gray-300">{{ data.raw }}</span>
                            <span v-else>{{ data.name }}</span>
                        </template>
                        <template #editor="{ data }">
                            <InputText v-if="data.raw != null" v-model="data.raw" fluid size="small" autofocus placeholder="自定义代码片段" />
                            <InputText v-else v-model="data.name" fluid size="small" autofocus placeholder="字段名" />
                        </template>
                    </Column>
                    <Column field="type" header="类型" columnKey="type" :style="{ width: '110px' }">
                        <template #body="{ data }">
                            <span v-if="data.raw != null" class="text-gray-300 dark:text-gray-600">—</span>
                            <Tag v-else :value="data.type" severity="secondary" />
                        </template>
                        <template #editor="{ data }">
                            <Select v-if="data.raw == null" v-model="data.type" :options="typeOptions" optionValue="value" optionLabel="label" size="small" fluid />
                            <span v-else class="text-gray-300 dark:text-gray-600">—</span>
                        </template>
                    </Column>
                    <Column field="length" header="长度" columnKey="length" :style="{ width: '110px' }">
                        <template #body="{ data }">
                            <span v-if="data.raw != null" class="text-gray-300 dark:text-gray-600">—</span>
                            <span v-else class="font-mono text-[12px]">{{ data.length || '—' }}</span>
                        </template>
                        <template #editor="{ data }">
                            <InputText v-if="data.raw == null" v-model="data.length" fluid size="small" autofocus placeholder="数字/表达式" />
                            <span v-else class="text-gray-300 dark:text-gray-600">—</span>
                        </template>
                    </Column>
                    <Column field="endian" header="字节序" columnKey="endian" :style="{ width: '92px' }">
                        <template #body="{ data }">
                            <span v-if="data.raw != null" class="text-gray-300 dark:text-gray-600">—</span>
                            <Tag v-else :value="data.endian" severity="secondary" />
                        </template>
                        <template #editor="{ data }">
                            <Select v-if="data.raw == null" v-model="data.endian" :options="endianOptions" optionValue="value" optionLabel="label" size="small" fluid />
                            <span v-else class="text-gray-300 dark:text-gray-600">—</span>
                        </template>
                    </Column>
                    <Column field="offset" header="偏移" columnKey="offset" :style="{ width: '92px' }">
                        <template #body="{ data }">
                            <span v-if="data.raw != null" class="text-gray-300 dark:text-gray-600">—</span>
                            <span v-else class="font-mono text-[12px]">{{ data.offset || '—' }}</span>
                        </template>
                        <template #editor="{ data }">
                            <InputText v-if="data.raw == null" v-model="data.offset" fluid size="small" autofocus placeholder="0" />
                            <span v-else class="text-gray-300 dark:text-gray-600">—</span>
                        </template>
                    </Column>
                    <Column field="remark" header="备注" columnKey="remark" :style="{ width: '140px' }">
                        <template #body="{ data }">
                            <span v-if="data.raw != null" class="text-gray-300 dark:text-gray-600">—</span>
                            <span v-else>{{ data.remark }}</span>
                        </template>
                        <template #editor="{ data }">
                            <InputText v-if="data.raw == null" v-model="data.remark" fluid size="small" autofocus placeholder="备注" />
                            <span v-else class="text-gray-300 dark:text-gray-600">—</span>
                        </template>
                    </Column>
                    <Column header="操作" columnKey="ops" :reorderableColumn="false" :resizeable="false" :style="{ width: '82px' }">
                        <template #body="{ data, index }">
                            <span v-if="data.raw != null" class="text-gray-300 dark:text-gray-600">—</span>
                            <span v-else class="flex flex-row gap-1 ops">
                                <button class="op-btn" title="上移" @click="moveListRow(index, -1)">▲</button>
                                <button class="op-btn" title="下移" @click="moveListRow(index, 1)">▼</button>
                                <button class="op-btn del" title="删除" @click="delListRow(index)">✕</button>
                            </span>
                        </template>
                    </Column>
                </DataTable>
            </div>
        </div>
        <!-- <Message v-if="state.showErr" severity="error">{{ state.errMsg }}</Message> -->
    </div>
</template>

<style scoped>
/* 列表模式下的行内操作按钮 */
.op-btn {
    width: 20px;
    height: 20px;
    line-height: 1;
    border: 1px solid var(--p-content-border-color, #d1d5db);
    border-radius: 4px;
    background: transparent;
    color: inherit;
    font-size: 11px;
    cursor: pointer;
}

.op-btn:hover {
    background: var(--p-content-hover-background, #f3f4f6);
}

.op-btn.del:hover {
    border-color: #ef4444;
    color: #ef4444;
}
</style>
