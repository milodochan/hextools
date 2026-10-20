<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue';
import { useAnalyzer } from '@/stores/useAnalyzer';

const props = defineProps({
    modelValue: { type: String, default: '' }
});
const emit = defineEmits(['update:modelValue', 'edit']);

const { state } = useAnalyzer();
const LINE_H = 19;

const taRef = ref(null);
const hlInnerRef = ref(null);
const lnRef = ref(null);

const lineCount = computed(() => Math.max(1, props.modelValue.split('\n').length));
const activeLine = computed(() => (state.activeLine >= 0 ? state.activeLine : -1));

function escapeHtml(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/* 轻量语法高亮（注释 / 字符串 / 数字 / 关键字 / Type.xxx / 属性名） */
function highlight(code) {
    const kw = /\b(?:const|let|var|function|return|if|else|for|while|new|typeof|true|false|null|undefined|async|await)\b/;
    const out = [];
    let i = 0;
    const n = code.length;
    let com = null; // '//' | '/*'
    while (i < n) {
        const c = code[i];
        const c2 = i + 1 < n ? code[i + 1] : '';
        if (com === '//') {
            let j = i;
            while (j < n && code[j] !== '\n') j++;
            out.push('<span class="text-gray-400 italic">' + escapeHtml(code.slice(i, j)) + '</span>');
            i = j;
            com = null;
            continue;
        }
        if (com === '/*') {
            let j = i;
            while (j < n && !(code[j] === '*' && code[j + 1] === '/')) j++;
            const end = Math.min(n, j + 2);
            out.push('<span class="text-gray-400 italic">' + escapeHtml(code.slice(i, end)) + '</span>');
            i = end;
            com = null;
            continue;
        }
        if (c === '/' && c2 === '/') {
            com = '//';
            i += 2;
            continue;
        }
        if (c === '/' && c2 === '*') {
            com = '/*';
            i += 2;
            continue;
        }
        if (c === "'" || c === '"' || c === '`') {
            const q = c;
            let j = i + 1;
            while (j < n) {
                if (code[j] === '\\') {
                    j += 2;
                    continue;
                }
                if (code[j] === q) {
                    j++;
                    break;
                }
                j++;
            }
            out.push('<span class="text-emerald-600 dark:text-emerald-400">' + escapeHtml(code.slice(i, j)) + '</span>');
            i = j;
            continue;
        }
        if (/[0-9]/.test(c) || (c === '.' && /[0-9]/.test(c2))) {
            let j = i;
            if (c === '0' && (c2 === 'x' || c2 === 'X')) {
                j += 2;
                while (j < n && /[0-9a-fA-F]/.test(code[j])) j++;
            } else {
                while (j < n && /[0-9a-fA-FxX.]/.test(code[j])) j++;
            }
            out.push('<span class="text-amber-600 dark:text-amber-400">' + escapeHtml(code.slice(i, j)) + '</span>');
            i = j;
            continue;
        }
        if (/[A-Za-z_$]/.test(c)) {
            let j = i;
            while (j < n && /[\w$]/.test(code[j])) j++;
            const word = code.slice(i, j);
            if (kw.test(word)) out.push('<span class="text-violet-600 dark:text-violet-400">' + escapeHtml(word) + '</span>');
            else if (word === 'Type') out.push('<span class="text-sky-600 dark:text-sky-400">' + escapeHtml(word) + '</span>');
            else out.push(escapeHtml(word));
            i = j;
            continue;
        }
        if (c === '.') {
            let j = i + 1;
            while (j < n && /[\w$]/.test(code[j])) j++;
            const prop = code.slice(i + 1, j);
            if (['name', 'type', 'length', 'endian', 'offset'].includes(prop)) out.push('.' + '<span class="text-blue-600 dark:text-blue-400">' + escapeHtml(prop) + '</span>');
            else out.push('.' + escapeHtml(prop));
            i = j;
            continue;
        }
        out.push(escapeHtml(c));
        i++;
    }
    return out.join('');
}

const hlHtml = computed(() => highlight(props.modelValue));

function onInput(e) {
    emit('update:modelValue', e.target.value);
    emit('edit');
}

function onScroll() {
    const ta = taRef.value;
    if (!ta) return;
    if (hlInnerRef.value) hlInnerRef.value.style.transform = 'translate(' + -ta.scrollLeft + 'px,' + -ta.scrollTop + 'px)';
    if (lnRef.value) lnRef.value.scrollTop = ta.scrollTop;
}

function scrollToLine(line) {
    const ta = taRef.value;
    if (!ta) return;
    ta.scrollTop = Math.max(0, line * LINE_H - ta.clientHeight / 2);
    onScroll();
}

watch(activeLine, (l) => {
    if (l >= 0) nextTick(() => scrollToLine(l));
});

defineExpose({ scrollToLine });

onMounted(() => {
    onScroll();
});
</script>

<template>
    <div class="flex h-full w-full overflow-hidden font-mono text-[12.5px] leading-[19px]">
        <!-- 行号栏：与代码区纵向滚动同步 -->
        <div ref="lnRef" class="w-[54px] shrink-0 overflow-hidden border-r border-gray-200 bg-gray-50 text-right text-[12px] leading-[19px] text-gray-400 select-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-600">
            <div v-for="n in lineCount" :key="n" class="h-[19px] pr-2" :class="n - 1 === activeLine ? 'bg-amber-400/15 text-amber-600 dark:text-amber-400' : ''">
                {{ n }}
            </div>
        </div>

        <!-- 代码区：高亮层在底层，透明 textarea 覆盖在上层接收输入 -->
        <div class="relative min-w-0 flex-1 overflow-hidden bg-white dark:bg-gray-950">
            <div class="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
                <div ref="hlInnerRef" class="absolute top-0 left-0 w-max min-w-full">
                    <div class="whitespace-pre px-2" v-html="hlHtml"></div>
                    <div v-if="activeLine >= 0" class="absolute top-0 left-0 h-[19px] w-full border-l-2 border-amber-500/70 bg-amber-400/10" :style="{ top: activeLine * LINE_H + 'px' }"></div>
                </div>
            </div>
            <textarea
                ref="taRef"
                :value="modelValue"
                wrap="off"
                spellcheck="false"
                class="absolute inset-0 h-full w-full resize-none bg-transparent font-mono text-[12.5px] leading-[19px] text-transparent caret-blue-600 outline-none selection:bg-blue-500/30 dark:caret-blue-400"
                @input="onInput"
                @scroll="onScroll"
            ></textarea>
        </div>
    </div>
</template>
