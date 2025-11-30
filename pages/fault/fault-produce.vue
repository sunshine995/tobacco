<template>
  <view class="container">

    <!-- 状态流程条 - 优化版 -->
    <view class="step-bar">
      <u-steps :current="currentStep" :active-color="currentColor">
        <u-steps-item
          v-for="(step, index) in steps"
          :key="index"
          :title="step.text"
          :inactive-icon="step.icon"
        />
      </u-steps>
    </view>

    <!-- 异常信息 -->
    <view class="info-card">
      <view class="card-header">
        <text class="card-title">异常信息</text>
        <view class="status-badge" :class="getStatusClass(exception.status)">
          {{ getStatusText(exception.status) }}
        </view>
      </view>
      
      <view class="info-grid">
        <!-- 第一行：异常位置和上报人 -->
        <view class="info-row">
          <view class="info-item">
            <view class="info-label">
              <u-icon name="map" size="16" color="#909399"></u-icon>
              <text>异常位置</text>
            </view>
            <text class="info-value">{{ exception.section }}</text>
          </view>
          <view class="info-item">
            <view class="info-label">
              <u-icon name="man" size="16" color="#409eff"></u-icon>
              <text>上报人</text>
            </view>
            <text class="info-value">{{ exception.reporterName || '未知' }}</text>
          </view>
        </view>
        
        <!-- 第二行：上报时间 -->
        <view class="info-row">
          <view class="info-item full-width">
            <view class="info-label">
              <u-icon name="calendar" size="16" color="#67c23a"></u-icon>
              <text>上报时间</text>
            </view>
            <text class="info-value">{{ formatTime(exception.reportTime) }}</text>
          </view>
        </view>
      </view>
      
      <!-- 异常描述 -->
      <view class="description-section">
        <view class="desc-label">
          <u-icon name="edit-pen" size="16" color="#606266"></u-icon>
          <text>异常描述</text>
        </view>
        <view class="desc-content">{{ exception.description }}</view>
      </view>
    </view>
    
    <!-- 上报图片（只读） -->
    <view v-if="reportImages.length > 0" class="image-section">
      <view class="upload-title">上报图片</view>
      <scroll-view class="image-scroll" scroll-x enable-flex>
        <view class="image-wrapper">
          <u-image
            v-for="(img, index) in reportImages"
            :key="index"
            :src="img.url"
            width="200rpx"
            height="150rpx"
            style="margin: 0 10rpx;"
            border-radius="4"
            @click="previewImage(reportImages.map(i => i.url), index)"
          />
        </view>
      </scroll-view>
    </view>
    
    <!-- 处理过程图片 -->
    <view v-if="processImages.length > 0" class="image-section">
      <view class="upload-title">处理过程照片</view>
      <scroll-view class="image-scroll" scroll-x enable-flex>
        <view class="image-wrapper">
          <u-image
            v-for="(img, index) in processImages"
            :key="index"
            :src="img.url"
            width="200rpx"
            height="150rpx"
            style="margin: 0 10rpx;"
            border-radius="4"
            @click="previewImage(processImages.map(i => i.url), index)"
          />
        </view>
      </scroll-view>
    </view>
    
    <!-- 处理结果图片 -->
    <view v-if="resultImages.length > 0" class="image-section">
      <view class="upload-title">处理结果照片</view>
      <scroll-view class="image-scroll" scroll-x enable-flex>
        <view class="image-wrapper">
          <u-image
            v-for="(img, index) in resultImages"
            :key="index"
            :src="img.url"
            width="200rpx"
            height="150rpx"
            style="margin: 0 10rpx;"
            border-radius="4"
            @click="previewImage(resultImages.map(i => i.url), index)"
          />
        </view>
      </scroll-view>
    </view>
    
    <!-- 接收异常按钮（仅在 reported 状态显示） -->
    <view v-if="showReceiveButton" class="action-section">
      <u-button
        type="primary"
        text="接收异常"
        @click="handleReceive"
        :loading="submitting"
        block
      />
      <view class="action-tip">接收后开始处理此异常</view>
    </view>
    
    <!-- 班长处理表单（仅在 in_progress 状态显示） -->
    <view v-if="showHandleForm" class="handle-form">
      <view class="form-title">异常处理</view>
      
      <!-- 处理过程图片上传 -->
      <view class="upload-section">
        <view class="upload-title">上传处理过程照片（可选）</view>
        <upload-image
          ref="processUploadRef"
          :max-count="3"
          title="上传处理过程图片"
        />
      </view>
      
      <!-- 处理结果图片上传 -->
      <view class="upload-section">
        <view class="upload-title">上传处理结果照片（可选）</view>
        <upload-image
          ref="resultUploadRef"
          :max-count="3"
          title="上传处理结果图片"
        />
      </view>
      
      <!-- 处理意见 -->
      <view class="form-item">
        <view class="form-label">处理意见 *</view>
        <u--textarea
          v-model="handleOpinion"
          placeholder="请详细描述异常原因、处理措施及预防建议"
          :border="true"
          height="200"
          maxlength="1000"
          show-word-limit
        />
      </view>
    
    </view>

    <!-- 已处理信息展示 -->
    <view v-if="exception.status === 'repaired'" class="result-card">
      <view class="card-title">处理结果</view>
      <u-cell-group>
        <u-cell title="处理人" :value="exception.supervisorName || '未知'" />
        <u-cell title="处理意见" :value="exception.repairNotes" />
        <u-cell title="处理耗时" :value="`${exception.durationMinutes}分钟`" />
      </u-cell-group>
    </view>

    <!-- 提交处理结果按钮（仅在 in_progress 状态显示） -->
    <view v-if="showSubmitButton" class="action-section">
      <u-button
        type="success"
        text="提交处理结果"
        @click="handleSubmit"
        :loading="submitting"
        block
      />
      <view class="action-tip">提交后将完成此异常处理</view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getFaultDetail, updateAdminStatusApi } from '@/api/fault.js'
