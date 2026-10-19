import { useStore } from '@/stores'
import axios from 'axios'

const serviceInstance = axios.create({
    baseURL: import.meta.env.VITE_BASE_URL,
})

// ===== 请求拦截器 =====
serviceInstance.interceptors.request.use(config => {
    // 获取 localStorage 中的 token
    const store = useStore()
    // 如果 token 存在，添加到请求头
    if (store.token) {
        config.headers['Authorization'] = `Bearer ${store.token}`
    }
    return config
}, error => {
    return Promise.reject(error)
})

// ===== 响应拦截器 =====
serviceInstance.interceptors.response.use(res => {
    if (res.status === 200) {
        // 判断token是否过期
        if (res.data.code === 1001) {
            const store = useStore()
            store.resetState()
        }
        // if (res.data.code === 1004) {
        //     const store = useStore()
        //     store.accessDenied()
        // }
        return Promise.resolve(res.data)
    }
    else
        return Promise.reject(res.error)
}, error => Promise.reject(error))

/**
 * 自定义请求
 * @param {*} config { url: '/controller/action', method: 'post', data: data }
 * @returns 
 */
const request = (config) => serviceInstance(config)

/**
 * get请求
 * @param {*} config { url: '/controller/action', data: data }
 * @returns 
 */
const get = (config) => {
    config.method = 'get'
    return serviceInstance(config)
}

/**
 * post请求
 * @param {*} config { url: '/controller/action', data: data }
 * @returns 
 */
const post = (config) => {
    config.method = 'post'

    // 自动设置 Content-Type 为 multipart/form-data（仅当传入的是 FormData）
    if (config.data instanceof FormData) {
        config.headers = {
            ...(config.headers || {}), // NOSONAR
            'Content-Type': 'multipart/form-data'
        }
    }

    return serviceInstance(config)
}

// ============================================
// ✅ 专门用于文件下载的实例（无响应拦截器）
// ============================================
const downloadInstance = axios.create({
    baseURL: import.meta.env.VITE_BASE_URL,
    timeout: 20000 // 下载可适当延长
})

// 请求拦截器（可选：复用 token）
downloadInstance.interceptors.request.use(config => {
    const urlParams = new URLSearchParams(globalThis.location.search)
    const id = urlParams.get('id')

    if (id) {
        const token = localStorage.getItem('token_' + id)
        if (token)
            config.headers['Authorization'] = `Bearer ${token}`
    } else
        console.warn('下载实例未找到 id')

    return config
}, error => Promise.reject(error))

// ===== 响应拦截器 =====
downloadInstance.interceptors.response.use(
    res => {
        if (res.status !== 200)
            return Promise.reject(error)

        const responseType = res.config.responseType
        const contentType = res.headers?.['content-type'] || ''
        // console.log('isArrayBuffer:', res.data instanceof ArrayBuffer)
        // console.log('responseType:', responseType)
        return Promise.resolve({
            contentType,
            data: res.data,
            config: res.config,
            headers: res.headers,
            responseType
        })
    },
    error => Promise.reject(error)
)

/**
 * downFile 封装
 * @param {*} auditId
 * @param {*} source
 * @param {*} type arraybuffer json
 */
const downFile = (url, data, type = 'json') => {
    return downloadInstance.post(url, data, { responseType: type })
}

export default { request, get, post, downFile }