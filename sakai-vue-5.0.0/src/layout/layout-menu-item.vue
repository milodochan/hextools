<script setup>
import { useLayout } from '@layoutkit/prime-vue-layoutkit'
import { onBeforeMount, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

const props = defineProps({
    item: {
        type: Object,
        default: () => ({})
    },
    index: {
        type: Number,
        default: 0
    },
    parentItemKey: {
        type: String,
        default: null
    }
})

const isActiveMenu = ref(false)
const itemKey = ref(null)
const route = useRoute()
const { activeMenu, isSidebarActive, setActiveMenu, toggleMenu } = useLayout()
const checkActiveRoute = (item) => route.path === item.path
const itemClick = (event, item) => {
    // console.log(`${item.label}-${itemKey.value}-${isActiveMenu.value}`)
    if (item.disabled) {
        event.preventDefault()
        return
    }

    if (item.path && isSidebarActive.value) {
        if (!item.items || item.items.length === 0)
            toggleMenu()
    }

    if (item.command)
        item.command({ originalEvent: event, item: item })

    let key = isActiveMenu.value ? props.parentItemKey : itemKey
    let foundItemKey = item.items ? key : itemKey.value

    setActiveMenu(foundItemKey)
}

onBeforeMount(() => {
    itemKey.value = props.parentItemKey ? `${props.parentItemKey}-${props.index}` : String(props.index)
    isActiveMenu.value = activeMenu.value === itemKey.value || activeMenu.value?.startsWith(`${itemKey.value}-`)
})

watch(
    () => activeMenu.value,
    (newVal) => {
        if (!newVal) {
            isActiveMenu.value = false
            return
        }
        isActiveMenu.value = newVal === itemKey.value || newVal.startsWith(`${itemKey.value}-`)
    }
)
</script>

<template>
    <li :class="{ 'active-menuitem': isActiveMenu }">
        <a v-if="!item.path || item.items" tabindex="0" @click="itemClick($event, item, index)" :class="item.class">
            <i v-if="item.icon" :class="item.icon" class="layout-menuitem-icon"></i>
            <span class="layout-menuitem-text">{{ item.label }}</span>
            <i class="pi pi-fw pi-angle-down layout-submenu-toggler" v-if="item.items"></i>
        </a>
        <router-link v-if="item.path && !item.items" tabindex="0" :to="item.path"
            @click="itemClick($event, item, index)" :class="[item.class, { 'active-route': checkActiveRoute(item) }]">
            <i v-if="item.icon" :class="item.icon" class="layout-menuitem-icon"></i>
            <span class="layout-menuitem-text">{{ item.label }}</span>
            <i class="pi pi-fw pi-angle-down layout-submenu-toggler" v-if="item.items"></i>
        </router-link>
        <Transition v-if="item.items" name="layout-submenu">
            <ul v-show="isActiveMenu" class="layout-submenu">
                <LayoutMenuItem v-for="(child, i) in item.items" :key="child" :index="i" :item="child"
                    :parentItemKey="itemKey" />
            </ul>
        </Transition>
    </li>

</template>