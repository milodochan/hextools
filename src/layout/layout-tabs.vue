<script setup>
import { useTabStore } from '@layoutkit/prime-vue-layoutkit'
import { computed, nextTick, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const emits = defineEmits(['updated'])
const router = useRouter()
const route = useRoute()
const tabStore = useTabStore()
const activePath = computed(() => tabStore.activePath.value)
const tabs = computed(() => tabStore.tabs.value)
const tabsContainer = ref(null)
const mainPage = ref({
    path: '/',
    title: '主页'
})
const menu = ref()
const items = ref([
    {
        label: '标签管理',
        items: [
            {
                label: '刷新',
                icon: 'pi pi-refresh',
                command: () => {
                    emits('updated', Date.now())
                }
            },
            {
                label: '全屏',
                icon: 'pi pi-arrow-up-right-and-arrow-down-left-from-center',
                command: () => {
                    if (document.fullscreenElement === null) {
                        // 进入全屏模式
                        if (document.documentElement.requestFullscreen) {
                            document.documentElement.requestFullscreen()    // 支持大多数浏览器
                        } else if (document.mozRequestFullScreen) {
                            document.mozRequestFullScreen()                 // Firefox
                        } else if (document.webkitRequestFullscreen) {
                            document.webkitRequestFullscreen()              // Chrome 和 Safari
                        } else if (document.msRequestFullscreen) {
                            document.msRequestFullscreen()                  // IE/Edge
                        }

                        const fullscreenItem = items.value[0].items.find(item => item.label === '全屏')
                        fullscreenItem.label = '退出全屏'
                        fullscreenItem.icon = 'pi pi-arrow-down-left-and-arrow-up-right-to-center'
                    } else {
                        // 退出全屏模式
                        if (document.exitFullscreen) {
                            document.exitFullscreen()
                        } else if (document.mozCancelFullScreen) {
                            document.mozCancelFullScreen()                  // Firefox
                        } else if (document.webkitExitFullscreen) {
                            document.webkitExitFullscreen()                 // Chrome 和 Safari
                        } else if (document.msExitFullscreen) {
                            document.msExitFullscreen()                     // IE/Edge
                        }

                        const fullscreenItem = items.value[0].items.find(item => item.label === '退出全屏')
                        fullscreenItem.label = '全屏'
                        fullscreenItem.icon = 'pi pi-arrow-up-right-and-arrow-down-left-from-center'
                    }
                }
            },
            {
                label: '关闭其他',
                icon: 'pi pi-arrows-h',
                command: () => {
                    tabStore.removeOther()
                }
            },
            {
                label: '关闭所有',
                icon: 'pi pi-times',
                command: () => {
                    tabStore.removeAll()
                    router.push(activePath.value)
                }
            }
        ]
    }
])

watch(
    () => route.fullPath,
    () => {
        tabStore.add({
            path: route.fullPath,
            name: route.name,
            title: route.query.title || route.meta.title || '未命名'
        })
    },
    { immediate: true }
)

watch(() => activePath.value, async (val) => {
    await nextTick() // 等DOM渲染完
    const activeTab = tabsContainer.value.querySelector(`.tab[data-path="${val}"]`)
    if (activeTab) {
        tabsContainer.value.scrollLeft = activeTab.offsetLeft - (tabsContainer.value.offsetWidth - activeTab.offsetWidth) / 2
    }
})

const switchTab = (path) => {
    tabStore.change(path)
    router.push(path)
}

const removeTab = (path) => {
    tabStore.remove(path)
    router.push(activePath.value)
}

const toggle = (event) => {
    menu.value.toggle(event)
}

</script>

<template>
    <div class="flex justify-content-between align-content-between"
        style="justify-content: space-between; margin-right: 5px; margin-bottom: 5px;">

        <div class="tabs tabmain" ref="tabsContainer">
            <ButtonGroup :key="mainPage.path" style="margin-right: 5px;" class="tab" :data-path="mainPage.path">
                <Button label="主页" :severity="mainPage.path === activePath ? 'primary' : 'secondary'"
                    style="min-width: 5rem;" @click="switchTab(mainPage.path)" />
            </ButtonGroup>
            <ButtonGroup v-for="tab in tabs" :key="tab.path" style="margin-right: 5px;" class="tab"
                :data-path="tab.path">
                <Button :label="tab.title" :severity="tab.path === activePath ? 'primary' : 'secondary'"
                    style="min-width: 5rem; max-width: 10rem;" @click="switchTab(tab.path)" />
                <Button icon="pi pi-times" :severity="tab.path === activePath ? 'primary' : 'secondary'"
                    @click="removeTab(tab.path)" />
            </ButtonGroup>
        </div>

        <div class="tabs">
            <Button type="button" icon="pi pi-ellipsis-v" severity="secondary" @click="toggle" aria-haspopup="true"
                aria-controls="overlay_menu" />
            <Menu ref="menu" id="overlay_menu" :model="items" :popup="true" />
        </div>
    </div>
</template>

<style lang="css" scoped>
:deep(.p-button-secondary) {
    background: var(--surface-card);
}

:deep(.p-button-label) {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
}

.tabs {
    display: flex;
    height: 2rem;
    margin: 4px 0 0 5px;
}

.tabmain {
    overflow-x: hidden;
}
</style>