<template>
  <view class="position-verification-container">
    <!-- 工单信息展示区域 -->
    <view class="work-order-info-card">
      <view class="order-info-content">
        <view class="info-row">
          <view class="info-label">批次号</view>
          <view class="info-value">{{ orderInfo.batchNo }}</view>
        </view>
        <view class="info-row">
          <view class="info-label">产品名称</view>
          <view class="info-value">{{ orderInfo.brand }}</view>
        </view>
      </view>
    </view>

    <!-- 页面主体内容 -->
    <u-card class="main-content-card" :border="false" shadow>
      <template #title>
        <view class="section-title">岗位验证</view>
      </template>
      <template #body>
        <!-- 岗位列表展示 -->
        <view class="position-list">
          <view 
            class="position-item" 
            v-for="(position, index) in positions" 
            :key="index"
            @click="handleNavigate(position.path)"
          >
            <!-- 第一行：名称 + 动态进度文本（分子=数据库data_count，分母=岗位自定义totalCount） -->
            <view class="item-row first-row">
              <view class="item-name">{{ position.name }}</view>
              <!-- 进度文本：当data_count === totalCount时变绿 -->
              <view 
                :class="['position-status', 
                  position.hasCurrentBatchStatus ? 'verified' : 'unverified',
                  position.dataCount === position.totalCount ? 'completed-green' : ''
                ]"
              >
                {{ getVerificationProgress(position) }}
              </view>
            </view>

            <!-- 第二行：4级验证（基于current_step + 已完成状态动态变色） -->
            <view class="item-row second-row">
              <view class="verification-levels">
                <!-- 1级验证：已完成（dataCount===totalCount） 或 currentStep>=1 变绿 -->
                <view class="verification-level">
                  <view 
                    :class="['level-number', 
                      { 'completed': isLevel1Completed(position) }
                    ]"
                  >
                    1级验证
                  </view>
                </view>
                <!-- 2级验证：current_step >= 2 变绿 -->
                <view class="verification-level">
                  <view 
                    :class="['level-number', 
                      { 'completed': getIsLevelCompleted(position, 2) }
                    ]"
                  >
                    2级验证
                  </view>
                </view>
                <!-- 3级验证：current_step >= 3 变绿 -->
                <view class="verification-level">
                  <view 
                    :class="['level-number', 
                      { 'completed': getIsLevelCompleted(position, 3) }
                    ]"
                  >
                    3级验证
                  </view>
                </view>
                <!-- 4级验证：current_step >= 4 变绿 -->
                <view class="verification-level">
                  <view 
                    :class="['level-number', 
                      { 'completed': getIsLevelCompleted(position, 4) }
                    ]"
                  >
                    4级验证
                  </view>
                </view>
              </view>
            </view>
          </view>
        </view>
      </template>
    </u-card>

    <u-toast ref="uToast" />
  </view>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import { byBatchIdAndSegment } from '@/api/production.js'

// 工单信息（当前批次+品牌）
const orderInfo = reactive({
  id: '',
  batchNo: '',
  brand: '',
  line: '',
  yield: '',
  createTime: '',
  remark: '',
  number: ''
})

