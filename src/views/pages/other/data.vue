<script setup>
import api from '@/api/other/data'
import { DialogContentSlot, useDialog, useMessage } from '@layoutkit/prime-vue-layoutkit'
import html2canvas from 'html2canvas'
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'

const message = useMessage()
const showBtn = ref(true)
const isBlackList = ref(false)
const isAbnormal = ref(false)
const baseData = ref({})
const changeRecordData = ref([])
const shareholderData = ref([])
const reportYearData = ref([])
const extensionData = ref([])
const route = useRoute()
const dialog = useDialog()
const currentReportYear = ref({})
const totalCount = ref(0)
const keyword = ref('')

const getInfo = async (callback) => {
    const res = await api.getInfo(keyword.value)
    if (res.code !== 0) return

    baseData.value = res.data
    callback()
}

const getChangeRecords = async () => {
    const res = await api.getChangeRecords(keyword.value)
    if (res.code !== 0) return

    changeRecordData.value = res.data?.ChangeRecords
}

const getShareholder = async () => {
    const res = await api.getShareholder(keyword.value)
    if (res.code !== 0) return

    shareholderData.value = res.data?.Partners
}

const getReportYear = async () => {
    const res = await api.getReportYear(keyword.value)
    if (res.code !== 0 || res.data?.total === 0) return

    reportYearData.value = res.data?.items
    totalCount.value = res.data?.total
}

const getException = async () => {
    const res = await api.getException(keyword.value)
    if (res.code !== 0 || res.data?.total === 0) return

    extensionData.value = res.data?.items
}

const yearReportDetail = (item) => {
    currentReportYear.value = item
    dialog.register(`${item.report_year}年度报告`)
        .setWidth('80rem')
        .setAttr({ maximizable: true })
        .setComponent('reportYearDetail')
        .show()
}

const capture = () => {
    const el = document.querySelector('#canvas') // 或你的 div id

    html2canvas(el, {
        useCORS: true,
        scale: 2
    }).then(canvas => {
        const link = document.createElement('a')
        link.download = 'capture.png'
        link.href = canvas.toDataURL()
        link.click()
    })
}

const loadData = (dataType) => {
    baseData.value = {}
    extensionData.value = []
    shareholderData.value = []
    reportYearData.value = []

    switch (dataType) {
        case 'holder': //股东信息
            getInfo(() => getShareholder())
            break
        case 'reportyear': //企业年报
            getInfo(() => getReportYear())
            break
        case 'exception': //基本信息
            getInfo(() => getException())
            break
        default:
            getInfo(() => getChangeRecords())
            break
    }
}

const open = (name) => {
    if (!keyword.value) {
        message.warning('请输入查询内容')
        return
    }
    const local = globalThis.location
    const query = `?keyword=${keyword.value}&showBtn=false&dataType=${name}`
    globalThis.open(`${local.origin}${local.pathname}#/kit/business/open${query}`)
}

onMounted(() => {
    showBtn.value = route.query.showBtn
    keyword.value = route.query.keyword
    if (!keyword.value) return

    loadData(route.query.dataType)

    document.body.style.overflow = 'auto'
    document.documentElement.style.overflow = 'auto'
})
</script>

