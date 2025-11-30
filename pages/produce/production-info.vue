<template>
  <view class="production-info-container">
    <!-- 线组选择 -->
    <view class="line-selector">
      <view class="section-title">线组选择</view>
      <view class="line-buttons">
        <view 
          v-for="line in lineOptions" 
          :key="line"
          :class="['line-btn', { active: selectedLine === line }]"
          @click="handleLineSelect(line)"
        >
          {{ line }}
        </view>
      </view>
    </view>

    <!-- 工单列表 -->
    <view class="work-orders-container">
      <view class="section-title">工单列表 <text class="total-count">共{{ workOrders.total }}条工单</text></view>
      <view class="work-order-list">
        <!-- 工单项（适配多种场景） -->
        <view 
          v-for="(order, index) in workOrders.list" 
          :key="order.id"
          :class="['work-order-item', { 'has-remark': order.remark, 'has-verify-btn': isForeman }]"
        >
          <!-- 工单主体（点击跳转） -->
          <view class="order-body" @click="navigateToPositionVerification(order)">
            <!-- 工单编号 -->
            <view class="order-number" :style="{backgroundColor: getOrderNumberBg(order.number)}">
              {{ getOrderNumberText(order.number) }}
            </view>
            
            <!-- 工单内容 -->
            <view class="order-content">
              <view class="order-row">
                <text class="order-label">批次号</text>
                <text class="order-value important-value">{{ order.batchNo }}</text>
              </view>
              <view class="order-row">
                <text class="order-label">产品名称</text>
                <text class="order-value important-value">{{ order.brand }}</text>
              </view>
              <view class="order-row">
                <text class="order-label">线组</text>
                <text class="order-value">{{ order.line }}</text>
              </view>
              <view class="order-row">
                <text class="order-label">投料量</text>
                <text class="order-value">{{ order.yield }}</text>
              </view>
              <view class="order-row">
                <text class="order-label">生产时间</text>
                <text class="order-value">{{ formatDate(order.createTime) }}</text>
              </view>
              
              <!-- 备注内容（有备注时显示） -->
              <view v-if="(order.remark || order.images) && showRemarks[order.id]" class="remark-content">
                <view v-if="order.remark" class="remark-text-wrap">
                  <text class="order-label">备注信息</text>
                  <text class="order-value remark-text">{{ order.remark }}</text>
                </view>
                
                <!-- 图片内容 -->
                <view v-if="order.images" class="images-content">
                  <text class="order-label">图片信息</text>
                  <view class="image-list">
                    <template v-if="Array.isArray(order.images)">
                      <view 
                        v-for="(image, idx) in (showAllImages[order.id] ? order.images : [order.images[0]])" 
                        :key="idx"
                        class="image-item"
                        @click.stop="previewImage(order.images, idx)"
                      >
                        <image :src="image" mode="aspectFill" class="remark-image"></image>
                      </view>
                      
                      <view 
                        v-if="order.images.length > 1 && !showAllImages[order.id]"
                        class="more-images-btn"
                        @click.stop="toggleShowAllImages(order.id)"
                      >
                        <text class="more-images-text">更多({{ order.images.length - 1 }})</text>
                      </view>
                      
                      <view 
                        v-if="order.images.length > 1 && showAllImages[order.id]"
                        class="collapse-images-btn"
                        @click.stop="toggleShowAllImages(order.id)"
                      >
                        <text class="collapse-images-text">收起</text>
                      </view>
                    </template>
                    <template v-else-if="typeof order.images === 'string'">
                      <view class="image-item" @click.stop="previewImage([order.images], 0)">
                        <image :src="order.images" mode="aspectFill" class="remark-image"></image>
                      </view>
                    </template>
                  </view>
                </view>
              </view>
            </view>
            
            <!-- 报警按钮（有备注时显示） -->
            <view 
              v-if="order.remark" 
              class="alarm-btn"
              :class="{ 'clicked': clickedOnce[order.id] }"
              @click.stop="handleRemarkClick(order.id)"
            >
              <text class="alarm-icon">!</text>
            </view>
          </view>
          
          <!-- 三级验证按钮（段长显示） -->
          <view v-if="isForeman" class="three-level-verify-btn" @click.stop="navigateToThreeLevelVerify(order)">
            三级验证
          </view>
        </view>
        
        <view v-if="loading" class="loading">加载中...</view>
        <view v-else-if="workOrders.list.length === 0 && !loading" class="empty">暂无工单数据</view>
      </view>
    </view>

    <view v-if="showToast" class="custom-toast" :class="toastType">
      {{ toastMessage }}
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { get, post } from '../../utils/request'

