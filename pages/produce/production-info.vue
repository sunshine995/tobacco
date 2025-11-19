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
        <view 
          v-for="(order, index) in workOrders.list" 
          :key="order.id"
          :class="['work-order-item', { 'has-remark': order.remark }]"
          @click="navigateToPositionVerification(order)"
        >
          <view class="order-number">{{ order.number }}</view>
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
            <!-- <view class="order-row">
              <text class="order-label">班组</text>
              <text class="order-value">{{ order.classes }}</text>
            </view> -->
            <view class="order-row">
              <text class="order-label">投料量</text>
              <text class="order-value">{{ order.yield }}</text>
            </view>
            <view class="order-row">
              <text class="order-label">生产时间</text>
              <text class="order-value">{{ formatDate(order.createTime) }}</text>
            </view>
            <!-- 备注内容显示 -->
            <view v-if="(order.remark || order.images) && showRemarks[order.id]" class="remark-content">
              <!-- 备注文本 -->
              <view v-if="order.remark">
                <text class="order-label">备注信息</text>
                <text class="order-value remark-text">{{ order.remark }}</text>
              </view>
              
              <!-- 图片内容 -->
              <view v-if="order.images" class="images-content">
                <text class="order-label">图片信息</text>
                <view class="image-list">
                  <!-- 处理images可能是字符串或数组的情况 -->
                  <template v-if="Array.isArray(order.images)">
                    <!-- 显示第一张图片 -->
                    <view 
                      v-for="(image, index) in (showAllImages[order.id] ? order.images : [order.images[0]])" 
                      :key="index"
                      class="image-item"
                      @click.stop="previewImage(order.images, index)"
                    >
                      <image :src="image" mode="aspectFill" class="remark-image"></image>
                    </view>
                    
                    <!-- 显示更多按钮（当图片数量大于1且未显示全部时） -->
                    <view 
                      v-if="order.images.length > 1 && !showAllImages[order.id]"
                      class="more-images-btn"
                      @click.stop="toggleShowAllImages(order.id)"
                    >
                      <text class="more-images-text">更多({{ order.images.length - 1 }})</text>
                    </view>
                    
                    <!-- 收起按钮（当显示全部图片时） -->
                    <view 
                      v-if="order.images.length > 1 && showAllImages[order.id]"
                      class="collapse-images-btn"
                      @click.stop="toggleShowAllImages(order.id)"
                    >
                      <text class="collapse-images-text">收起</text>
                    </view>
                  </template>
                  <!-- 处理images是字符串的情况 -->
                  <template v-else-if="typeof order.images === 'string'">
                    <view class="image-item" @click.stop="previewImage([order.images], 0)">
                      <image :src="order.images" mode="aspectFill" class="remark-image"></image>
                    </view>
                  </template>
                </view>
              </view>
            </view>
          </view>
          <!-- 报警按钮 -->
          <view 
            v-if="order.remark" 
            :class="['alarm-btn', { 'clicked': clickedOnce[order.id] }]"
            @click.stop="handleRemarkClick(order.id)"
          >
            <text class="alarm-icon">!</text>
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
import { ref, onMounted } from 'vue'
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

