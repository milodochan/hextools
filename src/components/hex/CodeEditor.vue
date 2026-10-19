<template>
    <div class="editor-wrap">
        <div class="line-nums" ref="lnRef">
            <div class="ln" v-for="n in lineCount" :key="n" :class="{ 'ln-act': n - 1 === activeLine }">
                {{ n }}
            </div>
        </div>
        <div class="editor-scroll" ref="scrollRef">
            <div class="editor-hl">
                <div class="editor-hl-inner" ref="hlInnerRef">
                    <div class="editor-hl-code" v-html="hlHtml"></div>
                    <div v-if="activeLine >= 0" class="editor-active-line" :style="{ top: activeLine * LINE_H + 'px' }"></div>
                </div>
            </div>
            <textarea class="editor-ta" ref="taRef" :value="modelValue" @input="onInput" @scroll="onScroll" spellcheck="false"></textarea>
        </div>
    </div>
</template>

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
const scrollRef = ref(null);

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
            out.push('<span class="c-com">' + escapeHtml(code.slice(i, j)) + '</span>');
            i = j;
            com = null;
            continue;
        }
        if (com === '/*') {
            let j = i;
            while (j < n && !(code[j] === '*' && code[j + 1] === '/')) j++;
            const end = Math.min(n, j + 2);
            out.push('<span class="c-com">' + escapeHtml(code.slice(i, end)) + '</span>');
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
            out.push('<span class="c-str">' + escapeHtml(code.slice(i, j)) + '</span>');
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
            out.push('<span class="c-num">' + escapeHtml(code.slice(i, j)) + '</span>');
            i = j;
            continue;
        }
        if (/[A-Za-z_$]/.test(c)) {
            let j = i;
            while (j < n && /[\w$]/.test(code[j])) j++;
            const word = code.slice(i, j);
            if (kw.test(word)) out.push('<span class="c-kw">' + word + '</span>');
            else if (word === 'Type') out.push('<span class="c-typ">' + word + '</span>');
            else out.push(escapeHtml(word));
            i = j;
            continue;
        }
        if (c === '.') {
            let j = i + 1;
            while (j < n && /[\w$]/.test(code[j])) j++;
            const prop = code.slice(i + 1, j);
            if (['name', 'type', 'length', 'endian', 'offset'].includes(prop)) out.push('.' + '<span class="c-prop">' + prop + '</span>');
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
