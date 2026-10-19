import service from '@/utils/axiosService'

const getPage = (data) => service.post({ url: '/breejobs/page', data: data })
const save = (data) => service.post({ url: '/breejobs/save', data: data })
const deleteById = (id) => service.post({ url: `/breejobs/delete/${id}` })
const run = (id) => service.post({ url: `/breejobs/run/${id}` })
const reset = (id) => service.post({ url: `/breejobs/reset/${id}` })
const start = (id) => service.post({ url: `/breejobs/start/${id}` })
const stop = (id) => service.post({ url: `/breejobs/stop/${id}` })
const upload = (file, onProgress) => {
    const data = new FormData()
    data.append('file', file)  // file 是 File 对象，input 或拖拽获取
    return service.post({
        url: '/breejobs/upload', data: data, onUploadProgress: (progressEvent) => {
            if (onProgress) {
                const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total)
                onProgress(percent)
            }
        }
    })
}

export default { getPage, deleteById, save, run, start, stop, upload, reset }