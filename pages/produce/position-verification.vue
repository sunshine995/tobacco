<template>
  <view class="position-verification-container">
    <!-- 工单信息展示区域 - 简化为普通view元素 -->
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
    
    <!-- 页面主体内容 - 使用uview-plus组件 -->
    <u-card class="main-content-card" :border="false" shadow>
      <template #title>
        <view class="section-title">岗位验证</view>
      </template>
      <template #body>
        <!-- 岗位列表展示 -->
        <view class="position-list">
          <view class="position-item" @click="navigateToStripTobaccoWarehousing">
            <view class="position-header">
              <view class="position-name">{{ positions[0].name }}</view>
            </view>
            <view :class="['position-status', getStatusClass(positions[0])]">
              {{ getPositionStatusText(positions[0]) }}
            </view>
          </view>
          
          <view class="position-item" @click="navigateToRobotArm">
            <view class="position-header">
              <view class="position-name">{{ positions[1].name }}</view>
            </view>
            <view :class="['position-status', getStatusClass(positions[1])]">
              {{ getPositionStatusText(positions[1]) }}
            </view>
          </view>
          
          <view class="position-item" @click="navigateToSlicingMachine">
            <view class="position-header">
              <view class="position-name">{{ positions[3].name }}</view>
            </view>
            <view :class="['position-status', getStatusClass(positions[2])]">
              {{ getPositionStatusText(positions[3]) }}
            </view>
          </view>
          
          <view class="position-item" @click="navigateToVacuumReconditioning">
            <view class="position-header">
              <view class="position-name">{{ positions[2].name }}</view>
            </view>
            <view :class="['position-status', getStatusClass(positions[3])]">
              {{ getPositionStatusText(positions[2]) }}
            </view>
          </view>
          
          <view class="position-item" @click="navigateToBoxTurningMachine">
            <view class="position-header">
              <view class="position-name">{{ positions[4].name }}</view>
            </view>
            <view :class="['position-status', getStatusClass(positions[4])]">
              {{ getPositionStatusText(positions[4]) }}
            </view>
          </view>
          
          <view class="position-item" @click="navigateToLooseMoisture">
            <view class="position-header">
              <view class="position-name">{{ positions[5].name }}</view>
            </view>
            <view :class="['position-status', getStatusClass(positions[5])]">
              {{ getPositionStatusText(positions[5]) }}
            </view>
          </view>
          
          <view class="position-item" @click="navigateToLaserCleaning">
            <view class="position-header">
              <view class="position-name">{{ positions[6].name }}</view>
            </view>
            <view :class="['position-status', getStatusClass(positions[6])]">
              {{ getPositionStatusText(positions[6]) }}
            </view>
          </view>
          
          <view class="position-item" @click="navigateToPreMixCabinet">
            <view class="position-header">
              <view class="position-name">{{ positions[7].name }}</view>
            </view>
            <view :class="['position-status', getStatusClass(positions[7])]">
              {{ getPositionStatusText(positions[7]) }}
            </view>
          </view>
          
          <view class="position-item" @click="navigateToFeedingMachine">
            <view class="position-header">
              <view class="position-name">{{ positions[8].name }}</view>
            </view>
            <view :class="['position-status', getStatusClass(positions[8])]">
              {{ getPositionStatusText(positions[8]) }}
            </view>
          </view>
          
          <view class="position-item" @click="navigateToLeafStorageCabinet">
            <view class="position-header">
              <view class="position-name">{{ positions[9].name }}</view>
            </view>
            <view :class="['position-status', getStatusClass(positions[9])]">
              {{ getPositionStatusText(positions[9]) }}
            </view>
          </view>
          
          <view class="position-item" @click="navigateToTemperatureHumidity">
            <view class="position-header">
              <view class="position-name">{{ positions[10].name }}</view>
            </view>
            <view :class="['position-status', getStatusClass(positions[10])]">
              {{ getPositionStatusText(positions[10]) }}
            </view>
          </view>
          
          <view class="position-item" @click="navigateToCuttingMachine">
            <view class="position-header">
              <view class="position-name">{{ positions[11].name }}</view>
            </view>
            <view :class="['position-status', getStatusClass(positions[11])]">
              {{ getPositionStatusText(positions[11]) }}
            </view>
          </view>
          
          <view class="position-item" @click="navigateToDryingMachine">
            <view class="position-header">
              <view class="position-name">{{ positions[12].name }}</view>
            </view>
            <view :class="['position-status', getStatusClass(positions[12])]">
              {{ getPositionStatusText(positions[12]) }}
            </view>
          </view>
          
          <view class="position-item" @click="navigateToExpandedTobacco">
            <view class="position-header">
              <view class="position-name">{{ positions[13].name }}</view>
            </view>
            <view :class="['position-status', getStatusClass(positions[13])]">
              {{ getPositionStatusText(positions[13]) }}
            </view>
          </view>
          
          <view class="position-item" @click="navigateToFlavoringMachine">
            <view class="position-header">
              <view class="position-name">{{ positions[14].name }}</view>
            </view>
            <view :class="['position-status', getStatusClass(positions[14])]">
              {{ getPositionStatusText(positions[14]) }}
            </view>
          </view>
          
          <view class="position-item" @click="navigateToSilkMixingCabinet">
            <view class="position-header">
              <view class="position-name">{{ positions[15].name }}</view>
            </view>
            <view :class="['position-status', getStatusClass(positions[15])]">
              {{ getPositionStatusText(positions[15]) }}
            </view>
          </view>
          
          <view class="position-item" @click="navigateToPackingStation">
            <view class="position-header">
              <view class="position-name">{{ positions[16].name }}</view>
            </view>
            <view :class="['position-status', getStatusClass(positions[16])]">
              {{ getPositionStatusText(positions[16]) }}
            </view>
          </view>
          
          <view class="position-item" @click="navigateToSilkStorage">
            <view class="position-header">
              <view class="position-name">{{ positions[17].name }}</view>
            </view>
            <view :class="['position-status', getStatusClass(positions[17])]">
              {{ getPositionStatusText(positions[17]) }}
            </view>
          </view>
        </view>
      </template>
    </u-card>
    
    <!-- 使用uview-plus的提示框组件 -->
    <u-toast ref="uToast" />
  </view>
