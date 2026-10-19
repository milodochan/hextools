<template>
    <Dialog v-model:visible="visible" modal header="使用说明" :style="{ width: '560px' }" :maximizable="true">
        <div class="help-body">
            <h4>基本流程</h4>
            <ol>
                <li>在「数据 / Hex」面板的文本框粘贴十六进制（可含空格、<code>0x</code> 前缀），或拖入 <code>.bin/.hex/.txt</code> 文件。</li>
                <li>在「Schema 编辑器」中定义 <code>const schema = [...]</code>（或切换到列表模式逐行填写）。</li>
                <li>解析结果会显示在「解析结果」面板，并与 Hex 视图双向联动：点击任一区域即可定位 / 钉住字段。</li>
                <li>在结果表点击 ✎ 可就地修改字段值，修改后的 hex 会输出到「数据」面板底部的替换输出区。</li>
            </ol>

            <h4>顶部布局切换</h4>
            <p>提供 <b>lr / rl / tb / tri</b> 四种面板排布，使用 PrimeVue <code>Splitter</code> 拖动分隔条自由调整大小。</p>

            <h4>支持的字段类型</h4>
            <p>
                <code>int8 / uint8 / int16 / uint16 / int32 / uint32 / float / double / bytes / utf16le / hex</code>
            </p>
            <ul>
                <li><b>length</b>：可省略（按类型默认），或填数字 / 表达式 <code>(d) =&gt; d.nameLen * 2</code>。</li>
                <li><b>endian</b>：默认小端；大写字节序字段填 <code>endian: false</code>（BE）。</li>
                <li><b>offset</b>：字段内偏移（极少用）。</li>
                <li><b>utf16le</b> 用于 UTF-16 小端字符串；<b>hex</b> 直接按十六进制原样保留。</li>
            </ul>

            <h4>示例数据</h4>
            <p>「数据」面板顶部的「示例」下拉可一键载入内置样本（含 schema），便于快速上手。</p>
        </div>
    </Dialog>
</template>

<script setup>
import { ref } from 'vue';
import Dialog from 'primevue/dialog';

const visible = ref(false);
defineExpose({ open: () => (visible.value = true) });
</script>

<style scoped>
.help-body {
    font-size: 13px;
    line-height: 1.7;
    color: var(--tx);
}
.help-body h4 {
    margin: 14px 0 6px;
    color: var(--ac);
    font-size: 13.5px;
}
.help-body h4:first-child {
    margin-top: 0;
}
.help-body code {
    font-family: var(--mono);
    background: #eef1f4;
    padding: 1px 5px;
    border-radius: 4px;
    color: var(--tx2);
    font-size: 12px;
}
.help-body ol,
.help-body ul {
    margin: 4px 0;
    padding-left: 20px;
}
</style>
