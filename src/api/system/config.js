import service from '@/utils/axiosService'

const getPage = (data) => service.post({ url: '/system/config/page', data: data })

const save = (data) => service.post({ url: '/system/config/save', data: data })

const deleteById = (id) => service.post({ url: `/system/config/delete?key=${id}` })

export default { getPage, save, deleteById } 