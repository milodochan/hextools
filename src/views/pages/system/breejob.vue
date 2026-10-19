<script setup>
import api from '@/api/system/breejob'
import { DialogContentSlot, FormEnum, PageRender, useConfig } from '@layoutkit/prime-vue-layoutkit'
import { ref } from 'vue'

const { table, filter, toolbar, tablebar, dialog, key, form, message } = useConfig()
const accept = '.js'
const statusOptions = [{ label: '执行中', value: true }, { label: '已停止', value: false }]
const resultStatusOptions = [{ label: '异常', value: true }, { label: '正常', value: false }]
const uploadPath = ref('')
const totalSizePercent = ref(0)

// 权限key
key.register('save', 'breejob:save')
key.register('delete', 'breejob:delete')
key.register('errmsg', 'breejob:errmsg')
key.register('result', 'breejob:result')
key.register('run', 'breejob:run')
key.register('reset', 'breejob:reset')
key.register('start', 'breejob:start')
key.register('stop', 'breejob:stop')
key.register('upload', 'breejob:upload')

// 筛选
filter.register('title', '任务标题')
filter.register('name', 'job名称')
filter.register('status', '任务状态').setOptions(statusOptions)
filter.register('resultStatus', '执行状态').setOptions(resultStatusOptions)

// 表格
table.setColumn('title', '任务标题').setContentLength(30).setWidth('20rem')
table.setColumn('status', '运行状态').setTag({ true: '运行中', false: '已停止' }, { true: 'success', false: 'danger' })
table.setColumn('resultStatus', '执行状态').setTag({ true: '异常', false: '正常' }, { true: 'danger', false: 'success' })
table.setColumn('createStatus', 'Bree任务状态').setTag({ true: '正常', false: '待同步' }, { true: 'success', false: 'danger' })
table.setColumn('name', 'job名称')
table.setColumn('cron', 'cron表达式')
table.setColumn('remark', '备注').setContentLength(20).setWidth('20rem')
table.setColumn('path', 'job文件路径').setContentLength(40).setWidth('20rem')
table.setColumn('createTime', '创建时间')
table.setColumn('updateTime', '更新时间')

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
tablebar.setStyle({ width: '350px' })
tablebar.register('重置')
    .enablePer('reset')
    .setAttr({ icon: 'pi pi-refresh' })
    .hide(item => !item.createStatus)
    .on(async (item) => {
        const res = await api.reset(item.id)
        if (res.code === 0) {
            message.success('重置成功')
            table.reload()
        }
        else message.error(res.message)
    })
tablebar.register('编辑')
    .enablePer('save')
    .setAttr({ icon: 'pi pi-pen-to-square' })
    .on((item) => {
        jobDialog.setTitle('编辑')
            .setForm(editForm)
            .setFormData(item)
            .show()
    })
