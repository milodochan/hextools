<script setup>
import { onErrorCaptured, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const error = ref(false)

onErrorCaptured((err) => {
    error.value = err
    return false
})

watch(() => route.fullPath, () => {
    error.value = false
})
</script>

<template>
    <template v-if="error">
        <div class="flex justify-center h-full w-full overflow-hidden">
            <div class="flex flex-col items-center justify-center">
                <div
                    style="border-radius: 56px; padding: 0.3rem; background: linear-gradient(180deg, rgba(233, 30, 99, 0.4) 10%, rgba(33, 150, 243, 0) 30%)">
                    <div class="w-full bg-surface-0 dark:bg-surface-900 py-20 px-8 sm:px-20 flex flex-col items-center"
                        style="border-radius: 53px">
                        <div class="gap-4 flex flex-col items-center">
                            <div class="flex justify-center items-center border-2 border-pink-500 rounded-full"
                                style="height: 3.2rem; width: 3.2rem">
                                <i class="pi pi-fw pi-exclamation-circle !text-2xl text-pink-500"></i>
                            </div>
                            <h1 class="text-surface-900 dark:text-surface-0 font-bold text-5xl mb-2">页面发生错误 </h1>
                            <span class="text-muted-color mb-8">{{ error.message }}</span>
                            <img src="/demo/images/error/asset-error.svg" alt="Error" class="mb-8" width="80%" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </template>

    <slot v-else />
</template>
