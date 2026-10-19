import service from '@/utils/axiosService'

const getPage = (data) => service.post({ url: '/kits/tools/page', data: data })

const save = (data) => service.post({ url: '/kits/tools/save', data: data })

const deleteById = (id) => service.post({ url: `/kits/tools/delete/${id}` })

const getAreaInfos = () => service.get({ url: '/kits/tools/areainfo/all' })

export default { getPage, save, deleteById, getAreaInfos } 