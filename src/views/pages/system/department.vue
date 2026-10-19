<script setup>
import api from '@/api/system/department'
import { FormEnum, PageRender, useConfig } from '@layoutkit/prime-vue-layoutkit'
import { Tag } from 'primevue'
import { ref } from 'vue'
import MenuAction from './menuAction.vue'

const treeNodes = ref([])
const origrinData = ref([])
const { table, toolbar, tablebar, dialog, key, form, message } = useConfig()

// 权限key
key.register('save', 'menu:save')
key.register('delete', 'menu:delete')
key.register('permission', 'menu:permission')

// 表格
table.disableDefaultCloumn()
table.setColumn('name', '部门名称').setAttr({ expander: true })
table.setColumn('caption', '部门介绍')
table.setColumn('status', '状态').setTemplate(item => {
    return {
        component: Tag,
        content: item.status === 1 ? '启用' : '禁用',
        props: {
            severity: item.status === 1 ? 'success' : 'danger'
        }
    }
})
table.setColumn('lastUpdateTime', '更新时间')
table.setColumn('lastUpdateUser', '更新人')

// 数据加载
table.setRowKey('id')
table.setParentKey('pid')
table.disablePagination()
table.enableTree()
table.registerLoader(async (page, params) => {
    const res = await api.getPage()
    if (res.code === 0) {
        origrinData.value = res.data
        const children = buildTreeNodesData(origrinData.value, '00000000-0000-0000-0000-000000000000')
        treeNodes.value = [{
            key: '00000000-0000-0000-0000-000000000000',
            label: '无',
            children: children
        }]
        return res.data.sort((a, b) => a.sort - b.sort)
    }
    else return []
})

// 表格功能
tablebar.setTitle('操作')
tablebar.setStyle({ width: '300px' })
// tablebar.enableLeftPosition()
tablebar.register('编辑')
    .enablePer('save')
    .setAttr({ icon: 'pi pi-pen-to-square' })
    .on((item) => {
        item.pid = item.pid.toLowerCase().trim()
        menuDialog.setTitle('编辑').setFormData(item).show()
    })
tablebar.register('菜单功能')
    .enablePer('permission')
    .setAttr({ icon: 'pi pi-objects-column' })
    .hide((item) => item.component)  // 需要一个字段来判断菜单的类型
    .on((item) => {
        dialog.register(`[${item.name}]菜单功能设置`)
            .setWidth('90rem')
            .setComponent(MenuAction, { id: item.id })
            .show()
    })
tablebar.register('删除')
    .enablePer('delete')
    .setAttr({ type: 'danger', icon: 'pi pi-trash' })
    .hide((item) => !origrinData.value.some(a => a.pid.toLowerCase() === item.id.toLowerCase()))
    .on((item) => {
        message.confirm(`确定要删除[${item.name}]菜单吗？`, async () => {
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
        menuDialog.setFormData({
            id: '',
            name: '',
            status: '',
            caption: '',
            pid: '00000000-0000-0000-0000-000000000000'
        }).show()
    })

// 表单配置
const departmentForm = form.register()
departmentForm.setRow()
    .setColumn('name', c => c.setLabel('部门名称').onRequire())
    .setColumn('status', c => c.setLabel('状态')
        .setOptions([{ label: '正常', value: 1 }, { label: '禁用', value: 0 }])
        .onRequire())
departmentForm.setRow()
    .setColumn('pid', c => c.setLabel('上级部门')
        .setOptions(treeNodes)
        .setType(FormEnum.TREE_SELECT)
        .onRequire())
departmentForm.setRow()
    .setColumn('caption', c => c.setLabel('部门介绍')
        .setType(FormEnum.INPUT_TEXTAREA)
        .onRequire())

// dialog配置
const menuDialog = dialog.register('新增')
    .setAttr({ style: { width: '45rem' } })
    .setForm(departmentForm)
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

const buildTreeNodesData = (data, pid) => {
    const outData = []
    const filterData = data.filter(item => item.pid.trim().toLowerCase() === pid.trim().toLowerCase())
    if (filterData.length > 0) {
        filterData.forEach(item => {
            item.pid = item.pid.toLowerCase()
            const children = buildTreeNodesData(data, item.id)
            const d = {
                key: item.id.toLowerCase(),
                label: item.name
            }
            if (children.length > 0) {
                d.children = children
            }
            outData.push(d)
        })
    }

    return outData
}
</script>

<template>
    <PageRender />
</template>