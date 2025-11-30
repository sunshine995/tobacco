<template>
  <view class="position-verification-page">
    <!-- 页面标题 -->
    <view class="page-header">
      <text class="page-title">HDT验证</text>
    </view>
    
    <!-- 工单信息展示 -->
    <view class="work-order-info">
      <view class="info-item">
        <text class="info-label">批次号：</text>
        <text class="info-value">{{ orderInfo.batchNo }}</text>
      </view>
      <view class="info-item">
        <text class="info-label">产品名称：</text>
        <text class="info-value">{{ orderInfo.brand }}</text>
      </view>
    </view>
    
    <!-- 验证步骤 -->
    <view class="verification-steps">
      <view class="step-item" v-for="(step, index) in verificationSteps" :key="index">
        <view class="step-header">
          <view class="step-number">{{ index + 1 }}</view>
          <view class="step-title">{{ step.title }}</view>
          <view class="step-status" :class="step.status ? 'completed' : 'pending'">{{ step.status ? '已完成' : '待验证' }}</view>
        </view>
        <view class="step-content">
          <!-- 根据步骤类型显示不同的验证内容 -->
          <template v-if="step.type === 'checkbox'">
            <view class="checkbox-group">
              <label class="checkbox-item" v-for="(option, optIndex) in step.options" :key="optIndex">
                <checkbox :checked="option.checked" @change="updateCheckbox(index, optIndex, $event)" />
                <text>{{ option.label }}</text>
              </label>
            </view>
          </template>
          <template v-else-if="step.type === 'input'">
            <input type="text" :value="step.value" @input="updateInput(index, $event)" placeholder="请输入内容" />
          </template>
          <template v-else-if="step.type === 'photo'">
            <view class="photo-upload">
              <button type="primary" @click="takePhoto(index)">拍摄照片</button>
              <view class="photo-preview" v-if="step.imageUrl">
                <image :src="step.imageUrl" mode="aspectFill"></image>
              </view>
            </view>
          </template>
        </view>
      </view>
    </view>
    
    <!-- 操作按钮 -->
    <view class="action-buttons">
      <button type="primary" @click="submitVerification" :disabled="!canSubmit">提交验证</button>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'

// 订单信息
const orderInfo = reactive({
  batchNo: '',
  brand: ''
})

// 验证步骤
const verificationSteps = reactive([
  {
    title: 'HDT设备检查',
    type: 'checkbox',
    options: [
      { label: '加热系统正常', checked: false },
      { label: '控制系统正常', checked: false },
      { label: '传感器校准', checked: false }
    ],
    status: false
  },
  {
    title: 'HDT工艺参数设置',
    type: 'input',
    value: '',
    status: false
  },
  {
    title: 'HDT处理效果验证',
    type: 'checkbox',
    options: [
      { label: '烟丝弹性良好', checked: false },
      { label: '水分符合要求', checked: false },
      { label: '无焦糊现象', checked: false }
    ],
    status: false
  },
  {
    title: '处理效果记录',
    type: 'photo',
    imageUrl: '',
    status: false
  }
])

// 是否可以提交验证
const canSubmit = computed(() => {
  return verificationSteps.every(step => step.status)
})

// 更新复选框状态
const updateCheckbox = (stepIndex, optIndex, event) => {
  verificationSteps[stepIndex].options[optIndex].checked = event.detail.value
  // 检查该步骤是否所有选项都已勾选
  const allChecked = verificationSteps[stepIndex].options.every(opt => opt.checked)
  verificationSteps[stepIndex].status = allChecked
}

// 更新输入框内容
const updateInput = (stepIndex, event) => {
  verificationSteps[stepIndex].value = event.detail.value
  verificationSteps[stepIndex].status = event.detail.value.trim() !== ''
}