// Toast相关状态
const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref('info')

// 显示Toast消息
const showToastMessage = (message, type = 'info') => {
  toastMessage.value = message
  toastType.value = type
  showToast.value = true
  setTimeout(() => {
    showToast.value = false
  }, 2000)
}

// 线组选项
const lineOptions = ref(['叶A', '叶B', '丝A', '丝B/C', '梗线'])
const selectedLine = ref('叶A')

// 处理线组选择
const handleLineSelect = (line) => {
  selectedLine.value = line
  queryWorkOrders()
}

// 工单数据
const workOrders = ref({
  total: 0,
  list: []
})

// 记录是否显示备注信息
const showRemarks = ref({})
// 记录已点击过的按钮
const clickedOnce = ref({})
// 记录是否显示全部图片
const showAllImages = ref({})

// 获取用户信息并判断是否为段长（核心判断逻辑）
const userInfo = ref(uni.getStorageSync('userInfo') || {})
const isForeman = computed(() => {
  const position = userInfo.value.position || ''
  const supportPosition = userInfo.value.support_position || ''
  // 判断position或support_position是否包含"段长"（不区分大小写）
  return position.includes('段长') || supportPosition.includes('段长')
})

// 处理备注按钮点击
const handleRemarkClick = (orderId) => {
  // 切换备注显示状态
  showRemarks.value[orderId] = !showRemarks.value[orderId]
  // 标记为已点击过
  clickedOnce.value[orderId] = true
  // 重置图片显示状态
  showAllImages.value[orderId] = false
}

// 预览图片
const previewImage = (images, current) => {
  uni.previewImage({
    current: current,
    urls: images,
    showmenu: true
  })
}

// 切换显示全部图片
const toggleShowAllImages = (orderId) => {
  showAllImages.value[orderId] = !showAllImages.value[orderId]
}

// 格式化日期，只显示到日，移除T字符
const formatDate = (dateString) => {
  if (!dateString) return ''
  // 移除T字符并只截取日期部分
  return dateString.replace('T', ' ').split(' ')[0]
}

// 工单编号文本提取（适配不同工单名称）
const getOrderNumberText = (number) => {
  // 提取工单编号中的数字（如“预混柜1号”→“1”，“混丝柜12号”→“12”）
  const match = number.match(/\d+/)
  return match ? match[0] : number.slice(0, 2) // 无数字时取前2个字符
}

// 工单编号背景色（按工单类型区分）
const getOrderNumberBg = (number) => {
  if (number.includes('预混柜')) return '#409eff' // 蓝色
  if (number.includes('混丝柜')) return '#67c23a' // 绿色
  if (number.includes('梗线')) return '#e6a23c' // 橙色
  return '#909399' // 默认灰色
}

