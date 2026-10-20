<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useAnalyzer } from '@/stores/useAnalyzer'
import { TYPE_OPTIONS } from '@/utils/hex/schema'
import CodeEditor from './code-editor.vue'

const { state, setSchemaMode, runParse, onListInput, addListRow, moveListRow, delListRow, registerEditor } = useAnalyzer()

const codeRef = ref(null)
const listWrapRef = ref(null)
const tableRef = ref(null)
const flashIdx = ref(-1)
const editingRows = ref([])
let flashTimer = null

const modeOpts = [
    { label: '代码', value: 'code' },
    { label: '列表', value: 'list' }
]
const typeOptions = TYPE_OPTIONS.map((t) => ({ label: t.toUpperCase(), value: t }))
const endianOptions = [
    { label: 'LE', value: 'le' },
    { label: 'BE', value: 'be' }
]

/* ===== 列宽/列序：交由 DataTable 原生 resizableColumns + reorderableColumns + stateStorage 处理 ===== */
/* 注意：DataTable 持久化列序时，列的标识取自 columnKey || field。
   两者都没有的列，其标识为 undefined → JSON 序列化后变成 null → 下次 restoreState()
   时 findColumnByKey 匹配不到，该列会被兜底逻辑追加到表格末尾（序号列因此跑到最后）。
   所以每一列都必须显式给出 columnKey。 */

const FIXED_FIRST = 'idx' // 序号列：始终钉在首位
const FIXED_LAST = 'ops' // 操作列：始终钉在末位

// 规范化列序：序号恒在首位、操作恒在末位，其余列保持相对顺序
function normalizeOrder(order) {
    if (!Array.isArray(order)) return null
    const rest = []
    const seen = new Set()
    for (const k of order) {
        if (k == null) continue
        if (k === FIXED_FIRST || k === FIXED_LAST) continue
        if (seen.has(k)) continue
        seen.add(k)
        rest.push(k)
    }
    return [FIXED_FIRST, ...rest, FIXED_LAST]
}

// 把「序号」钉回首位、「操作」钉回末位
function applyFixedColumnOrder() {
    const dt = tableRef.value
    if (!dt) return
    const cur = dt.d_columnOrder
    const next = normalizeOrder(cur)
    if (!next) return
    if (Array.isArray(cur) && cur.length === next.length && cur.every((k, i) => k === next[i])) return
    dt.d_columnOrder = next
}

function rowCls(data, index) {
    const c = []
    if (data.raw != null) c.push('bg-gray-100 dark:bg-gray-800/60')
    if (flashIdx.value === index) c.push('shadow-[inset_3px_0_0_#f43f5e]')
    return c.join(' ')
}

