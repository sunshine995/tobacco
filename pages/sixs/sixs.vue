<template>
  <view class="task-submit-page">

    <!-- 任务详情卡片 -->
    <view class="detail-card">
      <view class="card-header">
        <text class="card-title">任务详情</text>
        <view class="requirement-badge">
          <text class="requirement-text">{{ requiredImages }}张图片</text>
        </view>
      </view>
      
      <view class="detail-content">
        <view class="detail-section">
          <text class="section-label">🏷️ 任务名称</text>
          <text class="section-content">{{ taskName }}</text>
        </view>

        <view class="detail-section">
          <text class="section-label">📝 任务内容</text>
          <text class="section-content">{{ taskInfo.taskContent }}</text>
        </view>
        
        <view class="detail-section">
          <text class="section-label">🎯 执行标准</text>
          <text class="section-content">{{ taskInfo.taskStandard }}</text>
        </view>
      </view>
    </view>

    <!-- 图片上传区域（使用 UploadImage 组件） -->
    <view class="upload-card" v-if="taskInstance.status === 'pending'">
      <view class="card-header">
        <text class="card-title">📷 任务图片上传</text>
        <text class="upload-tip">已上传 {{ uploadCount }}/{{ requiredImages }} 张</text>
      </view>

      <view class="upload-content">
        <upload-image
          ref="uploadRef"
          :max-count="requiredImages"
          title="添加图片"
          @select="onUploadSelect"
          @remove="onUploadRemove"
          @success="onUploadSuccess"
        />
      </view>
    </view>

    <!-- 已提交图片展示 -->
    <view class="submitted-card" v-if="taskInstance.submittedImages?.length">
      <view class="card-header">
        <text class="card-title">✅ 已提交图片</text>
        <text class="submitted-time">{{ formatTime(taskInstance.submittedAt) }} 提交</text>
      </view>
      
      <scroll-view scroll-x class="submitted-scroll">
        <view class="submitted-images">
          <view 
            v-for="(image, index) in taskInstance.submittedImages" 
            :key="index" 
            class="submitted-image-item"
          >
            <image 
              :src="image" 
              mode="aspectFill" 
              class="submitted-image"
              @click="previewImage(index, taskInstance.submittedImages)"
            />
            <view class="image-number-badge">{{ index + 1 }}</view>
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- 说明输入区域 -->
    <view class="notes-card">
      <view class="card-header">
        <text class="card-title">✏️ 完成情况说明</text>
        <text class="word-count">{{ completionNotes.length }}/100</text>
      </view>
      
      <view class="notes-content">
        <textarea 
          v-if="taskInstance.status === 'pending'"
          v-model="completionNotes"
          class="notes-input"
          placeholder="请详细描述完成情况..."
          placeholder-class="placeholder"
          maxlength="500"
          auto-height
        />
        <view v-else class="submitted-notes">
          <text class="notes-text">{{ taskInstance.completionNotes || '未填写说明' }}</text>
        </view>
      </view>
    </view>

    <!-- 抽检结果展示 -->
    <view class="inspection-result-card" v-if="taskInstance.spotCheckStatus !== 'not_checked'">
      <view class="card-header">
        <text class="card-title">🔍 抽检结果</text>
        <view class="result-badge" :class="spotCheckClass">
          {{ spotCheckText }}
        </view>
      </view>
      
      <view class="inspection-content">
        <view class="inspector-info">
          <text class="inspector-label">抽检人：</text>
          <text class="inspector-name">张经理</text>
          <text class="inspector-time">{{ formatTime(taskInstance.spotCheckTime) }}</text>
        </view>
        
        <view v-if="taskInstance.spotCheckNotes" class="inspector-notes">
          <text class="notes-label">抽检备注：</text>
          <text class="notes-content">{{ taskInstance.spotCheckNotes }}</text>
        </view>
      </view>
    </view>

    <!-- 提交按钮 -->
    <view class="action-section" v-if="taskInstance.status === 'pending'">
        <button 
          class="submit-button"
          :class="{ 'disabled': uploadCount < requiredImages }"
          :disabled="uploadCount < requiredImages"
          @click="handleSubmit"
        >
          <text class="button-text">提交任务</text>
          <text v-if="uploadCount < requiredImages" class="button-tip">
            还需上传 {{ requiredImages - uploadCount }} 张图片
          </text>
        </button>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import UploadImage from '@/components/UploadImage.vue'
import{ getSixDay, submitTasks } from '@/api/sixs'
import { get } from '../../utils/request'


// 响应式数据
const taskInstanceId = ref('')
const taskInfo = ref()
const taskInstance = ref()

const uploadCount = ref(0)
const completionNotes = ref('')

