<script setup>
import { ProductService } from '@/service/ProductService'
import { onMounted, ref } from 'vue'

const products = ref(null)

onMounted(() => {
    ProductService.getProductsSmall().then((data) => (products.value = data))
})
</script>

<template>
    <div class="flex flex-col gap-2" style="width: 550px; height: 300px;">
        <div class="font-bold">我的消息</div>
        <div class="flex flex-col gap-2">
            <!-- <div class="flex flex-wrap p-2 items-center gap-4 w-full border border-gray-200 rounded-md shadow-sm">
                <div class="flex-1 flex flex-col">
                    <span class="font-medium text-sm">大撒大撒</span>
                    <span
                        :class="['text-sm', { 'text-surface-500 dark:text-surface-400': 'text-inherit' }]">dasdasd</span>
                </div>
                <span class="font-bold sm:ml-8">sdasdas</span>
            </div>
            <Button label="Show" class="mb-4" /> -->
        </div>
    </div>
</template>