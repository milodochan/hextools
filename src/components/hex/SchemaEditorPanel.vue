<template>
    <div class="panel">
        <div class="panel-head">
            <span>Schema 编辑器</span>
            <span class="sp"></span>
            <SelectButton :options="modeOpts" :modelValue="state.schemaMode" @change="onMode($event.value)" optionValue="value" optionLabel="label" :allowEmpty="false" />
            <Button label="解析" icon="pi pi-cog" size="small" @click="runParse" />
            <Button label="新增行" icon="pi pi-plus" size="small" severity="secondary" @click="addListRow" />
        </div>

        <div v-if="state.showErr" class="err-bar">{{ state.errMsg }}</div>

        <!-- 代码模式 -->
        <div v-show="state.schemaMode === 'code'" class="editor-area">
            <CodeEditor ref="codeRef" v-model="state.code" @edit="onCodeEdit" />
        </div>

        <!-- 列表模式（PrimeVue DataTable：cell 编辑 + 拖列宽 + 列排序 + 自动缓存） -->
        <div v-show="state.schemaMode === 'list'" id="listMode" class="list-mode">
            <div class="list-wrap" ref="listWrapRef">
                <DataTable
                    :value="state.listRows"
                    editMode="cell"
                    v-model:editingRows="editingRows"
                    @cell-edit-complete="onCellEditComplete"
                    resizableColumns
                    columnResizeMode="fit"
                    reorderableColumns
                    stateStorage="local"
                    stateKey="hexan.schemaCols.v3"
                    size="small"
                    scrollable
                    scrollHeight="flex"
                    stripedRows
                    :tableStyle="{ width: '840px' }"
                    :rowClass="rowCls"
                    class="list-dt"
                >
                    <Column header="#" :style="{ width: '42px' }" :reorderableColumn="false" :resizeable="false">
                        <template #body="{ index }">{{ index + 1 }}</template>
                    </Column>
                    <Column field="name" header="名称" columnKey="name" :style="{ width: '150px' }">
                        <template #body="{ data }">
                            <span v-if="data.raw != null" class="raw-text">{{ data.raw }}</span>
                            <span v-else>{{ data.name }}</span>
                        </template>
                        <template #editor="{ data }">
                            <InputText v-if="data.raw != null" v-model="data.raw" @input="onListInput" fluid size="small" autofocus placeholder="自定义代码片段" />
                            <InputText v-else v-model="data.name" @input="onListInput" fluid size="small" autofocus placeholder="字段名" />
                        </template>
                    </Column>
                    <Column field="type" header="类型" columnKey="type" :style="{ width: '110px' }">
                        <template #body="{ data }">
                            <span v-if="data.raw != null" class="cell-empty"></span>
                            <Tag v-else :value="data.type" severity="secondary" />
                        </template>
                        <template #editor="{ data }">
                            <Select v-if="data.raw == null" v-model="data.type" :options="typeOptions" optionValue="value" optionLabel="label" size="small" fluid @change="onListInput" />
                            <span v-else class="cell-empty"></span>
                        </template>
                    </Column>
                    <Column field="length" header="长度" columnKey="length" :style="{ width: '110px' }">
                        <template #body="{ data }">
                            <span v-if="data.raw != null" class="cell-empty"></span>
                            <span v-else class="mono">{{ data.length || '—' }}</span>
                        </template>
                        <template #editor="{ data }">
                            <InputText v-if="data.raw == null" v-model="data.length" @input="onListInput" fluid size="small" autofocus placeholder="数字/表达式" />
                            <span v-else class="cell-empty"></span>
                        </template>
                    </Column>
                    <Column field="endian" header="字节序" columnKey="endian" :style="{ width: '92px' }">
                        <template #body="{ data }">
                            <span v-if="data.raw != null" class="cell-empty"></span>
                            <Tag v-else :value="data.endian" severity="secondary" />
                        </template>
                        <template #editor="{ data }">
                            <Select v-if="data.raw == null" v-model="data.endian" :options="endianOptions" optionValue="value" optionLabel="label" size="small" fluid @change="onListInput" />
                            <span v-else class="cell-empty"></span>
                        </template>
                    </Column>
                    <Column field="offset" header="偏移" columnKey="offset" :style="{ width: '92px' }">
                        <template #body="{ data }">
                            <span v-if="data.raw != null" class="cell-empty"></span>
                            <span v-else class="mono">{{ data.offset || '—' }}</span>
                        </template>
                        <template #editor="{ data }">
                            <InputText v-if="data.raw == null" v-model="data.offset" @input="onListInput" fluid size="small" autofocus placeholder="0" />
                            <span v-else class="cell-empty"></span>
                        </template>
                    </Column>
                    <Column field="remark" header="备注" columnKey="remark" :style="{ width: '140px' }">
                        <template #body="{ data }">
                            <span v-if="data.raw != null" class="cell-empty"></span>
                            <span v-else>{{ data.remark }}</span>
                        </template>
                        <template #editor="{ data }">
                            <InputText v-if="data.raw == null" v-model="data.remark" @input="onListInput" fluid size="small" autofocus placeholder="备注" />
                            <span v-else class="cell-empty"></span>
                        </template>
                    </Column>
                    <Column header="操作" columnKey="ops" :reorderableColumn="false" :resizeable="false" :style="{ width: '82px' }">
                        <template #body="{ data, index }">
                            <span v-if="data.raw != null" class="cell-empty"></span>
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
        <div class="list-toolbar">
            <span>{{
                state.schemaMode === 'code'
                    ? `定义 [ { name, type: Type.XXX, length }, … ]，length
        可省略（按类型默认）。Ctrl/Cmd+S 解析`
                    : '字段列表（自动生成等价 schema 代码）'
            }}</span>
            <span class="sp"></span>
            <span class="stat">{{ state.parseStat || '—' }}</span>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import Button from 'primevue/button';
