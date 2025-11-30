<template>
  <view class="container">
	  
	  <!-- 分类选择 -->
	<u-tabs :list="tabList" @click="handleTabClick"></u-tabs>


    <!-- 下拉刷新 -->
    <scroll-view
      class="scroll-view"
      scroll-y
      @scrolltolower="onScrollToLower"
      :refresher-enabled="true"
      :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh"
    >
      <!-- 列表内容 -->
      <view class="list-container">
        <!-- 空状态 -->
        <u-empty
          v-if="faultList.length === 0 && !loading"
          mode="list"
          text="暂无故障信息"
          marginTop="100"
        />

        <!-- 加载中状态 -->
        <u-loading-page v-if="loading && faultList.length === 0" :loading="true" />

        <!-- 故障列表项 -->
        <view
          v-for="(item, index) in faultList"
          :key="item.id"
          class="fault-item"
          @click="goToDetail(item)"
        >
          <u-cell-group>
            <u-cell
              :title="`${item.line} - ${item.section}`"
              :label="item.description"
              :isLink="true"
            >
			<template #value>
				<u-tag
				  :text="statusText(item.status)"
				  :type="statusType(item.status)"
				  size="mini"
				  :style="{ height: '24px' }"
				/>
			  </template>
			</u-cell>
            <view class="item-footer">
              <text class="report-time">上报时间: {{ formatTime(item.reportTime) }}</text>
              <text class="reporter">上报人: {{ item.reporterName || '未知' }}</text>
            </view>
          </u-cell-group>
        </view>

        <!-- 上拉加载更多指示器 -->
        <u-loadmore
          v-if="faultList.length > 0"
          :status="loadStatus"
          :line="true"
          lineColor="#eee"
        />
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getFaultListByTypeApi } from '@/api/fault.js'

// 假设通过页面参数传递维修类型 (electrical / mechanical)
const repairType = ref('')
const showMyOnly = ref(false) // 是否只看自己上报的

const repairTypeTitle = computed(() => {
  if (role === 'admin') return '所有故障'
  if (showMyOnly.value) return '我的上报'
  return repairType.value === 'electrical' ? '电气维修' : '机械维修'
})

const role = uni.getStorageSync('userInfo').role 

// 故障列表数据
const faultList = ref([])

// 分页相关
const currentPage = ref(1)
const pageSize = 10
const hasMore = ref(true) // 是否还有更多数据

// 加载状态
const loading = ref(false)
const refreshing = ref(false) // 下拉刷新状态
const loadStatus = ref('loadmore') // u-loadmore 组件状态: loadmore, loading, nomore

// 分类列表
const tabList = [
  { name: '设备异常', type: 'device' },
  { name: '质量异常', type: 'quality' },
  { name: '生产异常', type: 'production' }
]

// 页面加载时获取参数和初始数据
onLoad(() => {
	
	if (role === 'ADMIN') {
	    // 管理员：查看所有，不传 type，也不限制班组
	    repairType.value = 'admin' // 表示全部
	    showMyOnly.value = false
	  } else if (role === 'USER') {
	    // 普通员工：只能看自己上报的
	    repairType.value = 'user' // 不按班组查
	    showMyOnly.value = true
	  } else if (['electrical', 'mechanical'].includes(role)) {
	    // 维修工：看自己班组的任务
	    repairType.value = role
	    showMyOnly.value = false
	  } else {
	    // 默认处理
	    repairType.value = 'electrical'
	    showMyOnly.value = false
	  }
	
    //repairType.value = uni.getStorageSync('userInfo').class	
    loadData(true) // 初始加载第一页

})

// 状态文本映射
const statusText = (status) => {
  const map = {
    reported: '待维修',
	acknowledged: '已确认',
    progress: '维修中',
    repaired: '已修复',
    cancelled: '已取消'
  }
  return map[status] || '未知状态'
}

// 状态类型（用于 u-tag 颜色）
const statusType = (status) => {
  const types = {
    reported: 'error',     // 红色
	acknowledged: 'warning',    // 黄色
    progress: 'warning',    // 黄色
    repaired: 'success',   // 绿色
    cancelled: 'info'      // 灰色
  }
  return types[status] || 'info'
}

// 格式化时间的函数
function formatTime(isoString) {
  if (!isoString) return ''
  const date = new Date(isoString)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}`
}

// 加载数据函数
async function loadData(isRefresh = false) {
  if (loading.value || (!isRefresh && !hasMore.value)) return

  if (isRefresh) {
    currentPage.value = 1
    refreshing.value = true
  } else {
    loading.value = true
    loadStatus.value = 'loading'
  }

  try {
	const params = {
	    type: repairType.value,
	    userId: uni.getStorageSync('userId')
	}
    // TODO: 调用实际API获取故障列表
    const res = await getFaultListByTypeApi(params)
    faultList.value = res

  } catch (err) {
    console.error('加载数据失败:', err)
    uni.$u.toast('加载失败')
    loadStatus.value = 'loadmore' // 重置状态
  } finally {
    loading.value = false
    refreshing.value = false
  }
}

// 下拉刷新
function onRefresh() {
  loadData(true)
}

// 上拉触底加载更多
function onScrollToLower() {
  if (hasMore.value && !loading.value) {
    currentPage.value++
    loadData()
  }
}

// 跳转到详情页
function goToDetail(item) {
  uni.navigateTo({
    url: `/pages/fault/fault-detail?id=${item.id}` // 假设详情页路径
  })
}
</script>

<style lang="scss" scoped>
.container {
  min-height: 100vh;
  background-color: #f8f8f8;
  //padding-top: calc(env(safe-area-inset-top) + 44px);
}

.scroll-view {
  height: calc(100vh - 44px); // 减去 navbar 高度
}

.list-container {
  padding: 10px;
}

.fault-item {
  background-color: #fff;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 10px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05); // 轻微阴影
}

.item-footer {
  display: flex;
  justify-content: space-between;
  padding: 8px 16px 12px 16px; // 与 u-cell 内边距对齐
  font-size: 12px;
  color: #999;
}

/* 覆盖 u-cell 的默认边距，使 footer 紧跟在 cell 下方 */
::v-deep .u-cell__body {
  padding: 12px 16px; // 可根据需要调整
}
</style>




