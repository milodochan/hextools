import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'

// 注意：vite-plugin-vue-devtools 依赖的 vite-plugin-inspect 与 Vite 8 (Rolldown 内核)
// 不兼容，会在 dep-pre-bundle 阶段抛 "Can not found environment context for client"，
// 导致依赖预构建崩溃、dev 触发 504 Outdated Optimize Dep。故此处移除该插件。
// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueJsx(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  // 显式预构建所有运行时依赖，避免 dev 过程中发现“新”依赖而反复触发
  // “Outdated Optimize Dep” -> 504 重试死循环
  optimizeDeps: {
    include: [
      'vue',
      '@primeuix/themes/aura',
      'primevue/config',
      'primevue/toastservice',
      'primevue/button',
      'primevue/selectbutton',
      'primevue/toast',
      'primevue/usetoast',
      'primevue/inputtext',
      'primevue/checkbox',
      'primevue/select',
      'primevue/splitter',
      'primevue/splitterpanel',
      'primevue/textarea',
      'primevue/dialog',
      'primevue/datatable',
      'primevue/column',
      'primevue/tag',
    ],
  },
  server: {
    host: '127.0.0.1',
    port: 5173,
  },
})
