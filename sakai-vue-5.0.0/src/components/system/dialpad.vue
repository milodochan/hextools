<script setup>
import { changeMic, changeWorkStatus, checkStatus, sendDTMF } from '@/utils/call'
import { useMessage } from '@layoutkit/prime-vue-layoutkit'
import { onBeforeUnmount, onMounted, ref } from 'vue'

const msg = useMessage()
const interval = ref(null)
const micStatus = ref(true)
const workStatus = ref(true)
const callInStatus = ref(false)
const callOutStatus = ref(false)
const talkingStatus = ref(false)
const numberContent = ref(['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'])
const numberClick = (val) => {
    sendDTMF(val).then(res => {
        if (res.Code !== 0) {
            msg.error(res.RetMsg.Msg)
        }
    })
}

const workerChange = () => {
    let funName = workStatus.value ? 'InToRestState' : 'InToWorkState'
    changeWorkStatus(funName).then(res => {
        if (res.Code !== 0) {
            msg.error(res.RetMsg.Msg)
        }
    })
    checkCallStatus()
}

const micChange = () => {
    changeMic().then(res => {
        if (res.Code !== 0) {
            msg.error(res.RetMsg.Msg)
        }
    })
    checkCallStatus()
}

const checkCallStatus = () => {
    checkStatus().then(res => {
        if (res.Code !== 0) return
        const data = res.Data
        micStatus.value = data.IsMicMute
        workStatus.value = data.IsWorking
        callInStatus.value = data.IsCallIn
        callOutStatus.value = data.IsCallOut
        talkingStatus.value = data.IsTalking

        if (!data.IsReg) {
            changeWorkStatus('Register').then(res => {
                if (res.Code !== 0) {
                    msg.error(res.RetMsg.Msg)
                }
            })
        }
    })
}

const getMessageContent = () => {
    if (workStatus.value) {
        if (talkingStatus.value) return '正在通话中...'
        else return '正在工作中...'
    }
    else return '正在休息中...'
}

// 快捷键静音还未实现
onMounted(() => {
    checkCallStatus()

    if (!interval.value) {
        interval.value = setInterval(checkCallStatus, 3000)
    }
})

onBeforeUnmount(() => {
    clearInterval(interval.value)
})
</script>

<template>
    <div class="flex flex-col gap-2" style="width: 300px;">
        <div class="flex flex-row gap-2">
            <Message :severity="workStatus ? 'success' : 'warn'" class="basis-4/5">
                {{ getMessageContent() }}
            </Message>
            <Button :label="workStatus ? '休息' : '工作'" :severity="workStatus ? 'warn' : 'success'" class="basis-1/5"
                @click="workerChange" />
            <Button icon="pi pi-microphone" :severity="micStatus ? 'danger' : 'success'" class="basis-1/5"
                v-tooltip.top="'ctrl + ~'" @click="micChange" />
        </div>
        <div class="grid grid-cols-3 gap-2">
            <Button v-for="value in numberContent" :label="value" severity="info" @click="numberClick(value)" />
        </div>
        <div class="flex flex-col gap-2 text-sm">
            <div class="flex flex-row gap-1 items-center">
                <Tag value="CTRL" severity="secondary" /> +
                <Tag value="~" severity="secondary" />
                <span>静音快捷键</span>
            </div>
        </div>
    </div>
</template>