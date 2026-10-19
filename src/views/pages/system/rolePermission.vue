<script setup>
import api from '@/api/system/role'
import PermissionPanel from '@/components/system/permission-panel.vue'
import { onMounted, ref } from 'vue'

const props = defineProps({
    id: String
})

const menus = ref([])
const pers = ref([])
const data = ref([])

onMounted(async () => {
    const res = await api.getPermissionConfig(props.id)
    console.log(res)
    const items = res.data.menus.sort((a, b) => a.sort - b.sort)
    menus.value = buildTreeData(items, '-1')
    pers.value = res.data.pers
    data.value = res.data.ids.map(v => v.toLowerCase())
})

const buildTreeData = (data, pid) => {
    const outData = []
    const filterData = data.filter(item => item.pid.trim().toLowerCase() === pid.trim().toLowerCase())
    if (filterData.length > 0) {
        filterData.forEach(item => {
            item.id = item.id.toLowerCase()
            item.pid = item.pid.toLowerCase()
            item.children = buildTreeData(data, item.id)
            outData.push(item)
        })
    }

    return outData
}

// 暴露componentRef
defineExpose({
    data
})
</script>

<template>
    <PermissionPanel v-model:ids="data" :pers="pers" v-for="(item, index) in menus" :key="index" :item="item" />
</template>