// 跳转到岗位验证页面（原有逻辑）
const navigateToPositionVerification = async (order) => {
  try {
    // 先将工单信息保存到全局状态
    const app = getApp()
    if (app && app.globalData) {
      app.globalData.currentOrder = {
        id: order.id,
        batchNo: order.batchNo,
        brand: order.brand,
        number: order.number,
        line: order.line || '',
        yield: order.yield || '',
        remark: order.remark || ''
      }
    }
    
    // 获取用户ID
    const userId = getUserInfo()
    if (!userId) {
      console.error('无法获取用户ID')
      showToastMessage('用户信息无效', 'error')
      // 默认跳转到岗位验证页面
      uni.navigateTo({
        url: `/pages/produce/position-verification?id=${1}&batchNo=${'123'}&brand=${encodeURIComponent(order.brand)}&number=${encodeURIComponent(order.number)}&yield=${encodeURIComponent(order.yield || '')}`
      });
      return
    }
	
	const res = uni.getStorageSync('userInfo') || {}
	
    try {
      if (res && (res.role === 'ADMIN'||res.position.includes('丝库工/跟班验证员'))) {
        console.log('用户角色为ADMIN，跳转到所有岗位验证页面')
        uni.navigateTo({
          url: `/pages/produce/position-verification?id=${order.id}&batchNo=${order.batchNo}&brand=${encodeURIComponent(order.brand)}&number=${encodeURIComponent(order.number)}&yield=${encodeURIComponent(order.yield || '')}`
        })
      } else if (res && res.role === 'USER') {
        try {
          console.log('用户角色为USER，跳转到岗位验证页面')
          // 调用权限验证接口，使用用户岗位和工单线组进行验证
          const checkPermissionData = {
            position: res.position || '',
            currentLine: order.line || ''
          }
          
          console.log('权限验证请求数据:', checkPermissionData)
          
          const permissionRes = await post('/api/position/check-permission', checkPermissionData)
          
          console.log('权限验证接口返回:', permissionRes)
          
          if (permissionRes && permissionRes.allow === true) {
            console.log('权限验证通过，允许跳转')
            uni.navigateTo({
              url: `${permissionRes.pagePath}?id=${order.id}&batchNo=${order.batchNo}&brand=${encodeURIComponent(order.brand)}&number=${encodeURIComponent(order.number)}&yield=${encodeURIComponent(order.yield || '')}`
            })
          } else {
            console.warn('权限验证失败或不允许访问:', permissionRes?.reason || '未知原因')
            showToastMessage(permissionRes?.reason || '无权限访问该岗位', 'warning')
            
            uni.showModal({
              title: '权限不足',
              content: permissionRes?.reason || '您没有权限访问该岗位，请确认您的岗位和线组权限。',
              showCancel: false,
              success: function() {
                uni.navigateTo({
                  url: `/pages/produce/production-info?id=${order.id}&batchNo=${order.batchNo}&brand=${encodeURIComponent(order.brand)}&number=${encodeURIComponent(order.number)}`
                })
              }
            })
          }
        } catch (apiError) {
          console.error('权限验证失败（可能是跨域问题）:', apiError)
          showToastMessage('权限验证失败，使用默认跳转', 'warning')
          
          uni.navigateTo({
            url: `/pages/produce/production-info?id=${order.id}&batchNo=${order.batchNo}&brand=${encodeURIComponent(order.brand)}&number=${encodeURIComponent(order.number)}`
          })
        }
      } else {
        console.warn('未识别的用户角色:', res?.role)
        uni.navigateTo({
          url: `/pages/produce/production-info?id=${order.id}&batchNo=${order.batchNo}&brand=${encodeURIComponent(order.brand)}&number=${encodeURIComponent(order.number)}`
        })
      }
    } catch (apiError) {
      console.error('获取用户角色失败（可能是跨域问题）:', apiError)
      showToastMessage('获取用户角色失败，使用默认角色', 'warning')
      
      uni.showModal({
        title: '角色选择',
        content: '无法自动获取用户角色，请选择您的角色',
        confirmText: '管理员(ADMIN)',
        cancelText: '普通用户(USER)',
        success: function(res) {
          if (res.confirm) {
            uni.navigateTo({
              url: `/pages/produce/position-verification?id=${order.id}&batchNo=${order.batchNo}&brand=${order.brand}`
            })
          } else if (res.cancel) {
            uni.navigateTo({
              url: `/pages/produce/box-turning-machine?id=${order.id}&batchNo=${order.batchNo}&brand=${order.brand}`
            })
          }
        }
      })
    }
  } catch (e) {
    console.error('导航到岗位验证页面失败:', e)
    uni.showToast({
      title: '导航失败',
      icon: 'none'
    })
    uni.navigateTo({
      url: `/pages/produce/position-verification?id=${order.id}&batchNo=${order.batchNo}&brand=${order.brand}`
    })
  }
}