import UploadImage from '@/components/UploadImage.vue';

// 页面参数
const exceptionType = ref('') // 'production' 或 'quality'
const exceptionId = ref(null)

// 上传组件引用
const processUploadRef = ref(null)
const resultUploadRef = ref(null)

// 异常数据
const exception = ref({})

// 图片分类
const reportImages = ref([])    // 上报图片
const processImages = ref([])   // 处理过程图片
const resultImages = ref([])    // 处理结果图片

// 表单数据
const handleOpinion = ref('')
const handleDuration = ref('')

const submitting = ref(false)

// 步骤条配置 - 优化版
const steps = [
  { key: 'reported', text: '已上报', icon: 'clock' },
  { key: 'progress', text: '处理中', icon: 'edit-pen' },
  { key: 'repaired', text: '已处理', icon: 'checkmark' }
]

const statusMap = {
  reported: 0,
  progress: 1,
  repaired: 2
}

onLoad((query) => {
  exceptionType.value = query.type // 'production' 或 'quality'
  exceptionId.value = Number(query.id)
  loadDetail()
})

// 加载异常详情
async function loadDetail() {
  try {
    const res = await getFaultDetail(exceptionId.value)
    exception.value = res
    
    // 分类加载图片
    reportImages.value = (res.imageUrls || []).map(url => ({ url }))
    processImages.value = (res.arrivalImageUrls || []).map(url => ({ url }))
    resultImages.value = (res.repairImageUrls || []).map(url => ({ url }))
    
    // 如果是已处理状态，填充表单数据
    if (res.status === 'repaired') {
      handleOpinion.value = res.supervisorOpinion || ''
      handleDuration.value = res.resolveDuration || ''
    }
    
  } catch (err) {
    console.error('加载详情失败:', err)
    uni.$u.toast('加载失败')
  }
}

// 状态样式映射
const getStatusClass = (status) => {
  const classMap = {
    reported: 'status-reported',
    progress: 'status-progress', 
    repaired: 'status-repaired'
  }
  return classMap[status] || 'status-reported'
}

const getStatusText = (status) => {
  const textMap = {
    reported: '待处理',
    progress: '处理中',
    repaired: '已处理'
  }
  return textMap[status] || '待处理'
}

// 异常类型文本
const exceptionTypeText = computed(() => {
  const types = {
    production: '生产异常',
    quality: '质量异常'
  }
  return types[exceptionType.value] || '异常'
})

// 显示接收按钮的条件
const showReceiveButton = computed(() => {
  const userInfo = uni.getStorageSync('userInfo')
  return userInfo.role === 'ADMIN' && exception.value.status === 'reported'
})

// 显示处理表单的条件
const showHandleForm = computed(() => {
  return exception.value.status === 'progress'
})

// 显示提交按钮的条件
const showSubmitButton = computed(() => {
  const userInfo = uni.getStorageSync('userInfo')
  return userInfo.role === 'ADMIN' && exception.value.status === 'progress'
})

// 计算当前步骤
const currentStep = computed(() => {
  return statusMap[exception.value.status] || 0
})

const currentColor = computed(() => {
  const colors = { 0: '#909399', 1: '#409eff', 2: '#67c23a' }
  return colors[currentStep.value] || '#909399'
})

// 接收异常
async function handleReceive() {
  uni.showModal({
    content: '确定接收此异常吗？',
    success: async (res) => {
      if (res.confirm) {
        submitting.value = true
        try {
          const formData = { 
            status: 'progress',
            faultId: exceptionId.value
          }

          await updateAdminStatusApi(formData)
          uni.$u.toast('已接收异常')
          exception.value.status = 'progress'
          loadDetail() // 刷新详情
        } catch (err) {
          console.error('接收失败:', err)
          uni.$u.toast('接收失败')
        } finally {
          submitting.value = false
        }
      }
    }
  })
}