function onMode(v) {
    if (!v) return
    setSchemaMode(v)
}
function onCellEditComplete() {
    // 编辑器里已通过 v-model 直接改了 listRows，这里仅触发重新生成代码 + 解析
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
    // 兜底：若 localStorage 中残留的历史列序把「序号」排到了中间/末尾，
    // restoreState() 会在 mounted 中还原它，这里统一纠正为「序号在最前、操作在最后」。
    applyFixedColumnOrder()

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
        <Toolbar style="padding: 5px;">
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
                    <SelectButton :modelValue="state.schemaMode" :options="modeOpts" optionLabel="label"
                        style="height: 28px; line-height: 28px;" optionValue="value" aria-labelledby="basic"
                        size="small" @change="onMode($event.value)" />
                    <Button label="新增" icon="pi pi-plus" severity="primay" size="small" @click="addListRow" />
                    <Button label="解析" icon="pi pi-cog" severity="info" size="small" @click="runParse" />
                </div>
            </template>
        </Toolbar>

        <!-- 代码模式 -->
        <div v-show="state.schemaMode === 'code'"
            class="min-h-[160px] flex-1 overflow-hidden border-1 rounded-md border-gray-300 dark:border-gray-700">
            <CodeEditor ref="codeRef" v-model="state.code" @edit="onCodeEdit" />
        </div>

        <!-- 列表模式 -->
        <div v-show="state.schemaMode === 'list'" id="listMode" class="min-h-0 flex-1 overflow-hidden">
            <div ref="listWrapRef" class="h-full overflow-auto">
                <DataTable ref="tableRef" :value="state.listRows" editMode="cell" v-model:editingRows="editingRows"
                    @cell-edit-complete="onCellEditComplete" resizableColumns columnResizeMode="fit" reorderableColumns
                    @column-reorder="applyFixedColumnOrder" stateStorage="local" stateKey="hexan.schemaCols.v4" size="small"
                    scrollable scrollHeight="flex" stripedRows :tableStyle="{ width: '840px' }" :rowClass="rowCls" class="list-dt">
                    <Column header="#" columnKey="idx" :style="{ width: '42px' }" :reorderableColumn="false" :resizeable="false">
                        <template #body="{ index }">{{ index + 1 }}</template>
                    </Column>
                    <Column field="name" header="名称" columnKey="name" :style="{ width: '150px' }">
                        <template #body="{ data }">
                            <span v-if="data.raw != null"
                                class="font-mono text-[12px] text-gray-600 dark:text-gray-300">{{ data.raw }}</span>
                            <span v-else>{{ data.name }}</span>
                        </template>
                        <template #editor="{ data }">
                            <InputText v-if="data.raw != null" v-model="data.raw" @input="onListInput" fluid
                                size="small" autofocus placeholder="自定义代码片段" />
                            <InputText v-else v-model="data.name" @input="onListInput" fluid size="small" autofocus
                                placeholder="字段名" />
                        </template>
                    </Column>
                    <Column field="type" header="类型" columnKey="type" :style="{ width: '110px' }">
                        <template #body="{ data }">
                            <span v-if="data.raw != null" class="text-gray-300 dark:text-gray-600">—</span>
                            <Tag v-else :value="data.type" severity="secondary" />
                        </template>
                        <template #editor="{ data }">
                            <Select v-if="data.raw == null" v-model="data.type" :options="typeOptions"
                                optionValue="value" optionLabel="label" size="small" fluid @change="onListInput" />
                            <span v-else class="text-gray-300 dark:text-gray-600">—</span>
                        </template>
                    </Column>
                    <Column field="length" header="长度" columnKey="length" :style="{ width: '110px' }">
                        <template #body="{ data }">
                            <span v-if="data.raw != null" class="text-gray-300 dark:text-gray-600">—</span>
                            <span v-else class="font-mono text-[12px]">{{ data.length || '—' }}</span>
                        </template>
                        <template #editor="{ data }">
                            <InputText v-if="data.raw == null" v-model="data.length" @input="onListInput" fluid
                                size="small" autofocus placeholder="数字/表达式" />
                            <span v-else class="text-gray-300 dark:text-gray-600">—</span>
                        </template>
                    </Column>
                    <Column field="endian" header="字节序" columnKey="endian" :style="{ width: '92px' }">
                        <template #body="{ data }">
                            <span v-if="data.raw != null" class="text-gray-300 dark:text-gray-600">—</span>
                            <Tag v-else :value="data.endian" severity="secondary" />
                        </template>
                        <template #editor="{ data }">
                            <Select v-if="data.raw == null" v-model="data.endian" :options="endianOptions"
                                optionValue="value" optionLabel="label" size="small" fluid @change="onListInput" />
                            <span v-else class="text-gray-300 dark:text-gray-600">—</span>
                        </template>
                    </Column>
                    <Column field="offset" header="偏移" columnKey="offset" :style="{ width: '92px' }">
                        <template #body="{ data }">
                            <span v-if="data.raw != null" class="text-gray-300 dark:text-gray-600">—</span>
                            <span v-else class="font-mono text-[12px]">{{ data.offset || '—' }}</span>
                        </template>
                        <template #editor="{ data }">
                            <InputText v-if="data.raw == null" v-model="data.offset" @input="onListInput" fluid
                                size="small" autofocus placeholder="0" />
                            <span v-else class="text-gray-300 dark:text-gray-600">—</span>
                        </template>
                    </Column>
                    <Column field="remark" header="备注" columnKey="remark" :style="{ width: '140px' }">
                        <template #body="{ data }">
                            <span v-if="data.raw != null" class="text-gray-300 dark:text-gray-600">—</span>
                            <span v-else>{{ data.remark }}</span>
                        </template>
                        <template #editor="{ data }">
                            <InputText v-if="data.raw == null" v-model="data.remark" @input="onListInput" fluid
                                size="small" autofocus placeholder="备注" />
                            <span v-else class="text-gray-300 dark:text-gray-600">—</span>
                        </template>
                    </Column>
                    <Column header="操作" columnKey="ops" :reorderableColumn="false" :resizeable="false"
                        :style="{ width: '82px' }">
                        <template #body="{ data, index }">
                            <span v-if="data.raw != null" class="text-gray-300 dark:text-gray-600">—</span>
                            <span v-else class="ops">
                                <button class="op-btn" title="上移" @click="moveListRow(index, -1)">▲</button>
                                <button class="op-btn" title="下移" @click="moveListRow(index, 1)">▼</button>
                                <button class="op-btn del" title="删除" @click="delListRow(index)">✕</button>
                            </span>
                        </template>
                    </Column>
                </DataTable>
            </div>
        </div>
        <Message v-if="state.showErr" severity="error">{{ state.errMsg }}</Message>
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