import SelectButton from 'primevue/selectbutton';
import Select from 'primevue/select';
import InputText from 'primevue/inputtext';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Tag from 'primevue/tag';
import CodeEditor from './CodeEditor.vue';
import { useAnalyzer } from '@/stores/useAnalyzer';
import { TYPE_OPTIONS } from '@/utils/hex/schema';

const { state, setSchemaMode, runParse, onListInput, addListRow, moveListRow, delListRow, registerEditor } = useAnalyzer();

const codeRef = ref(null);
const listWrapRef = ref(null);
const flashIdx = ref(-1);
const editingRows = ref([]);
let flashTimer = null;

const modeOpts = [
    { label: '代码', value: 'code' },
    { label: '列表', value: 'list' }
];
const typeOptions = TYPE_OPTIONS.map((t) => ({ label: t.toUpperCase(), value: t }));
const endianOptions = [
    { label: 'LE', value: 'le' },
    { label: 'BE', value: 'be' }
];

/* ===== 列宽/列序：交由 DataTable 原生 resizableColumns + reorderableColumns + stateStorage 处理 ===== */

function rowCls(data, index) {
    const c = [];
    if (data.raw != null) c.push('raw-row');
    if (flashIdx.value === index) c.push('row-flash');
    return c.join(' ');
}

function onMode(v) {
    if (!v) return;
    setSchemaMode(v);
}
function onCellEditComplete() {
    // 编辑器里已通过 v-model 直接改了 listRows，这里仅触发重新生成代码 + 解析
    onListInput();
}
function onCodeEdit() {
    if (state.bytes) runParse();
}

function scrollListTo(idx) {
    const wrap = listWrapRef.value;
    if (!wrap || idx == null) return;
    const sc = wrap.querySelector('.p-datatable-scrollable-body') || wrap.querySelector('.p-datatable-body') || wrap;
    const row = sc.querySelector('tbody tr:nth-child(' + (idx + 1) + ')');
    if (row) row.scrollIntoView({ block: 'center' });
}
function flashListRow(idx) {
    if (idx == null) return;
    flashIdx.value = idx;
    scrollListTo(idx);
    clearTimeout(flashTimer);
    flashTimer = setTimeout(() => {
        if (flashIdx.value === idx) flashIdx.value = -1;
    }, 1000);
}

onMounted(() => {
    registerEditor({
        scrollToLine(line) {
            if (state.schemaMode === 'list') {
                const ri = state.genLineToRow[line];
                scrollListTo(ri);
            } else {
                codeRef.value && codeRef.value.scrollToLine(line);
            }
        },
        flashRow(idx) {
            if (state.schemaMode === 'list') flashListRow(idx);
        }
    });
});
onBeforeUnmount(() => {
    clearTimeout(flashTimer);
});
</script>

<style scoped>
.editor-area {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 160px;
}

.editor-tip {
    flex: none;
    padding: 6px 10px;
    font-size: 11px;
    color: var(--tx3);
    border-top: 1px solid var(--bd);
    background: #fafbfc;
    line-height: 1.5;
}

.editor-tip code {
    font-family: var(--mono);
    background: #eef1f4;
    padding: 1px 4px;
    border-radius: 4px;
    color: var(--tx2);
}
</style>
