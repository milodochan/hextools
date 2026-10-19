import { z } from 'zod'

/**
 * 表单字段类型
 */
const FormEnum = Object.freeze({
    INPUT_TEXT: 'input_text',
    INPUT_NUMBER: 'input_number',
    INPUT_TEXTAREA: 'input_textarea',
    DATE_PICKER: 'date_picker',
    RADIO_BUTTON: 'radio_button',
    CHECKBOX: 'checkbox',
    TOGGLE_BUTTON: 'toggle_button',
    SELECT: 'select',
    MULTI_SELECT: 'multi_select',
    TREE_SELECT: 'tree_select'
})

/**
 * 表单验证
 * @param {*} formConfig 
 * @returns 
 */
const buildZodSchema = (formConfig) => {
    const schemaShape = {}

    if (formConfig === undefined || formConfig == null) {
        return schemaShape
    }

    formConfig.flat().forEach(item => {
        const field = item.field
        if (!field) return

        const require = item.fieldAttr.require
        if (!require) {
            schemaShape[item.field] = z.any()
            return
        }

        let schema
        const requireRule = item.fieldAttr.requireRule
        const label = item.fieldAttr.label
        switch (item.fieldType) {
            case FormEnum.INPUT_TEXT:
            case FormEnum.INPUT_TEXTAREA:
                if (requireRule) {
                    schema = z.string()
                    if (requireRule.min !== undefined) {
                        if (requireRule.min < 1) requireRule.min = 1
                        schema = schema.min(requireRule.min, { message: `最少${requireRule.min}个字符。` })
                    }
                    if (requireRule.max !== undefined) schema = schema.max(requireRule.max, { message: `最多${requireRule.max}个字符。` })
                }
                else schema = z.string().min(1, { message: `${label}为必填项。` })
                break

            case FormEnum.INPUT_NUMBER:
                if (requireRule) {
                    schema = z.number()
                    console.log(requireRule)
                    if (requireRule.min !== undefined) schema = schema.gt(requireRule.min, { message: `数值必须必须大于${requireRule.min}。` })
                    if (requireRule.max !== undefined) schema = schema.lt(requireRule.max, { message: `数值必须必须小于${requireRule.max}。` })
                    schema = z.union([schema, z.literal(null)]).refine((val) => val !== null, { message: `${label}为必填项。` })
                    //if (requireRule.int !== undefined && requireRule.int) schema = schema.refine((val) => Number.isInteger(val), { message: `${label}必须是整数` })
                }
                else schema = z.union([z.literal(null)]).refine((val) => val !== null, { message: `${label}为必填项。` })
                break

            case FormEnum.DATE_PICKER:
                schema = z.string().refine(val => !!Date.parse(val), {
                    message: `${label}必须是有效日期。`
                })
                break

            case FormEnum.RADIO_BUTTON:
            case FormEnum.SELECT:
                schema = z.union([z.string(), z.number()]).refine(val => val !== null && val !== '', {
                    message: `${label}为必填项。`
                })
                break

            case FormEnum.CHECKBOX:
            case FormEnum.MULTI_SELECT:
                schema = z.array(z.union([z.string(), z.number()])).min(1, { message: `${label}至少选择一项。` })
                break

            case FormEnum.TOGGLE_BUTTON:
                schema = z.boolean().refine(val => val === true, {
                    message: `${label}必须开启。`
                })
                break

            case FormEnum.TREE_SELECT:
                // 示例：{ 0: true } or null
                schema = z.union([z.record(z.boolean()), z.null()]).refine(
                    (val) => val && Object.keys(val).length > 0,
                    { message: `${label}为必选项。` }
                )
                break

            default:
                schema = z.any()
        }

        schemaShape[item.field] = schema
    })

    return z.object(schemaShape)
}

/**
 * 初始化特定组件值
 * @param {*} formConfig 
 * @param {*} data 
 * @returns 
 */
function normalizeInitialValues(formConfig, data) {
    const result = { ...data }

    formConfig?.flat().forEach(item => {
        if (data && Object.prototype.hasOwnProperty.call(data, item.field)) {
            try {
                if (item.fieldType === FormEnum.TREE_SELECT) {
                    result[item.field] = { [data[item.field].trim()]: true }
                }
            }
            catch (e) {

            }
        }
    })

    return result
}

/**
 * 反初始化特定组件值
 * @param {*} formConfig 
 * @param {*} values 
 * @returns 
 */
function denormalizeFormValues(formConfig, values) {
    const result = { ...values }

    formConfig?.flat().forEach(item => {
        if (values && Object.prototype.hasOwnProperty.call(values, item.field)) {
            try {
                if (item.fieldType === FormEnum.TREE_SELECT) {
                    const val = values[item.field]
                    result[item.field] = Object.keys(val || {})[0] || null
                }
            }
            catch (e) {

            }
        }
    })

    return result
}

/**
 * 同步数据回原对象
 * @param {*} initialData 
 * @param {*} formConfig 
 * @returns 
 */
function syncformConfig(initialData, formConfig) {
    Object.keys(formConfig).forEach(key => {
        // 如果字段是嵌套对象且存在于原始数据中，递归处理
        if (initialData.hasOwnProperty(key)) {
            if (typeof initialData[key] === 'object' && initialData[key] !== null && typeof formConfig[key] === 'object' && formData[key] !== null) {
                initialData[key] = syncformConfig(initialData[key], formConfig[key]) // 递归调用
            } else {
                initialData[key] = formConfig[key]
            }
        }
    })
    return initialData
}

/**
 * 表单对象feild转json对象
 * @param {*} fieldsObj 
 * @returns 
 */
function extractFormValues(fieldsObj) {
    const result = {}
    for (const key in fieldsObj) {
        if (fieldsObj.hasOwnProperty(key)) {
            result[key] = fieldsObj[key]?.states?.value
        }
    }
    return result
}

export { buildZodSchema, denormalizeFormValues, extractFormValues, FormEnum, normalizeInitialValues, syncformConfig }