// 页面加载时获取URL参数
onMounted(async () => {
  // 从URL参数获取订单信息
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  const options = currentPage.options || {}
  
  // 从URL参数更新orderInfo
  if (options.id) orderInfo.id = decodeURIComponent(options.id)
  if (options.batchNo) orderInfo.batchNo = decodeURIComponent(options.batchNo)
  if (options.brand) orderInfo.brand = decodeURIComponent(options.brand)
  if (options.number) orderInfo.number = decodeURIComponent(options.number)
  if (options.yield) orderInfo.yield = decodeURIComponent(options.yield)
  
  console.log('position-verification - URL参数获取到的订单信息:', orderInfo)
  
  // 尝试从全局获取数据（作为补充）
  let success = getDataFromGlobal()
  if (!success) setTimeout(getDataFromGlobal, 300)
  
  setTimeout(async () => {
    if (!orderInfo.batchNo) return

    try {
      for (const position of positions) {
        try {
          const result = await byBatchIdAndSegment(orderInfo.batchNo, position.segment)
          if (result) {
            position.hasCurrentBatchStatus = true
            position.verificationStatus = result.verificationResult?.status || ''
            position.currentStep = result.verificationResult?.current_step || 0
            position.dataCount = result.dataCount || 0 // 注意接口字段（是dataCount还是data_count）
            
            // 调试日志
            console.log(`岗位：${position.name}`)
            console.log(`  - 进度：${position.dataCount}/${position.totalCount}`)
            console.log(`  - currentStep：${position.currentStep}`)
          }
        } catch (error) {
          console.error(`查询${position.name}验证状态失败:`, error)
          position.hasCurrentBatchStatus = false
          position.dataCount = 0
          position.currentStep = 0
        }
      }
    } catch (e) {
      console.error('查询验证状态失败:', e)
    }
  }, 500)
})

// 岗位验证状态数据（每个岗位配置：自定义分母totalCount + 接口返回的分子dataCount）
const positions = reactive([
  {
    name: '片烟出库验证',
    segment: '片烟出库',
    path: 'strip-tobacco-warehousing',
    verificationStatus: '', 
    currentStep: 0,         
    hasCurrentBatchStatus: false,
    totalCount: 2, 
    dataCount: 0 
  },
  {
    name: '机械手验证',
    segment: '机械手',
    path: 'robot-arm',
    verificationStatus: '',
    currentStep: 0,
    hasCurrentBatchStatus: false,
    totalCount: 3, 
    dataCount: 0
  },
  {
    name: '真空回潮验证',
    segment: '真空回潮',
    path: 'vacuum-reconditioning',
    verificationStatus: '',
    currentStep: 0,
    hasCurrentBatchStatus: false,
    totalCount: 4, 
    dataCount: 0
  },
  {
    name: '切片机验证',
    segment: '切片机',
    path: 'slicing-machine',
    verificationStatus: '',
    currentStep: 0,
    hasCurrentBatchStatus: false,
    totalCount: 2, 
    dataCount: 0
  },
  {
    name: '翻箱机验证',
    segment: '翻箱机',
    path: 'box-turning-machine',
    verificationStatus: '',
    currentStep: 0,
    hasCurrentBatchStatus: false,
    totalCount: 1, 
    dataCount: 0
  },
  {
    name: '松散回潮验证',
    segment: '松散回潮',
    path: 'loose-moisture',
    verificationStatus: '',
    currentStep: 0,
    hasCurrentBatchStatus: false,
    totalCount: 3, 
    dataCount: 0
  },
  {
    name: '激光除杂验证',
    segment: '激光除杂',
    path: 'laser-cleaning',
    verificationStatus: '',
    currentStep: 0,
    hasCurrentBatchStatus: false,
    totalCount: 2, 
    dataCount: 0
  },
  {
    name: '预混柜验证',
    segment: '预混柜',
    path: 'pre-mix-cabinet',
    verificationStatus: '',
    currentStep: 0,
    hasCurrentBatchStatus: false,
    totalCount: 4, 
    dataCount: 0
  },
  {
    name: '加料机验证',
    segment: '加料机',
    path: 'feeding-machine',
    verificationStatus: '',
    currentStep: 0,
    hasCurrentBatchStatus: false,
    totalCount: 5, 
    dataCount: 0
  },
  {
    name: '储叶柜验证',
    segment: '储叶柜',
    path: 'leaf-storage-cabinet',
    verificationStatus: '',
    currentStep: 0,
    hasCurrentBatchStatus: false,
    totalCount: 2, 
    dataCount: 0
  },
  {
    name: '增温增湿验证',
    segment: '增温增湿',
    path: 'temperature-humidity',
    verificationStatus: '',
    currentStep: 0,
    hasCurrentBatchStatus: false,
    totalCount: 3, 
    dataCount: 0
  },
  {
    name: '切丝机验证',
    segment: '切丝机',
    path: 'cutting-machine',
    verificationStatus: '',
    currentStep: 0,
    hasCurrentBatchStatus: false,
    totalCount: 2, 
    dataCount: 0
  },
  {
    name: '烘丝机验证',
    segment: '烘丝机',
    path: 'drying-machine',
    verificationStatus: '',
    currentStep: 0,
    hasCurrentBatchStatus: false,
    totalCount: 5, 
    dataCount: 0
  },
  {
    name: '膨化烟丝掺对验证',
    segment: '膨化烟丝',
    path: 'expanded-tobacco',
    verificationStatus: '',
    currentStep: 0,
    hasCurrentBatchStatus: false,
    totalCount: 3, 
    dataCount: 0
  },
  {
    name: '加香机验证',
    segment: '加香机',
    path: 'flavoring-machine',
    verificationStatus: '',
    currentStep: 0,
    hasCurrentBatchStatus: false,
    totalCount: 7, 
    dataCount: 0
  },
  {
    name: '残烟丝验证',
    segment: '残烟丝',
    path: 'residual-tobacco',
    verificationStatus: '',
    currentStep: 0,
    hasCurrentBatchStatus: false,
    totalCount: 3, 
    dataCount: 0
  },
  {
    name: '混丝柜验证',
    segment: '混丝柜',
    path: 'silk-mixing-cabinet',
    verificationStatus: '',
    currentStep: 0,
    hasCurrentBatchStatus: false,
    totalCount: 3, 
    dataCount: 0
  },
  {
    name: '装箱站验证',
    segment: '装箱站',
    path: 'packing-station',
    verificationStatus: '',
    currentStep: 0,
    hasCurrentBatchStatus: false,
    totalCount: 2, 
    dataCount: 0
  },
  {
    name: '丝库验证',
    segment: '丝库',
    path: 'silk-storage',
    verificationStatus: '',
    currentStep: 0,
    hasCurrentBatchStatus: false,
    totalCount: 1, 
    dataCount: 0
  }
])

