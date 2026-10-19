<script setup>
let isError = false
</script>

<template>
    <div class="w-full h-full p-1 flex flex-col gap-1">
        <Toolbar>
            <template #start>
                <Button icon="pi pi-plus" class="mr-2" severity="secondary" text />
                <Button icon="pi pi-print" class="mr-2" severity="secondary" text />
                <Button icon="pi pi-upload" severity="secondary" text />
            </template>

            <template #center>
                <IconField>
                    <InputIcon>
                        <i class="pi pi-search" />
                    </InputIcon>
                    <InputText placeholder="Search" />
                </IconField>
            </template>

            <template #end> <SplitButton label="Save" :model="items"></SplitButton></template>
        </Toolbar>
        <Textarea v-model="hexText" class="h-full resize-none" fluid placeholder="在此粘贴十六进制文本（可含空格 / 0x），或拖拽 .bin/.hex/.txt 文件…" spellcheck="false" />
        <Message v-if="isError" severity="error">Error Message</Message>
        <Message severity="secondary">粘贴或拖拽文件 / hex 文本至此</Message>
    </div>
</template>
