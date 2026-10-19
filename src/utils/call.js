import jsonp from "jsonp"

function createCallTimer() {
    let startTime = 0
    let timer = null

    const format = (seconds) => {
        const h = String(Math.floor(seconds / 3600)).padStart(2, '0')
        const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0')
        const s = String(seconds % 60).padStart(2, '0')
        return `${h}:${m}:${s}`
    }

    return {
        start(callback) {
            startTime = Date.now()
            timer = setInterval(() => {
                const seconds = Math.floor((Date.now() - startTime) / 1000)
                callback?.(format(seconds), seconds)
            }, 1000)
        },

        stop() {
            clearInterval(timer)
            timer = null
        }
    }
}

/**
 *  处理json数据
 * @param {*} funName 方法名称
 * @param {*} data 数据
 * @returns 
 */
const getJsonpData = (funName, data) => {
    let request = {
        Data: data,
        Fun: funName,
        Sum: data?.Sum ?? '',
        SC: {
            Ak: '',
            Token: '',
            TS: getTimestamp(),
            CRC: '[debugAutoCRC]',
            SrcAddr: ''
        }
    }

    return {
        param: encryptBase64(JSON.stringify(request)),
        code: 'B64'
    }
}

/**
 * base64加密
 * @param {*} input 
 * @returns 
 */
const encryptBase64 = (input) => {
    const key = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/="
    let output = ""
    let i = 0
    let chr1, chr2, chr3, enc1, enc2, enc3, enc4

    input = input.replaceAll('\r\n', "\n")

    let utftext = ""
    for (let n = 0; n < input.length; n++) {
        const c = input.codePointAt(n)
        if (c < 128) {
            utftext += String.fromCodePoint(c)
        } else if (c < 2048) {
            utftext += String.fromCodePoint((c >> 6) | 192)
            utftext += String.fromCodePoint((c & 63) | 128)
        } else {
            utftext += String.fromCodePoint((c >> 12) | 224)
            utftext += String.fromCodePoint(((c >> 6) & 63) | 128)
            utftext += String.fromCodePoint((c & 63) | 128)
        }
    }

    input = utftext
    while (i < input.length) {
        chr1 = input.codePointAt(i++)
        chr2 = input.codePointAt(i++)
        chr3 = input.codePointAt(i++)

        enc1 = chr1 >> 2
        enc2 = ((chr1 & 3) << 4) | (chr2 >> 4)
        enc3 = ((chr2 & 15) << 2) | (chr3 >> 6)
        enc4 = chr3 & 63

        if (Number.isNaN(chr2)) {
            enc3 = enc4 = 64
        } else if (Number.isNaN(chr3)) {
            enc4 = 64
        }

        output = output +
            key.charAt(enc1) + key.charAt(enc2) +
            key.charAt(enc3) + key.charAt(enc4)
    }

    return output
}

/**
 * 时间戳
 * @returns 
 */
const getTimestamp = () => {
    const d = new Date()
    const d2 = Date.UTC(
        d.getUTCFullYear(),
        d.getUTCMonth(),
        d.getUTCDate(),
        d.getUTCHours(),
        d.getUTCMinutes(),
        d.getUTCSeconds(),
        d.getUTCMilliseconds()
    )
    return d2 + '000'
}

/**
 * 格式化 Date 对象为 yyyy-MM-dd hh:mm:ss
 * @param {Date} date
 * @returns {string}
 */
function formatDate(date) {
    const pad = n => n.toString().padStart(2, '0')

    const yyyy = date.getFullYear()
    const MM = pad(date.getMonth() + 1)
    const dd = pad(date.getDate())
    const hh = pad(date.getHours())
    const mm = pad(date.getMinutes())
    const ss = pad(date.getSeconds())

    return `${yyyy}-${MM}-${dd} ${hh}:${mm}:${ss}`
}

/**
 * 格式化自定义时间戳（相对2018年）
 * @param {number|string} ts
 * @returns {string}
 */
function getTime(ts) {
    const baseTime = new Date('2018-01-01T00:00:00Z').getTime()
    const realMillis = Number.parseInt(ts) / 1000 + baseTime
    const d = new Date(realMillis)
    return formatDate(d)
}

/**
 * 隐藏电话号码中间数字
 * @param {string} phone 原始号码
 * @returns {string} 隐藏后的号码
 */
function maskPhone(phone) {
    if (!phone) return ''

    const str = phone.toString()

    // 如果是 11 位手机号
    if (str.length === 11) {
        return str.slice(0, 3) + '****' + str.slice(7)
    }

    // 如果带区号（如 010-88886666 或 01088886666）
    const digits = str.replaceAll('-', '')
    if (digits.length > 7) {
        const hideLength = Math.min(4, Math.floor(digits.length / 3))
        const start = Math.floor((digits.length - hideLength) / 2)
        return digits.slice(0, start) + '*'.repeat(hideLength) + digits.slice(start + hideLength)
    }

    // 其他情况，后 4 位隐藏
    if (str.length > 4) {
        return str.slice(0, str.length - 4) + '****'
    }

    return str
}