// 跳转到三级验证页面（段长专用，按要求跳转指定URL）
const navigateToThreeLevelVerify = (order) => {
  try {
    // 保存工单信息到全局，供目标页面使用
    const app = getApp()
    if (app && app.globalData) {
      app.globalData.currentOrder = {
        id: order.id,
        batchNo: order.batchNo,
        brand: order.brand,
        number: order.number,
        line: order.line || '',
        yield: order.yield || ''
      }
    }
    
    // 按要求拼接跳转URL，所有参数编码处理
    const targetUrl = `/pages/produce/position-verification?id=${encodeURIComponent(order.id)}&batchNo=${encodeURIComponent(order.batchNo)}&brand=${encodeURIComponent(order.brand)}&number=${encodeURIComponent(order.number)}&yield=${encodeURIComponent(order.yield || '')}`
    
    console.log('三级验证跳转URL:', targetUrl)
    uni.navigateTo({ url: targetUrl })
    
    showToastMessage('跳转到三级验证页面', 'success')
  } catch (error) {
    console.error('三级验证跳转失败:', error)
    uni.showToast({
      title: '跳转失败，请重试',
      icon: 'none'
    })
  }
}

// 加载状态
const loading = ref(false)

// 获取用户信息（原有逻辑）
const getUserInfo = () => {
  try {
    const userId = uni.getStorageSync('userId')
    if (userId) {
      return userId
    }
  } catch (error) {
    console.error('获取用户信息失败:', error)
  }
}

// 查询今日工单（原有完整逻辑）
const queryWorkOrders = async () => {
  console.log('开始查询工单')
  
  const userId = getUserInfo()
  console.log('userId类型:', typeof userId, '值:', userId)
  
  // 验证userId的有效性
  if (!userId || userId === 'undefined' || userId === undefined) {
    console.error('用户ID无效:', userId)
    showToastMessage('用户信息无效，无法查询工单', 'error')
    loading.value = false
    return
  }
  
  loading.value = true
  try {
    // 构造查询参数
    const queryParams = { id: userId.toString() }
    console.log('工单查询参数:', queryParams)
    
    const res = await get('/api/work/today-work-orders', queryParams)
    console.log('工单接口返回数据:', res)
    
    // 处理不同返回数据格式
    let orderList = []
    if (Array.isArray(res)) {
      orderList = res
    } else if (res && typeof res === 'object' && Array.isArray(res.list)) {
      orderList = res.list
    } else if (res && typeof res === 'object' && res.data && Array.isArray(res.data.list)) {
      orderList = res.data.list
    } else {
      console.warn('数据格式不符合预期，使用模拟数据')
      // 模拟数据
      orderList = [
        {
          id: 1,
          userId: 19,
          classes: '甲班',
          line: '叶A',
          number: "预混柜1号",
          brand: '兰州（硬珍品）',
          batchNo: 'LZ(YZP)2510006',
          yield: '10000KG',
          remark: null,
          images: null,
          createTime: '2025-10-27 15:06:51'
        },
        {
          id: 2,
          userId: 19,
          classes: '甲班',
          line: '叶A',
          number: "混丝柜3号",
          brand: '兰州（软珍品）',
          batchNo: 'LZ(RZP)2510008',
          yield: '8000KG',
          remark: '新配方测试',
          images: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
          createTime: '2025-10-27 16:30:00'
        },
        {
          id: 3,
          userId: 19,
          classes: '乙班',
          line: '梗线',
          number: "梗线处理5号",
          brand: '通用梗丝',
          batchNo: 'GS2510012',
          yield: '3000KG',
          remark: '设备维护后首单',
          images: ['https://example.com/image3.jpg'],
          createTime: '2025-10-27 14:15:00'
        }
      ]
      showToastMessage('使用模拟数据', 'info')
    }
    
    // 根据选中的线组过滤数据
    const filteredList = orderList.filter(order => order.line === selectedLine.value)
    
    // 排序逻辑：预混柜在前，混丝柜在后，其他按编号排序
    const sortedList = filteredList.sort((a, b) => {
      const aNumber = parseInt(a.number.match(/\d+/)?.[0]) || 0
      const bNumber = parseInt(b.number.match(/\d+/)?.[0]) || 0
      
      const aIsPremix = a.number.includes('预混柜')
      const bIsPremix = b.number.includes('预混柜')
      const aIsMixing = a.number.includes('混丝柜')
      const bIsMixing = b.number.includes('混丝柜')
      
      if (aIsPremix && !bIsPremix) return -1
      if (!aIsPremix && bIsPremix) return 1
      if (aIsMixing && !bIsMixing) return 1
      if (!aIsMixing && bIsMixing) return -1
      
      return aNumber - bNumber
    })
    
    workOrders.value = {
      total: sortedList.length,
      list: sortedList
    }
    console.log('过滤排序后工单:', workOrders.value)
    
  } catch (error) {
    console.error('查询今日工单失败:', error)
    // 模拟数据兜底
    workOrders.value = {
      total: 2,
      list: [
        {
          id: 999,
          userId: 19,
          classes: '甲班',
          line: selectedLine.value,
          number: "测试预混柜",
          brand: '测试品牌',
          batchNo: 'TEST2510001',
          yield: '5000KG',
          remark: '接口调用失败，显示模拟数据',
          images: null,
          createTime: new Date().toISOString()
        },
        {
          id: 1000,
          userId: 19,
          classes: '乙班',
          line: selectedLine.value,
          number: "测试混丝柜",
          brand: '测试品牌2',
          batchNo: 'TEST2510002',
          yield: '6000KG',
          remark: null,
          images: ['https://example.com/test.jpg'],
          createTime: new Date().toISOString()
        }
      ]
    }
    showToastMessage('接口调用失败，显示模拟数据', 'warning')
  } finally {
    loading.value = false
  }
}

