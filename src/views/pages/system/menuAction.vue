<script setup>
import api from '@/api/system/menu'
import { FormEnum, PageRender, useConfig } from '@layoutkit/prime-vue-layoutkit'
import Tag from 'primevue/tag'

const props = defineProps({
    id: String
})

const { table, toolbar, tablebar, dialog, key, form, message } = useConfig()

// 权限key
key.register('save', 'menu:permission:save')
key.register('batchinsert', 'menu:permission:batchinsert')
key.register('delete', 'menu:permission:delete')

// 表格
table.setRowKey('code')
table.setColumn('sort', '排序编号')
table.setColumn('name', '名称')
table.setColumn('code', '权限code')
table.setColumn('tagType', '权限类型').setTemplate((item) => ({
    component: Tag,
    content: item.tagType === 1 ? '菜单权限' : '功能权限',
    props: {
        severity: item.tagType === 1 ? 'success' : 'info'
    }
}))
table.setColumn('description', '描述').setTemplate((item) => {
    if (item.description && item.description.length > 100) {
        return item?.description.substring(0, 100) + '...'
    } else {
        return item.description || ''
    }
})

table.registerLoader(async (page, params) => {
    params.menuId = props.id
    const pageData = {
        pageIndex: page.index,
        pageSize: page.size,
        data: params
    }
    const res = await api.getPermissionPage(pageData)
    return res.code === 0 ? res.data : []
})

// 表格功能
tablebar.setTitle('操作')
tablebar.setStyle({ width: '200px' })
tablebar.register('编辑')
    .enablePer('save')
    .setAttr({ icon: 'pi pi-pen-to-square' })
    .on((item) => {
        actionDialog.setTitle('编辑').setFormData(item).show()
    })
tablebar.register('删除')
    .enablePer('delete')
    .setAttr({ type: 'danger', icon: 'pi pi-trash' })
    .on((item) => {
        message.confirm('要删除选中的数据吗?', () => {
            api.deletePermissionById(item).then(res => {
                if (res.code === 0) {
                    message.info(res.message)
                    table.reload()
                }
                else message.error(res.message)
            })
        })
    })

// 工具栏
toolbar.register('新增')
    .enablePer('save')
    .setAttr({ icon: 'pi pi-plus' })
    .on(async () => {
        actionDialog.setFormData({
            id: '',
            code: '',
            name: '',
            tagType: '',
            menuId: '',
            sort: 0,
            description: ''
        }).show()
    })
toolbar.register('快捷新增')
    .enablePer('batchinsert')
    .setAttr({ icon: 'pi pi-plus' })
    .on(async () => {
        dialog.register('快捷新增')
            .setAttr({ style: { width: '35rem' } })
            .setForm(batchForm)
            .setBtn(b => {
                b.setLabel('保存')
                    .setIcon('pi pi-save')
                    .on(async (dialogInstance, compRef) => {
                        try {
                            // 调用暴露的方法 valid()
                            await compRef.valid()
                            const formData = compRef.formData
                            formData.menuId = props.id

                            let batchArr = [{
                                id: '',
                                code: `${formData.code}:view`,
                                name: '查询',
                                tagType: 1,
                                menuId: props.id,
                                sort: 1,
                                description: '查询'
                            }, {
                                id: '',
                                code: `${formData.code}:save`,
                                name: '保存',
                                tagType: 0,
                                menuId: props.id,
                                sort: 2,
                                description: '保存'
                            }, {
                                id: '',
                                code: `${formData.code}:delete`,
                                name: '删除',
                                tagType: 0,
                                menuId: props.id,
                                sort: 3,
                                description: '删除'
                            }]
                            let success = true
                            for (const item of batchArr) {
                                const res = await api.savePermission(item)

                                if (res.code !== 0) {
                                    success = false
                                    message.error(res.message)
                                    break
                                }
                            }

                            if (success) {
                                message.success('保存成功')
                                dialogInstance.hide()
                                table.reload()
                            }

                        } catch (e) {
                            console.log('表单校验未通过', e)
                        }
                    })
            }).show()
    })

// 快捷新增表单
const batchForm = form.register()
batchForm.setRow().setColumn('code', c => c.setLabel('权限code前缀').onRequire())

// 表单配置
const actionForm = form.register()
actionForm.setRow()
    .setColumn('code', c => c.setLabel('权限code').onRequire())
    .setColumn('name', c => c.setLabel('名称').onRequire())
actionForm.setRow()
    .setColumn('tagType', c => c.setLabel('权限类型')
        .setOptions([
            { label: '功能权限', value: 0 },
            { label: '菜单权限', value: 1 }
        ])
        .onRequire()
    )
    .setColumn('sort', c => c.setLabel('排序编号')
        .setType(FormEnum.INPUT_NUMBER)
        .setAttr({ showButtons: true, buttonLayout: "horizontal" })
        .onRequire())
actionForm.setRow()
    .setColumn('description', c => c.setLabel('描述').setType(FormEnum.INPUT_TEXTAREA))


// dialog配置
const actionDialog = dialog.register('新增')
    .setAttr({ style: { width: '45rem' } })
    .setForm(actionForm)
    .setBtn(b => {
        b.setLabel('保存')
            .setIcon('pi pi-save')
            .on(async (dialogInstance, compRef) => {
                try {
                    // 调用暴露的方法 valid()
                    await compRef.valid()
                    const formData = compRef.formData
                    formData.menuId = props.id
                    const res = await api.savePermission(formData)
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