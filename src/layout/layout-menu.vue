<script setup>
import { useStore } from '@/stores'
import { onMounted, ref } from 'vue'
import LayoutMenuItem from './layout-menu-item.vue'

const store = useStore()
const model = ref()

// 初始化菜单
onMounted(async () => {
    if (store.isLoggedIn && store.siderMenus.length > 0) {
        //model.value = store.siderMenus
        model.value = [
            // { label: 'Form Layout', icon: 'pi pi-fw pi-id-card', path: '/uikit/formlayout' },
            // { label: 'Input', icon: 'pi pi-fw pi-check-square', path: '/uikit/input' },
            // { label: 'Button', icon: 'pi pi-fw pi-mobile', path: '/uikit/button', class: 'rotated-icon' },
            // { label: 'Table', icon: 'pi pi-fw pi-table', path: '/uikit/table' },
            // { label: 'List', icon: 'pi pi-fw pi-list', path: '/uikit/list' },
            // { label: 'Tree', icon: 'pi pi-fw pi-share-alt', path: '/uikit/tree' },
            // { label: 'Panel', icon: 'pi pi-fw pi-tablet', path: '/uikit/panel' },
            // { label: 'Overlay', icon: 'pi pi-fw pi-clone', path: '/uikit/overlay' },
            // { label: 'Media', icon: 'pi pi-fw pi-image', path: '/uikit/media' },
            // { label: 'Menu', icon: 'pi pi-fw pi-bars', path: '/uikit/menu' },
            // { label: 'Message', icon: 'pi pi-fw pi-comment', path: '/uikit/message' },
            // { label: 'File', icon: 'pi pi-fw pi-file', path: '/uikit/file' },
            // { label: 'Chart', icon: 'pi pi-fw pi-chart-bar', path: '/uikit/charts' },
            // { label: 'Timeline', icon: 'pi pi-fw pi-calendar', path: '/uikit/timeline' },
            // { label: 'Misc', icon: 'pi pi-fw pi-circle', path: '/uikit/misc' },
            // {
            //     label: 'Submenu 1.1',
            //     icon: 'pi pi-fw pi-bookmark',
            //     items: [
            //         { label: 'Submenu 1.1.1', icon: 'pi pi-fw pi-bookmark' },
            //         { label: 'Submenu 1.1.2', icon: 'pi pi-fw pi-bookmark' },
            //         { label: 'Submenu 1.1.3', icon: 'pi pi-fw pi-bookmark' }
            //     ]
            // }
        ]
        store.siderMenus.forEach(item => {
            model.value.push(item)
        })

        // console.log(model.value)
    }
})

</script>

<template>
    <div class="layout-sidebar">
        <div class="layout-menu">
            <ul class="layout-submenu">
                <LayoutMenuItem v-for="(item, i) in model" :key="item" :item="item" :index="i" parentItemKey="parent" />
            </ul>
        </div>
    </div>
</template>

<style lang="css" scoped>
.layout-sidebar {
    padding: 10px;
    top: 4rem;
    left: 0rem;
    height: calc(100vh - 4rem);
    max-height: calc(100vh - 4rem);
    margin-top: 5px;
}

@media (min-width: 992px) {
    .layout-wrapper.layout-overlay.layout-overlay-active .layout-sidebar {
        height: calc(100vh - 10px);
        max-height: calc(100vh - 10px);
    }
}
</style>
