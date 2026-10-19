import { useStore } from '@/stores'
import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
    history: createWebHashHistory(),
    routes: []
})

// 路由守卫，检查是否需要认证
router.beforeEach(async (to, from, next) => {
    const store = useStore()
    const isLoginPage = to.path.startsWith('/auth/login')

    if (store.token && !store.validSession()) {
        await store.getPermission()
        await store.generateRoutes(router)
    }

    // 已登录访问登录页，跳首页
    if (isLoginPage && store.isLoggedIn) {
        next('/')
        return
    }

    // 不需要认证的页面直接放行
    if (to.meta && !to.meta.requiresAuth) {
        next()
        return
    }

    if (isLoginPage || store.isLoggedIn) {
        next()
        return
    }

    next(`/auth/login?redirect=${to.fullPath}`)
})

export default router
