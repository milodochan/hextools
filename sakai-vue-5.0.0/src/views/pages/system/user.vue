<script setup>
import api from '@/api/system/user'
import { FormEnum, PageRender, useConfig } from '@layoutkit/prime-vue-layoutkit'
import { Tag } from 'primevue'
import { onMounted, ref } from 'vue'

const levelOptions = ref([])
const roleOptions = ref([])
const departmentOptions = ref([])
const { table, filter, toolbar, tablebar, dialog, key, form, message } = useConfig()

const validOptions = [{ label: '正常', value: 1 }, { label: '禁用', value: 0 }, { label: '锁定', value: 2 }]
const workStatusOptions = [{ label: '在岗', value: 1 }, { label: '不在岗', value: 2 }]

// 权限key
key.register('save', 'user:save')
key.register('unlock', 'user:unlock')
key.register('sendlink', 'user:sendlink')

// 筛选
filter.register('loginName', '登录名')
filter.register('nickName', '姓名')
filter.register('mobile', '手机号')
filter.register('departmentName', '部门名称')
filter.register('roleName', '角色名称')
filter.register('isValid', '锁定状态').setOptions(validOptions)
filter.register('workStatus', '在岗状态').setOptions(workStatusOptions)

// 表格
table.setColumn('loginName', '登录名称')
table.setColumn('checkStatus', '登录状态').setWidth('20rem')
    .setTemplate((item, temp) => {
        temp.setComponent(Tag)
            .setContent(item.checkStatus === 1 ? '已登录' : '未登录')
            .setProps({
                severity: item.checkStatus === 1 ? 'success' : 'warn'
            })
    })
table.setColumn('mobile', '手机号').setWidth('20rem')
table.setColumn('mail', '邮箱').setWidth('20rem')
table.setColumn('nickName', '姓名').setWidth('20rem')
table.setColumn('subPhoneNo', '分机号').setWidth('20rem')
table.setColumn('qq', '企点').setWidth('20rem')
table.setColumn('departments', '部门').setWidth('20rem').setTemplate(item => (item.departments ?? []).map(a => a.name).join(','))
table.setColumn('workStatus', '在岗状态')
    .setWidth('20rem')
    .setTemplate((item, temp) => {
        temp.setComponent(Tag)
            .setContent(item.workStatus === 1 ? '在岗' : '不在岗')
            .setProps({
                severity: item.workStatus === 1 ? 'success' : 'danger'
            })
    })
table.setColumn('isValid', '状态').setWidth('20rem')
    .setTemplate((item, temp) => {
        let content = '正常'
        let severity = 'success'
        if (item.isValid === 2) {
            content = '锁定'
            severity = 'warn'
        }
        if (item.isValid === 0) {
            content = '禁用'
            severity = 'danger'
        }
        temp.setComponent(Tag)
            .setContent(content)
            .setProps({
                severity: severity
            })
    })
table.setColumn('levelName', '级别').setWidth('20rem').setTemplate(item => item.levelName && item.levelName.length > 0 ? item.levelName : '无')
table.setColumn('roles', '角色').setWidth('20rem').setTemplate(item => (item.roles ?? []).map(a => a.name).join(','))
table.setColumn('registerTime', '注册日期').setWidth('20rem')
table.setColumn('lastLoginTime', '最后登录时间').setWidth('20rem')
table.setColumn('efficiencyCoefficient', '效能指标').setWidth('20rem')
table.setColumn('leaveTime', '离职时间').setWidth('20rem')
table.setColumn('joinTime', '进组时间').setWidth('20rem')

// 数据加载
table.enableLeftPosition()
table.setPageOptions([10, 15, 20])
table.registerLoader(async (page, params) => {
    if (params.isValid === undefined || params.isValid === '') params.isValid = -1
    if (params.workStatus === undefined || params.workStatus === '') params.workStatus = -1
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
        item.businessArr = item.businessTypes
            .split(',')
            .map(v => v.trim())
            .filter(v => v !== '')

        item.departmentId = (item.departments ?? []).map(a => a.id)[0].toLowerCase()
        item.roleIds = (item.roles ?? []).map(a => a.id)

        console.log(item)
        userDialog.setTitle('编辑用户').setFormData(item).show()
    })

// 工具栏
toolbar.register('新增')
    .enablePer('save')
    .setAttr({ icon: 'pi pi-plus' })
    .on(() => {
        userDialog.setFormData({
            id: '',
            loginName: '',
            nickName: '',
            mobile: '',
            mail: '',
            subPhoneNo: '',
            qq: '',
            departmentId: '',
            roleIds: [],
            isValid: 1,
            workStatus: 1,
            registerTime: '',
            leaveTime: '1970-01-01',
            joinTime: '1970-01-01',
            businessTypes: []
        }).show()
    })

toolbar.register('解锁')
    .enablePer('unlock')
    .enableSingle()
    .setAttr({ icon: 'pi pi-lock-open' })
    .on(async (items) => {
        const item = items[0]
        const res = await api.unLock(item.id)
        if (res.code === 0) {
            message.success('解锁成功')
            table.reload()
        }
        else message.error(res.message)
    })