<template>
    <div class="canvas">
        <!-- 原来的所有内容 -->
        <div class="flex flex-col gap-2" style="width:100%;">
            <div class="flex flex-row gap-2 w-full bg-gray-100 items-center">
                <div style="width:20%;">来源：水滴信用</div>
                <div style="width:50%;">最后更新时间：{{ baseData.date }}</div>
                <div style="width:30%;">
                    <Button label="生成完整截图" alt="点击后在图片上右键【复制图片】后可在中间结果中粘贴" class="invisible" @click="capture" />
                </div>
            </div>

            <div class="flex flex-row gap-2 w-full mt-2" v-if="!showBtn">
                <InputText v-model="keyword" placeholder="输入主体名称/注册号/组织机构代码/统一社会信用代码查询" />
                <Button label="企业基本信息查询" @click="open('')" />
                <Button label="股东信息查询" @click="open('holder')" />
                <Button label="企业年报查询" @click="open('reportyear')" />
            </div>
        </div>

        <div id="canvas">
            <div class="nameBox  clearfix">
                <div class="yyzz">
                    <a href="javascript:void(0)" class="yyzz a" />
                </div>
                <div class="companyDetail clearfix">
                    <div class="companyName">
                        <h1 class="fullName">
                            <strong>
                                <span>{{ baseData.Name }}</span>
                            </strong>
                        </h1>
                        <span v-if="baseData.BusExceptCount === 0 || baseData.BusExceptCount === 2"
                            class="companyStatus" style="display: inline-block;"
                            :style="baseData.Status.includes('吊销') || baseData.Status.includes('注销') ? 'background: red' : 'background: rgb(67, 149, 225)'">
                            <span class="Status">
                                {{ baseData.Status }}
                            </span>
                        </span>
                        <span v-if="baseData.BusExceptCount === 1 || extensionData.length > 0" class="companyStatus"
                            style="display: inline-block;background: rgb(255,88,87);margin-left:2px;cursor:default">
                            <span id="detail0" @click="() => isAbnormal = true">该企业被列入经营异常名录，点击查看详情</span>
                            <div class="metitle" v-if="isAbnormal">
                                <h5>
                                    经营异常名录
                                    <span class="cls" @click="() => isAbnormal = false">X</span>
                                </h5>
                                <div class="ctt">
                                    该企业被列入市场监管部门经营异常名录
                                </div>
                            </div>
                        </span>
                        <span v-if="baseData.BusExceptCount === 2" class="companyStatus"
                            style="display: inline-block;background: rgb(255,88,87);margin-left:2px;cursor:default">
                            <span id="detail1" @click="() => isBlackList = true">该企业被列入黑名单，点击查看详情</span>
                            <div class="metitle" v-if="isBlackList">
                                <h5>
                                    黑名单
                                    <span class="cls" @click="() => isBlackList = false">X</span>
                                </h5>
                                <div class="ctt">
                                    该企业被列入严重违法失信企业名单
                                </div>
                            </div>
                        </span>
                    </div>
                    <span class="regNum_inner">
                        <i class="abs fa fa-map1" aria-hidden="true"></i>
                        <strong><span class="codeTitle">{{ baseData.CreditCode != null ? '统一社会信用代码' : '注册号'
                                }}</span>：</strong>
                        <span style="margin-left:10px;" class="nameBoxColor">
                            <span class="CreditCode">{{ baseData.CreditCode }}</span>
                        </span>
                    </span>
                    <span class="owner">
                        <i class="abs fa fa-user1" aria-hidden="true"></i>
                        <strong> 法定代表人：</strong>
                        <span style="margin-left:10px;" class="nameBoxColor">
                            <span class="OperName">{{ baseData.OperName }}</span>
                        </span>
                    </span>
                    <span class="regNum_inner">
                        <i class="abs fa fa-map-marker1" aria-hidden="true"></i>
                        <strong>登记机关：</strong>
                        <span style="margin-left:10px;" class="nameBoxColor">
                            <span class="BelongOrg">{{ baseData.BelongOrg }}</span>
                        </span>
                    </span>
                    <span class="regNum_inner">
                        <i class="abs fa fa-info-circle1" aria-hidden="true"></i>
                        <strong>成立日期 : </strong>
                        <span style="margin-left:10px;" class="nameBoxColor">
                            <span class="StartDate">{{ baseData.StartDate }}</span>
                        </span>
                    </span>
                </div>
            </div>

            <div class="content">
                <div class="menu">
                    <div class="menu-i">
                        <span id="tab_primary1" class="active">
                            基础信息
                        </span>
                        <div style="height:16px;width:1px;position:absolute; right:1px;background:#ccc; top: 9px">
                        </div>
                    </div>
                </div>
                <div class="content-i" style="display: block;">
                    <div class="tabin mainContent">
                        <div class="details clearfix">
                            <div class="classify">营业执照信息</div>
                            <div class="overview">
                                <dl>
                                    <dt class="item">
                                        {{ baseData.CreditCode != null ? '统一社会信用代码：' : '注册号：' }}
                                    </dt>
                                    <dd class="result">
                                        <!-- 这里还需要添加业务逻辑 -->
                                        <span class="CreditCode copyable">
                                            {{ baseData.CreditCode != null ? baseData.CreditCode : baseData.No }}
                                        </span>
                                    </dd>
                                </dl>
                                <dl>
                                    <dt class="item_right">企业名称：</dt>
                                    <dd class="result" title="企业名称">
                                        <span id="Name" class="copyable">
                                            {{ baseData.Name }}
                                        </span>
                                    </dd>
                                </dl>
                                <dl>
                                    <dt class="item">企业类型：</dt>
                                    <dd class="result">
                                        <span id="EconKind" class="copyable">
                                            {{ baseData.EconKind }}
                                        </span>
                                    </dd>
                                </dl>
                                <dl>
                                    <dt class="item_right">法定代表人：</dt>
                                    <dd class="result">
                                        <span class="OperName copyable">
                                            {{ baseData.OperName }}
                                        </span>
                                    </dd>
                                </dl>
                                <dl>
                                    <dt class="item">注册资本：</dt>
                                    <dd class="result">
                                        <span id="RegistCapi">
                                            {{ baseData.RegistCapi }}
                                        </span>
                                    </dd>
                                </dl>
                                <dl>
                                    <dt class="item_right">成立日期：</dt>
                                    <dd class="result">
                                        <span class="StartDate copyable">
                                            {{ baseData.StartDate }}
                                        </span>
                                    </dd>
                                </dl>
                                <dl>
                                    <dt class="item">营业期限自：</dt>
                                    <dd class="result">
                                        <span id="TermStart">
                                            {{ baseData.TermStart }}
                                        </span>
                                    </dd>
                                </dl>
                                <dl>
                                    <dt class="item_right">营业期限至：</dt>
                                    <dd class="result">
                                        <span id="TeamEnd">
                                            {{ baseData.TeamEnd }}
                                        </span>
                                    </dd>
                                </dl>
                                <dl>
                                    <dt class="item">登记机关：</dt>
                                    <dd class="result">
                                        <span class="BelongOrg">
                                            {{ baseData.BelongOrg }}
                                        </span>
                                    </dd>
                                </dl>
                                <dl>
                                    <dt class="item_right">核准日期：</dt>
                                    <dd class="result">
                                        <span id="CheckDate">
                                            {{ baseData.CheckDate }}
                                        </span>
                                    </dd>
                                </dl>
                                <dl>
                                    <dt class="item">登记状态：</dt>
                                    <dd class="result">
                                        <span class="Status">
                                            {{ baseData.Status }}
                                        </span>
                                    </dd>
                                </dl>
                                <dl>
                                    <dt class="item_right">联系电话：</dt>
                                    <dd class="result">
                                        <span id="PhoneNumber">
                                            {{ baseData.PhoneNumber }}
                                        </span>
                                    </dd>
                                </dl>
                                <dl class="item info-dl all">
                                    <dt class="item_right">企业地址：</dt>
                                    <dd class="result">
                                        <span id="Address" class="copyable">
                                            {{ baseData.Address }}
                                        </span>
                                    </dd>
                                </dl>
                                <dl class="item info-dl all">
                                    <dt class="item">经营范围：</dt>
                                    <dd>
                                        <span id="Scope" class="copyable">
                                            {{ baseData.Scope }}
                                        </span>
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                    <div v-if="shareholderData && shareholderData.length > 0" class="holderInfo">
                        <div class="classify" id="shareHolderForAll">
                            股东及出资信息
                        </div>
                        <div id="shareholderInfo_wrapper" class="dataTables_wrapper form-inline dt-bootstrap no-footer">
                            <div class="row">
                                <div class="col-sm-6">
                                    <div class="dataTables_length" id="shareholderInfo_length"><label>
                                            显示
                                            <select name="shareholderInfo_length" aria-controls="shareholderInfo"
                                                class="form-control input-sm">
                                                <option value="10">10</option>
                                                <option value="25">25</option>
                                                <option value="50">50</option>
                                                <option value="100">100</option>
                                            </select>
                                            项结果</label>
                                    </div>
                                </div>
                                <div class="col-sm-6">
                                    <div id="shareholderInfo_filter" class="dataTables_filter">
                                        <label>Search:<input type="search" class="form-control input-sm" placeholder=""
                                                aria-controls="shareholderInfo">
                                        </label>
                                    </div>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-sm-12">
                                    <table class="display dataTable no-footer" id="shareholderInfo" role="grid"
                                        aria-describedby="shareholderInfo_info">
                                        <thead>
                                            <tr role="row">
                                                <th class="sorting_disabled" rowspan="1" colspan="1" width="6%">
                                                    序号
                                                </th>
                                                <th class="sorting_disabled" rowspan="1" colspan="1" width="">
                                                    股东名称
                                                </th>
                                                <th class="sorting_disabled" rowspan="1" colspan="1" width="18%">
                                                    股东类型
                                                </th>
                                                <th class="sorting_disabled" rowspan="1" colspan="1" width="">
                                                    证照/证件类型
                                                </th>
                                                <th class="sorting_disabled" rowspan="1" colspan="1" width="">
                                                    证照/证件号码
                                                </th>
                                                <th class="sorting_disabled" rowspan="1" colspan="1" width="6%">
                                                    详情
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody id="tbodyPartners">
                                            <tr v-for="item, index in shareholderData" role="row" class="odd">
                                                <td>{{ index + 1 }}</td>
                                                <td>{{ item.StockName }}</td>
                                                <td>{{ item.StockType }}</td>
                                                <td>非公示项</td>
                                                <td>非公示项</td>
                                                <td><span class="clickToDetail">查看</span></td>
                                                <!-- <td>
                                                        <span class="clickToDetail"
                                                            onclick="shareHodlerDetail('李彦宏','PROVINCENODENUM1100005B45713B994F4986BDA016B1A6C60B15')">查看</span>
                                                    </td> -->
                                            </tr>
                                        </tbody>
                                    </table>
                                    <!-- <div id="shareholderInfo_processing"
                                            class="dataTables_processing panel panel-default" style="display: none;">
                                            正在加载，请稍候</div> -->
                                </div>
                            </div>
                        </div>

                    </div>
                    <div class="wrap" id="wrap-keyperson" style="display: none;">
                        <div id="keyPerson" class="keyPerson">
                            <div class="classify rel" id="keyperForAll">
                                主要人员信息
                                <span class="personCount">
                                    <span id="perCount"></span>
                                </span>
                            </div>
                            <div id="personInfo" class="clearfix">
                                <ul id="ulPersonInfo" class="people-list" style="float: left;">
                                    <!-- <li>
                                        <a>
                                            <div class="people-list-div list1">祥</div>
                                            <div class="people-list-position">
                                                <span>
                                                    <img
                                                        src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB0AAAAOCAYAAADT0Rc6AAABoUlEQVR42r2UT0REURTGr5G0eCJJWkWrFrNLxshom1m0mM1IRkak1WgRLUbSLmmRJDIyRtImaTFGJC3Sov0s0ma0GEkkSVrE9J18L2fuvDtv2nT5effdd+89/77zjGkefWDV/PNYA0ecz4JPBxPcMwkyCjkzB94c1E1AlE9gOMSpG/W+AHbpyD7YBvNck5EEp5x303DT2ALr/CgX9Frfl8E9GAhw5hl4nIvRPd4zDc4492yjMV7YA/LgUn2TzUXQACuODNhGa6AMbsEj5xXbaJEpksVXpjjC9EkdCmCcB6tgKsRoR+mNEIlwEUTpodQvYRlI0REpxQ4vavBZo9EyDfoaSDLVLTXNK6/8lHsOhogr0jtQYhAPnB/aRsWLL7bLCTjmWp28gA/1vtkmvV3Uhp1eo/b89tsByHJjv3Vpho6YDoSUowaEc6a8oBgNukBqG+fzL0Zn2CqigTTZoILTikH/UJx9KjV4p0o7iVR695qluaIu9LDT26LIJTCmRHShqFLNei1H0aRUDbMUTSlASD6uXv/5JSZCGAk4F2V07Yh9A2Qgg+AVrBiLAAAAAElFTkSuQmCC">
                                                </span>
                                            </div>
                                        </a>
                                    </li> -->
                                </ul>
                            </div>
                        </div>
                    </div>
                    <div v-if="reportYearData && reportYearData.length > 0" class="keyPerson">
                        <div class="classify rel" id="yearReportAll">
                            企业年报信息
                            <span class="personCount">
                            </span>
                        </div>
                        <table class="display dataTable no-footer" id="yearReportInfo" role="grid"
                            aria-describedby="shareholderInfo_info">
                            <thead>
                                <tr role="row">
                                    <th class="sorting_disabled" rowspan="1" colspan="1" width="6%">序号</th>
                                    <th class="sorting_disabled" rowspan="1" colspan="1" width="">报送年度</th>
                                    <th class="sorting_disabled" rowspan="1" colspan="1" width="">公示日期</th>
                                    <th class="sorting_disabled" rowspan="1" colspan="1" width="6%">详情</th>
                                </tr>
                            </thead>
                            <tbody id="tbodYearReport">
                                <tr v-for="item, index in reportYearData" role="row" class="odd">
                                    <td>{{ index + 1 }}</td>
                                    <td>{{ item.report_year }}</td>
                                    <td>{{ item.report_date }}</td>
                                    <td>
                                        <span class="clickToDetail" @click="yearReportDetail(item)">查看</span>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div v-if="changeRecordData && changeRecordData.length > 0" class="changeInfo">
                        <div class="classify">
                            变更信息
                        </div>
                        <table class="table dataTable table-striped table-bordered table-hover dataTables-example">
                            <thead>
                                <tr role="row">
                                    <th width="6%" class="sorting_disabled" rowspan="1" colspan="1">序号</th>
                                    <th width="22%" class="sorting_disabled" rowspan="1" colspan="1">变更事项</th>
                                    <th class="sorting_disabled" rowspan="1" colspan="1">变更前内容</th>
                                    <th class="sorting_disabled" rowspan="1" colspan="1">变更后内容</th>
                                    <th width="13%" class="sorting_disabled" rowspan="1" colspan="1">变更日期</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-if="changeRecordData.length === 0">
                                    <td colspan="5">
                                        <div style="text-align: center;">
                                            暂无变更信息
                                        </div>
                                    </td>
                                </tr>
                                <tr v-for="item, index in changeRecordData">
                                    <td>{{ index + 1 }}</td>
                                    <td>{{ item.ProjectName }} </td>
                                    <td class="altcontent">
                                        {{
                                            item.BeforeContent?.replace(/<.*?>/ig, '')?.replace('\r',
                                                '<br />')?.replace('\n', '<br />')
                                        }}
                                    </td>
                                    <td class="altcontent">
                                        {{
                                            item.AfterContent?.replace(/<.*?>/ig, '')?.replace('\r',
                                                '<br />')?.replace('\n', '<br />')
                                        }}
                                    </td>
                                    <td>{{ item.ChangeDate }} </td>
                                </tr>
                            </tbody>

                        </table>
                    </div>
                    <div v-if="extensionData && extensionData.length > 0" class="keyPerson">
                        <div class="classify rel">
                            列入经营异常名录信息
                            <span class="personCount"><span id="perCount"></span><a></a></span>
                        </div>
                        <table class="display dataTable no-footer" id="yearReportInfo" role="grid"
                            aria-describedby="shareholderInfo_info">
                            <thead>
                                <tr role="row">
                                    <th class="sorting_disabled" rowspan="1" colspan="1" width="6%">序号</th>
                                    <th class="sorting_disabled" rowspan="1" colspan="1" width="">列入经营异常名录原因
                                    </th>
                                    <th class="sorting_disabled" rowspan="1" colspan="1" width="">列入日期</th>
                                    <th class="sorting_disabled" rowspan="1" colspan="1" width="">作出决定机关(例入)
                                    </th>
                                    <th class="sorting_disabled" rowspan="1" colspan="1" width="">移出经营异常名录原因
                                    </th>
                                    <th class="sorting_disabled" rowspan="1" colspan="1" width="">移出日期</th>
                                    <th class="sorting_disabled" rowspan="1" colspan="1" width="">作出决定机关(移出)
                                    </th>
                                </tr>
                            </thead>
                            <tbody id="tbodExceptionInfo">
                                <tr v-for="item, index in extensionData" role="row" class="odd">
                                    <td>{{ index + 1 }}</td>
                                    <td>{{ item.addReason }}</td>
                                    <td>{{ item.addDate }}</td>
                                    <td>{{ item.decisionOffice }}</td>
                                    <td>{{ item.removeReason ?? '' }}</td>
                                    <td>{{ item.removeDate ?? '' }}</td>
                                    <td>{{ item.removeDecisionOffice ?? '' }}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <!--企业年报详情-->
    <DialogContentSlot name="reportYearDetail">
        <div id="canvas" style="margin: 50px auto;">
            <div class="content">
                <div class="content-i" id="content1" style="display: block;">
                    <div class="wrap" style="display: block;">
                        <div>
                            <div class="clearfix" style="margin: 10px;">
                                <div style="text-align: center;margin-bottom: 10px;">
                                    <span style="font-size: 40px;color: #804000 !important;line-height: 40px;">
                                        {{ currentReportYear.report_year }}年度报告
                                    </span>
                                    <span class="btn btn-xs btn-danger btn-outline" style="margin-top: -2px;">
                                        有{{ totalCount }}条修改记录
                                    </span>
                                    <span style="float: right; text-align: center; margin-top: 10px;color: #bbb;">
                                        填报时间：{{ currentReportYear.report_date }}
                                    </span>
                                </div>
                                <div style="text-align: center; font-size: 20px; color: #a20f0f;">
                                    企业年报信息由该企业提供，企业对其年报信息的真实性、合法性负责</div>
                            </div>
                        </div>
                    </div>
                    <div class="wrap" id="wrap-base" style="display: block;">
                        <div id="primaryInfo" class="tabin mainContent" style="background: transparent;">
                            <div class="details clearfix">
                                <div class="classify">基本信息</div>
                                <div class="overview">
                                    <dl>
                                        <dt class="item">统一社会信用代码/注册码：</dt>
                                        <dd class="result"><span id="code" class="copyable">
                                                {{ (currentReportYear.credit_no.length == 0 ? currentReportYear.reg_no :
                                                    currentReportYear.credit_no) }}
                                            </span>
                                        </dd>
                                    </dl>
                                    <dl>
                                        <dt class="item_right">企业名称：</dt>
                                        <dd class="result" title="企业名称">
                                            <span id="name" class="copyable">
                                                {{ currentReportYear.name }}
                                            </span>
                                        </dd>
                                    </dl>
                                    <dl>
                                        <dt class="item">企业通信地址：</dt>
                                        <dd class="result">
                                            <span id="address" class="copyable">
                                                {{ currentReportYear.address }}
                                            </span>
                                        </dd>
                                    </dl>
                                    <dl>
                                        <dt class="item_right">邮政编码</dt>
                                        <dd class="result">
                                            <span id="post" class="copyable">
                                                {{ currentReportYear.zip_code }}
                                            </span>
                                        </dd>
                                    </dl>
                                    <dl>
                                        <dt class="item">企业联系电话：</dt>
                                        <dd class="result">
                                            <span id="tel" class="copyable">
                                                {{ currentReportYear.telephone }}
                                            </span>
                                        </dd>
                                    </dl>
                                    <dl>
                                        <dt class="item_right">企业电子邮箱：</dt>
                                        <dd class="result">
                                            <span id="mail" class="copyable">
                                                {{ currentReportYear.email }}</span>
                                        </dd>
                                    </dl>
                                    <dl>
                                        <dt class="item">从业人数：</dt>
                                        <dd class="result">
                                            <span id="person" class="copyable">
                                                {{ (currentReportYear.prac_person_num.length == 0 ? '企业选择不公示' :
                                                    currentReportYear.prac_person_num) }}
                                            </span>
                                        </dd>
                                    </dl>
                                    <dl>
                                        <dt class="item_right">其中女性从业人数:</dt>
                                        <dd class="result"><span id="woman-person" class="copyable">企业选择不公示</span></dd>
                                    </dl>
                                    <dl>
                                        <dt class="item">企业经营状态:</dt>
                                        <dd class="result">
                                            <span id="status" class="copyable">
                                                {{
                                                    currentReportYear.origin_status
                                                }}
                                            </span>
                                        </dd>
                                    </dl>
                                    <dl>
                                        <dt class="item_right">企业控股情况：</dt>
                                        <dd class="result">
                                            <span id="holding" class="copyable">企业选择不公示</span>
                                        </dd>
                                    </dl>
                                    <dl>
                                        <dt class="item">是否有投资信息或购买其他公司股权：</dt>
                                        <dd class="result">
                                            <span id="other-con" class="copyable">
                                                {{ currentReportYear.if_invest }}
                                            </span>
                                        </dd>
                                    </dl>
                                    <dl>
                                        <dt class="item_right">是否有网站或网店：</dt>
                                        <dd class="result">
                                            <span id="website" class="copyable">
                                                {{ currentReportYear.if_website }}
                                            </span>
                                        </dd>
                                    </dl>
                                    <dl>
                                        <dt class="item">是否对外提供保证担保信息：</dt>
                                        <dd class="result">
                                            <span id="db" class="copyable">
                                                {{ currentReportYear.if_external_guarantee }}
                                            </span>
                                        </dd>
                                    </dl>
                                    <dl>
                                        <dt class="item_right">有限责任公司本年度是否发生股东股权转让：</dt>
                                        <dd class="result">
                                            <span id="transafer" class="copyable">
                                                {{ currentReportYear.if_equity }}
                                            </span>
                                        </dd>
                                    </dl>
                                    <dl>
                                        <dt class="item">企业主营业活动：</dt>
                                        <dd class="result">
                                            <span id="mainbus" class="copyable">
                                                {{ currentReportYear.fare_scope }}
                                            </span>
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="wrap" style="display: block;">
                        <div class="changeInfo">
                            <div class="classify">
                                网站或网店信息
                            </div>
                            <div class="clearfix">
                                <ul class="people-list" style="float: left;">
                                    <li v-for="web, i in currentReportYear.websites" style="width:250px;height:90px;">
                                        <a>
                                            <span
                                                style="display: block;text-align: left;font-size: 14px;color: #3b3b3b;margin-left: 10px;line-height: 24px;">{{
                                                    web.web_url }}</span>
                                            <span
                                                style="display: block;text-align: left;font-size: 14px;color: #3b3b3b;margin-left: 10px;line-height: 24px;">
                                                <div
                                                    style="width: 2px;height: 2px;border-radius: 1px;background-color: gray;display: inline-block;margin-bottom: 5px;margin-right: 5px;">
                                                </div>类型：{{ web.web_type }}
                                            </span>
                                            <span
                                                style="display: block;text-align: left;font-size: 14px;color: #3b3b3b;margin-left: 10px;line-height: 24px;">
                                                <div
                                                    style="width: 2px;height: 2px;border-radius: 1px;background-color: gray;display: inline-block;margin-bottom: 5px;margin-right: 5px;">
                                                </div>网址：{{ web.web_name }}
                                            </span>
                                        </a>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </DialogContentSlot>
</template>

<style scoped>
@import '@/assets/data/common_fq.css';
@import '@/assets/data/portal.css';
@import '@/assets/data/yjapi.css';
</style>