<script setup>
import api from '@/api/business/task'
import utils from '@/utils/index'
import { PageRender, useConfig } from '@layoutkit/prime-vue-layoutkit'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import { useRouter } from 'vue-router'

const router = useRouter()
const { table, filter, key, message } = useConfig()

// 权限key
key.register('look', 'receive:look')

// 筛选
filter.register('auditId', '订单号').onRequire()
filter.register('mainName', '主体名称').onRequire()
filter.register('nickName', '认证昵称').onRequire()
filter.register('appId', '账号AppId').onRequire()
// 后续新增电话后四位查询， 运营者姓名查询？
filter.registerBuildDataFunc((items) => utils.filterDataBuild(items))


table.setColumn('auditId', '查看')
    .enablePer('look')
    .setAttr({ frozen: true, alignFrozen: 'left' })
    .setTemplate((item) => {
        return {
            component: Button,
            content: '查看',
            props: {
                severity: 'info',
                variant: 'text',
                // 绑定事件处理器
                onClick: () => {
                    api.getViewToken(item.id).then(res => {
                        if (res.code === 0) {
                            const token = encodeURIComponent(res.data.token)
                            const id = res.data.id
                            window.open(`/core/#/view/?id=${id}&token=${token}`, '_blank')

                            // router.push({
                            //     path: '/iframe',
                            //     query: {
                            //         title: item.mainName,
                            //         url: `/core/#/view/?id=${id}&token=${token}`
                            //     }
                            // })
                        }
                        else {
                            message.error(res.message)
                        }
                    })

                }
            }
        }
    })
table.setColumn('auditId', '订单编号')
table.setColumn('isLocked', '状态').setTemplate((item) => ({
    component: Tag,
    content: item.isLocked ? '已锁定' : '未锁定',
    props: {
        icon: item.isLocked ? 'pi pi-lock' : 'pi pi-lock-open',
        severity: item.isLocked ? 'danger' : 'success'
    }
}))
table.setColumn('orderTypeName', '订单类型')
// table.setColumn('mainTypeName', '主体类型')
table.setColumn('mainName', '主体名称').setTemplate((item, temp) => {
    temp.setContent(item.mainName.length > 20 ? item.mainName.substring(0, 19) + '...' : item.mainName)
        .setTooltip(item.mainName)
})
table.setColumn('nickName', '认证昵称')
table.setColumn('costTime', '订单计时').setTemplate((item) => {
    const format = utils.formatDurationWithLevel(item.costTime)
    // console.log(format)
    return {
        component: Tag,
        content: format.text,
        props: {
            severity: format.level
        }
    }
})
// table.setColumn('auditTime', '审核计时').setTemplate((item) => {
//     const format = utils.formatDurationWithLevel(item.auditTime)
//     return {
//         component: Tag,
//         content: format.text,
//         props: {
//             severity: format.level
//         }
//     }
// })
table.setColumn('businessTypeName', '业务类型')
table.setColumn('resultName', '审核结果')
table.setColumn('auditStatusName', '订单状态')
// table.setColumn('computedIsRefill', '是否被打回').setTemplate((item) => ({
//     component: Tag,
//     content: item.computedIsRefill === 1 ? '是' : '否',
//     props: {
//         severity: item.computedIsRefill === 1 ? 'danger' : 'secondary'
//     }
// }))
table.setColumn('pushTime', '推单时间').setTemplate((item) => utils.formatDate(item.pushTime))
table.setColumn('loginName', '初审人员')
table.setColumn('createTime', '初审拉取时间').setTemplate((item) => utils.formatDate(item.createTime))
table.setColumn('submitTime', '我方最后更新时间').setTemplate((item) => utils.formatDate(item.submitTime))
table.setColumn('updateTime', '我方最后更新时间').setTemplate((item) => utils.formatDate(item.updateTime))

table.setPageOptions([10, 15, 20])
table.registerLoader(async (page, data) => {
    // if (data.queryList.every(item => !item.value?.length)) {
    //     message.warning('请至少填写一个筛选条件')
    //     return {
    //         total: 0,
    //         records: []
    //     }
    // }
    const pageData = {
        pageIndex: page.index,
        pageSize: page.size,
        data: data
    }
    const result = await api.getUnionPage(pageData)
    if (result.code === 0) return result.data
    else message.error(result.message)
})
</script>

<template>
    <PageRender />
</template>