</template>

<script setup>
import { ref, onMounted, reactive, computed } from 'vue'

// 确保所有导航函数在模板中可用
// 由于使用<script setup>，所有定义的函数和变量会自动暴露给模板

// 使用reactive代替ref，更适合复杂对象
const orderInfo = reactive({
  batchNo: '',
  brand: '',
  line: '',
  yield: '',
  createTime: '',
  remark: ''
})

// 岗位验证状态数据
const positions = reactive([
  {
    name: '片烟出库验证',
    totalSteps: 4,
    completedSteps: 0,
    status: false
  },
  {
    name: '机械手验证',
    totalSteps: 5,
    completedSteps: 5,
    status: true
  },
  {
    name: '真空回潮验证',
    totalSteps: 1,
    completedSteps: 1,
    status: true
  },
  {
    name: '切片机验证',
    totalSteps: 1,
    completedSteps: 0,
    status: false
  },
  {
    name: '翻箱机验证',
    totalSteps: 3,
    completedSteps: 0,
    status: false
  },
  {
    name: '松散回潮验证',
    totalSteps: 4,
    completedSteps: 0,
    status: false
  },
  {
    name: '激光除杂验证',
    totalSteps: 2,
    completedSteps: 0,
    status: false
  },
  {
    name: '预混柜验证',
    totalSteps: 3,
    completedSteps: 0,
    status: false
  },
  {
    name: '加料机验证',
    totalSteps: 4,
    completedSteps: 0,
    status: false
  },
  {
    name: '储叶柜验证',
    totalSteps: 2,
    completedSteps: 0,
    status: false
  },
  {
    name: '增温增湿验证',
    totalSteps: 3,
    completedSteps: 0,
    status: false
  },
  {
    name: '切丝机验证',
    totalSteps: 4,
    completedSteps: 0,
    status: false
  },
  {
    name: '烘丝机验证',
    totalSteps: 3,
    completedSteps: 0,
    status: false
  },
  {
    name: '膨化烟丝掺对验证',
    totalSteps: 3,
    completedSteps: 0,
    status: false
  },
  {
    name: '加香机验证',
    totalSteps: 4,
    completedSteps: 0,
    status: false
  },
  {
    name: '混丝柜验证',
    totalSteps: 2,
    completedSteps: 0,
    status: false
  },
  {
    name: '装箱站验证',
    totalSteps: 3,
    completedSteps: 0,
    status: false
  },
  {
    name: '丝库验证',
    totalSteps: 4,
    completedSteps: 0,
    status: false
  }
])

