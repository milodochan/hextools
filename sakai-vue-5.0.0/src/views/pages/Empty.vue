<script name="empty" setup>
import { ref } from 'vue';

const val = ref('')

</script>

<!-- <script>
export default {
     name: "empty"
}
</script> -->

<template>
    <div className="card">
        <div class="font-semibold text-xl mb-4">Empty Page</div>
        <p>Use this page to start from scratch and place your custom content.</p>
        <InputText type="text" v-model="val" />
    </div>
</template>