// 动态生成进度文本
const getVerificationProgress = (position) => {
  if (!position.hasCurrentBatchStatus) {
    return `0/${position.totalCount} 未验证`
  }
  const { dataCount, totalCount } = position
  const statusText = dataCount >= totalCount ? '已完成' : '已验证'
  return `${dataCount}/${totalCount} ${statusText}`
}

// 1级验证单独判断：已完成（dataCount===totalCount） 或 currentStep>=1 都变绿
const isLevel1Completed = (position) => {
  if (!position.hasCurrentBatchStatus) return false
  // 条件：已完成 或 currentStep>=1
  return position.dataCount === position.totalCount || position.currentStep >= 1
}

// 2-4级验证判断：currentStep >= 等级
const getIsLevelCompleted = (position, level) => {
  if (!position.hasCurrentBatchStatus) return false
  return position.currentStep >= level
}

// 统一导航处理
const handleNavigate = (path) => {
  try {
    const app = getApp()
    if (app && app.globalData) {
      app.globalData.currentOrder = { ...orderInfo }
    }
    uni.navigateTo({
      url: `/pages/position/${path}?id=${encodeURIComponent(orderInfo.id)}&batchNo=${encodeURIComponent(orderInfo.batchNo)}&brand=${encodeURIComponent(orderInfo.brand)}&number=${encodeURIComponent(orderInfo.number)}&yield=${encodeURIComponent(orderInfo.yield || '')}`
    })
  } catch (error) {
    console.error('导航失败:', error)
    uni.showToast({ title: '导航失败', icon: 'error' })
  }
}

// 从全局获取当前批次信息
const getDataFromGlobal = () => {
  try {
    const app = getApp()
    if (app && app.globalData && app.globalData.currentOrder) {
      Object.keys(app.globalData.currentOrder).forEach(key => {
        if (orderInfo.hasOwnProperty(key)) orderInfo[key] = app.globalData.currentOrder[key]
      })
      return true
    }
    return false
  } catch (e) {
    console.error('获取全局状态失败:', e)
    return false
  }
}

