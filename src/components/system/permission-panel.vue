<script setup>
import PermissionPanel from '@/components/system/permission-panel.vue'

const props = defineProps({
    item: Object,
    pers: Array
})

const ids = defineModel('ids')
const hasChilds = props.item.children ? props.item.children.filter(c => c.children && c.children.length > 0) : []
const noHasChilds = props.item.children ? props.item.children.filter(c => !c.children || c.children.length === 0) : []

// 获取子菜单对应的权限项
function getPersForMenu(menuItem) {
    return (props.pers || [])
        .filter(p => p.menuId.toLowerCase() === menuItem.id.toLowerCase())
        .sort((a, b) => a.sort - b.sort)
}

</script>

<template>
    <Panel :header="item.name" toggleable style="margin-bottom: 5px;">
        <!-- 递归渲染有子节点的 -->
        <template v-if="hasChilds.length > 0">
            <PermissionPanel v-model:ids="ids" :pers="pers" v-for="(child, idx) in hasChilds" :key="idx"
                :item="child" />
        </template>

        <!-- 渲染没有子节点的权限列表 -->
        <template v-if="noHasChilds.length > 0">
            <ul class="per-ul">
                <li class="per-li" v-for="(child, i) in noHasChilds" :key="i">
                    <div class="per-li-left">{{ child.name }}</div>
                    <div class="per-li-right flex flex-wrap gap-4">
                        <div class="flex items-center gap-2" v-for="(power, idx) in getPersForMenu(child)" :key="idx">
                            <Checkbox v-model="ids" :inputId="`checkbox_${child.id}_${idx}`"
                                :value="power.id.toLowerCase()" />
                            <label :for="`checkbox_${child.id}_${idx}`">{{ power.name }}</label>
                        </div>
                    </div>
                </li>
            </ul>
        </template>
    </Panel>
</template>

<style lang="scss" scoped>
.per-ul {
    list-style: none;
    padding: 0;
    margin: 0;
    border: 1px solid var(--surface-border);
    border-radius: 5px;
    overflow: hidden;
}

.per-li {
    display: flex;
    border-bottom: 1px solid var(--surface-border);
}

.per-li:last-child {
    border-bottom: none;
}

.per-li-left {
    width: 10rem;
    padding: 1rem;
    border-right: 1px solid var(--surface-border);
}

.per-li-right {
    width: auto;
    padding: 10px;
    text-align: center;
}
</style>