// 提交处理结果
async function handleSubmit() {
  // 验证必填字段
  if (!handleOpinion.value.trim()) {
    uni.$u.toast('请填写处理意见')
    return
  }

  uni.showModal({
    content: '确定提交处理结果吗？',
    success: async (res) => {
      if (res.confirm) {
        submitting.value = true
        try {
          const formData = { 
            status: 'repaired',
            faultId: exceptionId.value,
			repairNotes: handleOpinion.value
          }

          // 处理图片上传
          const processUrls = await uploadImages(processUploadRef.value)
          const resultUrls = await uploadImages(resultUploadRef.value)
          
          if (processUrls.length > 0) {
            formData.processImageUrls = processUrls
          }
          
          if (resultUrls.length > 0) {
            formData.resultImageUrls = resultUrls
          }
		  console.log(formData)
          await updateAdminStatusApi(formData)
          uni.$u.toast('处理结果提交成功')
          exception.value.status = 'repaired'
          loadDetail() // 刷新详情
        } catch (err) {
          console.error('提交失败:', err)
          uni.$u.toast('提交失败')
        } finally {
          submitting.value = false
        }
      }
    }
  })
}

// 图片上传辅助函数
async function uploadImages(uploadRef) {
  if (!uploadRef) return []
  
  try {
    await uploadRef.triggerUpload()
    return uploadRef.getUploadedUrls()
  } catch (err) {
    console.error('图片上传失败:', err)
    return []
  }
}

// 图片预览
function previewImage(urls, currentIndex) {
  uni.previewImage({
    urls: urls,
    current: currentIndex
  })
}

// 格式化时间
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
</script>

<style lang="scss" scoped>
.container {
  min-height: 100vh;
  background-color: #f8f8f8;
  padding-bottom: 40rpx;
}

.step-bar {
  padding: 20px 16px 10px;
  background-color: #fff;
  margin-bottom: 10px;
}

.result-card {
  background-color: #fff;
  margin: 0 10px 10px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.card-title {
  padding: 16px 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.handle-form {
  background-color: #fff;
  margin: 0 10px 10px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.form-title {
  padding: 16px;
  font-size: 16px;
  font-weight: 600;
  color: #333;
  border-bottom: 1px solid #f0f0f0;
}

.form-item {
  padding: 0 16px 16px;
}

.form-label {
  font-size: 14px;
  color: #333;
  margin-bottom: 8px;
  font-weight: 500;
}

.upload-section,
.image-section {
  padding: 0 16px 16px;
  background-color: #fff;
}

.upload-title {
  font-size: 14px;
  color: #333;
  margin: 10px 0 5px;
  font-weight: 500;
}

.image-scroll {
  white-space: nowrap;
  width: 100%;
  padding: 10rpx 0;
}

.image-wrapper {
  display: flex;
  align-items: center;
}

.action-section {
  padding: 20rpx;
  background-color: #fff;
  margin: 20rpx;
  border-radius: 12rpx;
  box-shadow: 0 4rpx 24rpx rgba(0, 0, 0, 0.06);
}

.action-tip {
  font-size: 24rpx;
  color: #909399;
  text-align: center;
  margin-top: 16rpx;
}

/* 表单样式优化 */
:deep(.u-input) {
  padding: 8px 0;
}

:deep(.u-textarea) {
  margin-top: 8px;
}

.info-card {
  background: #fff;
  margin: 20rpx;
  border-radius: 12rpx;
  box-shadow: 0 4rpx 24rpx rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx 32rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.card-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #303133;
  padding: 0;
}

.status-badge {
  padding: 8rpx 20rpx;
  border-radius: 20rpx;
  font-size: 24rpx;
  font-weight: 500;
  
  &.status-reported {
    background: #fef0f0;
    color: #f56c6c;
  }
  
  &.status-progress {
    background: #fdf6ec;
    color: #e6a23c;
  }
  
  &.status-resolved {
    background: #f0f9ff;
    color: #409eff;
  }
}

.info-grid {
  padding: 0 32rpx;
}

.info-row {
  display: flex;
  margin: 24rpx 0;
  gap: 32rpx;
}

.info-item {
  flex: 1;
  
  &.full-width {
    flex: 0 0 100%;
  }
}

.info-label {
  display: flex;
  align-items: center;
  margin-bottom: 12rpx;
  
  text {
    margin-left: 12rpx;
    font-size: 26rpx;
    color: #606266;
  }
}

.info-value {
  font-size: 28rpx;
  color: #303133;
  font-weight: 500;
  word-break: break-all;
}

.description-section {
  padding: 24rpx 32rpx;
  border-top: 1rpx solid #f0f0f0;
}

.desc-label {
  display: flex;
  align-items: center;
  margin-bottom: 16rpx;
  
  text {
    margin-left: 12rpx;
    font-size: 26rpx;
    color: #606266;
    font-weight: 500;
  }
}

.desc-content {
  font-size: 28rpx;
  color: #303133;
  line-height: 1.6;
  background: #f8f9fa;
  padding: 20rpx;
  border-radius: 8rpx;
  border-left: 4rpx solid #409eff;
}
</style>