toolbar.register('发送密码设置链接')
    .enablePer('sendlink')
    .enableMultiple()
    .setAttr({ icon: 'pi pi-external-link' })
    .on((items) => {
        message.confirm('你确定要发送密码设置链接到该用户邮箱吗？', async () => {
            let ids = items.map(a => a.id)
            const res = await api.sendLink(ids)
            if (res.code === 0) {
                message.success('发送成功')
            }
            else message.error(res.message)
        })
    })

const userForm = form.register()
userForm.setRow()
    .setColumn('loginName', c => c.setLabel('登录名').onRequire())
    .setColumn('nickName', c => c.setLabel('姓名').onRequire())
userForm.setRow()
    .setColumn('roleIds', c => c.setLabel('角色名称')
        .setOptions(roleOptions, FormEnum.MULTI_SELECT)
        .setAttr({ display: 'chip' })
        .onRequire())
    .setColumn('departmentId', c => c.setLabel('部门名称')
        .setOptions(departmentOptions, FormEnum.TREE_SELECT)
        .onRequire())
userForm.setRow()
    .setColumn('mobile', c => c.setLabel('手机号').onRequire())
    .setColumn('mail', c => c.setLabel('邮箱').onRequire())
userForm.setRow()
    .setColumn('businessArr', c => c.setLabel('审核业务类型')
        .setOptions([
            { label: '公众号审核业务', value: '*' },
            { label: '企业微信认证', value: '163' },
            { label: '小程序微信认证', value: '2' },
            { label: '个人认证业务', value: '38' }
        ])
        .setType(FormEnum.CHECKBOX)
        .onRequire())
userForm.setRow()
    .setColumn('levelId', c => c.setLabel('级别').setOptions(levelOptions).onRequire())
    .setColumn('registerTime', c => c.setLabel('入职时间')
        .setType(FormEnum.DATE_PICKER)
        .setAttr({ showTime: false })
        .onRequire())
userForm.setRow()
    .setColumn('leaveTime', c => c.setLabel('离职时间')
        .setType(FormEnum.DATE_PICKER).setAttr({ showTime: false })
        .onRequire())
    .setColumn('joinTime', c => c.setLabel('正式进组时间')
        .setType(FormEnum.DATE_PICKER).setAttr({ showTime: false })
        .onRequire())
userForm.setRow()
    .setColumn('workStatus', c => c.setLabel('在岗状态')
        .setOptions(workStatusOptions)
        .onRequire())
    .setColumn('isValid', c => c.setLabel('状态')
        .setOptions(validOptions)
        .onRequire())
userForm.setRow()
    .setColumn('subPhoneNo', c => c.setLabel('分机号'))
    .setColumn('qq', c => c.setLabel('企点'))


function toDateTime1(value) {
    if (!value) return null

    // 已经是完整时间
    if (value.includes('T')) return value

    // 只有日期：补 00:00:00
    return value
}

function toDateTime(val) {
    if (!val) return null

    // Date 对象
    if (val instanceof Date) {
        return val.toISOString().slice(0, 19)
    }

    // 字符串日期
    if (typeof val === 'string' && val.length === 10) {
        return val + 'T00:00:00'
    }

    return val
}

const userDialog = dialog.register('新增用户')
    .setAttr({ style: { width: '55rem' } })
    .setForm(userForm)
    .setBtn(b => {
        b.setLabel('保存')
            .setIcon('pi pi-save')
            .on(async (dialogInstance, compRef) => {
                try {
                    // 调用暴露的方法 valid()
                    await compRef.valid()
                    const formData = compRef.formData
                    formData.businessTypes = `,${formData.businessArr.join(',')},`
                    formData.registerTime = toDateTime(formData.registerTime)
                    formData.leaveTime = toDateTime(formData.leaveTime)
                    formData.joinTime = toDateTime(formData.joinTime)
                    console.log(formData)
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
                label: item.name,
                icon: item.icon
            }
            if (children.length > 0) {
                d.children = children
            }
            outData.push(d)
        })
    }

    return outData
}

onMounted(async () => {
    let res = await api.getAllLevel()
    if (res.code === 0) {
        let levelArr = res.data.sort((a, b) => a.levelName - b.levelName)
            .map(a => ({ label: a.levelName, value: a.id }))
        levelOptions.value = [
            { label: '无', value: '00000000-0000-0000-0000-000000000000' },
            ...levelArr
        ]
    }

    res = await api.getAllDepartment()
    if (res.code === 0) {
        const children = buildTreeNodesData(res.data, '00000000-0000-0000-0000-000000000000')
        departmentOptions.value = children
    }

    res = await api.getAllRole()
    if (res.code === 0) {
        roleOptions.value = res.data
            .sort((a, b) => a.name.localeCompare(b.name))
            .map(a => ({ label: a.name, value: a.id }))
    }
})
</script>

<template>
    <PageRender />
</template>