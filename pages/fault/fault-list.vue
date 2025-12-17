<template>
  <view class="container">
	  
	  <!-- 分类选择 - 优化版本 -->
	<view class="tab-container">
	  <scroll-view 
		class="tab-scroll" 
		scroll-x 
		:show-scrollbar="false"
		:scroll-left="scrollLeft"
	  >
		<view class="tab-content">
		  <view 
			v-for="(tab, index) in tabList" 
			:key="tab.type"
			class="tab-item"
			:class="{ active: activeTab === tab.type }"
			@click="handleTabClick(tab, index)"
		  >
			<text class="tab-text">{{ tab.name }}</text>
			<view class="tab-indicator"></view>
		  </view>
		</view>
	  </scroll-view>
	  
	  <!-- 统计信息 -->
	  <view class="stats-info" v-if="showStats">
		<text class="stats-text">共{{ totalCount }}条</text>
	  </view>
	</view>


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
          :text="emptyText"
          marginTop="100"
        />

        <!-- 加载中状态 -->
        <u-loading-page v-if="loading && faultList.length === 0" :loading="true" />

        <!-- 故障列表项 -->
        <view
		  v-for="(item, index) in faultList"
		  :key="item.id"
		  class="fault-item"
		>
		  <u-cell-group>
			<u-cell
			  :title="`${item.line} - ${item.section}`"
			  :label="item.description"
			  :isLink="true"
			  @click="goToDetail(item)"  
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

// 分类列表 - 优化版本
const tabList = computed(() => {
  const allTabs = [
    { name: '全部', type: 'all', count: 0 },
    { name: '设备异常', type: 'device', count: 0 },
    { name: '质量异常', type: 'quality', count: 0 },
    { name: '生产异常', type: 'produce', count: 0 }
  ]
  
  // 如果是 electrical 或 mechanical 角色，过滤掉质量和生产异常
  if (['electrical', 'mechanical'].includes(role)) {
    return allTabs.filter(tab => 
      tab.type === 'all' || tab.type === 'device'
    )
  }
  
  return allTabs
})

const activeTab = ref('all') // 当前激活的tab
const scrollLeft = ref(0) // 横向滚动位置
const showStats = ref(true) // 是否显示统计信息
const totalCount = ref(0) // 总条数

// 空状态文本
const emptyText = computed(() => {
  if (activeTab.value === 'all') {
    return '暂无异常信息'
  }
  const currentTab = tabList.value.find(tab => tab.type === activeTab.value)
  return `暂无${currentTab?.name}`
})

// 页面加载时获取参数和初始数据
onLoad(() => {
  if (role === 'ADMIN') {
    repairType.value = 'admin'
    showMyOnly.value = false
  } else if (role === 'USER') {
    repairType.value = 'user'
    showMyOnly.value = true
  } else if (['electrical', 'mechanical'].includes(role)) {
    repairType.value = role
    showMyOnly.value = false
  } else {
    repairType.value = 'electrical'
    showMyOnly.value = false
  }
  
  loadData(true)
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
    reported: 'error',
    acknowledged: 'warning',
    progress: 'warning',
    repaired: 'success',
    cancelled: 'info'
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

// 处理tab点击
function handleTabClick(tab, index) {
  activeTab.value = tab.type
  // 计算滚动位置，让当前tab尽量居中
  scrollLeft.value = Math.max(0, (index - 1) * 80)
  loadData(true)
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
      faultType: activeTab.value === 'all' ? '' : activeTab.value, // 添加异常类型筛选
      userId: uni.getStorageSync('userId')
    }
    const res = await getFaultListByTypeApi(params)
    
    if (isRefresh) {
      faultList.value = res.data || res
    } else {
      faultList.value = [...faultList.value, ...(res.data || res)]
    }
    
    // 更新统计信息
    totalCount.value = faultList.value.length
    updateTabStats()
    
  } catch (err) {
    console.error('加载数据失败:', err)
    uni.$u.toast('加载失败')
    loadStatus.value = 'loadmore'
  } finally {
    loading.value = false
    refreshing.value = false
  }
}

// 更新tab统计信息
function updateTabStats() {
  // 这里可以根据实际数据更新每个tab的数量
  tabList.value.forEach(tab => {
    if (tab.type === 'all') {
      tab.count = totalCount.value
    } else {
      // 实际项目中应该从接口获取每个分类的数量
      tab.count = Math.floor(Math.random() * 20) // 模拟数据
    }
  })
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
	//console.log(item.type)
  if(item.type === 'produce' || item.type === 'quality'){
	uni.navigateTo({
	  url: `/pages/fault/fault-produce?id=${item.id}`
	})  
  }else{
	  uni.navigateTo({
		url: `/pages/fault/fault-detail?id=${item.id}`
	  })
  }

}
</script>

<style lang="scss" scoped>
.container {
  min-height: 100vh;
  background-color: #f8f8f8;
}

/* 分类选择器样式优化 */
.tab-container {
  display: flex;
  align-items: center;
  background: #fff;
  padding: 10px 16px;
  border-bottom: 1px solid #f0f0f0;
  position: sticky;
  top: 0;
  z-index: 10;
}

.tab-scroll {
  flex: 1;
  white-space: nowrap;
  height: 44px;
}

.tab-content {
  display: inline-flex;
  align-items: center;
  height: 100%;
}

.tab-item {
  position: relative;
  padding: 0 16px;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.3s ease;
  
  &.active {
    .tab-text {
      color: #2979ff;
      font-weight: 600;
    }
    
    .tab-indicator {
      transform: scaleX(1);
      opacity: 1;
    }
  }
}

.tab-text {
  font-size: 15px;
  color: #606266;
  transition: color 0.3s ease;
}

.tab-indicator {
  position: absolute;
  bottom: 0;
  left: 16px;
  right: 16px;
  height: 3px;
  background: #2979ff;
  border-radius: 2px;
  transform: scaleX(0.8);
  opacity: 0;
  transition: all 0.3s ease;
}

.stats-info {
  margin-left: 12px;
  padding-left: 12px;
  border-left: 1px solid #e8e8e8;
  flex-shrink: 0;
}

.stats-text {
  font-size: 12px;
  color: #909399;
  white-space: nowrap;
}

.scroll-view {
  height: calc(100vh - 64px); // 调整高度适应新的tab容器
}

.list-container {
  padding: 10px;
}

.fault-item {
  background-color: #fff;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 10px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.item-footer {
  display: flex;
  justify-content: space-between;
  padding: 8px 16px 12px 16px;
  font-size: 12px;
  color: #999;
}

/* 覆盖 u-cell 的默认边距 */
::v-deep .u-cell__body {
  padding: 12px 16px;
}

/* 响应式调整 */
@media (max-width: 375px) {
  .tab-item {
    padding: 0 12px;
  }
  
  .tab-text {
    font-size: 14px;
  }
}
</style>
