import { fileURLToPath, URL } from 'node:url'

import { PrimeVueResolver } from '@primevue/auto-import-resolver'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import Components from 'unplugin-vue-components/vite'
import { defineConfig, loadEnv } from 'vite'
import vueSetupExtend from 'vite-plugin-vue-setup-extend'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd())
    const urlKey = env.VITE_BASE_URL

    return {
        base: '/service/',
        server: {
            proxy: {
                [urlKey]: {
                    target: env.VITE_API_URL,
                    changeOrigin: true,
                    rewrite: path => path.replace(new RegExp(`^${urlKey}`), '')
                }
            }
        },
        optimizeDeps: {
            noDiscovery: true,
            include: ['crypto-js', 'quill', 'quill-delta', 'jsonp']
        },
        plugins: [
            vue(),
            vueSetupExtend(),
            tailwindcss(),
            Components({
                resolvers: [PrimeVueResolver()]
            })
        ],
        resolve: {
            alias: {
                '@': fileURLToPath(new URL('./src', import.meta.url))
            }
        },
        css: {
            preprocessorOptions: {
                scss: {
                    api: 'modern-compiler'
                }
            }
        },
        build: {
            target: 'esnext'
        }
    }
})
