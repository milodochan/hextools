import { createApp } from 'vue'

import PrimeVue from 'primevue/config'
import ToastService from 'primevue/toastservice'
import Aura from '@primeuix/themes/aura'
import 'primeicons/primeicons.css'

import App from './App.vue'
import './styles/app.css'

const app = createApp(App)

app.use(PrimeVue, {
  theme: {
    preset: Aura,
    options: {
      // 亮色主题；如需暗色把下面这个 class 加到 <html> 上即可
      darkModeSelector: '.app-dark',
    },
  },
})
app.use(ToastService)

app.mount('#app')
