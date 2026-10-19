import service from '@/utils/axiosService'

const getInfo = (name) => service.get({ url: `/thirdsdk/info?name=${name}` })

const getChangeRecords = (name) => service.get({ url: `/thirdsdk/change/records?name=${name}` })

const getException = (name) => service.get({ url: `/thirdsdk/exception?name=${name}` })

const getReportYear = (name) => service.get({ url: `/thirdsdk/report/year?name=${name}` })

const getShareholder = (name) => service.get({ url: `/thirdsdk/shareholder?name=${name}` })

export default { getInfo, getChangeRecords, getException, getReportYear, getShareholder } 