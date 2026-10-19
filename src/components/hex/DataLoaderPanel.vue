<template>
    <div class="panel">
        <div class="panel-head">
            <span>数据 / Hex 视图</span>
            <span class="stat" :class="{ warn: !state.bytes }">{{ state.dataStat || '未加载' }}</span>
            <span class="sp"></span>
            <Button label="加载" icon="pi pi-play" size="small" @click="loadData" />
            <Button label="文件" icon="pi pi-upload" size="small" severity="secondary" @click="pickFile" />
            <Button label="清空" icon="pi pi-trash" size="small" severity="secondary" @click="clearData" />
            <input ref="fileInput" type="file" hidden @change="onFile" />
        </div>

        <div class="loader-bar">
            <div class="flex justify-center">
                <FloatLabel>
                    <InputText id="username" v-model="value" autocomplete="off" />
                    <label for="username">Username</label>
                </FloatLabel>
            </div>
            <label class="lb-item">
                起始偏移
                <InputText class="lb-off" v-model="state.startOffset" @change="onOffsetChange" placeholder="0" size="small" />
            </label>
            <label class="lb-item lb-check">
                <Checkbox v-model="state.isNameLen" :binary="true" @change="onNameLenChange" size="small" />
                命名长度
            </label>
            <label class="lb-item">
                示例
                <Select :options="sampleOptions" optionLabel="label" optionValue="idx" placeholder="载入示例…" class="lb-sample" size="small" @change="onSample" />
            </label>
        </div>

        <!-- 三个主内容（数据输入 / Hex 视图 / 替换输出）可拖动调整高度 -->
        <Splitter layout="vertical" class="loader-split">
            <SplitterPanel :size="30" :minSize="12">
                <div class="seg">
                    <Textarea
                        class="hex-input"
                        :class="{ drag: dragging }"
                        v-model="state.hexInput"
                        @input="onInput"
                        @dragover.prevent="dragging = true"
                        @dragleave.prevent="dragging = false"
                        @drop.prevent="onDrop"
                        placeholder="在此粘贴十六进制文本（可含空格 / 0x），或拖拽 .bin/.hex/.txt 文件…"
                        spellcheck="false"
                    ></Textarea>
                    <div v-if="state.showErr" class="err-bar">{{ state.errMsg }}</div>
                    <div class="stat">粘贴或拖拽文件 / hex 文本至此</div>
                </div>
            </SplitterPanel>

            <SplitterPanel :size="46" :minSize="15">
                <div class="seg">
                    <HexView />
                </div>
            </SplitterPanel>

            <SplitterPanel :size="24" :minSize="10">
                <div class="seg out-seg">
                    <div class="panel-foot out-foot">
                        <span class="stat">替换输出</span>
                        <span class="sp"></span>
                        <span class="stat">{{ state.outStat }}</span>
                        <Button label="复制" icon="pi pi-copy" size="small" severity="secondary" @click="copyHex" />
                        <Button label="重置" icon="pi pi-replay" size="small" severity="secondary" @click="resetOutput" />
                    </div>
                    <Textarea class="out-hex" readonly :value="state.outHex" spellcheck="false" placeholder="替换字段后生成的 hex 会显示在这里"></Textarea>
                </div>
            </SplitterPanel>
        </Splitter>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Checkbox from 'primevue/checkbox';
import Select from 'primevue/select';
import Splitter from 'primevue/splitter';
import SplitterPanel from 'primevue/splitterpanel';
import HexView from './HexView.vue';
import { useAnalyzer } from '@/stores/useAnalyzer';
import Textarea from 'primevue/textarea';
const { state, loadData, clearData, readFile, applySample, copyHex, resetOutput, runParse, saveState } = useAnalyzer();

const fileInput = ref(null);
const dragging = ref(false);
const sampleOptions = computed(() => state.samples.map((s, i) => ({ label: s.label, idx: i })));

let inputTimer = null;
function onInput() {
    clearTimeout(inputTimer);
    inputTimer = setTimeout(() => loadData(), 500);
}
function onOffsetChange() {
    saveState();
    if (state.bytes) runParse();
}
function onNameLenChange() {
    saveState();
    if (state.bytes) runParse();
}
function onSample(e) {
    const idx = e.value;
    if (idx != null && state.samples[idx]) applySample(idx);
}
function pickFile() {
    fileInput.value && fileInput.value.click();
}
function onFile(e) {
    const f = e.target.files && e.target.files[0];
    if (f) readFile(f);
    e.target.value = '';
}
function onDrop(e) {
    dragging.value = false;
    const f = e.dataTransfer.files && e.dataTransfer.files[0];
    if (f) readFile(f);
}
</script>

<style scoped>
.loader-bar {
    flex: none;
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 6px 10px;
    border-bottom: 1px solid var(--bd);
    background: #fafbfc;
    flex-wrap: wrap;
}

.lb-item {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 11.5px;
    color: var(--tx2);
}

.lb-off {
    width: 78px;
    font-family: var(--mono);
    font-size: 12px;
}

.lb-sample {
    min-width: 150px;
    font-size: 12px;
}

.lb-check {
    gap: 5px;
}

/* 内部竖向 Splitter：让数据输入 / Hex 视图 / 替换输出 三块可拖动调整高度 */
.loader-split {
    flex: 1;
    min-height: 0;
}

.seg {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
    overflow: hidden;
}

.out-foot {
    border-top: 1px solid var(--bd);
}
</style>
