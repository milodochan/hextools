<script setup>
import api from '@/api/system/config'
import { FormItemSlot, PageRender, useConfig } from '@layoutkit/prime-vue-layoutkit'

const { table, filter, toolbar, tablebar, dialog, key, form, message } = useConfig()

// 权限key
key.register('save', 'config:save')
key.register('delete', 'config:delete')

// 筛选
filter.register('name', '配置名称')

// 表格
table.setColumn('styleName', '配置类型').setWidth('10rem')
table.setColumn('name', '配置名称').setWidth('10rem')
table.setColumn('configKey', '配置类型')

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
tablebar.setTitle('操作')
tablebar.setWidth('300px')
tablebar.register('编辑')
    .enablePer('save')
    .setAttr({ icon: 'pi pi-pen-to-square' })
    .on((item) => {
        configDialog.setTitle('编辑配置')
            .setForm(editConfigForm)
            .setFormData(item)
            .show()
    })

tablebar.register('删除')
    .enablePer('delete')
    .setAttr({ type: 'danger', icon: 'pi pi-trash' })
    .on((item) => {
        message.confirm(`确定要删除[${item.name}]该配置吗？`, async () => {
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
        configDialog.setForm(configForm)
            .setFormData({
                configKey: '',
                configValue: '',
                name: '',
                style: ''
            }).show()
    })

const configForm = form.register()
configForm.setRow()
    .setColumn('configKey', c => c.setLabel('配置编码').onRequire())
configForm.setRow()
    .setColumn('name', c => c.setLabel('配置名称').onRequire())
configForm.setRow()
    .setColumn('style', c => c.setLabel('配置类型')
        .setOptions([
            { label: '邮箱', value: 'EMAIL' },
            { label: '短信', value: 'SMS' },
            { label: '其他', value: 'OTHER' }])
        .onRequire())
configForm.setRow()
    .setColumn('configValue', c => c.setLabel('配置名内容').setComponent('configValue').onRequire())

const editConfigForm = configForm.clone()
editConfigForm.updateAttr('configKey', {
    require: false,
    props: {
        disabled: true
    }
})

const configDialog = dialog.register('新增配置')
    .setAttr({ style: { width: '55rem' } })
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
    <FormItemSlot name="configValue">
        <template #default="{ data, props, emit }">
            <Editor v-model="data.configValue" editorStyle="height: 320px" />
        </template>
    </FormItemSlot>
</template>