// 组件挂载时：查询当前批次下对应segment岗位的状态
onMounted(async () => {
  console.log('position-verification页面加载')
  let success = getDataFromGlobal()
  if (!success) setTimeout(getDataFromGlobal, 300)
  
  setTimeout(async () => {
    if (!orderInfo.batchNo) return

    try {
      for (const position of positions) {
        try {
          const result = await byBatchIdAndSegment(orderInfo.batchNo, position.segment)
          if (result) {
            position.hasCurrentBatchStatus = true
            position.verificationStatus = result.verificationResult?.status || ''
            position.currentStep = result.verificationResult?.current_step || 0
            position.dataCount = result.dataCount || 0 // 注意接口字段（是dataCount还是data_count）
            
            // 调试日志
            console.log(`岗位：${position.name}`)
            console.log(`  - 进度：${position.dataCount}/${position.totalCount}`)
            console.log(`  - currentStep：${position.currentStep}`)
          }
        } catch (error) {
          console.error(`查询${position.name}验证状态失败:`, error)
          position.hasCurrentBatchStatus = false
          position.dataCount = 0
          position.currentStep = 0
        }
      }
    } catch (e) {
      console.error('查询验证状态失败:', e)
    }
  }, 500)
})
</script>

<style lang="scss" scoped>
.position-verification-container {
  padding: 20rpx;
  background-color: #f5f5f5;
  min-height: 100vh;
}

.work-order-info-card {
  margin-bottom: 30rpx;
  border-radius: 12rpx;
  border: 1px solid #e0e0e0;
  padding: 20rpx;
  background-color: #ffffff;
}

.order-info-content {
  flex: 1;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 10rpx 0;
  font-size: 28rpx;
}

.info-label {
  color: #606266;
}

.info-value {
  color: #303133;
  font-weight: 500;
}

.main-content-card {
  border-radius: 12rpx;
  overflow: hidden;
  margin-bottom: 30rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #303133;
  padding-bottom: 20rpx;
  border-bottom: 2rpx solid #ebeef5;
}

.position-list {
  display: flex;
  flex-direction: column;
  gap: 30rpx;
  width: 100%;
  padding: 20rpx 0;
}

.position-item {
  background-color: #ffffff;
  border-radius: 12rpx;
  padding: 20rpx 30rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
  border: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.position-item::after {
  content: '>';
  position: absolute;
  right: 30rpx;
  top: 25rpx;
  color: #c0c4cc;
  font-size: 32rpx;
}

.position-item:active {
  background-color: #f5f5f5;
  transform: scale(0.98);
}

.item-row {
  display: flex;
  align-items: center;
}

.first-row {
  justify-content: space-between;
  margin-bottom: 15rpx;
}

.second-row {
  justify-content: flex-start;
}

.item-name {
  font-size: 32rpx;
  font-weight: 500;
  color: #303133;
}

/* 岗位状态样式 */
.position-status {
  padding: 6rpx 20rpx;
  border-radius: 20rpx;
  font-size: 24rpx;
  font-weight: bold;
  transition: all 0.3s ease;
}
.unverified {
  background-color: #fef0f0;
  color: #f56c6c;
}
.verified {
  background-color: #e8f4f8;
  color: #4299e1;
}
.completed-green {
  background-color: #f0f9eb;
  color: #67c23a;
}

/* 4级验证样式 */
.verification-levels {
  display: flex;
  gap: 15rpx;
  align-items: center;
  flex-wrap: wrap;
}

.verification-level {
  flex: 1;
  min-width: 80rpx;
  text-align: center;
}

.level-number {
  font-size: 22rpx;
  padding: 4rpx 8rpx;
  border-radius: 15rpx;
  background-color: rgba(204, 204, 204, 0.1);
  color: #666;
  border: 1px solid rgba(204, 204, 204, 0.3);
  display: inline-block;
  width: 100%;
  box-sizing: border-box;
  transition: all 0.3s ease;
}

.level-number.completed {
  background-color: rgba(82, 196, 26, 0.1);
  color: #52c41a;
  border: 1px solid rgba(82, 196, 26, 0.3);
}
</style>