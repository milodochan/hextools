<script setup>
import { DialogRender, LayoutMessage } from '@layoutkit/prime-vue-layoutkit';
</script>

<template>
    <router-view />
    <ConfirmDialog />
    <Toast position="top-center" group="tc" />
    <LayoutMessage />
    <DialogRender />
</template>
