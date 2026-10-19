<script setup>
import api from '@/api/other/tools'
import utils from '@/utils/index'
import { FilterOperatorEnum, PageRender, useConfig } from '@layoutkit/prime-vue-layoutkit'
import { onMounted, ref } from 'vue'

const { table, filter, toolbar, tablebar, dialog, key, form, message } = useConfig()
const areaInfoOptions = ref([])
const typeOptions = [
    { label: '主体信息查询', value: 1 },
    { label: '证书资质查询', value: 2 },
    { label: '商标/产权查询', value: 3 },
    { label: '人资档案查询', value: 4 },
    { label: '其他', value: 5 }
]

// 权限key
key.register('save', 'tools:save')
key.register('delete', 'tools:delete')

// 筛选
filter.register('kitName', '名称').setOperator(FilterOperatorEnum.LIKE)
filter.register('kitName', '名称分类').setOptions([
    { label: '纳税人', value: '税' },
    { label: 'ICP备案', value: 'ICP' },
    { label: '机构认证', value: '机构认证' },
    { label: '操作手册', value: '操作手册' }
]).setOperator(FilterOperatorEnum.LIKE)
filter.register('typeId', '工具分类').setOptions(typeOptions)
filter.register('areaCode', '省份').setOptions(areaInfoOptions)
filter.registerBuildDataFunc((items) => utils.filterDataBuild(items))

// 表格
table.setColumn('areaName', '所属省份').setWidth('10rem')
table.setColumn('typeName', '分类').setWidth('10rem')
table.setColumn('kitName', '名称')

table.enableLeftPosition()
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


// 表格功能
tablebar.setTitle('操作')
tablebar.setWidth('200px')
tablebar.register('编辑')
    .enablePer('save')
    .setAttr({ icon: 'pi pi-pen-to-square' })
    .on((item) => {
        configDialog.setTitle('编辑工具').setFormData(item).show()
    })

tablebar.register('删除')
    .enablePer('delete')
    .setAttr({ type: 'danger', icon: 'pi pi-trash' })
    .on((item) => {
        message.confirm(`确定要删除[${item.kitName}]该工具吗？`, async () => {
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
    .on(() => {
        configDialog.setFormData({
            areaName: '',
            areaCode: '',
            kitName: '',
            typeId: 1
        }).show()
    })

const configForm = form.register()
configForm.setRow()
    .setColumn('typeId', c => c.setLabel('类型')
        .setOptions(typeOptions)
        .onRequire())
configForm.setRow()
    .setColumn('areaCode', c => c.setLabel('省份')
        .setOptions(areaInfoOptions)
        .onRequire())
configForm.setRow()
    .setColumn('kitName', c => c.setLabel('名称').onRequire())
configForm.setRow()
    .setColumn('url', c => c.setLabel('链接地址').onRequire())

const configDialog = dialog.register('新增工具')
    .setAttr({ style: { width: '40rem' } })
    .setForm(configForm)
    .setBtn(b => {
        b.setLabel('保存')
            .setIcon('pi pi-save')
            .on(async (dialogInstance, compRef) => {
                try {
                    // 调用暴露的方法 valid()
                    await compRef.valid()
                    const formData = compRef.formData
                    let area = areaInfoOptions.value.find(a => a.value === formData.areaCode)
                    if (area) formData.areaName = area.label

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

onMounted(async () => {
    let res = await api.getAreaInfos()
    if (res.code === 0) {
        areaInfoOptions.value = res.data.sort((a, b) => a.areaCode - b.areaCode)
            .map(a => ({ label: a.areaName, value: a.areaCode }))
    }
})
</script>

<template>
    <PageRender />
</template>