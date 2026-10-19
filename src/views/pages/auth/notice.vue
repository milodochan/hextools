<script setup>
import api from '@/api/system/notice'
import { DialogContentSlot, FilterEnum, FilterOperatorEnum, PageRender, useConfig } from '@layoutkit/prime-vue-layoutkit'
import Tag from 'primevue/tag'

const { table, filter, tablebar, dialog } = useConfig()

// 筛选
filter.register('title', '标题')
filter.register('type', '类型')
filter.register('startTime', '开始日期')
    .setType(FilterEnum.DATE)
    .setOperator(FilterOperatorEnum.LESS)
    .setAttr({ showTime: false })
filter.register('endTime', '结束日期')
    .setType(FilterEnum.DATE)
    .setOperator(FilterOperatorEnum.LESS)
    .setAttr({ showTime: false })

// 表格
table.setColumn('title', '标题').setTemplate((item) => {
    const content = item.title.length > 50 ? item.title.substring(0, 49) + '...' : item.title
    return {
        content: item.readStatus ? content : `<span class='text-red-500'>${content}</span>`,
        tooltip: item.title
    }
})
table.setColumn('type', '类型').setWidth('20rem')
table.setColumn('forceRead', '是否强制阅读').setWidth('20rem').setTemplate((item) => ({
    component: Tag,
    content: item.forceRead ? '是' : '否',
    props: {
        severity: item.forceRead ? 'danger' : 'success'
    }
}))
table.setColumn('releaseUser', '发布人').setWidth('20rem')
table.setColumn('releaseTime', '发布时间').setWidth('20rem')

// 数据加载
table.enableLeftPosition()
table.setPageOptions([10, 15, 20])
table.registerLoader(async (page, params) => {
    const pageData = {
        pageIndex: page.index,
        pageSize: page.size,
        data: params
    }
    const res = await api.getMyPage(pageData)
    return res.code === 0 ? res.data : []
})

// 表格功能
tablebar.enableForzen()
tablebar.setTitle('操作')
tablebar.setWidth('100px')
tablebar.register('查看')
    .ignorePer()
    .on(async (item) => {
        const title = item.title.length > 20 ? item.title.substring(0, 19) + '...' : item.title
        dialog.register(title)
            .disableCancel()
            .setAttr({ style: { width: '50%' }, closable: false, closeOnEscape: false })
            .setComponent('detail', item)
            .setBtn(b => {
                b.setLabel('关闭').setType('secondary')
                    .on(async (dialogInstance, compRef) => {
                        dialogInstance.hide()
                        table.reload()
                    })
            }).show()

        const res = await api.saveReadLog(item.id)
        if (res.code !== 0) console.log(res.message)
    })
</script>

<template>
    <PageRender />
    <DialogContentSlot name="detail">
        <template #default="{ data }">
            <div class="p-6 md:p-10 ">
                <h1 class="text-2xl md:text-3xl font-bold text-gray-900 leading-snug mb-4 text-center">
                    {{ data.title }}
                </h1>
                <div class="flex items-center gap-3 text-sm text-gray-500 mb-6">
                    <span class="mr-auto px-2 py-1 bg-gray-100 rounded-md">
                        类型：{{ data.type }}
                    </span>
                    <span>发布人：{{ data.releaseUser }}</span>
                    <span>时间：{{ data.releaseTime }}</span>
                </div>
                <div class="border-t border-gray-100 mb-6"></div>
                <div class="prose prose-gray max-w-none text-gray-700 leading-8" v-html="data.content"></div>
            </div>
        </template>
    </DialogContentSlot>
</template>