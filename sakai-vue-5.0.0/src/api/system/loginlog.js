import service from '@/utils/axiosService'

/**
 * 获取日志页
 */
const getPage = (data) => service.post({ url: '/system/loginlog/page', data: data })


export default { getPage }