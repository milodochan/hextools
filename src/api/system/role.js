import service from '@/utils/axiosService'

/**
 * 获取角色页
 */
const getPage = (data) => service.post({ url: '/system/role/page', data: data })

/**
 * 获取角色权限
 */
const getPermissionConfig = (id) => service.post({ url: `/system/role/permission/config?id=${id}` })

/**
 * 保存角色权限
 * @param {*} data 
 * @returns 
 */
const savePermission = (data) => service.post({ url: '/system/role/permission/save', data: data })

/**
 * 编辑角色
 */
const save = (data) => service.post({ url: '/system/role/save', data: data })

/**
 * 删除角色
 */
const deleteById = (id) => service.post({ url: `/system/role/delete/${id}` })

export default { getPage, getPermissionConfig, savePermission, deleteById, save }