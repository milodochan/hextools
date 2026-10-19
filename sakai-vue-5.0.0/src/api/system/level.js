import service from '@/utils/axiosService'

const getPage = (data) => service.post({ url: '/system/level/page', data: data })

const save = (data) => service.post({ url: '/system/level/save', data: data })

const deleteById = (id) => service.post({ url: `/system/level/delete/${id}` })

export default { getPage, deleteById, save }