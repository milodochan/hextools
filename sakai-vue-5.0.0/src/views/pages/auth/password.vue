<script setup>
import { getSecretKey, resetPassword } from '@/api/auth'
import utils from '@/utils'
import { FormEnum, LayoutForm, useForm, useMessage } from '@layoutkit/prime-vue-layoutkit'
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const formRef = ref()
const route = useRoute()
const router = useRouter()
const form = useForm()
const message = useMessage()

const passwordRule = (z) => {
    return z.string()
        .min(8, { message: '密码长度不能少于8位' })
        .max(15, { message: '密码长度不能超过15位' })
        .refine((value) => /[a-z]/.test(value), {
            message: '密码必须包含小写字母'
        })
        .refine((value) => /[A-Z]/.test(value), {
            message: '密码必须包含大写字母'
        })
        .refine((value) => /\d/.test(value), {
            message: '密码必须包含数字'
        })
}

const passwordForm = form.register()
passwordForm.setData({ key: route.query.key, newPassword: '', repeatPassword: '' })
passwordForm.setRow().setColumn('newPassword', c => c.setLabel('新密码')
    .setType(FormEnum.PASSWORD)
    .setAttr({ toggleMask: true })
    .setRule((schema, z) => passwordRule(z))
    .onRequire())
passwordForm.setRow().setColumn('repeatPassword', c => c.setLabel('重复密码').setPlaceholder('请再次输入新密码')
    .setType(FormEnum.PASSWORD)
    .setAttr({ toggleMask: true })
    .setRule((schema, z, formData) => {
        return passwordRule(z)
            .refine(value => value === formData.newPassword, {
                message: '两次输入的密码不一致'
            })
    })
    .onRequire())

const save = async () => {
    await formRef.value.valid()
    let res = await getSecretKey(passwordForm.data.key)
    if (res.code !== 0) {
        message.error(res.message)
        return
    }

    let data = {
        key: passwordForm.data.key,
        newPassword: utils.encrypt(passwordForm.data.newPassword, res.data),
        repeatPassword: utils.encrypt(passwordForm.data.repeatPassword, res.data)
    }
    res = await resetPassword(data)
    if (res.code === 0) {
        message.success('保存成功')
        router.push('/auth/login')
    }
    else message.error(res.message)
}
</script>

<template>
    <div class="flex items-center justify-center min-h-screen overflow-hidden">
        <div class="flex-col items-center justify-center min-w-[20vw]">
            <LayoutForm ref="formRef" :config="passwordForm.config.value" :data="passwordForm.data" />
            <Button label="保存" @click="save" class="mt-4 w-full" />
        </div>
    </div>
</template>