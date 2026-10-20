<script setup>
import { ref, computed, watch, nextTick, shallowRef } from 'vue';
import { useAnalyzer } from '@/stores/useAnalyzer';
import { Codemirror } from 'vue-codemirror';

import { EditorView, lineNumbers, drawSelection, dropCursor, highlightSpecialChars, keymap, Decoration } from '@codemirror/view';
import { StateField, StateEffect } from '@codemirror/state';
import { history, defaultKeymap, historyKeymap, indentWithTab } from '@codemirror/commands';
import { StreamLanguage, HighlightStyle, syntaxHighlighting, bracketMatching, indentOnInput, indentUnit } from '@codemirror/language';
import { tags as t } from '@lezer/highlight';

const props = defineProps({
    modelValue: { type: String, default: '' }
});
const emit = defineEmits(['update:modelValue', 'edit']);

const { state } = useAnalyzer();
const activeLine = computed(() => (state.activeLine >= 0 ? state.activeLine : -1));

/* ===== 轻量 BNS-schema 语法（与旧版高亮规则保持一致） =====
   - 注释 // 与 /* *​/
   - 字符串 ' " `
   - 数字（含 0x 十六进制、前导小数点）
   - 关键字
   - Type.xxx 中的 Type 特殊着色
   - .name / .type / .length / .endian / .offset 属性名特殊着色
*/
const KEYWORDS = new Set([
    'const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while',
    'new', 'typeof', 'true', 'false', 'null', 'undefined', 'async', 'await'
]);
const PROPS = new Set(['name', 'type', 'length', 'endian', 'offset']);

const bnsStreamParser = {
    name: 'bns-schema',
    startState() {
        return { block: false };
    },
    token(stream, st) {
        if (st.block) {
            if (stream.match(/.*?\*\//)) st.block = false;
            else stream.skipToEnd();
            return 'comment';
        }
        if (stream.eatSpace()) return null;

        // 注释
        if (stream.match('//')) {
            stream.skipToEnd();
            return 'comment';
        }
        if (stream.match('/*')) {
            st.block = true;
            return 'comment';
        }

        const ch = stream.peek();

        // 字符串（含模板串）
        if (ch === '"' || ch === "'" || ch === '`') {
            stream.next();
            while (!stream.eol()) {
                const c = stream.next();
                if (c === '\\') {
                    stream.next();
                    continue;
                }
                if (c === ch) break;
            }
            return 'string';
        }

        // 数字
        if (/[0-9]/.test(ch) || (ch === '.' && /[0-9]/.test(stream.peek()))) {
            if (ch === '0' && (stream.peek() === 'x' || stream.peek() === 'X')) {
                stream.next();
                stream.next();
                stream.match(/[0-9a-fA-F]+/);
            } else {
                stream.match(/[0-9a-fA-FxX.]+/);
            }
            return 'number';
        }

        // 标识符 / 关键字 / Type
        if (/[A-Za-z_$]/.test(ch)) {
            stream.next();
            stream.match(/[\w$]*/);
            const w = stream.current();
            if (KEYWORDS.has(w)) return 'keyword';
            if (w === 'Type') return 'typeName';
            return 'variableName';
        }

        // .属性名
        if (ch === '.') {
            stream.next();
            if (stream.match(/[\w$]+/)) {
                const p = stream.current();
                if (PROPS.has(p)) return 'propertyName';
            }
            return null;
        }

        stream.next();
        return null;
    },
    languageData: {
        commentTokens: { line: '//', block: { open: '/*', close: '*/' } }
    }
};

const bnsLanguage = StreamLanguage.define(bnsStreamParser);

// 颜色使用 CSS 变量，由 style 块按 .app-dark 切换亮/暗
const bnsHighlight = HighlightStyle.define([
    { tag: t.comment, color: 'var(--cm-comment)', fontStyle: 'italic' },
    { tag: t.string, color: 'var(--cm-string)' },
    { tag: t.number, color: 'var(--cm-number)' },
    { tag: t.keyword, color: 'var(--cm-keyword)' },
    { tag: t.typeName, color: 'var(--cm-typename)' },
    { tag: t.propertyName, color: 'var(--cm-property)' },
    { tag: t.variableName, color: 'var(--cm-fg)' }
]);

// 基础编辑扩展（不含光标所在行高亮，避免与下方「外部 activeLine」高亮冲突）
const baseSetup = [
    lineNumbers(),
    highlightSpecialChars(),
    history(),
    drawSelection(),
    dropCursor(),
    indentOnInput(),
    bracketMatching(),
    indentUnit.of('  '),
    keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab])
];

