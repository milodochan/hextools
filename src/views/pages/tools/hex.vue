<script setup>
import dataLoader from '@/components/hex/data-loader.vue'
import hexView from '@/components/hex/hex-view.vue'
import result from '@/components/hex/result.vue'
import schemaEditor from '@/components/hex/schema-editor.vue'
import analysisResult from '@/components/hex/analysis-result.vue'
</script>

<template>
    <Splitter class="h-full">
        <SplitterPanel class="flex items-center justify-center" :size="40" :minSize="0">
            <analysisResult />
        </SplitterPanel>
        <SplitterPanel class="flex items-center justify-center" :size="40" :minSize="0">
            <schemaEditor />
        </SplitterPanel>
        <SplitterPanel class="flex items-center justify-center" :size="20" :minSize="0">
            <Splitter class="h-full" layout="vertical">
                <SplitterPanel class="flex" :size="25" :minSize="0">
                    <dataLoader />
                </SplitterPanel>
                <SplitterPanel class="flex items-center justify-center" :size="50" :minSize="0">
                    <hexView />
                </SplitterPanel>
                <SplitterPanel class="flex items-center justify-center" :size="25" :minSize="0">
                    <result />
                </SplitterPanel>
            </Splitter>
        </SplitterPanel>
    </Splitter>
</template>
