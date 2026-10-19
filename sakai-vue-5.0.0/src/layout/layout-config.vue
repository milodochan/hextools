<script setup>
import { useLayout } from '@layoutkit/prime-vue-layoutkit'
import { ref } from 'vue'

const { primaryColors, getMenuMode, updateColors, updateMenuMode, isPrimary } = useLayout()

const menuMode = ref(getMenuMode.value)
const menuModeOptions = ref([
    { label: '静态', value: 'static' },
    { label: '隐藏式', value: 'overlay' }
])
</script>

<template>
    <div
        class="config-panel hidden absolute top-[3.25rem] right-0 w-64 p-4 bg-surface-0 dark:bg-surface-900 border border-surface rounded-border origin-top shadow-[0px_3px_5px_rgba(0,0,0,0.02),0px_0px_2px_rgba(0,0,0,0.05),0px_1px_4px_rgba(0,0,0,0.08)]">
        <div class="flex flex-col gap-4">
            <div>
                <span class="text-sm text-muted-color font-semibold">主题</span>
                <div class="pt-2 flex gap-2 flex-wrap justify-between">
                    <button v-for="primaryColor of primaryColors" :key="primaryColor.name" type="button"
                        :title="primaryColor.name" @click="updateColors(primaryColor.name)"
                        :class="['border-none w-5 h-5 rounded-full p-0 cursor-pointer outline-none outline-offset-1', { 'outline-primary': isPrimary(primaryColor.name) }]"
                        :style="{ backgroundColor: `${primaryColor.name === 'noir' ? 'var(--text-color)' : primaryColor.palette['500']}` }"></button>
                </div>
            </div>
            <div class="flex flex-col gap-2">
                <span class="text-sm text-muted-color font-semibold">菜单模式</span>
                <SelectButton v-model="menuMode" @change="updateMenuMode($event.value)" :options="menuModeOptions"
                    :allowEmpty="false" optionLabel="label" optionValue="value" />
            </div>
        </div>
    </div>
</template>
