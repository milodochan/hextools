import service from '@/utils/axiosService'

const getMyPage = (data) => service.post({ url: '/notice/mypage', data: data })

const saveReadLog = (id) => service.post({ url: `/notice/readlog/save/${id}` })

const noticeStatus = () => service.get({ url: '/notice/status' })

const save = (data) => service.post({ url: '/system/department/save', data: data })

const deleteById = (id) => service.post({ url: `/system/department/delete/${id}` })

export default { getMyPage, saveReadLog, noticeStatus, deleteById, save }