// 页面加载时执行查询
onMounted(() => {
  queryWorkOrders()
  // 监听用户信息变化（实时更新权限）
  uni.onStorageChange((res) => {
    if (res.key === 'userInfo') {
      userInfo.value = uni.getStorageSync('userInfo') || {}
    }
  })
})
</script>

<style lang="scss" scoped>
.production-info-container {
  padding: 20rpx;
  background-color: #f8f8f8;
  min-height: 100vh;
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin: 20rpx 0;
}

.total-count {
  font-size: 28rpx;
  font-weight: normal;
  color: #666;
  float: right;
}

.line-selector {
  background-color: #fff;
  padding: 20rpx;
  border-radius: 10rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
}

.line-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 15rpx;
}

.line-btn {
  padding: 15rpx 30rpx;
  border: 1px solid #dcdfe6;
  border-radius: 6rpx;
  font-size: 28rpx;
  color: #606266;
  background-color: #fff;
  transition: all 0.3s;
  
  &:active {
    background-color: #f5f7fa;
  }
}

.line-btn.active {
  color: #fff;
  background-color: #409eff;
  border-color: #409eff;
}

.work-orders-container {
  background-color: #fff;
  padding: 20rpx;
  border-radius: 10rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
}

.work-order-list {
  margin-top: 20rpx;
}

/* 工单项：适配有无按钮、有无备注的场景 */
.work-order-item {
  border: 1px solid #ebeef5;
  border-radius: 8rpx;
  margin-bottom: 20rpx;
  background-color: #fff;
  overflow: hidden;
  transition: box-shadow 0.3s;
  
  &:hover {
    box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);
  }
  
  /* 有三级验证按钮时，底部留空并添加边框 */
  &.has-verify-btn {
    padding-bottom: 0;
  }
  
  /* 有备注时，边框高亮 */
  &.has-remark {
    border-color: #f56c6c;
  }
}

/* 工单主体（包含内容+报警按钮） */
.order-body {
  display: flex;
  padding: 20rpx;
  position: relative;
  align-items: flex-start;
}

/* 工单编号：适配不同类型工单的颜色 */
.order-number {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  font-weight: bold;
  margin-right: 20rpx;
  flex-shrink: 0;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
}

.order-content {
  flex: 1;
}

.order-row {
  display: flex;
  margin-bottom: 12rpx;
  align-items: center;
  font-size: 28rpx;
  
  &:last-child {
    margin-bottom: 0;
  }
}

