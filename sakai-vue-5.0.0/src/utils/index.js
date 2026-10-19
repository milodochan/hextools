import CryptoJS from 'crypto-js'

/**
 * des 加密
 * @param {*} content 
 * @param {*} secretKey 
 * @returns 
 */
const encrypt = (content, secretKey) => {
    try {
        // key 必须是 WordArray
        const key = CryptoJS.enc.Utf8.parse(secretKey)

        // AES/ECB/PKCS7
        const encrypted = CryptoJS.AES.encrypt(content, key, {
            mode: CryptoJS.mode.ECB,
            padding: CryptoJS.pad.Pkcs7
        })

        return encrypted.toString() // Base64
    } catch (error) {
        console.error('加密失败:', error)
        return null
    }
}

/**
 * AES 解密（ECB + Pkcs7）
 * @param {string} content Base64 密文
 * @param {string} secretKey 16/24/32 字符 AES key
 * @returns {string} 明文
 */
const decrypt = (content, secretKey) => {
    try {
        // key 必须是 WordArray
        const key = CryptoJS.enc.Utf8.parse(secretKey)

        const bytes = CryptoJS.AES.decrypt(content, key, {
            mode: CryptoJS.mode.ECB,
            padding: CryptoJS.pad.Pkcs7
        })

        return bytes.toString(CryptoJS.enc.Utf8)
    } catch (error) {
        console.error('解密失败:', error)
        return null
    }
}

/**
 * 字符串时间格式化
 * @param {*} isoString 
 * @returns 
 */
const formatDate = (isoString) => {
    const date = new Date(isoString)

    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')

    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const seconds = String(date.getSeconds()).padStart(2, '0')

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

const formatDurationWithLevel = (seconds) => {
    let prefix = ''
    if (seconds < 0) {
        prefix = '-'
        seconds = Math.abs(seconds)
    }

    const sec = seconds % 60
    const totalMinutes = Math.floor(seconds / 60)
    const min = totalMinutes % 60
    const totalHours = Math.floor(totalMinutes / 60)
    const hour = totalHours % 24
    const day = Math.floor(totalHours / 24)

    let text = ''
    if (day > 0) text += `${day}天`
    if (hour > 0 || day > 0) text += `${hour}小时`
    if (min > 0 || hour > 0 || day > 0) text += `${min}分`
    text += `${sec}秒`

    let level = 'normal'
    if (day >= 7) {
        level = 'danger'  // 红色预警
    } else if (totalHours >= 24) {
        level = 'warn'    // 黄色预警
    } else if (totalHours >= 12) {
        level = 'info'    // 蓝色预警
    }

    return {
        text: prefix + text,
        level
    }
}

const filterDataBuild = (items) => {
    return {
        queryList: items.map(item => ({
            field: item.field,
            value: item.value,
            fieldOperator: JavaFilterTypeMap[item.fieldOperator]
        }))
    }
}

const JavaFilterTypeMap = {
    '=': 'EQ',
    '!=': 'NE',

    '>': 'GT',
    '>=': 'GE',

    '<': 'LT',
    '<=': 'LE',

    like: 'LIKE',
    notLike: 'NOT_LIKE',

    in: 'IN',
    notIn: 'NOT_IN',

    isNull: 'IS_NULL',
    isNotNull: 'IS_NOT_NULL',

    or: 'OR'
}



export { decrypt, encrypt, filterDataBuild, formatDate, formatDurationWithLevel }
export default { encrypt, decrypt, formatDate, formatDurationWithLevel, filterDataBuild }