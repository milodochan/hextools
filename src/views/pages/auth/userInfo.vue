<script setup>
import { updateUser } from '@/api/auth'
import { useStore } from '@/stores'
import { LayoutForm, useForm, useMessage } from '@layoutkit/prime-vue-layoutkit'
import { ref } from 'vue'

const formRef = ref()
const store = useStore()
const form = useForm()
const message = useMessage()
const infoForm = form.register()
infoForm.setRow()
    .setColumn('nickName', c => c.setLabel('姓名').onRequire())
    .setColumn('mail', c => c.setLabel('邮箱').onRequire())
infoForm.setRow()
    .setColumn('mobile', c => c.setLabel('手机号').onRequire())
    .setColumn('qq', c => c.setLabel('企点').onRequire())
infoForm.setRow()
    .setColumn('subPhoneNo', c => c.setLabel('分机号').onRequire())

infoForm.setData(store.userInfo ?? {})

const save = async () => {
    await formRef.value.valid()
    const res = await updateUser(infoForm.data)
    if (res.code === 0) {
        message.success('保存成功')
        store.userInfo = infoForm.data
    }
    else message.error(res.message)
}
</script>

<template>
    <div class="flex items-center justify-center overflow-hidden">
        <div class="flex-col items-center justify-center min-w-[35vw]">
            <LayoutForm ref="formRef" :config="infoForm.config.value" :data="infoForm.data" />
            <Button label="保存" @click="save" class="mt-4" />
        </div>
    </div>
</template>