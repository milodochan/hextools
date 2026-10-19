<script setup>
import LayoutSplitter from '@/components/hex/LayoutSplitter.vue';
import dataLoader from '@/components/hex/data-loader.vue';
</script>

<template>
    <!-- <div class="container mx-auto px-4"> -->
    <!-- <LayoutSplitter /> -->
    <Splitter class="h-full">
        <SplitterPanel class="flex items-center justify-center">
            <Splitter class="h-full" layout="vertical">
                <SplitterPanel class="flex">
                    <dataLoader />
                </SplitterPanel>
                <SplitterPanel class="flex items-center justify-center"> Panel 2 </SplitterPanel>
                <SplitterPanel class="flex items-center justify-center"> Panel 3 </SplitterPanel>
            </Splitter>
        </SplitterPanel>
        <SplitterPanel class="flex items-center justify-center"> Panel 4 </SplitterPanel>
        <SplitterPanel class="flex items-center justify-center"> Panel 5 </SplitterPanel>
    </Splitter>
    <!-- </div> -->
</template>