// 拍摄照片
const takePhoto = (stepIndex) => {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['camera'],
    success: (res) => {
      verificationSteps[stepIndex].imageUrl = res.tempFilePaths[0]
      verificationSteps[stepIndex].status = true
    },
    fail: (err) => {
      console.error('选择图片失败:', err)
      uni.showToast({
        title: '拍摄失败',
        icon: 'none'
      })
    }
  })
}

// 提交验证
const submitVerification = () => {
  // 构建提交数据
  const submitData = {
    orderId: orderInfo.id,
    positionName: 'HDT验证',
    steps: verificationSteps
  }
  
  console.log('提交验证数据:', submitData)
  
  // 这里应该调用API提交数据
  // 模拟API调用成功
  uni.showToast({
    title: '验证成功',
    icon: 'success'
  })
  
  // 返回上一页
  setTimeout(() => {
    uni.navigateBack()
  }, 1500)
}

// 从全局状态获取订单信息
const getDataFromGlobal = () => {
  try {
    const app = getApp()
    if (app && app.globalData && app.globalData.currentOrder) {
      Object.assign(orderInfo, app.globalData.currentOrder)
      console.log('从全局获取到订单信息:', orderInfo)
    }
  } catch (error) {
    console.error('获取全局数据失败:', error)
  }
}

// 页面加载时获取订单信息
onMounted(() => {
  getDataFromGlobal()
})
</script>

<style scoped>
.position-verification-page {
  padding: 20rpx;
  background-color: #f5f5f5;
}

.page-header {
  text-align: center;
  padding: 20rpx 0;
  margin-bottom: 20rpx;
}

.page-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
}

.work-order-info {
  background-color: #fff;
  border-radius: 12rpx;
  padding: 20rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);
}

.info-item {
  display: flex;
  align-items: center;
  margin-bottom: 16rpx;
}

.info-item:last-child {
  margin-bottom: 0;
}

.info-label {
  font-size: 28rpx;
  color: #666;
  width: 160rpx;
}

.info-value {
  font-size: 28rpx;
  color: #333;
  flex: 1;
}

.verification-steps {
  background-color: #fff;
  border-radius: 12rpx;
  padding: 20rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);
}

.step-item {
  border-bottom: 1rpx solid #eee;
  padding: 20rpx 0;
}

.step-item:last-child {
  border-bottom: none;
}

.step-header {
  display: flex;
  align-items: center;
  margin-bottom: 16rpx;
}

.step-number {
  width: 44rpx;
  height: 44rpx;
  background-color: #07c160;
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  margin-right: 16rpx;
}

.step-title {
  flex: 1;
  font-size: 28rpx;
  font-weight: 500;
  color: #333;
}

.step-status {
  font-size: 24rpx;
  padding: 4rpx 16rpx;
  border-radius: 16rpx;
}

.step-status.completed {
  background-color: #e1f3d8;
  color: #52c41a;
}

.step-status.pending {
  background-color: #f5f5f5;
  color: #999;
}

.step-content {
  padding-left: 60rpx;
}

.checkbox-group {
  display: flex;
  flex-direction: column;
}

.checkbox-item {
  display: flex;
  align-items: center;
  margin-bottom: 12rpx;
}

.checkbox-item:last-child {
  margin-bottom: 0;
}

.checkbox-item text {
  font-size: 26rpx;
  color: #666;
  margin-left: 10rpx;
}

input {
  width: 100%;
  height: 80rpx;
  border: 1rpx solid #ddd;
  border-radius: 8rpx;
  padding: 0 20rpx;
  font-size: 28rpx;
}

.photo-upload {
  text-align: center;
  padding: 20rpx 0;
}

.photo-preview {
  margin-top: 20rpx;
  width: 100%;
  height: 300rpx;
  overflow: hidden;
  border-radius: 8rpx;
}

.photo-preview image {
  width: 100%;
  height: 100%;
}

.action-buttons {
  padding: 0 20rpx 40rpx;
}

.action-buttons button {
  width: 100%;
  height: 88rpx;
  line-height: 88rpx;
  font-size: 32rpx;
}
</style>