import service from '@/utils/axiosService'

/**
 * 获取用户菜单
 * @returns 
 */
const getAll = () => service.get({ url: '/system/menu' })

/**
 * 保存菜单
 */
const save = (data) => service.post({ url: '/system/menu/save', data: data })

/**
 * 删除菜单
 */
const deleteById = (id) => service.post({ url: `/system/menu/delete/${id}` })

/**
 * 获取菜单功能页
 */
const getPermissionPage = (data) => service.post({ url: '/system/menu/permission/page', data: data })

/**
 * 保存菜单功能数据
 */
const savePermission = (data) => service.post({ url: '/system/menu/permission/save', data: data })

/**
 * 删除菜单功能数据
 */
const deletePermissionById = (data) => service.post({ url: '/system/menu/permission/delete', data: data })

export default { getAll, save, deleteById, getPermissionPage, savePermission, deletePermissionById }