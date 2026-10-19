<template>
    <div class="panel">
        <div class="panel-head">
            <span>解析结果</span>
            <span class="stat">{{ state.resStat || '—' }}</span>
            <span class="sp"></span>
            <SelectButton :options="viewOpts" :modelValue="state.resViewMode" @change="switchResView($event.value)" optionValue="value" optionLabel="label" :allowEmpty="false" />
            <Button v-if="state.resViewMode === 'json'" label="复制JSON" icon="pi pi-copy" size="small" severity="secondary" @click="copyJson" />
        </div>

        <div v-if="state.showErr" class="err-bar">{{ state.errMsg }}</div>

        <!-- 表格视图 -->
        <div v-show="state.resViewMode === 'table'" class="res-flex">
            <DataTable :value="resultRows" dataKey="i" scrollable scrollHeight="flex" size="small" :rowClass="rowClass" @row-click="onRow" stripedRows reorderableColumns class="res-dt">
                <Column header="#" field="idx" style="width: 42px" />
                <Column header="行" style="width: 46px">
                    <template #body="{ data }">
                        <span v-if="data.hasLine" class="c-line" @click.stop="locateByLine(data.line - 1)">{{ data.line }}</span>
                        <span v-else class="c-line none">—</span>
                    </template>
                </Column>
                <Column header="字段" field="name" style="min-width: 130px">
                    <template #body="{ data }"> <span class="chip" :class="'f' + data.colorIdx"></span>{{ data.name }} </template>
                </Column>
                <Column header="类型" field="type" style="width: 84px" />
                <Column header="偏移" field="off" style="width: 74px" />
                <Column header="长度" field="len" style="width: 56px" />
                <Column header="值" field="val" style="min-width: 180px">
                    <template #body="{ data }">
                        <span class="c-val">{{ data.val }}</span>
                    </template>
                </Column>
                <Column header="操作" style="width: 56px">
                    <template #body="{ data }">
                        <Button icon="pi pi-pencil" size="small" text rounded aria-label="编辑字段" @click.stop="openReplace(data.i)" />
                    </template>
                </Column>
                <template #empty>
                    <div class="empty">暂无解析结果，请先在「数据」面板加载数据并定义 schema</div>
                </template>
            </DataTable>
        </div>

        <!-- JSON 视图 -->
        <div v-show="state.resViewMode === 'json'" class="json-wrap">
            <div v-for="row in jsonRows" :key="row.i" class="jline" :class="{ pinned: row.i === state.pinField }" @click="locateField(row.i)">
                <span class="jkey">"{{ row.key }}"</span><span class="jcolon">: </span><span class="jval" :class="valCls(row)">{{ row.val }}</span
                ><span class="jcolon">,</span>
            </div>
            <div v-if="!jsonRows.length" class="empty">暂无解析结果</div>
        </div>
    </div>
</template>

<script setup>
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import SelectButton from 'primevue/selectbutton';
import { useAnalyzer } from '@/stores/useAnalyzer';

const { state, resultRows, switchResView, locateField, locateByLine, openReplace, copyJson } = useAnalyzer();

const viewOpts = [
    { label: '表格', value: 'table' },
    { label: 'JSON', value: 'json' }
];

const jsonRows = resultRows; // 同结构，字段为扁平对象

function rowClass(row) {
    return row.i === state.pinField ? 'pinned' : '';
}
function onRow(e) {
    if (e && e.data) locateField(e.data.i);
}
function valCls(row) {
    const f = state.currentFields[row.i];
    return f && typeof f.value === 'number' ? 'jnum' : 'jstr';
}
</script>
