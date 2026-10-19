<script setup>
import api from '@/api/system/level'
import { FormEnum, PageRender, useConfig } from '@layoutkit/prime-vue-layoutkit'

const { table, filter, toolbar, tablebar, dialog, key, form, message } = useConfig()

// 权限key
key.register('save', 'level:save')
key.register('delete', 'level:delete')

// 筛选
filter.register('levelName', '级别名称')

// 表格
table.setColumn('levelName', '级别名称').setWidth('20rem')
table.setColumn('orderIndex', '排序').setWidth('20rem')
table.setColumn('unhandlerMaxNum', '最大未处理订单数量(每天)').setWidth('20rem')
table.setColumn('dayMaxNum', '最大领取订单数量(每天)').setWidth('20rem')
table.setColumn('dangerNum', '危险订单量数量').setWidth('20rem')
table.setColumn('dangerTime', '危险订单时间范围(单位 小时)').setWidth('20rem')
table.setColumn('lastUpdateUser', '最后更新人').setWidth('20rem')
table.setColumn('createTime', '创建时间').setWidth('20rem')
table.setColumn('updateTime', '更新时间').setWidth('20rem')

// 数据加载
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

// 表格功能
tablebar.enableForzen()
tablebar.setTitle('操作')
tablebar.setWidth('300px')
tablebar.register('编辑')
    .enablePer('save')
    .setAttr({ icon: 'pi pi-pen-to-square' })
    .on((item) => {
        userDialog.setTitle('编辑级别').setFormData(item).show()
    })

tablebar.register('删除')
    .enablePer('delete')
    .setAttr({ type: 'danger', icon: 'pi pi-trash' })
    .on((item) => {
        message.confirm(`确定要删除[${item.name}]该级别吗？`, async () => {
            const res = await api.deleteById(item.configKey)
            if (res.code === 0) {
                message.success('删除成功')
                table.reload()
            }
            else message.error(res.message)
        })
    })

// 工具栏
toolbar.register('新增')
    .enablePer('save')
    .setAttr({ icon: 'pi pi-plus' })
    .on(() => {
        userDialog.setFormData({
            levelName: '',
            orderIndex: 0,
            unhandlerMaxNum: 0,
            dayMaxNum: 0,
            dangerNum: 0,
            dangerTime: 0
        }).show()
    })

const levelForm = form.register()
levelForm.setRow().setColumn('levelName', c => c.setLabel('名称').onRequire())
levelForm.setRow().setColumn('orderIndex', c => c.setLabel('排序')
    .setType(FormEnum.INPUT_NUMBER)
    .setAttr({ showButtons: true, buttonLayout: "horizontal" })
    .onRequire())
levelForm.setRow().setColumn('unhandlerMaxNum', c => c.setLabel('最大未处理订单数量(每天)')
    .setType(FormEnum.INPUT_NUMBER)
    .setAttr({ showButtons: true, buttonLayout: "horizontal" })
    .onRequire())
levelForm.setRow().setColumn('dayMaxNum', c => c.setLabel('最大领取订单数量(每天)')
    .setType(FormEnum.INPUT_NUMBER)
    .setAttr({ showButtons: true, buttonLayout: "horizontal" })
    .onRequire())
levelForm.setRow().setColumn('dangerNum', c => c.setLabel('危险订单量数量')
    .setType(FormEnum.INPUT_NUMBER)
    .setAttr({ showButtons: true, buttonLayout: "horizontal" })
    .onRequire())
levelForm.setRow().setColumn('dangerTime', c => c.setLabel('危险订单时间范围(单位 小时)')
    .setType(FormEnum.INPUT_NUMBER)
    .setAttr({ showButtons: true, buttonLayout: "horizontal" })
    .onRequire())

const userDialog = dialog.register('新增级别')
    .setAttr({ style: { width: '35rem' } })
    .setForm(levelForm)
    .setBtn(b => {
        b.setLabel('保存')
            .setIcon('pi pi-save')
            .on(async (dialogInstance, compRef) => {
                try {
                    // 调用暴露的方法 valid()
                    await compRef.valid()
                    const formData = compRef.formData
                    const res = await api.save(formData)
                    if (res.code === 0) {
                        message.success('保存成功')
                        dialogInstance.hide()
                        table.reload()
                    }
                    else message.error(res.message)
                } catch (e) {
                    console.log('表单校验未通过', e)
                }
            })
    })
</script>

<template>
    <PageRender />
</template>