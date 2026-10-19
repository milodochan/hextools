import service from '@/utils/axiosService'

/**
 * 获取部门页
 */
const getPage = () => service.get({ url: '/system/department/page' })

/**
 * 编辑部门
 */
const save = (data) => service.post({ url: '/system/department/save', data: data })

/**
 * 删除部门
 */
const deleteById = (id) => service.post({ url: `/system/department/delete/${id}` })

export default { getPage, deleteById, save }