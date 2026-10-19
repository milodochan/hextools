import api from '@/api/auth'
import LayoutMain from '@/layout/layout-main.vue'
import router from '@/router'
import { store as storePer, useTabStore } from '@layoutkit/prime-vue-layoutkit'
import { defineStore } from 'pinia'

/**
 * 构造菜单界面数据
 * @param {*} data 
 * @param {*} pid 
 * @returns 
 */
const buildMenu = (data, pid) => {
    const outData = []
    const filterData = data.filter(item => item.pid.trim().toLowerCase() === pid.trim().toLowerCase())
    if (filterData.length > 0) {
        filterData.forEach(item => {
            const childData = buildMenu(data, item.id)
            const menuItem = {
                label: item.name,
                icon: item.icon,
                path: item.url ?? null
            }
            if (childData.length > 0) {
                menuItem.items = childData
            }

            outData.push(menuItem)
        })
    }

    return outData
}

const parseUrl = (url) => {
    const [path, queryString] = url.split('?')
    const query = {}
    if (queryString) {
        queryString.split('&').forEach(item => {
            const [key, value] = item.split('=')
            query[key] = value
        })
    }

    return { path, query }
}

/**
 * 构造菜单路由数据
 * @param {*} data 
 * @param {*} pid 
 * @returns 
 */
const buildRoute = (data) => {
    const outData = []
    const modules = import.meta.glob('../views/**/*.vue')
    // console.log(modules)
    // console.log(data)
    const filterData = data.filter(item => item.component)
    if (filterData.length > 0) {
        filterData.forEach(item => {
            const { path, query } = parseUrl(item.url)
            // 使用路径作为唯一name，或使用 path + component 组合
            const uniqueName = item.component.replaceAll('/', '_') || path.replaceAll('/', '_')
            const requiresAuth = item?.requiresAuth ?? true
            const layout = item?.layout ?? true
            outData.push({
                path,
                name: uniqueName,
                component: modules[`../views/${item.component}.vue`],
                meta: {
                    layout,
                    title: item.name,
                    requiresAuth: requiresAuth,
                    query
                }
            })
        })
    }

    return outData
}

/**
 * 默认路由数据
 */
const routeDatas = [
    { requiresAuth: true, name: '主页', url: '/', component: 'Dashboard', layout: true },
    { requiresAuth: true, name: '404', url: '/:pathMatch(.*)*', component: 'pages/auth/notFound', layout: true },
    { requiresAuth: true, name: '外链页面', url: '/iframe', component: 'pages/iframe', layout: true },
    { requiresAuth: true, name: '个人资料', url: '/userinfo', component: 'pages/auth/userInfo', layout: true },
    { requiresAuth: true, name: '公告', url: '/notice', component: 'pages/auth/notice', layout: true },
    { requiresAuth: true, name: '无权限', url: '/access', component: 'pages/auth/access', layout: false },
    { requiresAuth: false, name: '登录', url: '/auth/login', component: 'pages/auth/login', layout: false },
    { requiresAuth: false, name: '密码设置', url: '/auth/password', component: 'pages/auth/password', layout: false },
    { requiresAuth: false, name: '工商数据查询', url: '/kit/business/open', component: 'pages/other/data', layout: false },
]

let heartbeatInterval = null
export const useStore = defineStore('data', {
    // 持久化配置
    persist: [
        {
            key: 'user-token',
            storage: localStorage,
            pick: ['token']
        },
        {
            key: 'user-session',
            storage: sessionStorage,
            pick: ['menus', 'userInfo', 'permissions']
        }
    ],
    state: () => ({
        token: '',
        userInfo: null,
        menus: [],
        permissions: [],
        callInfo: {},
        hasNotice: false,
        parentRoute: 'main'
    }),
    getters: {
        isLoggedIn: (state) => true, // !!state.token && state.menus.length > 0,
        userName: (state) => `${state.userInfo?.nickName}(${state.userInfo?.loginName})`,
        siderMenus: (state) => buildMenu(state.menus, '-1')
    },
    actions: {
        // 登录
        async login(data) {
            try {
                const res = await api.login(data)
                if (res.code === 0)
                    this.token = res.data

                return res
            } catch (error) {
                this.resetState()
                throw error
            }
        },

        // 登出
        async logout() {
            this.resetState()
        },

        // 获取菜单列表
        async getPermission() {
            // try {
            //     const res = await api.getPermission()
            //     if (res.code === 0) {
            //         this.menus = res.data.menus.sort((a, b) => a.sort - b.sort) // 考虑数据加密
            //         this.permissions = res.data.pers            // 考虑数据加密
            //         this.userInfo = res.data.userInfo           // 考虑数据加密
            //         if (res.data.super) storePer.disablePer()  // 超管不验证权限
            //         else {
            //             storePer.set(res.data.pers)             // 将权限数据传递给权限控制模块
            //             storePer.enablePer()                   // 启用权限控制   
            //         }
            //     }
            //     return res
            // } catch (error) {
            //     this.menus = []
            //     throw error
            // }

            this.menus = [
                    {
                        id: 1,
                        pid: '-1',
                        name: '测试',
                        icon: '',
                        component: 'pages/Documentation',
                        path: 'documentation'
                    },
                    // {
                    //     id: 1,
                    //     pid: '-1',
                    //     label: '测试',
                    //     icon: '',
                    //     path: 'pages/Documentation'
                    // },
                ]
        },

        // 默认路由设置
        async defaultRoutes(router) {
            router.addRoute({
                path: '/',
                name: this.parentRoute,
                component: LayoutMain,
                meta: { requiresAuth: true },
                children: []
            })
            const routes = buildRoute(routeDatas)
            routes.forEach(route => {
                route.meta.layout
                    ? router.addRoute(this.parentRoute, route)
                    : router.addRoute(route)
                // console.log('创建路由=>' + route.path)
            })
        },

        // 生成动态路由
        async generateRoutes(router) {
            // console.log(this.menus)
            const routes = buildRoute(this.menus)
            // console.log(routes)
            routes.forEach(route => {
                route.meta.layout
                    ? router.addRoute(this.parentRoute, route)
                    : router.addRoute(route)
                // console.log('创建路由=>' + route.path)
            })
        },

        //  登录状态心跳 
        async startHeartbeat() {
            if (heartbeatInterval) return // 防止重复启动
            heartbeatInterval = setInterval(async () => {
                try {
                    const res = await api.heartbeat()
                    if (res.code !== 0) console.log(res.message)
                } catch (err) {
                    console.error('心跳失败', err)
                }
            }, 10000)  // 10秒一次
        },

        // 验证session中的信息是否存在
        validSession() {
            return this.menus && this.userInfo
        },

        // 权限判断
        hasPer(code) {
            const result = this.permissions.includes(code)
            // console.log(`code->${code}, result->${result}`)
            return result
        },

        // 重置状态
        resetState() {
            const redirect = router.currentRoute.value.fullPath
            const tabStore = useTabStore()

            this.$reset()
            localStorage.removeItem('user-token')
            storePer.clear()
            tabStore.removeAll()
            clearInterval(heartbeatInterval)
            heartbeatInterval = null

            router.push({
                path: '/auth/login',
                query: {
                    redirect   // ✅ router 会自动处理
                }
            })
        },
        // 无权限
        accessDenied() {
            // const redirect = router.currentRoute.value.fullPath
            router.replace({
                path: '/access'
            })
        }
    }
})