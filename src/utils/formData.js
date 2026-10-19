import { FromEnum } from '@/utils/form'

export const fromData = [//行
    [//列
        {
            field: 'a',
            fieldType: FromEnum.INPUT_TEXT,
            fieldAttr: {
                label: '普通输入框',
                placeholder: '提示语',
                options: [],
                rowSpan: 3,
                require: true,
                requireRule: {
                    min: 0,
                    max: 10
                }
            }
        },
        {
            fromType: FromEnum.INPUT_TEXT,
            label: '富文本',
            placeholder: '提示语',
            field: 'a',
            value: ''
        },
        {
            fromType: FromEnum.INPUT_TEXT,
            label: '富文本',
            placeholder: '提示语',
            field: 'a',
            value: ''
        }
    ], [
        {
            fromType: FromEnum.INPUT_TEXTAREA,
            label: '普通输入框',
            placeholder: '提示语',
            field: 'a',
            value: ''
        },
        {
            fromType: FromEnum.INPUT_TEXTAREA,
            label: '富文本',
            placeholder: '提示语',
            field: 'a',
            value: ''
        }
    ], [
        {
            fromType: FromEnum.DATE_PICKER,
            label: '日期',
            placeholder: '提示语',
            field: 'a',
            value: '2015-05-25'
        }
    ], [
        {
            fromType: FromEnum.RADIO_BUTTON,
            label: '单选',
            placeholder: '',
            renderData: [{
                label: '男',
                value: 1
            }, {
                label: '女',
                value: 0
            }],
            field: 'radio',
            value: 0
        },
        {
            fromType: FromEnum.CHECKBOX,
            label: '多选',
            placeholder: '',
            renderData: [{
                label: '男',
                value: 1
            }, {
                label: '女',
                value: 0
            }],
            field: 'checkbox',
            value: 0
        },
        {
            fromType: FromEnum.TOGGLE_BUTTON,
            label: 'switch 按钮',
            placeholder: '提示语',
            field: 'switch',
            value: 0
        }
    ], [
        {
            fromType: FromEnum.SELECT,
            label: '下拉单选',
            placeholder: '提示语',
            renderData: [{
                label: '男',
                value: 1
            }, {
                label: '女',
                value: 0
            }],
            field: 'select',
            value: 0
        },
        {
            fromType: FromEnum.MULTI_SELECT,
            label: '下拉多选',
            placeholder: '提示语',
            renderData: [{
                label: '男',
                value: 1
            }, {
                label: '女',
                value: 0
            }],
            field: 'multiselect',
            value: 0
        },
        {
            fromType: FromEnum.TREE_SELECT,
            label: '树形下拉',
            placeholder: '提示语',
            renderData: [
                {
                    key: '0',
                    label: 'Documents',
                    data: 'Documents Folder',
                    icon: 'pi pi-fw pi-inbox',
                    children: [
                        {
                            key: '0-0',
                            label: 'Work',
                            data: 'Work Folder',
                            icon: 'pi pi-fw pi-cog',
                            children: [
                                { key: '0-0-0', label: 'Expenses.doc', icon: 'pi pi-fw pi-file', data: 'Expenses Document' },
                                { key: '0-0-1', label: 'Resume.doc', icon: 'pi pi-fw pi-file', data: 'Resume Document' }
                            ]
                        },
                        {
                            key: '0-1',
                            label: 'Home',
                            data: 'Home Folder',
                            icon: 'pi pi-fw pi-home',
                            children: [{ key: '0-1-0', label: 'Invoices.txt', icon: 'pi pi-fw pi-file', data: 'Invoices for this month' }]
                        }
                    ]
                }
            ],
            field: 'treeselect',
            value: 0
        }
    ]
]

const data = ref({
    name: '',
    pid: '',
    url: '',
    ico: '',
    component: ''
})