// 计算岗位状态文本
const getPositionStatusText = (position) => {
  if (position.totalSteps > 1) {
    return `${position.completedSteps}/${position.totalSteps}${position.status ? '已验证' : '未验证'}`
  } else {
    return position.status ? '已验证' : '未验证'
  }
}

// 获取状态样式类名
const getStatusClass = (position) => {
  return position.status ? 'verified' : 'unverified'
}

// 简化的Toast函数
const showToast = (message) => {
  uni.showToast({
    title: message,
    icon: 'none',
    duration: 2000
  })
}

// 导航到生产页面
const navigateToStripTobaccoWarehousing = () => {
  try {
    // 保存当前订单信息到全局，以便在目标页面使用
    const app = getApp()
    if (app && app.globalData) {
      app.globalData.currentOrder = { ...orderInfo }
    }
    
    uni.navigateTo({
      url: `/pages/position/strip-tobacco-warehousing?batchNo=${encodeURIComponent(orderInfo.batchNo)}&brand=${encodeURIComponent(orderInfo.brand)}`
    })
  } catch (e) {
    console.error('导航到生产页面失败:', e)
    showToast('导航失败')
  }
}

// 导航到工单详情页面
const navigateToRelaxedMoisture = () => {
  try {
    // 保存当前订单信息到全局，以便在目标页面使用
    const app = getApp()
    if (app && app.globalData) {
      app.globalData.currentOrder = { ...orderInfo }
    }
    
    uni.navigateTo({
      url: '/pages/produce/robot-arm'
    })
  } catch (e) {
    console.error('导航到工单详情页面失败:', e)
    showToast('导航失败')
  }
}

// 导航到机械手操作页面
const navigateToRobotArm = () => {
  try {
    // 保存订单信息到全局状态
    const app = getApp()
    if (app && app.globalData) {
      app.globalData.currentOrder = { ...orderInfo }
    }
    // 跳转到机械手页面
    uni.navigateTo({
      url: `/pages/position/robot-arm?batchNo=${encodeURIComponent(orderInfo.batchNo)}&brand=${encodeURIComponent(orderInfo.brand)}`
    })
    console.log('导航到机械手操作页面')
  } catch (error) {
    console.error('导航失败:', error)
    uni.showToast({
      title: '导航失败',
      icon: 'error'
    })
  }
}

// 导航到真空回潮页面
const navigateToVacuumReconditioning = () => {
  try {
    // 保存订单信息到全局状态
    const app = getApp()
    if (app && app.globalData) {
      app.globalData.currentOrder = { ...orderInfo }
    }
    // 跳转到真空回潮页面
    uni.navigateTo({
      url: '/pages/position/vacuum-reconditioning'
    })
    console.log('导航到真空回潮页面')
  } catch (error) {
    console.error('导航失败:', error)
    uni.showToast({
      title: '导航失败',
      icon: 'error'
    })
  }
}

// 导航到切片机操作页面
const navigateToSlicingMachine = () => {
  try {
    // 保存订单信息到全局状态
    const app = getApp()
    if (app && app.globalData) {
      app.globalData.currentOrder = { ...orderInfo }
    }
    // 跳转到切片机页面
    uni.navigateTo({
      url: `/pages/position/slicing-machine?batchNo=${encodeURIComponent(orderInfo.batchNo)}&brand=${encodeURIComponent(orderInfo.brand)}`
    })
    console.log('导航到切片机操作页面')
  } catch (error) {
    console.error('导航失败:', error)
    uni.showToast({
      title: '导航失败',
      icon: 'error'
    })
  }
}

// 导航到翻箱机页面
const navigateToBoxTurningMachine = () => {
  try {
    // 保存订单信息到全局状态
    const app = getApp()
    if (app && app.globalData) {
      app.globalData.currentOrder = { ...orderInfo }
    }
    // 跳转到翻箱机页面
    uni.navigateTo({
      url: '/pages/position/box-turning-machine'
    })
    console.log('导航到翻箱机页面')
  } catch (error) {
    console.error('导航失败:', error)
    uni.showToast({
      title: '导航失败',
      icon: 'error'
    })
  }
}