/**
 * 基础封装
 * @param {*} actionName 
 * @param {*} funName 
 * @param {*} data 
 * @returns 
 */
const baseSend = (actionName, funName, data) => {
    const url = `http://127.0.0.1:4444/${actionName}`
    const paramObj = getJsonpData(funName, data)

    const query = new URLSearchParams(paramObj).toString()
    const requestUrl = `${url}?${query}`

    return new Promise((resolve, reject) => {
        jsonp(
            requestUrl,
            { param: 'callback', timeout: 10000 },
            (err, data) => {
                if (err) {
                    const resultData = JSON.parse(localStorage.getItem('callInfPer'))
                    if (resultData?.isUse) {
                        alert('请求失败，请检测呼叫软件是否打开！')
                    } else {
                        console.error('JSONP 请求失败:', err)
                    }
                    reject(err)
                } else {
                    resolve(data)
                }
            }
        )
    })
}

const checkStatus = () => {
    return baseSend('ctrl', 'VoipState', {
        UID: 'A1004',
        CallID: ''
    })
}

const getCallDataPage = (auditId, pageIndex, pageSize) => {
    return baseSend('ctrl', 'GetOrderPageInf', {
        UID: '',
        OrderID: auditId,
        NowPage: pageIndex,
        PageShowCount: pageSize,
        UploadedBSYSState: 0
    })
}

const getAutoCallData = (auditId) => {
    return baseSend('ctrl', 'GetAutoCallInf', {
        UID: '',
        AuditId: auditId
    })
}

const updateReamrk = (uId, callId, remark, orderId = '', orderName = '') => {
    return baseSend('ctrl', 'UpdataCallInf_OrderInf', {
        UID: uId,
        CallID: callId,
        NewOrderID: orderId,
        NewOrderName: orderName,
        NewSum: remark,
        Force: true,
        ResID: '',
        SetUpdataStat: 0
    })
}

const playAudioRecord = (data) => {
    return baseSend('ctrl', 'VoiceRecordPlay', {
        UID: data?.uid ?? '',
        CallID: data?.call_id ?? '',
        LDB_Bin: data?.ldb_bin ?? '',
        RecID: data?.resource_id ?? '',
        AudioUrl: data?.audio_url ?? '',
        OrderID: data?.audit_id ?? '',
        DefSWPlay: true
    })
}

const call = (auditId, main_name, phone, is_encode = false, call_line = 'A', is_auto = 0, encode_phone = '') => {
    let request = {
        PhoneNumView: phone,
        PhoneNumEncode: encode_phone,
        IsEncode: is_encode,
        CallLine: call_line,
        OrderID: auditId,
        OrderName: main_name,
        CallUID: 'A1004',
        PNTfID: is_auto
    }

    console.log(request)
    // uid 当前审核员的uid
    return baseSend('call', 'CallOut', request)
}

const uploadAudio = (item) => {
    const call_time = item.call_time === undefined ? '' : getTime(item.call_time)
    const phone = item.phone === undefined ? '' : maskPhone(item.phone)
    const request = {
        UID: 'A1004',
        CallID: item?.call_id ?? '',
        LDB_Bin: item?.ldb_bin ?? '',
        AudioUrl: item?.audio_url ?? '',
        SID: item?.sid ?? '',
        CallTime: call_time,
        Phone: phone,
        AuditId: item?.audit_id ?? '',
        Host: 'http://192.168.20.5/Mp'//`${window.location.origin}/${hose_name}`
    }
    return baseSend('ctrl', 'UploadVoiceRecord', request)
}

const getUploadAudioResult = (call_id) => {
    return baseSend('ctrl', 'GetUploadVoiceRecordResult', {
        UID: 'A1004',
        CallID: call_id
    })
}

const changeMic = () => {
    return baseSend('call', 'MicMute', {
        UID: 'A1004'
    })
}

const changeWorkStatus = (funName, isKefu = false) => {
    return baseSend('ctrl', funName, {
        UID: 'A1004',
        HideRegButs: true,
        HideWorkButs: true,
        HideDTMFButs: true,
        HideWin: true,
        HideLocalCallRecordWin: true,
        IsKF: isKefu  // 接电话的窗体
    })
}

const pickUp = () => {
    return baseSend('call', 'PickUp', {
        UID: 'A1004'
    })
}

const hangUp = () => {
    return baseSend('call', 'HangUp', {
        UID: 'A1004'
    })
}

const sendDTMF = (dtmfStr) => {
    return baseSend('call', 'SendDTMF', {
        UID: 'A1004',
        DTMFStr: dtmfStr
    })
}

export {
    call, changeMic, changeWorkStatus, checkStatus, createCallTimer,
    getAutoCallData, getCallDataPage, getTime, getUploadAudioResult, hangUp,
    maskPhone, pickUp, playAudioRecord, sendDTMF, updateReamrk, uploadAudio
}

