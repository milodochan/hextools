<script setup>

import { useRouter } from 'vue-router'
const router = useRouter()

const test = (title, url) => {
    router.push({
        path: '/iframe',
        query: {
            title: title,// t === 1 ? '百度一下' : 'primevue',
            url: url// t === 1 ? 'https://www.baidu.com' : 'https://primevue.org/setup/'
        }
    })
}
</script>

<template>
    <div class="grid grid-cols-12 gap-8">

        <!-- <Button label="百度" @click="test('百度一下', 'https://www.baidu.com')" />
        <Button label="PrimeVue" @click="test('primevue', 'https://primevue.org/setup/')" />
        <Button label="Icon" @click="test('primevue icon', 'https://primevue.org/icons/')" />
        <StatsWidget />

        <div class="col-span-12 xl:col-span-6">
            <RecentSalesWidget />
            <BestSellingWidget />
        </div>
        <div class="col-span-12 xl:col-span-6">
            <RevenueStreamWidget />
            <NotificationsWidget />
        </div> -->
    </div>
</template>