const baseTheme = EditorView.theme({
    '&': {
        height: '100%',
        backgroundColor: 'var(--cm-bg)',
        color: 'var(--cm-fg)',
        fontSize: '12.5px'
    },
    '.cm-scroller': {
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace',
        lineHeight: '19px'
    },
    '.cm-gutters': {
        backgroundColor: 'var(--cm-gutter-bg)',
        color: 'var(--cm-gutter-color)',
        border: 'none',
        borderRight: '1px solid var(--cm-border)'
    },
    // 关闭自带的「光标行」高亮，避免与下方 activeLine 高亮视觉重叠
    '.cm-activeLineGutter': { backgroundColor: 'transparent' },
    '.cm-activeLine': { backgroundColor: 'transparent' },
    '.cm-cursor': { borderLeftColor: 'var(--cm-caret)' },
    '.cm-selectionBackground, .cm-content ::selection': { backgroundColor: 'var(--cm-selection)' },
    // 外部 activeLine（解析定位行）高亮
    '.cm-schema-active-line': {
        backgroundColor: 'var(--cm-activeline-bg)',
        boxShadow: 'inset 2px 0 0 var(--cm-activeline-border)'
    },
    '&.cm-focused': { outline: 'none' }
});

/* ===== 外部 activeLine（state.activeLine，0-based）高亮 ===== */
const setActiveLine = StateEffect.define();
const activeLineField = StateField.define({
    create() {
        return -1;
    },
    update(value, tr) {
        for (const e of tr.effects) if (e.is(setActiveLine)) value = e.value;
        return value;
    },
    provide: (f) =>
        // 注意：decorations.from 的 getter 只接收字段值，不接收 state，
        // 因此改用 compute(以本字段为依赖)，在回调里通过 state.field(f) 取值并访问 doc。
        EditorView.decorations.compute([f], (state) => {
            const active = state.field(f);
            if (active < 0 || active >= state.doc.lines) return Decoration.none;
            const line = state.doc.line(Math.min(active + 1, state.doc.lines));
            return Decoration.set([Decoration.line({ class: 'cm-schema-active-line' }).range(line.from)]);
        })
});

const extensions = [baseSetup, bnsLanguage, syntaxHighlighting(bnsHighlight), baseTheme, activeLineField];

/* ===== 视图引用与对外方法 ===== */
const cmView = shallowRef(null);

function onReady(payload) {
    cmView.value = payload && payload.view ? payload.view : null;
}

// 文本变化（仅来自真实输入，vue-codemirror 已过滤外部赋值）
function onChange() {
    emit('edit');
}
function onUpdate(val) {
    emit('update:modelValue', val);
}

function setActive(line) {
    const view = cmView.value;
    if (!view) return;
    view.dispatch({ effects: setActiveLine.of(line) });
}

function scrollToLine(line) {
    const view = cmView.value;
    if (!view) return;
    const target = Math.max(0, line | 0);
    setActive(target);
    if (target >= 0 && target < view.state.doc.lines) {
        const pos = view.state.doc.line(target + 1).from;
        view.dispatch({ effects: EditorView.scrollIntoView(pos, { y: 'center' }) });
    }
}

function clearActiveLine() {
    setActive(-1);
}

// state.activeLine 变化：定位并高亮；为 -1 时清除高亮（与原组件行为一致）
watch(activeLine, (l) => {
    if (l >= 0) nextTick(() => scrollToLine(l));
    else clearActiveLine();
});

defineExpose({ scrollToLine });
</script>

<template>
    <Codemirror
        :model-value="props.modelValue"
        :extensions="extensions"
        @update:model-value="onUpdate"
        @change="onChange"
        @ready="onReady"
    />
</template>

<!-- 非 scoped：需作用于 CodeMirror 动态生成的 DOM -->
<style>
.cm-editor {
    --cm-comment: #9ca3af;
    --cm-string: #059669;
    --cm-number: #d97706;
    --cm-keyword: #7c3aed;
    --cm-typename: #0284c7;
    --cm-property: #2563eb;
    --cm-fg: #1f2937;
    --cm-bg: #ffffff;
    --cm-gutter-bg: #f9fafb;
    --cm-gutter-color: #9ca3af;
    --cm-border: #e5e7eb;
    --cm-caret: #2563eb;
    --cm-selection: rgba(59, 130, 246, 0.3);
    --cm-activeline-bg: rgba(245, 158, 11, 0.1);
    --cm-activeline-border: rgba(245, 158, 11, 0.7);
    height: 100%;
}

/* PrimeVue 暗色（.app-dark）以及常见 .dark 约定 */
.app-dark .cm-editor,
.dark .cm-editor {
    --cm-comment: #6b7280;
    --cm-string: #34d399;
    --cm-number: #fbbf24;
    --cm-keyword: #a78bfa;
    --cm-typename: #38bdf8;
    --cm-property: #60a5fa;
    --cm-fg: #e5e7eb;
    --cm-bg: #030712;
    --cm-gutter-bg: #111827;
    --cm-gutter-color: #4b5563;
    --cm-border: #1f2937;
    --cm-caret: #60a5fa;
    --cm-selection: rgba(59, 130, 246, 0.35);
    --cm-activeline-bg: rgba(245, 158, 11, 0.1);
    --cm-activeline-border: rgba(245, 158, 11, 0.7);
}

</style>
