import service from '@/utils/axiosService'

/**
 * 登录
 * @param {*} data 
 * @returns 
 */
const login = (data) => service.post({ url: '/auth/login', data: data })

/**
 * 获取加密密钥
 * @param {*} loginName 
 * @returns 
 */
const getSecretKey = (loginName) => service.get({ url: `/auth/secretkey?loginName=${loginName}` })

/**
 * 获取验证码
 * @param {*} loginName 
 * @returns 
 */
const getValidCode = (loginName) => service.get({ url: `/auth/validcode?loginName=${loginName}` })

/**
 * 获取权限信息
 * @returns 
 */
const getPermission = () => service.post({ url: '/auth/permission' })

/**
 * 更新登录密码
 * @returns 
 */
const updatePassword = (data) => service.post({ url: '/auth/update/password', data: data })

/**
 * 更新邮箱密码
 * @returns 
 */
const updateMailPassword = (data) => service.post({ url: '/auth/update/mail/password', data: data })

/**
 * 更新邮箱密码
 * @returns 
 */
const updateUser = (data) => service.post({ url: '/auth/update/user', data: data })

/**
 * 登录状态
 * @returns 
 */
const heartbeat = () => service.post({ url: '/auth/heartbeat' })

/**
 * 
 * @returns 
 */
const resetPassword = (data) => service.post({ url: '/auth/reset/password', data: data })


export { getPermission, getSecretKey, getValidCode, heartbeat, login, resetPassword, updateMailPassword, updatePassword, updateUser }
export default { login, getSecretKey, getValidCode, getPermission, updatePassword, updateMailPassword, updateUser, heartbeat, resetPassword }