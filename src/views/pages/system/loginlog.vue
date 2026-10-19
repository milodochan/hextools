<script setup>
import api from '@/api/system/loginlog'
import { PageRender, useConfig } from '@layoutkit/prime-vue-layoutkit'
import { Tag } from 'primevue'

const { table, filter } = useConfig()

//筛选
filter.register('loginName', '登录名称')
filter.register('loginIp', '登录IP')

// 表格列
table.setColumn('loginName', '登录名称').setWidth('12rem')
table.setColumn('loginIp', '登录IP').setWidth('12rem')
table.setColumn('isSuccess', '登录状态').setWidth('8rem').setTemplate(item => {
    return {
        component: Tag,
        content: item.isSuccess === 1 ? '成功' : '失败',
        props: {
            severity: item.isSuccess === 1 ? 'success' : 'danger'
        }
    }
})
table.setColumn('loginTime', '登录时间')

table.enableLeftPosition()
table.setPageOptions([10, 15, 20])
table.registerLoader(async (page, params) => {
    const pageData = {
        pageIndex: page.index,
        pageSize: page.size,
        data: params
    }
    const res = await api.getPage(pageData)
    return res.code === 0 ? res.data : []

})

</script>

<template>
    <PageRender />
</template>