.order-label {
  width: 120rpx;
  color: #606266;
  margin-right: 10rpx;
  flex-shrink: 0;
}

.order-value {
  flex: 1;
  color: #303133;
  word-break: break-all;
}

.important-value {
  font-size: 32rpx;
  font-weight: bold;
  color: #000;
}

/* 备注内容：默认隐藏，点击报警按钮显示 */
.remark-content {
  margin-top: 15rpx;
  padding-top: 15rpx;
  border-top: 1px dashed #ebeef5;
}

.remark-text-wrap {
  margin-bottom: 10rpx;
}

.remark-text {
  color: #f56c6c !important;
  font-weight: bold !important;
}

.images-content {
  margin-top: 10rpx;
}

.image-list {
  display: flex;
  flex-wrap: wrap;
  gap: 15rpx;
  margin-top: 10rpx;
}

.image-item {
  width: 160rpx;
  height: 160rpx;
  border-radius: 8rpx;
  overflow: hidden;
  border: 1px solid #ebeef5;
}

.remark-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.more-images-btn {
  width: 160rpx;
  height: 160rpx;
  border-radius: 8rpx;
  border: 1px solid #ebeef5;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f7fa;
  color: #606266;
  font-size: 24rpx;
}

.collapse-images-btn {
  margin-top: 10rpx;
  padding: 8rpx 16rpx;
  background-color: #f5f7fa;
  color: #606266;
  font-size: 24rpx;
  border-radius: 4rpx;
  border: 1px solid #ebeef5;
  width: fit-content;
}

/* 报警按钮：有备注时显示 */
.alarm-btn {
  position: absolute;
  right: 20rpx;
  bottom: 20rpx;
  width: 60rpx;
  height: 60rpx;
  background-color: #f56c6c;
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  font-weight: bold;
  border: 2px solid #fff;
  box-shadow: 0 2rpx 8rpx rgba(245, 108, 108, 0.5);
  z-index: 10;
  transition: all 0.3s;
  cursor: pointer;
  
  &.clicked {
    background-color: #67c23a;
    box-shadow: 0 2rpx 8rpx rgba(103, 194, 58, 0.5);
  }
  
  &:active {
    transform: scale(0.95);
  }
}

/* 三级验证按钮：段长显示，适配不同工单高度 */
.three-level-verify-btn {
  width: 100%;
  padding: 20rpx 0;
  background-color: #1890ff;
  color: #fff;
  text-align: center;
  font-size: 32rpx;
  font-weight: 500;
  transition: background-color 0.3s;
  border-top: 1px solid #ebeef5;
  cursor: pointer;
  
  &:active {
    background-color: #096dd9;
  }
}

.loading,
.empty {
  text-align: center;
  padding: 60rpx 0;
  color: #909399;
  font-size: 28rpx;
}

.custom-toast {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  padding: 20rpx 40rpx;
  border-radius: 10rpx;
  background-color: rgba(0, 0, 0, 0.7);
  color: #fff;
  font-size: 28rpx;
  z-index: 9999;
  max-width: 80%;
  text-align: center;
}

.custom-toast.success {
  background-color: rgba(103, 194, 58, 0.7);
}

.custom-toast.error {
  background-color: rgba(245, 108, 108, 0.7);
}

.custom-toast.warning {
  background-color: rgba(230, 162, 60, 0.7);
}

/* 响应式适配：小屏设备优化 */
@media (max-width: 375px) {
  .order-row {
    font-size: 26rpx;
  }
  
  .order-label {
    width: 100rpx;
  }
  
  .important-value {
    font-size: 28rpx;
  }
  
  .order-number {
    width: 70rpx;
    height: 70rpx;
    font-size: 28rpx;
  }
  
  .image-item,
  .more-images-btn {
    width: 140rpx;
    height: 140rpx;
  }
}

/* 适配无备注、无图片的简洁场景 */
.work-order-item:not(.has-remark) .order-body {
  padding-bottom: 20rpx;
}

/* 适配有图片的场景 */
.work-order-item .image-list {
  margin-bottom: 10rpx;
}
</style>