<script setup>
import { ref } from 'vue'
import { useAnalyzer } from '@/stores/useAnalyzer'
import { FIELD_SOLID } from '@/utils/hex/palette'

const { state, resultRows, switchResView, locateField, locateByLine, openReplace, copyJson } = useAnalyzer()

const stateOptions = ref([
    { label: '表格', value: 'table' },
    { label: 'JSON', value: 'json' }
])

const jsonRows = resultRows // 同结构，字段为扁平对象

function rowClass(row) {
    // 钉住字段：左侧红色标记（不用背景色，避免与 DataTable 斑马纹冲突）
    return row.i === state.pinField ? 'shadow-[inset_3px_0_0_#f43f5e]' : ''
}
function onRow(e) {
    if (e && e.data) locateField(e.data.i)
}
function valCls(row) {
    const f = state.currentFields[row.i]
    return f && typeof f.value === 'number' ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
}
</script>

<template>
    <div class="w-full h-full p-1 flex flex-col gap-1">
        <Toolbar style="padding: 5px;">
            <template #start>
                <span>解析结果</span>
            </template>

            <template #end>
                <div class="flex justify-items-center content-center gap-1">
                    <SelectButton :modelValue="state.resViewMode" :options="stateOptions" optionLabel="label"
                        optionValue="value" aria-labelledby="basic" size="small"
                        style="height: 28px; line-height: 28px;" @change="switchResView($event.value)" />
                    <Button label="复制" icon="pi pi-copy" severity="Secondary" size="small" @click="copyJson" />
                </div>
            </template>
        </Toolbar>

        <!-- 表格视图 -->
        <div v-show="state.resViewMode === 'table'" class="min-h-0 flex-1 overflow-hidden">
            <DataTable :value="resultRows" dataKey="i" scrollable scrollHeight="flex" size="small" :rowClass="rowClass"
                @row-click="onRow" stripedRows reorderableColumns class="res-dt h-full">
                <Column header="#" field="idx" style="width: 42px" />
                <Column header="行" style="width: 46px">
                    <template #body="{ data }">
                        <span v-if="data.hasLine"
                            class="cursor-pointer font-mono text-[12px] text-blue-600 hover:underline dark:text-blue-400"
                            @click.stop="locateByLine(data.line - 1)">{{ data.line }}</span>
                        <span v-else class="font-mono text-[12px] text-gray-300 dark:text-gray-600">—</span>
                    </template>
                </Column>
                <Column header="字段" field="name" style="min-width: 130px">
                    <template #body="{ data }">
                        <span class="mr-1 inline-block h-2 w-2 rounded-full align-middle"
                            :class="FIELD_SOLID[data.colorIdx]"></span>{{ data.name }}
                    </template>
                </Column>
                <Column header="类型" field="type" style="width: 84px" />
                <Column header="偏移" field="off" style="width: 74px" />
                <Column header="长度" field="len" style="width: 56px" />
                <Column header="值" field="val" style="min-width: 180px">
                    <template #body="{ data }">
                        <span class="font-mono text-[12px] break-all">{{ data.val }}</span>
                    </template>
                </Column>
                <Column header="操作" style="width: 56px">
                    <template #body="{ data }">
                        <Button icon="pi pi-pencil" size="small" text rounded aria-label="编辑字段"
                            @click.stop="openReplace(data.i)" />
                    </template>
                </Column>
                <template #empty>
                    <div class="py-6 text-center text-xs text-gray-500 dark:text-gray-400">暂无解析结果，请先在「数据」面板加载数据并定义
                        schema</div>
                </template>
            </DataTable>
        </div>

        <!-- JSON 视图 -->
        <div v-show="state.resViewMode === 'json'"
            class="min-h-0 flex-1 overflow-auto font-mono text-[12.5px] leading-[19px]">
            <div v-for="row in jsonRows" :key="row.i"
                class="flex cursor-pointer items-center gap-2 px-1 hover:bg-gray-100 dark:hover:bg-gray-800"
                :class="row.i === state.pinField ? 'shadow-[inset_3px_0_0_#f43f5e]' : ''" @click="locateField(row.i)">
                <span class="inline-block h-2 w-2 shrink-0 rounded-full" :class="FIELD_SOLID[row.colorIdx]"></span>
                <span class="text-sky-700 dark:text-sky-300">"{{ row.name }}"</span>
                <span class="text-gray-400">:</span>
                <span :class="valCls(row)">{{ row.val }}</span>
                <span class="text-gray-400">,</span>
            </div>
            <div v-if="!jsonRows.length" class="py-6 text-center text-xs text-gray-500 dark:text-gray-400">暂无解析结果</div>
        </div>

        <Message v-if="state.showErr" severity="error">{{ state.errMsg }}</Message>
    </div>
</template>
