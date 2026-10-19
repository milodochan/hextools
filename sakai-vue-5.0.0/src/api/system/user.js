import service from '@/utils/axiosService'

const getPage = (data) => service.post({ url: '/system/user/page', data: data })

const getAllLevel = () => service.get({ url: '/system/user/level/all' })

const getAllRole = () => service.get({ url: '/system/user/role/all' })

const getAllDepartment = () => service.get({ url: '/system/user/department/all' })

const save = (data) => service.post({ url: '/system/user/save', data: data })

const unLock = (id) => service.post({ url: `/system/user/unlock/${id}` })

const sendLink = (data) => service.post({ url: `/system/user/sendlink`, data: data })

export default { getPage, getAllLevel, unLock, getAllRole, getAllDepartment, save, sendLink }