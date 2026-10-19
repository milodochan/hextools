<template>
  <div id="app">
    <header class="app-header">
      <span class="logo">Hex<em>Analyzer</em></span>
      <span class="sub">二进制协议解析 · Vue + PrimeVue</span>
      <span class="sp"></span>
      <SelectButton :options="layoutOpts" :modelValue="state.layout" @change="onLayout($event.value)"
        optionValue="value" optionLabel="label" :allowEmpty="false" />
      <Button icon="pi pi-question-circle" severity="secondary" text rounded aria-label="帮助" @click="openHelp" />
    </header>

    <main class="app-main">
      <LayoutSplitter :layout="state.layout" />
    </main>

    <ReplaceDialog />
    <HelpDialog ref="helpRef" />
    <Toast position="bottom-right" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import Button from 'primevue/button'
import SelectButton from 'primevue/selectbutton'
import Toast from 'primevue/toast'
import { useToast } from 'primevue/usetoast'
import LayoutSplitter from './components/LayoutSplitter.vue'
import ReplaceDialog from './components/ReplaceDialog.vue'
import HelpDialog from './components/HelpDialog.vue'
import { useAnalyzer } from './store/useAnalyzer.js'

const { state, init, registerToast, setLayout } = useAnalyzer()
const toast = useToast()
const helpRef = ref(null)

const layoutOpts = [
  { label: '左→右', value: 'lr' },
  { label: '右→左', value: 'rl' },
  { label: '上→下', value: 'tb' },
  { label: '三栏', value: 'tri' },
]

function onLayout(v) {
  if (v) setLayout(v)
}
function openHelp() {
  helpRef.value && helpRef.value.open()
}

onMounted(() => {
  registerToast((msg) => toast.add({ summary: msg, life: 2200 }))
  init()
})
</script>