// 跳转到岗位验证页面
const navigateToPositionVerification = async (order) => {
  try {
    // 先将工单信息保存到全局状态
    const app = getApp()
    if (app && app.globalData) {
      app.globalData.currentOrder = {
        id: order.id,
        batchNo: order.batchNo,
        brand: order.brand,
        // 添加其他可能需要的字段
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
        url: `/pages/produce/position-verification?id=${1}&batchNo=${'123'}&brand=${encodeURIComponent(order.brand)}&number=${encodeURIComponent(order.number)}`
      });
      return
    }
	
	const res = uni.getStorageSync('userInfo') || {}
	
    
    try {
      if (res && res.role === 'ADMIN') {
        console.log('用户角色为ADMIN，跳转到所有岗位验证页面')
        uni.navigateTo({
          url: `/pages/produce/position-verification?id=${order.id}&batchNo=${order.batchNo}&brand=${encodeURIComponent(order.brand)}&number=${encodeURIComponent(order.number)}`
        })
      } else if (res && res.role === 'USER') {
        try {
          console.log('用户角色为USER，跳转到岗位验证页面')
          // 调用权限验证接口，使用用户岗位和工单线组进行验证
          const checkPermissionData = {
            position: res.position || '', // 确保岗位字段存在且不为空
            currentLine: order.line || '' // 修正字段名为currentLine（驼峰命名）以匹配后端要求
          }
          
          console.log('权限验证请求数据:', checkPermissionData)
          
          // 调用权限验证接口
          const permissionRes = await post('/api/position/check-permission', checkPermissionData)
          
          console.log('权限验证接口返回:', permissionRes)
          
          // 处理接口返回结果
          // 注意：request.js中的post方法直接返回了res.data.data，所以permissionRes就是后端返回的data对象
          console.log('权限验证结果详情:', permissionRes)
          if (permissionRes && permissionRes.allow === true) {
            console.log('权限验证通过，允许跳转')
            // 使用接口返回的pagePath进行跳转
            uni.navigateTo({
              url: `${permissionRes.pagePath}?id=${order.id}&batchNo=${order.batchNo}&brand=${encodeURIComponent(order.brand)}&number=${encodeURIComponent(order.number)}`
            })
          } else {
            console.warn('权限验证失败或不允许访问:', permissionRes?.reason || '未知原因')
            // 显示不允许跳转的原因
            showToastMessage(permissionRes?.reason || '无权限访问该岗位', 'warning')
            
            // 提供一个选择对话框给用户
            uni.showModal({
              title: '权限不足',
              content: permissionRes?.reason || '您没有权限访问该岗位，请确认您的岗位和线组权限。',
              showCancel: false,
              success: function() {
                // 默认跳转到岗位验证页面
                uni.navigateTo({
                  url: `/pages/produce/production-info?id=${order.id}&batchNo=${order.batchNo}&brand=${encodeURIComponent(order.brand)}&number=${encodeURIComponent(order.number)}`
                })
              }
            })
          }
        } catch (apiError) {
          // 处理API调用错误，特别是CORS错误
          console.error('权限验证失败（可能是跨域问题）:', apiError)
          showToastMessage('权限验证失败，使用默认跳转', 'warning')
          
          // 默认跳转到岗位验证页面
          uni.navigateTo({
            url: `/pages/produce/production-info?id=${order.id}&batchNo=${order.batchNo}&brand=${encodeURIComponent(order.brand)}&number=${encodeURIComponent(order.number)}`
          })
        }
      } else {
        console.warn('未识别的用户角色:', res?.role)
        // 默认跳转到岗位验证页面
        uni.navigateTo({
          url: `/pages/produce/production-info?id=${order.id}&batchNo=${order.batchNo}&brand=${encodeURIComponent(order.brand)}&number=${encodeURIComponent(order.number)}`
        })
      }
    } catch (apiError) {
      // 处理API调用错误，特别是CORS错误
      console.error('获取用户角色失败（可能是跨域问题）:', apiError)
      showToastMessage('获取用户角色失败，使用默认角色', 'warning')
      
      // 提供一个选择对话框给用户
      uni.showModal({
        title: '角色选择',
        content: '无法自动获取用户角色，请选择您的角色',
        confirmText: '管理员(ADMIN)',
        cancelText: '普通用户(USER)',
        success: function(res) {
          if (res.confirm) {
            // 用户选择管理员角色
            uni.navigateTo({
              url: `/pages/produce/position-verification?id=${order.id}&batchNo=${order.batchNo}&brand=${order.brand}`
            })
          } else if (res.cancel) {
            // 用户选择普通用户角色
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
    // 最后的兜底方案，确保用户能够跳转到某个页面
    uni.navigateTo({
      url: `/pages/produce/position-verification?id=${order.id}&batchNo=${order.batchNo}&brand=${order.brand}`
    })
  }
}

// 加载状态
const loading = ref(false)

// 获取用户信息
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

// 查询今日工单
const queryWorkOrders = async () => {
  console.log('开始查询工单')
  
  const userId = getUserInfo()
  // console.log('获取到的用户信息:', userInfo)
  
  // const userId = userInfo.id
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
    // 直接使用导入的get函数，确保参数正确传递
    const queryParams = { id: userId.toString() } // 确保转换为字符串
    console.log('即将发送的查询参数:', queryParams)
    
    const res = await get('/api/work/today-work-orders', queryParams)
    
    console.log('接口返回数据类型:', typeof res)
    console.log('接口返回数据:', res)
    
    // 先尝试直接使用res作为list（如果res本身就是数组）
    if (Array.isArray(res)) {
      console.log('res是数组，长度:', res.length)
      // 检查第一个元素的结构
      if (res.length > 0) {
        console.log('工单第一个元素结构:', Object.keys(res[0]))
      }
      
      // 根据选中的线组过滤数据
      const filteredList = res.filter(order => {
        const lineMatch = order.line === selectedLine.value
        console.log(`工单线组: ${order.line}, 选中线组: ${selectedLine.value}, 匹配: ${lineMatch}`)
        return lineMatch
      })
      
      // 添加排序逻辑：预混柜排在最上面，混丝柜排在最下面，其他按数字从小到大排列
      const sortedList = filteredList.sort((a, b) => {
        // 从order.number提取第一个数字（可能是数字或字符串）
        const aNumber = parseInt(a.number.match(/\d+/)?.[0])
        const bNumber = parseInt(b.number.match(/\d+/)?.[0])
        
        // 检查是否包含特定文本
        const aIsPremix = a.number.includes('预混柜')
        const bIsPremix = b.number.includes('预混柜')
        const aIsMixing = a.number.includes('混丝柜')
        const bIsMixing = b.number.includes('混丝柜')
        
        // 预混柜优先级最高
        if (aIsPremix && !bIsPremix) return -1
        if (!aIsPremix && bIsPremix) return 1
        
        // 混丝柜优先级最低
        if (aIsMixing && !bIsMixing) return 1
        if (!aIsMixing && bIsMixing) return -1
        
        // 都不是预混柜或混丝柜，按数字大小排序
        if (!isNaN(aNumber) && !isNaN(bNumber)) {
          return aNumber - bNumber
        }
        
        // 如果无法比较数字，则保持原有顺序
        return 0
      })
      
      console.log('过滤后的工单数量:', filteredList.length)
      console.log('排序后的工单顺序:', sortedList.map(item => item.number))
      workOrders.value = {
        total: sortedList.length,
        list: sortedList
      }
    } 
    // 尝试使用res.list（如果res是包含list属性的对象）
    else if (res && typeof res === 'object' && res.list && Array.isArray(res.list)) {
      console.log('res.list是数组，长度:', res.list.length)
      
      // 根据选中的线组过滤数据
      const filteredList = res.list.filter(order => {
        const lineMatch = order.line === selectedLine.value
        console.log(`工单线组: ${order.line}, 选中线组: ${selectedLine.value}, 匹配: ${lineMatch}`)
        return lineMatch
      })
      
      // 添加排序逻辑：预混柜排在最上面，混丝柜排在最下面，其他按数字从小到大排列
      const sortedList = filteredList.sort((a, b) => {
        // 从order.number提取第一个数字（可能是数字或字符串）
        const aNumber = parseInt(a.number.match(/\d+/)?.[0])
        const bNumber = parseInt(b.number.match(/\d+/)?.[0])
        
        // 检查是否包含特定文本
        const aIsPremix = a.number.includes('预混柜')
        const bIsPremix = b.number.includes('预混柜')
        const aIsMixing = a.number.includes('混丝柜')
        const bIsMixing = b.number.includes('混丝柜')
        
        // 预混柜优先级最高
        if (aIsPremix && !bIsPremix) return -1
        if (!aIsPremix && bIsPremix) return 1
        
        // 混丝柜优先级最低
        if (aIsMixing && !bIsMixing) return 1
        if (!aIsMixing && bIsMixing) return -1
        
        // 都不是预混柜或混丝柜，按数字大小排序
        if (!isNaN(aNumber) && !isNaN(bNumber)) {
          return aNumber - bNumber
        }
        
        // 如果无法比较数字，则保持原有顺序
        return 0
      })
      
      console.log('过滤后的工单数量:', filteredList.length)
      console.log('排序后的工单顺序:', sortedList.map(item => item.number))
      workOrders.value = {
        total: sortedList.length,
        list: sortedList
      }
    }
    // 尝试使用res.data.list（兼容另一种可能的数据格式）
    else if (res && typeof res === 'object' && res.data && res.data.list && Array.isArray(res.data.list)) {
      console.log('res.data.list是数组，长度:', res.data.list.length)
      
      const filteredList = res.data.list.filter(order => order.line === selectedLine.value)
      
      // 添加排序逻辑：预混柜排在最上面，混丝柜排在最下面，其他按数字从小到大排列
      const sortedList = filteredList.sort((a, b) => {
        // 从order.number提取第一个数字（可能是数字或字符串）
        const aNumber = parseInt(a.number.match(/\d+/)?.[0])
        const bNumber = parseInt(b.number.match(/\d+/)?.[0])
        
        // 检查是否包含特定文本
        const aIsPremix = a.number.includes('预混柜')
        const bIsPremix = b.number.includes('预混柜')
        const aIsMixing = a.number.includes('混丝柜')
        const bIsMixing = b.number.includes('混丝柜')
        
        // 预混柜优先级最高
        if (aIsPremix && !bIsPremix) return -1
        if (!aIsPremix && bIsPremix) return 1
        
        // 混丝柜优先级最低
        if (aIsMixing && !bIsMixing) return 1
        if (!aIsMixing && bIsMixing) return -1
        
        // 都不是预混柜或混丝柜，按数字大小排序
        if (!isNaN(aNumber) && !isNaN(bNumber)) {
          return aNumber - bNumber
        }
        
        // 如果无法比较数字，则保持原有顺序
        return 0
      })
      
      console.log('排序后的工单顺序:', sortedList.map(item => item.number))
      workOrders.value = {
        total: sortedList.length,
        list: sortedList
      }
    }
    else {
      console.log('数据格式不符合预期，详细信息:', JSON.stringify(res))
      
      // 尝试一个更直接的方法，直接设置一些硬编码的数据来测试前端显示
      console.log('尝试直接设置测试数据...')
      workOrders.value = {
        total: 1,
        list: [
          {
            id: 1,
            userId: 19,
            classes: '甲班',
            line: '叶A',
            number: "测试工单",
            brand: '兰州（硬珍品）',
            batchNo: 'LZ(YZP)2510006',
            yield: '10000KG',
            isRemark: '新配方',
            remark: null,
            images: null,
            createTime: '2025-10-27 15:06:51'
          }
        ]
      }
      showToastMessage('使用硬编码测试数据', 'info')
    }
  } catch (error) {
    console.error('查询今日工单失败:', error)
    // 模拟数据，实际项目中应移除
    simulateWorkOrders()
    showToastMessage('接口调用失败，显示模拟数据', 'warning')
  } finally {
    loading.value = false
  }
}


// 页面加载时执行查询
onMounted(() => {
  // 初始化时直接调用接口查询数据
  queryWorkOrders()
})
</script>

<style lang="scss" scoped>
.production-info-container {
  padding: 20rpx;
  background-color: #f8f8f8;
  min-height: 100vh;
}

.section-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin: 20rpx 0;
}

.total-count {
  font-size: 14px;
  font-weight: normal;
  color: #666;
  float: right;
}

.line-selector,
.class-selector {
  background-color: #fff;
  padding: 20rpx;
  border-radius: 10rpx;
  margin-bottom: 20rpx;
}

.line-buttons,
.class-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 15rpx;
}

.line-btn,
.class-btn {
  padding: 15rpx 30rpx;
  border: 1px solid #dcdfe6;
  border-radius: 6rpx;
  font-size: 14px;
  color: #606266;
  background-color: #fff;
  transition: all 0.3s;
}

.line-btn.active,
.class-btn.active {
  color: #fff;
  background-color: #409eff;
  border-color: #409eff;
}

.query-btn-container {
  margin: 20rpx 0 30rpx;
}

.work-orders-container {
  background-color: #fff;
  padding: 20rpx;
  border-radius: 10rpx;
}

.work-order-list {
  margin-top: 20rpx;
}

.work-order-item {
  display: flex;
  padding: 20rpx;
  border: 1px solid #ebeef5;
  border-radius: 8rpx;
  margin-bottom: 20rpx;
  background-color: #fff;
}

.work-order-item.has-remark {
  border-color: #f56c6c;
}

.alarm-btn {
  width: 80rpx;
  height: 80rpx;
  background-color: #f56c6c;
  color: #fff;
  border: 2px solid #f56c6c;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: bold;
  margin-left: 10rpx;
  flex-shrink: 0;
  align-self: center;
  transition: all 0.3s;
}

.alarm-btn.clicked {
  background-color: #67c23a;
  border-color: #67c23a;
}

.alarm-icon {
  line-height: 1;
}

.remark-content {
  margin-top: 12rpx;
  padding-top: 12rpx;
  border-top: 1px dashed #ebeef5;
}

.remark-text {
  color: red !important;
  font-weight: bold !important;
}

.images-content {
  margin-top: 20rpx;
}

.image-list {
  display: flex;
  flex-wrap: wrap;
  gap: 15rpx;
  margin-top: 10rpx;
}

.image-item {
  width: 200rpx;
  height: 200rpx;
  border-radius: 8rpx;
  overflow: hidden;
  border: 1px solid #ebeef5;
}

.remark-image {
  width: 100%;
  height: 100%;
}

.more-images-btn {
  width: 200rpx;
  height: 200rpx;
  border-radius: 8rpx;
  border: 1px solid #ebeef5;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f7fa;
  color: #606266;
  font-size: 14px;
}

.more-images-text {
  text-align: center;
}

.collapse-images-btn {
  margin-top: 15rpx;
  padding: 10rpx 20rpx;
  background-color: #f5f7fa;
  color: #606266;
  font-size: 14px;
  border-radius: 4rpx;
  width: 100rpx;
  text-align: center;
  border: 1px solid #ebeef5;
}

.order-number {
  width: 80rpx;
  height: 80rpx;
  background-color: #409eff;
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  margin-right: 20rpx;
  flex-shrink: 0;
}

.order-content {
  flex: 1;
}

.order-row {
  display: flex;
  margin-bottom: 12rpx;
  align-items: flex-start;
}

.order-label {
  width: 100rpx;
  font-size: 14px;
  color: #606266;
  margin-right: 10rpx;
}

.order-value {
  flex: 1;
  font-size: 14px;
  color: #303133;
  word-break: break-all;
}

// 加粗加黑字体放大样式
.important-value {
  font-size: 16px;
  font-weight: bold;
  color: #000;
}

.loading,
.empty {
  text-align: center;
  padding: 40rpx 0;
  color: #909399;
  font-size: 14px;
}

/* 自定义Toast样式 */
.custom-toast {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  padding: 15rpx 30rpx;
  border-radius: 8rpx;
  background-color: rgba(0, 0, 0, 0.7);
  color: #fff;
  font-size: 14px;
  z-index: 9999;
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
</style>