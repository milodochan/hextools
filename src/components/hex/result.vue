<script setup>
import { useAnalyzer } from '@/stores/useAnalyzer';

const { state, copyHex, resetOutput } = useAnalyzer();
</script>

<template>
    <div class="w-full h-full p-1 flex flex-col gap-1">
        <Toolbar style="padding: 5px;">
            <template #start>
                <span>结果</span>
            </template>

            <template #end>
                <div class="flex gap-1">
                    <Button label="复制" icon="pi pi-copy" severity="Secondary" size="small" @click="copyHex" />
                    <Button label="重置" icon="pi pi-replay" severity="Secondary" size="small" @click="resetOutput" />
                </div>
            </template>
        </Toolbar>
        <Textarea :value="state.outHex" class="h-full resize-none font-mono text-[12.5px]" fluid readonly spellcheck="false"
            placeholder="替换字段后生成的 hex 会显示在这里" />
    </div>
</template>
