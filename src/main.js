import { useStore } from '@/stores'
import { createPinia } from 'pinia'
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

import { zhCNLocale } from '@/utils/zh-CN'
import Aura from '@primeuix/themes/aura'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import PrimeVue from 'primevue/config'
import ConfirmationService from 'primevue/confirmationservice'
import DialogService from 'primevue/dialogservice'
import Ripple from 'primevue/ripple'
import ToastService from 'primevue/toastservice'
import Tooltip from 'primevue/tooltip'

import '@/assets/styles.scss'
import '@/assets/tailwind.css'
import '@layoutkit/prime-vue-layoutkit/style.css'

import { LayoutKit, useLayout } from '@layoutkit/prime-vue-layoutkit'
const { loadConfig } = useLayout()
loadConfig()

const app = createApp(App);
// 创建 pinia 实例
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)


// 使用 pinia
app.use(pinia)
const options = {
    theme: {
        preset: Aura,
        options: {
            darkModeSelector: '.app-dark'
        }
    },
    locale: zhCNLocale,
    ripple: true
}
app.use(PrimeVue, options)
app.use(LayoutKit, options)

app.use(ToastService)
app.use(ConfirmationService)
app.use(DialogService)

const store = useStore()
await store.defaultRoutes(router)
await store.generateRoutes(router)

app.directive('tooltip', Tooltip)
app.directive('ripple', Ripple)

app.use(router)
app.mount('#app')
