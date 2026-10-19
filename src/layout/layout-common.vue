<script setup>
import api from '@/api/system/notice'
import dialpad from '@/components/system/dialpad.vue'
import messages from '@/components/system/messages.vue'
import { useStore } from '@/stores'
import { DialogContentSlot, store as storePer, useDialog, useMessage } from '@layoutkit/prime-vue-layoutkit'
import { nextTick, onMounted, ref } from 'vue'

let noticeList = []
let timeInterval = null
let showItemId = ''
const readTime = ref(0)
const store = useStore()
const dialog = useDialog()
const message = useMessage()

const noticeDialog = dialog.register('查看')
    .disableCancel()
    .setAttr({ style: { width: '50%' }, closable: false, closeOnEscape: false })
    .setBtn(b => {
        b.setLabel('关闭').setType('secondary')
            .on(async (dialogInstance, compRef) => {
                if (readTime.value > 0) {
                    message.warning(`阅读时间未到，还需阅读${readTime.value}秒`)
                    return
                }

                dialogInstance.hide()
                const res = await api.saveReadLog(showItemId)
                if (res.code === 0) loopCheckNotice()
                else console.log(res.message)
            })
    })

const checkNotice = async () => {
    try {
        const res = await api.noticeStatus()
        if (res.code !== 0) {
            console.log(res.message)
            return
        }

        store.hasNotice = res.data.status
        noticeList = [...res.data.items]
        if (noticeList.length > 0) {
            loopCheckNotice()
        }
    } catch (err) {
        console.error('公告通知异常', err)
    }
}

const loopCheckNotice = () => {
    let item = noticeList.shift()
    if (!item) return

    const title = item.title.length > 40 ? item.title.substring(0, 39) + '...' : item.title
    noticeDialog.setTitle(`公告：[${title}]`).setComponent('forceNotice', item).show()
    readTime.value = item.forceReadTime
    showItemId = item.id

    timeInterval = setInterval(() => {
        readTime.value--
        if (readTime.value <= 0) {
            clearInterval(timeInterval)
            timeInterval = null
        }
    }, 1000)
}

onMounted(async () => {
    await nextTick()

    if (store.isLoggedIn) {
        store.startHeartbeat()
        checkNotice()
    }
})

const messageRef = ref()
const callRef = ref()
</script>

<template>
    <div class="absolute bottom-7 right-7  flex flex-col-reverse gap-3">
        <Button icon="pi pi-comments" severity="success" rounded aria-label="Search"
            @click="(event) => messageRef.toggle(event)" />
        <Popover ref="messageRef">
            <messages />
        </Popover>
        <Button v-if="storePer.hasPer('user:call')" icon="pi pi-microphone" severity="info" rounded
            aria-label="Bookmark" @click="(event) => callRef.toggle(event)" />
        <Popover ref="callRef">
            <dialpad />
        </Popover>
    </div>
    <DialogContentSlot name="forceNotice">
        <template #default="{ data }">
            <div class="p-6 md:p-10 ">
                <h1 class="text-2xl md:text-3xl font-bold text-gray-900 leading-snug mb-4 text-center">
                    {{ data.title }}
                </h1>
                <div class="flex items-center gap-3 text-sm text-gray-500 mb-6">
                    <span class="mr-auto px-2 py-1 bg-gray-100 rounded-md">
                        类型：{{ data.type }}
                    </span>
                    <span>发布人：{{ data.releaseUser }}</span>
                    <span>发布时间：{{ data.releaseTime.replace('T', ' ') }}</span>
                    <span class="text-red-500">阅读剩余时间：{{ readTime }}秒</span>
                </div>
                <div class="border-t border-gray-100 mb-6"></div>
                <div class="prose prose-gray max-w-none text-gray-700 leading-8" v-html="data.content"></div>
            </div>
        </template>
    </DialogContentSlot>
</template>
