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
key.register('audit', 'task:audit')
key.register('look', 'task:look')

// 筛选
filter.register('auditId', '订单号')
filter.register('mainName', '主体名称')
filter.register('businessType', '业务类型').setOptions([
    { label: '小程序微信认证', value: 2 },
    { label: '公众号微信认证', value: 3 },
    { label: '企业微信(企业号)微信认证', value: 163 },
    { label: '开放平台(Open)微信认证', value: 25 },
    { label: '公众号个人认证', value: 38 },
    { label: '视频号个人认证', value: 53 },
    { label: '视频号企业认证', value: 65 }
])
filter.register('orderType', '订单类型').setOptions([
    { label: '新提交', value: '0' },
    { label: '年审', value: '4' },
    { label: '重新认证', value: '5' },
    { label: '主体变更认证', value: '6' }
])
filter.register('isRefill', '是否被打回').setOptions([{ label: '是', value: 1 }, { label: '否', value: 2 }])
filter.registerBuildDataFunc((items) => utils.filterDataBuild(items))

// 表格
table.setColumn('auditId', '操作')
    .enablePer('audit')
    .setAttr({ frozen: true, alignFrozen: 'left' })
    .setTemplate((item) => {
        return {
            component: Button,
            content: '审核',
            props: {
                severity: 'info',
                variant: 'text',
                // 绑定事件处理器
                onClick: () => {
                    api.getToken(item.id).then(res => {
                        if (res.code === 0) {
                            const token = encodeURIComponent(res.data.token)
                            const id = res.data.id
                            window.open(`/core/#/entry/?id=${id}&token=${token}`, '_blank')
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
table.setColumn('orderTypeName', '订单类型')
table.setColumn('mainTypeName', '主体类型')
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
table.setColumn('auditTime', '审核计时').setTemplate((item) => {
    const format = utils.formatDurationWithLevel(item.auditTime)
    return {
        component: Tag,
        content: format.text,
        props: {
            severity: format.level
        }
    }
})
table.setColumn('businessTypeName', '业务类型')
table.setColumn('resultName', '审核结果')
table.setColumn('auditStatusName', '订单状态')
table.setColumn('computedIsRefill', '是否被打回').setTemplate((item) => ({
    component: Tag,
    content: item.computedIsRefill === 1 ? '是' : '否',
    props: {
        severity: item.computedIsRefill === 1 ? 'danger' : 'secondary'
    }
}))
table.setColumn('isPay', '打款状态').setTemplate((item) => {
    let text = '未知'
    let severity = 'secondary'
    switch (item.isPay) {
        case 0:
        case 1:
            text = '未打款'
            severity = 'warn'
            break
        case 2:
            text = '已申请打款'
            severity = 'warn'
            break
        case 3:
            text = '打款成功'
            severity = 'success'
            break
        case 4:
            text = '打款失败'
            severity = 'danger'
            break
        case 5:
            text = '已打款(结果待定)'
            severity = 'primary'
            break
    }

    return {
        component: Tag,
        content: text,
        props: {
            severity: severity
        }
    }
})
table.setColumn('pushTime', '推单时间').setTemplate((item) => utils.formatDate(item.pushTime))
table.setColumn('createTime', '初审拉取时间').setTemplate((item) => utils.formatDate(item.createTime))
table.setColumn('updateTime', '我方最后更新时间').setTemplate((item) => utils.formatDate(item.updateTime))

table.setPageOptions([10, 15, 20])
table.registerLoader(async (page, data) => {
    const pageData = {
        pageIndex: page.index,
        pageSize: page.size,
        data: data
    }
    const result = await api.getPage(pageData)
    if (result.code === 0) return result.data
    else message.error(result.message)
})
</script>

<template>
    <PageRender />
</template>