const uploadRef = ref(null)

// 计算属性
const scheduledDate = computed(() => {
  if (!taskInfo.value.scheduled_date) return ''
  const date = new Date(taskInfo.value.scheduled_date)
  const dayNames = ['日', '一', '二', '三', '四', '五', '六']
  const day = dayNames[date.getDay()]
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 星期${day}`
})

// 统一任务名称字段（兼容不同命名）
const taskName = computed(() => {
  if (!taskInfo.value) return ''
  return taskInfo.value.templateName || taskInfo.value.template_name || taskInfo.value.template_name || ''
})

const requiredImages = computed(() => {
  if (!taskInfo.value) return 0
  return taskInfo.value.requiredImages || taskInfo.value.required_images || 0
})

const statusText = computed(() => {
  const statusMap = {
    'pending': '待完成',
    'completed': '已完成',
    'timeout': '已超时'
  }
  return statusMap[taskInstance.value.status] || taskInstance.value.status
})

const spotCheckText = computed(() => {
  const statusMap = {
    'not_checked': '未抽检',
    'passed': '抽检通过',
    'failed': '抽检不通过'
  }
  return statusMap[taskInstance.value.spot_check_status] || taskInstance.value.spot_check_status
})

const statusClass = computed(() => ({
  'pending': taskInstance.value.status === 'pending',
  'completed': taskInstance.value.status === 'completed',
  'timeout': taskInstance.value.status === 'timeout'
}))

const spotCheckClass = computed(() => ({
  'passed': taskInstance.value.spot_check_status === 'passed',
  'failed': taskInstance.value.spot_check_status === 'failed'
}))

// 生命周期
onMounted( async () => {
  const userId = uni.getStorageSync('userId')
    if (!userId) {
      uni.showToast({ title: '用户未登录', icon: 'none' })
      return
    }
    taskInstanceId.value = userId
  
    try {
      const response = await getSixDay(userId)
  
      // 判断 response 是否有效
      if (!response || !response.taskInfo || !response.taskInstance) {
        uni.showToast({ title: '今日暂无6S任务', icon: 'none' })
        // 可选：清空响应式数据
        taskInfo.value = null
        taskInstance.value = null
        return
      }
  
      taskInfo.value = response.taskInfo
      taskInstance.value = response.taskInstance
    } catch (error) {
      console.error('获取6S任务失败:', error)
      uni.showToast({ title: '加载失败，请重试', icon: 'none' })
      taskInfo.value = null
      taskInstance.value = null
    }
})

const updateUploadCount = () => {
  try {
    const files = uploadRef.value?.getAllFiles ? uploadRef.value.getAllFiles() : []
    uploadCount.value = files.length || 0
  } catch (e) {
    uploadCount.value = 0
  }
}

const onUploadSelect = () => updateUploadCount()
const onUploadRemove = () => updateUploadCount()
const onUploadSuccess = () => updateUploadCount()

const previewImage = (index, images) => {
  uni.previewImage({
    current: images[index],
    urls: images
  })
}

const handleSubmit = () => {
  const currentCount = uploadRef.value?.getAllFiles ? (uploadRef.value.getAllFiles() || []).length : 0
  if (currentCount < requiredImages.value) {
    uni.showToast({ title: `请上传${requiredImages.value}张图片`, icon: 'none' })
    return
  }
  
  // if (!completionNotes.value.trim()) {
  //   uni.showModal({ title: '提示', content: '请填写完成情况说明', showCancel: false })
  //   return
  // }
  
  uni.showModal({
    title: '确认提交',
    content: '提交后不可修改，请确认所有内容填写正确。',
    confirmColor: '#4CAF50',
    success: async (res) => {
      if (res.confirm) {
        await submitTask()
      }
    }
  })
}

const submitTask = async () => {
  try {
    uni.showLoading({ title: '提交中...' })
    let submittedUrls = []
    try {
      if (uploadRef.value?.triggerUpload) {
        await uploadRef.value.triggerUpload()
      }
      if (uploadRef.value?.getAllImageUrls) {
        submittedUrls = uploadRef.value.getAllImageUrls() || []
      }
    } catch (err) {
      console.error('图片上传或获取 URL 失败：', err)
    }

    // setTimeout(() => {
      const now = new Date().toISOString()
      taskInstance.value = {
        ...taskInstance.value,
        status: 'completed',
        submittedImages: submittedUrls,
        completionNotes: completionNotes.value
      }
      uni.hideLoading()
      uni.showToast({ title: '任务提交成功', icon: 'success', duration: 2000 })
      await submitTasks(taskInstance.value)

      setTimeout(() => {
        uni.navigateBack()
      }, 2000)
    // }, 1500)
    
  } catch (error) {
    uni.showToast({ title: '提交失败', icon: 'error' })
  }
}

const formatTime = (time) => {
  if (!time) return '--:--'
  const date = new Date(time)
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}
</script>

<style scoped>
.task-submit-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding-bottom: 120rpx;
}

/* 顶部任务卡片 */
.task-header-card {
  background: linear-gradient(135deg, #b9bed3 0%, #acd3e1 90%);
  border-radius: 0 0 32rpx 32rpx;
  /* 控制顶部区域整体高度：缩小 padding */
  padding: 36rpx 30rpx 30rpx;
  color: white;
  box-shadow: 0 8rpx 20rpx rgba(102, 126, 234, 0.16);
}

.task-header-content {
  max-width: 560rpx;
  margin: 0 auto;
}

.task-title-section {
  margin-bottom: 18rpx;
}

.task-badge {
  display: inline-block;
  padding: 6rpx 16rpx;
  border-radius: 18rpx;
  font-size: 20rpx;
  font-weight: 600;
  margin-bottom: 12rpx;
}

.task-badge.pending {
  background: rgba(255, 193, 7, 0.2);
  color: #ffc107;
  border: 1rpx solid rgba(255, 193, 7, 0.3);
}

.task-badge.completed {
  background: rgba(76, 175, 80, 0.2);
  color: #4caf50;
  border: 1rpx solid rgba(76, 175, 80, 0.3);
}

.task-badge.timeout {
  background: rgba(244, 67, 54, 0.2);
  color: #f44336;
  border: 1rpx solid rgba(244, 67, 54, 0.3);
}

.task-main-title {
  font-size: 36rpx;
  font-weight: 700;
  line-height: 1.3;
  display: block;
  margin-top: 6rpx;
}

.task-meta-info {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 15rpx;
}

.meta-icon {
  font-size: 24rpx;
}

.meta-text {
  font-size: 22rpx;
  opacity: 0.9;
}

/* 卡片通用样式 */
.detail-card,
.upload-card,
.submitted-card,
.notes-card,
.inspection-result-card {
  background: white;
  border-radius: 24rpx;
  margin: 30rpx 40rpx;
  padding: 40rpx 35rpx;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.06);
  transition: transform 0.2s ease;
}

.detail-card:hover,
.upload-card:hover,
.submitted-card:hover,
.notes-card:hover,
.inspection-result-card:hover {
  transform: translateY(-4rpx);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30rpx;
  padding-bottom: 20rpx;
  border-bottom: 2rpx solid #f0f2f5;
}

.card-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #1a1a1a;
}

.requirement-badge {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 6rpx 20rpx;
  border-radius: 20rpx;
}

.requirement-text {
  color: white;
  font-size: 24rpx;
  font-weight: 600;
}

.upload-tip {
  color: #666;
  font-size: 24rpx;
}

.detail-content {
  display: flex;
  flex-direction: column;
  gap: 30rpx;
}

.detail-section {
  display: flex;
  flex-direction: column;
  gap: 15rpx;
}

.section-label {
  font-size: 28rpx;
  font-weight: 600;
  color: #667eea;
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.section-content {
  font-size: 28rpx;
  line-height: 1.6;
  color: #444;
  background: #f8f9fa;
  padding: 25rpx;
  border-radius: 12rpx;
  border-left: 6rpx solid #667eea;
}

/* 图片上传区域 */
.image-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 30rpx;
}

.image-item-container {
  position: relative;
}

.image-wrapper {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  border-radius: 20rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 15rpx rgba(0, 0, 0, 0.1);
}

.uploaded-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  opacity: 0;
  transition: opacity 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-item-container:hover .image-overlay {
  opacity: 1;
}

.image-actions {
  display: flex;
  gap: 20rpx;
}

.icon-btn {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.icon-btn:active {
  transform: scale(0.95);
}

.delete-btn {
  background: rgba(255, 68, 68, 0.9);
}

.icon {
  font-size: 36rpx;
}

.image-number {
  position: absolute;
  bottom: 15rpx;
  right: 15rpx;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 4rpx 12rpx;
  border-radius: 12rpx;
  font-size: 22rpx;
  font-weight: 600;
}

.upload-placeholder {
  width: 100%;
  aspect-ratio: 1;
  border: 3rpx dashed #c3cfe2;
  border-radius: 20rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 15rpx;
  color: #667eea;
  background: rgba(102, 126, 234, 0.05);
  transition: all 0.3s ease;
}

.upload-placeholder:active {
  background: rgba(102, 126, 234, 0.1);
  transform: scale(0.98);
}

.add-icon {
  font-size: 72rpx;
  font-weight: 300;
  color: #667eea;
}

.add-text {
  font-size: 28rpx;
  font-weight: 600;
}

.add-tip {
  font-size: 22rpx;
  opacity: 0.7;
}

/* 已提交图片区域 */
.submitted-scroll {
  white-space: nowrap;
}

.submitted-images {
  display: inline-flex;
  gap: 30rpx;
}

.submitted-image-item {
  position: relative;
  width: 280rpx;
  height: 280rpx;
  border-radius: 20rpx;
  overflow: hidden;
  box-shadow: 0 8rpx 25rpx rgba(0, 0, 0, 0.1);
}

.submitted-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-number-badge {
  position: absolute;
  top: 15rpx;
  left: 15rpx;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  width: 50rpx;
  height: 50rpx;
  border-radius: 25rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 24rpx;
}

.submitted-time {
  color: #999;
  font-size: 24rpx;
}

/* 说明区域 */
.notes-content {
  margin-top: 20rpx;
}

.notes-input {
  min-height: 250rpx;
  padding: 30rpx;
  font-size: 28rpx;
  line-height: 1.6;
  background: #f8f9fa;
  border-radius: 20rpx;
  border: 2rpx solid #e9ecef;
  transition: all 0.3s ease;
}

.notes-input:focus {
  border-color: #667eea;
  background: white;
  box-shadow: 0 0 0 3rpx rgba(102, 126, 234, 0.1);
}

.placeholder {
  color: #adb5bd;
}

.submitted-notes {
  background: #f8f9fa;
  padding: 30rpx;
  border-radius: 20rpx;
  border-left: 6rpx solid #4caf50;
}

.notes-text {
  font-size: 28rpx;
  line-height: 1.6;
  color: #444;
}

.word-count {
  color: #adb5bd;
  font-size: 24rpx;
}

/* 抽检结果 */
.result-badge {
  padding: 8rpx 24rpx;
  border-radius: 20rpx;
  font-size: 26rpx;
  font-weight: 600;
}

.result-badge.passed {
  background: rgba(76, 175, 80, 0.1);
  color: #2e7d32;
  border: 1rpx solid #4caf50;
}

.result-badge.failed {
  background: rgba(244, 67, 54, 0.1);
  color: #c62828;
  border: 1rpx solid #f44336;
}

.inspection-content {
  display: flex;
  flex-direction: column;
  gap: 25rpx;
}

.inspector-info {
  display: flex;
  align-items: center;
  gap: 20rpx;
  flex-wrap: wrap;
}

.inspector-label {
  color: #666;
  font-size: 26rpx;
}

.inspector-name {
  font-weight: 600;
  color: #333;
  font-size: 26rpx;
}

.inspector-time {
  color: #999;
  font-size: 24rpx;
}

.inspector-notes {
  background: #f8f9fa;
  padding: 25rpx;
  border-radius: 16rpx;
  border-left: 4rpx solid #667eea;
}

.notes-label {
  font-weight: 600;
  color: #333;
  font-size: 26rpx;
  margin-bottom: 10rpx;
  display: block;
}

.notes-content {
  color: #666;
  font-size: 26rpx;
  line-height: 1.5;
}

/* 提交按钮 */
.action-section {
  padding: 40rpx;
  margin-top: 20rpx;
}

.submit-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 50rpx;
  height: 100rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  font-weight: 600;
  box-shadow: 0 10rpx 30rpx rgba(102, 126, 234, 0.3);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.submit-button::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s ease;
}

.submit-button:active::after {
  left: 100%;
}

.submit-button:active {
  transform: translateY(2rpx);
  box-shadow: 0 5rpx 20rpx rgba(102, 126, 234, 0.3);
}

.submit-button.disabled {
  background: linear-gradient(135deg, #cccccc 0%, #999999 100%);
  box-shadow: none;
}

.button-text {
  font-size: 34rpx;
  font-weight: 700;
  letter-spacing: 2rpx;
}

.button-tip {
  font-size: 24rpx;
  opacity: 0.8;
  font-weight: normal;
}

/* 悬浮按钮 */
.floating-actions {
  position: fixed;
  right: 40rpx;
  bottom: 120rpx;
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  z-index: 1000;
}

.camera-btn,
.album-btn {
  width: 120rpx;
  height: 120rpx;
  border-radius: 60rpx;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 25rpx rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
}

.camera-btn {
  background: linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%);
}

.album-btn {
  background: linear-gradient(135deg, #2196F3 0%, #0D47A1 100%);
}

.camera-btn:active,
.album-btn:active {
  transform: scale(0.95);
  box-shadow: 0 4rpx 15rpx rgba(0, 0, 0, 0.2);
}

.btn-icon {
  font-size: 48rpx;
}
</style>