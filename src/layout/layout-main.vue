<script setup>
import { useLayout, useTabStore } from '@layoutkit/prime-vue-layoutkit'
import { computed, nextTick, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import LayoutCommon from './layout-common.vue'
import LayoutError from './layout-error.vue'
import LayoutMenu from './layout-menu.vue'
import LayoutTabs from './layout-tabs.vue'
import LayoutTopbar from './layout-topbar.vue'

const { enableOutSide, isSidebarActive, containerClass } = useLayout()
const router = useRouter()
const route = useRoute()
const tabStore = useTabStore()
const outsideClickListener = ref(null)
const currentKey = ref(Date.now())
const isLoading = ref(false)

router.beforeEach((to, from, next) => {
    isLoading.value = true
    next()
})

watch(isSidebarActive, (newVal) => {
    if (newVal) {
        bindOutsideClickListener()
    } else {
        unbindOutsideClickListener()
    }
})

const bindOutsideClickListener = () => {
    if (!outsideClickListener.value) {
        outsideClickListener.value = (event) => {
            if (isOutsideClicked(event))
                enableOutSide()
        }
        document.addEventListener('click', outsideClickListener.value)
    }
}

const unbindOutsideClickListener = () => {
    if (outsideClickListener.value) {
        document.removeEventListener('click', outsideClickListener.value)
        outsideClickListener.value = null
    }
}

const isOutsideClicked = (event) => {
    const sidebarEl = document.querySelector('.layout-sidebar')
    const topbarEl = document.querySelector('.layout-menu-button')
    const elements = [sidebarEl, topbarEl]
    return elements.every(el => !(el.isSameNode(event.target) || el.contains(event.target)))
}

const refreshKey = (val) => {
    if (route.name === 'iframe') isLoading.value = true
    currentKey.value = val
}

const cachedComponentNames = computed(() => tabStore.tabs.value.map(tab => tab.name))
// iframe 缓存管理
const activeIframe = ref('')
const iframeTabs = ref([])

// 绑定移除钩子
tabStore.registerRemoveHook((path) => {
    const index = iframeTabs.value.findIndex(t => t.name === path)
    if (index !== -1) {
        iframeTabs.value.splice(index, 1)
    }
})

watch(
    () => route.fullPath,
    async (newPath) => {
        if (route.name === 'iframe') {
            const url = route.query.url
            if (!url) return

            const isExist = iframeTabs.value.some(tab => tab.name === newPath)
            if (!isExist) {
                iframeTabs.value.push({
                    title: route.query?.title ?? Date.now().getTime(),
                    name: newPath,
                    url,
                })
                isLoading.value = true
            }
            activeIframe.value = newPath
        }

        await nextTick()
        isLoading.value = false
        // currentKey.value = Date.now()
    },
    { immediate: true }
)

</script>

<template>
    <div class="layout-wrapper" :class="containerClass">
        <LayoutTopbar></LayoutTopbar>
        <LayoutMenu></LayoutMenu>
        <div class="layout-main-container">
            <!--多标签栏-->
            <LayoutTabs @updated="(val) => refreshKey(val)" />
            <div class="layout-main">
                <div class="card" :style="route.name === 'iframe' ? 'padding: 0;' : ''">
                    <!-- iframe 部分：仅当是 iframe 页面时显示 -->
                    <div v-show="route.name === 'iframe'" style="height: 100%; position: relative;">
                        <div v-for="item in iframeTabs" :key="item.name" v-show="item.name === activeIframe"
                            style="position: absolute; top:0; left:0; width:100%; height:100%;">
                            <iframe :key="currentKey" v-on:load="() => isLoading = false" :src="item.url"
                                :title="item.title" style="width: 100%; height: 100%; border: none" />
                        </div>
                    </div>

                    <router-view v-slot="{ Component }">
                        <template v-if="Component">
                            <LayoutError>
                                <keep-alive :include="cachedComponentNames">
                                    <component v-if="!isLoading" :is="Component" :key="`${route.name}-${currentKey}`" />
                                </keep-alive>
                            </LayoutError>
                            <div v-if="isLoading" class="loading">
                                <ProgressSpinner aria-label="Loading" />
                            </div>
                        </template>
                    </router-view>
                </div>
            </div>
        </div>
        <div class="layout-mask animate-fadein"></div>
    </div>
    <LayoutCommon />
</template>

<style lang="css" scoped>
.layout-main-container {
    margin-left: 20rem;
    padding: 4rem 0 0 0rem;
    max-height: calc(100vh - 6rem);
    overflow-y: hidden;
}

@media (min-width: 992px) {
    .layout-wrapper.layout-overlay .layout-main-container {
        margin-left: 0;
        padding-left: 0;
    }
}

@media (min-width: 992px) {
    .layout-wrapper.layout-static.layout-static-inactive .layout-main-container {
        margin-left: 0;
        padding-left: 0;
    }
}

@media (min-width: 992px) {
    .layout-wrapper.layout-static .layout-main-container {
        margin-left: 20rem;
    }
}

.layout-main {
    overflow-y: hidden;
    padding: 0 5px;
    width: 100%;
    max-height: calc(100vh - 6rem);
    height: calc(100vh - 6rem);
}

.card {
    height: 100%;
    overflow-y: auto;
}

.loading {
    position: absolute;
    top: 50%;
    left: 51%;
}
</style>
