<script setup>
import api from '@/api/auth'
import { useStore } from '@/stores'
import utils from '@/utils'
import { useMessage } from '@layoutkit/prime-vue-layoutkit'
import Button from 'primevue/button'
import InputGroup from 'primevue/inputgroup'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const message = useMessage()
const store = useStore()
const route = useRoute()
const router = useRouter()
const label = ref('登录')
const validCodeLabel = ref('获取验证码')
const disableValidCode = ref(false)
const data = ref({
    loginName: '',
    password: '',
    validCode: ''
})

const getValidCode = async () => {
    if (!data.value.loginName) {
        message.error('请输入用户名')
        return
    }
    disableValidCode.value = true
    validCodeLabel.value = '获取中...'
    const res = await api.getValidCode(data.value.loginName)
    if (res.code === 0) {
        let countdown = 60 // res.data
        let interval = setInterval(() => {
            validCodeLabel.value = `重新获取(${countdown}s)`
            countdown -= 1
            if (countdown < 0) {
                clearInterval(interval)
                validCodeLabel.value = '获取验证码'
                disableValidCode.value = false
            }
        }, 1000)
        message.success('验证码已发送，请注意查收')
    }
    else {
        validCodeLabel.value = '获取验证码'
        disableValidCode.value = false
        message.error(res.message)
    }
}

const submit = async () => {
    const fields = ['loginName', 'password', 'validCode']
    if (fields.some(field => data.value[field].trim() === '')) {
        message.error('请完整填写登录信息')
        return
    }

    label.value = '登录中...'
    try {
        // 获取密钥
        const res = await api.getSecretKey(data.value.loginName)
        if (res.code !== 0) {
            message.error(res.message)
            return // 失败就直接返回
        }

        // 登录
        const loginData = {
            loginName: data.value.loginName,
            password: utils.encrypt(data.value.password, res.data),
            validCode: data.value.validCode
        }
        const loginRes = await store.login(loginData)
        if (loginRes.code !== 0) {
            message.error(loginRes.message)
            return // 失败就直接返回
        }

        label.value = '登录成功，正在跳转中...'
        let interval = setInterval(() => {
            if (store.isLoggedIn && store.menus.length > 0) {
                clearInterval(interval)
                const redirect = route.query.redirect || '/'
                router.push(redirect)
                // router.push({
                //     path: '/notice'
                // })
            }
        }, 500)

        // 拉取权限菜单
        const perRes = await store.getPermission()
        if (!perRes.data.menus || perRes.data.menus.length === 0) {
            message.error('账号菜单加载失败，请联系管理员')
            return
        }

        await store.generateRoutes(router)
        console.log('load menu completed..')
    } catch (err) {
        console.error(err)
        message.error('登录异常，请重试')
    } finally {
        setTimeout(() => {
            label.value = '登录'
        }, 2000)
    }
}

const onKeyUp = (e) => {
    if (e.key !== 'Enter') return
    submit()
}

onMounted(() => globalThis.addEventListener('keyup', onKeyUp))
onBeforeUnmount(() => globalThis.removeEventListener('keyup', onKeyUp))
</script>

<template>
    <div
        class="bg-surface-50 dark:bg-surface-950 flex items-center justify-center min-h-screen min-w-[100vw] overflow-hidden">
        <div class="flex flex-col items-center justify-center">
            <div class="w-full bg-gray-200 dark:bg-gray-800 py-20 px-8 sm:px-20"
                style="border-radius: 20px; width: 120%;">
                <div class="text-center mb-8">
                    <div class="text-surface-900 dark:text-surface-0 text-3xl font-medium mb-4">企业基本信息审核系统</div>
                    <span class="text-muted-color font-medium">欢迎使用</span>
                </div>
                <div class="flex flex-col gap-4">
                    <InputText id="account" type="text" placeholder="用户名" class="w-full md:w-[30rem]"
                        v-model="data.loginName" />
                    <Password id="password" v-model="data.password" placeholder="密码" :toggleMask="true"
                        class="w-full md:w-[30rem]" fluid :feedback="false" />
                    <InputGroup class="w-full md:w-[30rem]">
                        <InputText id="code" type="text" placeholder="验证码" class=" md:w-[30rem]" autocomplete="off"
                            v-model="data.validCode" />
                        <Button class="text-right" :label="validCodeLabel" :disabled="disableValidCode"
                            style="width: 8rem" @click="getValidCode" />
                    </InputGroup>
                    <Button :label="label" class="w-full" v-on:click="submit"></Button>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.pi-eye {
    transform: scale(1.6);
    margin-right: 1rem;
}

.pi-eye-slash {
    transform: scale(1.6);
    margin-right: 1rem;
}
</style>
