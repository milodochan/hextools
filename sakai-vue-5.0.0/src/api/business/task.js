import service from '@/utils/axiosService'

/**
 * 获取菜单页
 */
const getPage = (data) => service.post({ url: '/task/list/page', data: data })

/**
 * 获取菜单页
 */
const getUnCompletePage = (data) => service.post({ url: '/task/uncomplete/page', data: data })

/**
 * 获取菜单页
 */
const getCompletePage = (data) => service.post({ url: '/task/complete/page', data: data })

/**
 * 获取订单查询
 */
const getUnionPage = (data) => service.post({ url: '/task/receive/page', data: data })

/**
 * 获取token
 * @param {*} id 
 * @returns 
 */
const getToken = (id) => service.get({ url: `/task/gettoken?receiveId=${id}` })

/**
 * 获取查看token
 * @param {*} id 
 * @returns 
 */
const getViewToken = (id) => service.get({ url: `/task/getviewtoken?receiveId=${id}` })

export default { getPage, getToken, getCompletePage, getUnCompletePage, getUnionPage, getViewToken }