// 导航到松散回潮页面
const navigateToLooseMoisture = () => {
  try {
    // 保存订单信息到全局状态
    const app = getApp()
    if (app && app.globalData) {
      app.globalData.currentOrder = { ...orderInfo }
    }
    // 跳转到松散回潮页面
    uni.navigateTo({
      url: '/pages/position/loose-moisture'
    })
    console.log('导航到松散回潮页面')
  } catch (error) {
    console.error('导航失败:', error)
    uni.showToast({
      title: '导航失败',
      icon: 'error'
    })
  }
}

// 导航到激光除杂页面
const navigateToLaserCleaning = () => {
  try {
    // 保存订单信息到全局状态
    const app = getApp()
    if (app && app.globalData) {
      app.globalData.currentOrder = { ...orderInfo }
    }
    // 跳转到激光除杂页面
    uni.navigateTo({
      url: '/pages/position/laser-cleaning'
    })
    console.log('导航到激光除杂页面')
  } catch (error) {
    console.error('导航失败:', error)
    uni.showToast({
      title: '导航失败',
      icon: 'error'
    })
  }
}

// 导航到预混柜页面
const navigateToPreMixCabinet = () => {
  try {
    // 保存订单信息到全局状态
    const app = getApp()
    if (app && app.globalData) {
      app.globalData.currentOrder = { ...orderInfo }
    }
    // 跳转到预混柜页面
    uni.navigateTo({
      url: '/pages/position/pre-mix-cabinet'
    })
    console.log('导航到预混柜页面')
  } catch (error) {
    console.error('导航失败:', error)
    uni.showToast({
      title: '导航失败',
      icon: 'error'
    })
  }
}

// 导航到加料机页面
const navigateToFeedingMachine = () => {
  try {
    // 保存订单信息到全局状态
    const app = getApp()
    if (app && app.globalData) {
      app.globalData.currentOrder = { ...orderInfo }
    }
    // 跳转到加料机页面
    uni.navigateTo({
      url: '/pages/position/feeding-machine'
    })
    console.log('导航到加料机页面')
  } catch (error) {
    console.error('导航失败:', error)
    uni.showToast({
      title: '导航失败',
      icon: 'error'
    })
  }
}

// 导航到储叶柜页面
const navigateToLeafStorageCabinet = () => {
  try {
    // 保存订单信息到全局状态
    const app = getApp()
    if (app && app.globalData) {
      app.globalData.currentOrder = { ...orderInfo }
    }
    // 跳转到储叶柜页面
    uni.navigateTo({
      url: '/pages/position/leaf-storage-cabinet'
    })
    console.log('导航到储叶柜页面')
  } catch (error) {
    console.error('导航失败:', error)
    uni.showToast({
      title: '导航失败',
      icon: 'error'
    })
  }
}

// 导航到增温增湿页面
const navigateToTemperatureHumidity = () => {
  try {
    // 保存订单信息到全局状态
    const app = getApp()
    if (app && app.globalData) {
      app.globalData.currentOrder = { ...orderInfo }
    }
    // 跳转到增温增湿页面
    uni.navigateTo({
      url: `/pages/position/temperature-humidity?batchNo=${encodeURIComponent(orderInfo.batchNo)}&brand=${encodeURIComponent(orderInfo.brand)}`
    })
    console.log('导航到增温增湿页面')
  } catch (error) {
    console.error('导航失败:', error)
    uni.showToast({
      title: '导航失败',
      icon: 'error'
    })
  }
}

// 导航到切丝机页面
const navigateToCuttingMachine = () => {
  try {
    // 保存订单信息到全局状态
    const app = getApp()
    if (app && app.globalData) {
      app.globalData.currentOrder = { ...orderInfo }
    }
    // 跳转到切丝机页面
    uni.navigateTo({
      url: `/pages/position/cutting-machine?batchNo=${encodeURIComponent(orderInfo.batchNo)}&brand=${encodeURIComponent(orderInfo.brand)}`
    })
    console.log('导航到切丝机页面')
  } catch (error) {
    console.error('导航失败:', error)
    uni.showToast({
      title: '导航失败',
      icon: 'error'
    })
  }
}

