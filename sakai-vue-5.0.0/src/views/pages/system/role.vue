<script setup>
import api from '@/api/system/role'
import { PageRender, useConfig } from '@layoutkit/prime-vue-layoutkit'
import { Tag } from 'primevue'
import RolePermission from './rolePermission.vue'

const { table, filter, toolbar, tablebar, dialog, key, form, message } = useConfig()

// 权限key
key.register('save', 'role:save')
key.register('delete', 'role:delete')
key.register('permission', 'role:permission')
key.register('permission.save', 'role:permission:save')

// 筛选
filter.register('name', '角色名称')

// 表格
table.setColumn('name', '角色名称').setWidth('20rem')
table.setColumn('isValid', '状态').setTemplate(item => {
    return {
        component: Tag,
        content: item.isValid === 1 ? '正常' : '禁用',
        props: {
            severity: item.isValid === 1 ? 'success' : 'danger'
        }
    }
})
table.setColumn('addTime', '创建时间')
table.setColumn('editTime', '更新时间')

// 数据加载
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
tablebar.setStyle({ width: '300px' })
tablebar.register('编辑')
    .enablePer('save')
    .setAttr({ icon: 'pi pi-pen-to-square' })
    .on((item) => {
        roleDialog.setTitle('编辑').setFormData(item).show()
    })
tablebar.register('权限设置')
    .enablePer('permission')
    .setAttr({ icon: 'pi pi-objects-column' })
    // .hide((item) => item)  // 需要一个字段来判断菜单的类型
    .on((item) => {
        dialog.register(`[${item.name}]角色权限设置`)
            .enableMaximizable()
            .setWidth('80rem')
            .setComponent(RolePermission, { id: item.id })
            .setBtn(b => {
                b.setLabel('保存')
                    .setIcon('pi pi-save')
                    .on(async (dialogInstance, compRef) => {
                        try {
                            const permissionIds = compRef.data
                            const res = await api.savePermission({ roleId: item.id, permissionIds })
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
            .show()
    })
tablebar.register('删除')
    .enablePer('delete')
    .setAttr({ type: 'danger', icon: 'pi pi-trash' })
    .on((item) => {
        message.confirm(`确定要删除[${item.name}]角色吗？`, async () => {
            const res = await api.deleteById(item.id)
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
    .on(async () => {
        roleDialog.setFormData({
            id: '',
            name: '',
            isValid: 1
        }).show()
    })

// 表单配置
const roleForm = form.register()
roleForm.setRow().setColumn('name', c => c.setLabel('角色名称').onRequire())
roleForm.setRow().setColumn('isValid', c => c.setLabel('状态').setOptions([{ label: '正常', value: 1 }, { label: '禁用', value: 0 }]).onRequire())

// dialog配置
const roleDialog = dialog.register('新增')
    .setAttr({ style: { width: '35rem' } })
    .setForm(roleForm)
    .setBtn(b => {
        b.setLabel('保存')
            .setIcon('pi pi-save')
            .on(async (dialogInstance, conpRef) => {
                try {
                    await conpRef.valid()
                    const formData = conpRef.formData
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