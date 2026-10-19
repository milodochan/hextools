<script setup>
import { getSecretKey, updateMailPassword, updatePassword } from '@/api/auth'
import { useStore } from '@/stores'
import utils from '@/utils'
import { FormEnum, useDialog, useForm, useLayout, useMessage } from '@layoutkit/prime-vue-layoutkit'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import LayoutConfig from './layout-config.vue'

const { toggleMenu, toggleDarkMode, isDarkTheme } = useLayout()
const store = useStore()
const router = useRouter()
const dialog = useDialog()
const form = useForm()
const message = useMessage()
const menu = ref()
const items = ref([
    {
        label: store.userName,
        items: [
            {
                label: '个人资料',
                icon: 'pi pi-id-card',
                command: () => {
                    router.push({
                        path: '/userinfo'
                    })
                }
            },
            {
                label: '修改登录密码',
                icon: 'pi pi-lock',
                command: () => {
                    passwordForm.setData({ oldPassword: '', newPassword: '', repeatPassword: '' })
                    dialog.register('修改登录密码')
                        .setAttr({ style: { width: '35rem' } })
                        .setForm(passwordForm, {})
                        .setBtn(b => {
                            b.setLabel('保存')
                                .setIcon('pi pi-save')
                                .on(async (dialogInstance, compRef) => {
                                    try {
                                        // 调用暴露的方法 valid()
                                        await compRef.valid()
                                        const formData = compRef.formData
                                        if (formData.newPassword !== formData.repeatPassword) {
                                            message.error('两次输入密码不一致！')
                                            return
                                        }

                                        let res = await getSecretKey(store.userInfo.loginName)
                                        if (res.code !== 0) {
                                            message.error(res.message)
                                            return
                                        }

                                        let data = {
                                            oldPassword: utils.encrypt(formData.oldPassword, res.data),
                                            newPassword: utils.encrypt(formData.newPassword, res.data),
                                            repeatPassword: utils.encrypt(formData.repeatPassword, res.data)
                                        }
                                        res = await updatePassword(data)
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
                }
            },
            {
                label: '修改邮箱密码',
                icon: 'pi pi-envelope',
                command: () => {
                    mailForm.setData({ mail: store.userInfo.mail, newPassword: '', repeatPassword: '' })
                    dialog.register('修改邮箱密码')
                        .setAttr({ style: { width: '35rem' } })
                        .setForm(mailForm)
                        .setBtn(b => {
                            b.setLabel('保存')
                                .setIcon('pi pi-save')
                                .on(async (dialogInstance, compRef) => {
                                    try {
                                        // 调用暴露的方法 valid()
                                        await compRef.valid()
                                        const formData = compRef.formData
                                        let res = await getSecretKey(store.userInfo.loginName)
                                        if (res.code !== 0) {
                                            message.error(res.message)
                                            return
                                        }

                                        let data = {
                                            newPassword: utils.encrypt(formData.newPassword, res.data),
                                            repeatPassword: utils.encrypt(formData.repeatPassword, res.data)
                                        }
                                        res = await updateMailPassword(data)
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
                }
            },
            {
                label: '退出系统',
                icon: 'pi pi-sign-out',
                command: () => store.resetState()
            }
        ]
    }
])

const toggle = (event) => {
    menu.value.toggle(event)
}

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
passwordForm.setRow().setColumn('oldPassword', c => c.setLabel('旧密码')
    .setType(FormEnum.PASSWORD)
    .setAttr({ toggleMask: true, feedback: false })
    .onRequire())
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


const mailForm = form.register()
mailForm.setRow().setColumn('mail', c => c.setLabel('邮箱')
    .setAttr({ disabled: true }))
mailForm.setRow().setColumn('newPassword', c => c.setLabel('密码')
    .setType(FormEnum.PASSWORD)
    .setAttr({ toggleMask: true, feedback: false })
    .onRequire())
mailForm.setRow().setColumn('repeatPassword', c => c.setLabel('重复密码').setPlaceholder('请再次输入密码')
    .setType(FormEnum.PASSWORD)
    .setAttr({ toggleMask: true, feedback: false })
    .setRule((schema, z, formData) => {
        return z.string()
            .refine(value => value === formData.newPassword, {
                message: '两次输入的密码不一致'
            })
    })
    .onRequire())

const openMessage = () => {
    router.push({
        path: '/notice'
    })
}

</script>

<template>
    <div class="layout-topbar">
        <div class="layout-topbar-logo-container">
            <button class="layout-menu-button layout-topbar-action" @click="toggleMenu">
                <i class="pi pi-bars"></i>
            </button>
            <router-link to="/" class="layout-topbar-logo">
                <!--logo-->
                <image />

                <span>企业基本信息审核系统</span>
            </router-link>
        </div>

        <div class="layout-topbar-actions">
            <div class="layout-config-menu">
                <button v-tooltip.bottom="'黑/白模式'" type="button" class="layout-topbar-action" @click="toggleDarkMode">
                    <i :class="['pi', { 'pi-moon': isDarkTheme, 'pi-sun': !isDarkTheme }]"></i>
                </button>
                <div class="relative">
                    <button
                        v-styleclass="{ selector: '@next', enterFromClass: 'hidden', enterActiveClass: 'animate-scalein', leaveToClass: 'hidden', leaveActiveClass: 'animate-fadeout', hideOnOutsideClick: true }"
                        v-tooltip.bottom="'主题'" type="button"
                        class="layout-topbar-action layout-topbar-action-highlight">
                        <i class="pi pi-palette"></i>
                    </button>
                    <LayoutConfig />
                </div>
            </div>

            <button class="layout-topbar-menu-button layout-topbar-action"
                v-styleclass="{ selector: '@next', enterFromClass: 'hidden', enterActiveClass: 'animate-scalein', leaveToClass: 'hidden', leaveActiveClass: 'animate-fadeout', hideOnOutsideClick: true }">
                <i class="pi pi-ellipsis-v"></i>
            </button>


            <!--右上角功能区-->
            <div class="layout-topbar-menu lg:block">
                <div class="layout-topbar-menu-content">
                    <!-- <button v-tooltip.bottom="'日历'" type="button" class="layout-topbar-action">
                        <i class="pi pi-calendar"></i>
                        <span>Calendar</span>
                    </button> -->
                    <button v-tooltip.bottom="'公告'" type="button" class="layout-topbar-action" @click="openMessage">
                        <i class="pi pi-inbox " :class="store.hasNotice ? 'text-red-500' : ''"></i>
                        <span>Messages</span>
                    </button>
                    <button v-tooltip.bottom="'个人信息'" type="button" class="layout-topbar-action" @click="toggle"
                        aria-haspopup="true" aria-controls="overlay_menu">
                        <i class="pi pi-user"></i>
                        <span>Profile</span>
                    </button>
                    <Menu ref="menu" id="overlay_menu" :model="items" :popup="true" />
                </div>
            </div>
        </div>
    </div>
</template>