// 导航到烘丝机页面
const navigateToDryingMachine = () => {
  try {
    // 保存订单信息到全局状态
    const app = getApp()
    if (app && app.globalData) {
      app.globalData.currentOrder = { ...orderInfo }
    }
    // 跳转到烘丝机页面
    uni.navigateTo({
      url: '/pages/position/drying-machine'
    })
    console.log('导航到烘丝机页面')
  } catch (error) {
    console.error('导航失败:', error)
    uni.showToast({
      title: '导航失败',
      icon: 'error'
    })
  }
}

// 导航到膨化烟丝掺对页面
const navigateToExpandedTobacco = () => {
  try {
    // 保存订单信息到全局状态
    const app = getApp()
    if (app && app.globalData) {
      app.globalData.currentOrder = { ...orderInfo }
    }
    // 跳转到膨化烟丝掺对页面
    uni.navigateTo({
      url: '/pages/position/expanded-tobacco'
    })
    console.log('导航到膨化烟丝掺对页面')
  } catch (error) {
    console.error('导航失败:', error)
    uni.showToast({
      title: '导航失败',
      icon: 'error'
    })
  }
}

// 导航到加香机页面
const navigateToFlavoringMachine = () => {
  try {
    // 保存订单信息到全局状态
    const app = getApp()
    if (app && app.globalData) {
      app.globalData.currentOrder = { ...orderInfo }
    }
    // 跳转到加香机页面
    uni.navigateTo({
      url: '/pages/position/flavoring-machine'
    })
    console.log('导航到加香机页面')
  } catch (error) {
    console.error('导航失败:', error)
    uni.showToast({
      title: '导航失败',
      icon: 'error'
    })
  }
}

// 导航到混丝柜页面
const navigateToSilkMixingCabinet = () => {
  try {
    // 保存订单信息到全局状态
    const app = getApp()
    if (app && app.globalData) {
      app.globalData.currentOrder = { ...orderInfo }
    }
    // 跳转到混丝柜页面
    uni.navigateTo({
      url: '/pages/position/silk-mixing-cabinet'
    })
    console.log('导航到混丝柜页面')
  } catch (error) {
    console.error('导航失败:', error)
    uni.showToast({
      title: '导航失败',
      icon: 'error'
    })
  }
}

// 导航到装箱站页面
const navigateToPackingStation = () => {
  try {
    // 保存订单信息到全局状态
    const app = getApp()
    if (app && app.globalData) {
      app.globalData.currentOrder = { ...orderInfo }
    }
    // 跳转到装箱站页面
    uni.navigateTo({
      url: '/pages/position/packing-station'
    })
    console.log('导航到装箱站页面')
  } catch (error) {
    console.error('导航失败:', error)
    uni.showToast({
      title: '导航失败',
      icon: 'error'
    })
  }
}

// 导航到丝库页面
const navigateToSilkStorage = () => {
  try {
    // 保存订单信息到全局状态
    const app = getApp()
    if (app && app.globalData) {
      app.globalData.currentOrder = { ...orderInfo }
    }
    // 跳转到丝库页面
    uni.navigateTo({
      url: '/pages/position/silk-storage'
    })
    console.log('导航到丝库页面')
  } catch (error) {
    console.error('导航失败:', error)
    uni.showToast({
      title: '导航失败',
      icon: 'error'
    })
  }
}

// 从全局状态获取数据的函数
const getDataFromGlobal = () => {
  try {
    // 尝试获取全局数据
    const app = getApp()
    console.log('获取app实例:', app)
    
    if (app && app.globalData) {
      console.log('全局数据存在:', app.globalData)
      if (app.globalData.currentOrder) {
        console.log('找到currentOrder:', app.globalData.currentOrder)
        // 逐个属性赋值，确保响应式更新
        Object.keys(app.globalData.currentOrder).forEach(key => {
          if (orderInfo.hasOwnProperty(key)) {
            orderInfo[key] = app.globalData.currentOrder[key]
          }
        })
        showToast('工单信息已加载')
        return true
      }
    }
    return false
  } catch (e) {
    console.error('获取全局状态失败:', e)
    return false
  }
}