tablebar.register('错误信息')
    .enablePer('errmsg')
    .setAttr({ type: 'warn', icon: 'pi pi-eye' })
    .hide(item => item.resultStatus)
    .on((item) => {
        dialog.register(`[${item.title}]错误日志`)
            .setAttr({ style: { width: '45%' } })
            .setComponent('info', { message: item.errorMessage })
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
tablebar.register('执行结果')
    .enablePer('result')
    .setAttr({ type: 'info', icon: 'pi pi-eye' })
    .hide(item => item.executeResult?.length > 0)
    .on((item) => {
        dialog.register(`[${item.title}]执行结果信息`)
            .setAttr({ style: { width: '45%' } })
            .setComponent('info', { message: item.executeResult })
            .show()
    })

// 工具栏
toolbar.register('新增')
    .enablePer('save')
    .setAttr({ icon: 'pi pi-plus' })
    .on(async () => {
        jobDialog.setForm(jobForm)
            .setFormData({
                id: '',
                name: '',
                isValid: 1
            }).show()
    })

toolbar.register('启动')
    .enablePer('start')
    .enableSingle()
    .setAttr({ icon: 'pi pi-play-circle' })
    .on(async (items) => {
        const item = items[0]
        const res = await api.start(item.id)
        if (res.code === 0) {
            message.success('启动成功')
            table.reload()
        }
        else message.error(res.message)
    })

toolbar.register('停止')
    .enablePer('stop')
    .enableSingle()
    .setAttr({ icon: 'pi pi-stop-circle' })
    .on(async (items) => {
        const item = items[0]
        const res = await api.stop(item.id)
        if (res.code === 0) {
            message.success('停止成功')
            table.reload()
        }
        else message.error(res.message)
    })

toolbar.register('执行一次')
    .enablePer('run')
    .enableSingle()
    .setAttr({ icon: 'pi pi-minus-circle' })
    .on(async (items) => {
        const item = items[0]
        const res = await api.run(item.id)
        if (res.code === 0) message.success('执行成功')
        else message.error(res.message)
    })

toolbar.register('job文件上传')
    .enablePer('upload')
    .enableSingle()
    .setAttr({ icon: 'pi pi-upload' })
    .on(async (items) => {
        uploadPath.value = ''
        totalSizePercent.value = 0
        const item = items[0]
        dialog.register(`job[${item.name}]文件上传`)
            .setAttr({ style: { width: '35%' } })
            .setComponent('upload')
            .setBtn(b => {
                b.setLabel('保存')
                    .setIcon('pi pi-save')
                    .on(async (dialogInstance, conpRef) => {
                        try {
                            if (uploadPath.value.length === 0) {
                                message.warning('未上传任何文件')
                                return
                            }

                            item.path = uploadPath.value
                            const res = await api.save(item)
                            if (res.code === 0) {
                                message.success('保存成功')
                                dialogInstance.hide()
                                table.reload()
                            }
                            else message.error(res.message)
                        } catch (e) {
                            console.log(e)
                        }
                    })
            })
            .show()
    })

// 表单配置
const jobForm = form.register()
jobForm.setRow().setColumn('name', c => c.setLabel('job名称').onRequire())
jobForm.setRow().setColumn('title', c => c.setLabel('任务名称').onRequire())
jobForm.setRow().setColumn('cron', c => c.setLabel('cron表达式').onRequire())
jobForm.setRow().setColumn('path', c => c.setLabel('job文件路径').setType(FormEnum.INPUT_TEXTAREA).setAttr({ rows: 3 }))
jobForm.setRow().setColumn('requestData', c => c.setLabel('执行参数(Json)').setType(FormEnum.INPUT_TEXTAREA).setAttr({ rows: 3 }))
jobForm.setRow().setColumn('remark', c => c.setLabel('备注').setType(FormEnum.INPUT_TEXTAREA).setAttr({ rows: 3 }))

const editForm = jobForm.clone()
editForm.updateAttr('name', {
    require: false,
    props: {
        disabled: true
    }
})

// dialog配置
const jobDialog = dialog.register('新增')
    .setAttr({ style: { width: '35rem' } })
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


// 选中文件时（可选）
const onSelect = (e) => {
    console.log('文件已选择：', e.files)

    // 或者你可以用 toast 警告用户只支持单文件
    if (e.files.length > 1) {
        e.files.splice(1) // 移除第二个及之后的文件
        message.warning('仅支持上传一个文件，已自动保留第一个文件')
    }
}

// 上传逻辑（调用你的后端接口）
const onUpload = async (event, emit) => {
    const file = event.files[0]
    if (!validateFileType(file)) {
        message.error(`文件类型不支持: ${file.name}`)
        return
    }

    const res = await api.upload(file, (percent) => {
        totalSizePercent.value = percent
    })
    if (res.code === 0) {
        uploadPath.value = res.data.absolutePath
        message.success('上传文件成功')
    }
    else {
        message.error('上传文件失败:' + res.message)
    }
}

// 粘贴上传（Ctrl + V 截图）
const onPaste = async (e) => {
    const items = e.clipboardData?.items
    if (!items) return

    for (const item of items) {
        if (item.kind === 'file') {
            const file = item.getAsFile()
            if (!validateFileType(file)) {
                message.error(`文件类型不支持: ${file.name}`)
                return
            }

            if (file) {
                totalSizePercent.value = 0.7
                const res = await api.upload(file, (percent) => {
                    totalSizePercent.value = percent
                })
                if (res.code === 0) {
                    // ✅ 获取文件信息
                    uploadPath.value = res.data.absolutePath
                    message.success('上传文件成功')
                }
                else {
                    message.error('上传文件失败:' + res.message)
                }
            }
        }
    }
}

// 验证扩展名
function validateFileType(file) {
    const fileName = file.name.toLowerCase()
    const acceptedTypes = accept.split(',').map(type => type.trim().toLowerCase())
    // 从 accept 列表中找出匹配的扩展名
    return acceptedTypes.some(ext => {
        // ext 形如 ".jpg" ，判断文件名是否以 ext 结尾
        return fileName.endsWith(ext)
    })
}
</script>

<template>
    <PageRender />
    <DialogContentSlot name="info">
        <template #default="{ data }">
            <div class="p-6 md:p-10 ">
                <div class="prose prose-gray max-w-none text-gray-700 leading-8" v-html="data.message"></div>
            </div>
        </template>
    </DialogContentSlot>
    <DialogContentSlot name="upload">
        <div @paste="(e) => onPaste(e)" class="paste">
            <FileUpload name="file" mode="advanced" :multiple="false" :customUpload="true" :accept="accept"
                :maxFileSize="1000000" @select="onSelect" @uploader="(e) => onUpload(e, emit)">
                <template #header="{ chooseCallback, uploadCallback, clearCallback, files }">
                    <div class="flex flex-col gap-2 w-full">
                        <div class="flex justify-start gap-2 w-full">
                            <Button @click="chooseCallback()" :fluid="false" icon="pi pi-plus" label="选择文件" outlined
                                severity="info" />
                            <Button @click="uploadCallback()" :fluid="false" icon="pi pi-cloud-upload" label="上传"
                                outlined severity="success" :disabled="!files || files.length === 0" />
                            <Button @click="() => { clearCallback(); totalSizePercent = 0; }" :fluid="false"
                                icon="pi pi-times" label="清除" outlined severity="danger"
                                :disabled="!files || files.length === 0" />
                        </div>
                        <ProgressBar :value="totalSizePercent" :showValue="true" class="w-full" />
                    </div>
                </template>
                <template #empty>
                    <div class="flex items-center justify-center flex-col">
                        <i class="pi pi-cloud-upload !border-2 !rounded-full !p-3 !text-4xl !text-muted-color" />
                        <span class="mt-6 mb-0">您可以尝试文件拖拽；使用QQ截屏工具，然后【点击】此区域后粘贴（Ctrl+V）</span>
                    </div>
                </template>
            </FileUpload>
        </div>
    </DialogContentSlot>
</template>