onMounted(() => {
  console.log('position-verification页面加载')
  
  // 获取并打印用户的role和position信息
  try {
    const app = getApp()
    if (app && app.globalData) {
      console.log('用户role信息:', app.globalData.role || '未获取到role信息')
      console.log('用户position信息:', app.globalData.position || '未获取到position信息')
    }
  } catch (e) {
    console.error('获取用户信息失败:', e)
  }
  
  // 立即尝试从全局状态获取数据
  const success = getDataFromGlobal()
  
  if (!success) {
    console.log('未找到全局数据，等待300ms后重试...')
    // 延迟重试，确保全局数据已设置完成
    setTimeout(() => {
      getDataFromGlobal()
      console.log('重试后订单信息:', JSON.stringify(orderInfo))
    }, 300)
  }
  
  // 作为最后的备选方案，检查URL参数
  setTimeout(() => {
    try {
      const pages = getCurrentPages()
      const currentPage = pages[pages.length - 1]
      const options = currentPage.options
      console.log('检查URL参数:', options)
      
      if (options && options.data) {
        try {
          const parsedData = JSON.parse(decodeURIComponent(options.data))
          console.log('通过URL参数接收到数据:', parsedData)
          // 只有在全局数据未获取成功时使用URL参数
          if (!orderInfo.batchNo) {
            Object.keys(parsedData).forEach(key => {
              if (orderInfo.hasOwnProperty(key)) {
                orderInfo[key] = parsedData[key]
              }
            })
            showToast('通过URL参数加载数据')
          }
        } catch (e) {
          console.error('解析URL参数失败:', e)
        }
      }
    } catch (e) {
      console.error('检查URL参数失败:', e)
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

/* 工单信息卡片样式 */
.work-order-info-card {
  margin-bottom: 30rpx;
  border-radius: 12rpx;
  border: 1px solid #e0e0e0;
  padding: 20rpx;
  background-color: #ffffff;
  position: relative;
  display: flex;
  align-items: flex-start;
}

/* 预混柜圆圈样式 */
.pre-mix-circle {
  width: 100rpx;
  height: 100rpx;
  border-radius: 50%;
  background-color: #409EFF;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  font-weight: bold;
  margin-right: 20rpx;
}

/* 工单信息内容区域 */
.order-info-content {
  flex: 1;
}

/* 信息行样式 */
.info-row {
  display: flex;
  justify-content: space-between;
  padding: 10rpx 0;
  font-size: 28rpx;
}

/* 信息标签样式 */
.info-label {
  color: #606266;
}

/* 信息值样式 */
.info-value {
  color: #303133;
  font-weight: 500;
}

/* 警告圆圈样式 */
.warning-circle {
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
  background-color: #F56C6C;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36rpx;
  font-weight: bold;
  position: absolute;
  right: 20rpx;
  top: 50%;
  transform: translateY(-50%);
}

/* 页面主体内容卡片样式 */
.main-content-card {
  border-radius: 12rpx;
  overflow: hidden;
  margin-bottom: 30rpx;
}

/* 标题样式 */
.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #303133;
  padding-bottom: 20rpx;
  border-bottom: 2rpx solid #ebeef5;
}

/* 岗位列表样式 */
.position-list {
  display: flex;
  flex-direction: column;
  gap: 30rpx;
  width: 100%;
  padding: 20rpx 0;
}

/* 岗位项样式 */
.position-item {
  background-color: #ffffff;
  border-radius: 12rpx;
  padding: 30rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
  border: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.position-item::after {
  content: '>';
  position: absolute;
  right: 30rpx;
  color: #c0c4cc;
  font-size: 32rpx;
}

.position-item:active {
  background-color: #f5f5f5;
  transform: scale(0.98);
}

/* 岗位头部信息 */
.position-header {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

/* 岗位名称 */
.position-name {
  font-size: 32rpx;
  font-weight: 500;
  color: #303133;
}

/* 岗位编码 */
.position-code {
  font-size: 26rpx;
  color: #909399;
}

/* 岗位状态样式 */
.position-status {
  padding: 6rpx 20rpx;
  border-radius: 20rpx;
  font-size: 24rpx;
  margin-right: 40rpx;
}

/* 已验证状态 - 绿色 */
.position-status.verified {
  background-color: #f0f9eb;
  color: #67c23a;
}

/* 未验证状态 - 红色 */
.position-status.unverified {
  background-color: #fef0f0;
  color: #f56c6c;
}

/* 异常状态 */
.position-status.abnormal {
  background-color: #fef0f0;
  color: #f56c6c;
}

/* 维护状态 */
.position-status.maintenance {
  background-color: #fdf6ec;
  color: #e6a23c;
}
</style>