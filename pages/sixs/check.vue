<template>
  <view class="spot-check-container">
    <!-- 顶部导航栏 -->
    <view class="custom-navbar">
      <view class="navbar-left" @tap="goBack">
        <uni-icons type="arrowleft" size="20" color="#fff"></uni-icons>
      </view>
      <view class="navbar-center">
        <text class="navbar-title">
          {{ hasCheckData ? '抽检结果详情' : '开始抽检' }}
        </text>
      </view>
      <view class="navbar-right"></view>
    </view>

    <scroll-view scroll-y="true" class="content">
      <!-- 任务基本信息（共用部分） -->
      <view class="section">
        <view class="section-title">任务信息</view>
        <view class="info-item">
          <text class="label">任务名称：</text>
          <text class="value">{{ task.templateName }}</text>
        </view>
        <view class="info-item">
          <text class="label">负责人：</text>
          <text class="value">{{ task.employeeName }}</text>
        </view>
        <view class="info-item">
          <text class="label">计划完成时间：</text>
          <text class="value">{{ formatTime(task.plannedCompletionTime) }}</text>
        </view>
      </view>

      <!-- 提交的图片（共用部分） -->
      <view v-if="task.submittedImages && task.submittedImages.length" class="section">
        <view class="section-title">任务提交图片</view>
        <scroll-view class="images-scroll" scroll-x="true">
          <view class="images-wrapper">
            <view
              v-for="(img, index) in task.submittedImages"
              :key="index"
              class="image-item"
              @tap="previewImage(img, task.submittedImages)"
            >
              <image class="task-img" :src="img" mode="aspectFill"></image>
            </view>
          </view>
        </scroll-view>
      </view>

      <!-- ====================== -->
      <!-- 条件渲染：根据是否有抽检数据 -->
      <!-- ====================== -->

      <!-- 模式1：没有抽检数据 - 显示表单 -->
      <view v-if="!hasCheckData" class="section form-section">
        <view class="section-title required">抽检结果</view>
        
        <!-- 使用 uview-plus 的单选框 -->
        <up-radio-group
          v-model="formData.checkResult"
          placement="row"
          @change="onRadioChange"
        >
          <up-radio
            :customStyle="{marginRight: '20px'}"
            label="合格"
            name="pass"
            size="18"
          >
          </up-radio>
          <up-radio
            label="不合格"
            name="fail"
            size="18"
          >
          </up-radio>
        </up-radio-group>

        <view class="input-item">
          <view class="section-title required">抽检备注</view>
          <textarea
            v-model="formData.notes"
            placeholder="请输入抽检备注..."
            maxlength="200"
            class="textarea"
          />
          <view class="char-count">{{ formData.notes.length }}/200</view>
        </view>

        <!-- 使用 UploadImage 组件 -->
        <view class="input-item">
          <view class="section-title">抽检图片（可选）</view>
          <upload-image
            ref="uploadRef"
            :max-count="9"
            title="添加图片"
          />
        </view>
      </view>

      <!-- 模式2：已有抽检数据 - 显示详情 -->
      <view v-else class="section detail-section">
        <view class="section-title">抽检结果</view>
        
        <!-- 抽检状态卡片 -->
        <view class="result-card" :class="getResultCardClass()">
          <view class="result-header">
            <view class="result-icon">
              <uni-icons 
                :type="task.spotCheckResult === 'pass' ? 'checkbox-filled' : 'close'" 
                size="24" 
                :color="task.spotCheckResult === 'pass' ? '#52c41a' : '#f5222d'"
              ></uni-icons>
            </view>
            <view class="result-text">
              <text class="result-title">{{ getResultText() }}</text>
              <text class="result-time">{{ formatTime(task.spotCheckTime) }}</text>
            </view>
          </view>
          
          <!-- 抽检人信息 -->
          <view class="checker-info">
            <image class="checker-avatar" :src="task.spotCheckerAvatar || '/static/default-avatar.png'" mode="aspectFill"></image>
            <view class="checker-details">
              <text class="checker-name">{{ task.spotCheckerName || '抽检员' }}</text>
              <text class="checker-position">{{ task.spotCheckerPosition || '' }}</text>
            </view>
          </view>
        </view>

        <!-- 抽检备注 -->
        <view class="info-item">
          <view class="section-title">抽检备注</view>
          <view class="remark-box">
            <text class="remark-text">{{ task.spotCheckNotes || '无备注' }}</text>
          </view>
        </view>

        <!-- 抽检图片 -->
        <view v-if="task.spotCheckImages && task.spotCheckImages.length" class="info-item">
          <view class="section-title">抽检图片</view>
          <scroll-view class="images-scroll" scroll-x="true">
            <view class="images-wrapper">
              <view
                v-for="(img, index) in task.spotCheckImages"
                :key="index"
                class="image-item"
                @tap="previewImage(img, task.spotCheckImages)"
              >
                <image class="task-img" :src="img" mode="aspectFill"></image>
                <!-- 图片标签 -->
                <view v-if="task.spotCheckResult === 'fail'" class="image-tag fail">
                  <text>不合格</text>
                </view>
                <view v-else-if="task.spotCheckResult === 'pass'" class="image-tag pass">
                  <text>合格</text>
                </view>
              </view>
            </view>
          </scroll-view>
        </view>


        <!-- 重新抽检按钮（只有管理员或有权限的用户可见） -->
        <view v-if="canRecheck" class="recheck-section">
          <button class="recheck-btn" @tap="handleRecheck">
            <uni-icons type="reload" size="16" color="#1890ff"></uni-icons>
            <text>重新抽检</text>
          </button>
        </view>
      </view>
    </scroll-view>

    <!-- 底部固定按钮（只在编辑模式显示） -->
    <view v-if="!hasCheckData" class="fixed-bottom">
      <button class="submit-btn" @tap="submitCheck">提交抽检结果</button>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad,  } from '@dcloudio/uni-app'
import UploadImage from '@/components/UploadImage.vue'
import { getTaskById, submitSpotCheck } from '@/api/sixs'

const taskId = ref(null)
const task = ref({})
const uploadRef = ref(null)

// 表单数据（用于编辑模式）
const formData = ref({
  checkResult: '',
  notes: ''
})

// 计算属性：判断是否有抽检数据
const hasCheckData = computed(() => {
  return task.value.spotCheckResult && task.value.spotCheckResult !== 'not_checked'
})

// 计算属性：是否有重新抽检权限（这里简单判断，实际根据用户角色）
const canRecheck = computed(() => {
  // 这里可以根据用户角色判断，比如管理员、主管等
  const userRole = 'admin' // 实际应该从 store 获取
  return userRole === 'admin' || userRole === 'supervisor'
})

// 页面加载
onLoad((options) => {
  if (options.id) {
    taskId.value = parseInt(options.id)
    fetchTaskDetail()
  } else {
    uni.showToast({ title: '无效的任务ID', icon: 'none' })
    goBack()
  }
})

// 获取任务详情
const fetchTaskDetail = async () => {
  try {
    const res = await getTaskById(taskId.value)
    task.value = res || {}
    
    // 如果已有抽检数据，可以在这里预处理显示
    console.log('任务数据:', task.value)
    console.log('是否有抽检数据:', hasCheckData.value)
  } catch (error) {
    console.error('获取任务详情失败:', error)
    uni.showToast({ title: '加载失败', icon: 'error' })
  }
}

// 单选框变化
const onRadioChange = (value) => {
  console.log('抽检结果选择:', value)
}

// 提交抽检结果（编辑模式）
const submitCheck = async () => {
  // 验证必填项
  if (!formData.value.checkResult) {
    uni.showToast({ title: '请选择抽检结果', icon: 'none' })
    return
  }
  
  if (!formData.value.notes.trim()) {
    uni.showToast({ title: '请输入抽检备注', icon: 'none' })
    return
  }
  
  uni.showLoading({ title: '提交中...' })

  try {
    // 触发上传组件上传图片
    await uploadRef.value?.triggerUpload?.()
    
    // 获取上传的图片URL
    const uploadedImageUrls = uploadRef.value?.getAllImageUrls?.() || []
    
    // 构造提交数据
    const data = {
      id: taskId.value,
      spotCheckerId: uni.getStorageSync('userId'),
      spotCheckResult: formData.value.checkResult,
      spotCheckNotes: formData.value.notes.trim(),
      spotCheckImages: uploadedImageUrls
    }
    
    console.log('提交的数据:', data)
    
    // 调用API提交
    await submitSpotCheck(data)
    
    uni.showToast({ title: '提交成功', icon: 'success' })
    
    // 提交成功后重新加载数据，界面会自动切换为详情模式
    setTimeout(() => {
      fetchTaskDetail()
    }, 1000)
  } catch (error) {
    console.error('提交失败:', error)
    uni.showToast({ title: error.message || '提交失败，请重试', icon: 'error' })
  } finally {
    uni.hideLoading()
  }
}

// 重新抽检（详情模式）
const handleRecheck = () => {
  uni.showModal({
    title: '提示',
    content: '确定要重新进行抽检吗？这将覆盖原有抽检结果。',
    success: (res) => {
      if (res.confirm) {
        // 清除原有抽检数据，切换回编辑模式
        // 这里可以调用API清除数据，或者直接在本地切换到编辑模式
        // 如果API支持，可以调用清除接口
        // 否则，我们可以直接重置表单数据
        formData.value = {
          checkResult: '',
          notes: ''
        }
        
        // 清除图片
        uploadRef.value?.clearImages?.()
        
        uni.showToast({ 
          title: '可以开始重新抽检', 
          icon: 'success',
          duration: 2000
        })
        
        // 如果需要，可以刷新任务数据
        // fetchTaskDetail()
      }
    }
  })
}

// 返回上一页
const goBack = () => {
  uni.navigateBack()
}

// 预览图片
const previewImage = (current, urls) => {
  uni.previewImage({
    current,
    urls,
    indicator: 'number',
    loop: true
  })
}

// 时间格式化
const formatTime = (datetime) => {
  if (!datetime) return ''
  const d = new Date(datetime)
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatFullTime = (datetime) => {
  if (!datetime) return '--'
  const d = new Date(datetime)
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// 获取结果文本
const getResultText = () => {
  if (task.value.spotCheckResult === 'pass') {
    return '抽检合格'
  } else if (task.value.spotCheckResult === 'fail') {
    return '抽检不合格'
  }
  return '未抽检'
}

// 获取结果卡片样式类
const getResultCardClass = () => {
  if (task.value.spotCheckResult === 'pass') {
    return 'pass-card'
  } else if (task.value.spotCheckResult === 'fail') {
    return 'fail-card'
  }
  return 'default-card'
}
</script>

<style lang="scss" scoped>
.spot-check-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  display: flex;
  flex-direction: column;
}

.custom-navbar {
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  color: #fff;
  padding: 10px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;

  .navbar-center {
    flex: 1;
    text-align: center;
    .navbar-title {
      font-size: 18px;
      font-weight: 600;
    }
  }
}

.content {
  flex: 1;
  padding: 16px;
}

.section {
  background: #fff;
  border-radius: 10px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);

  .section-title {
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 12px;
    color: #333;

    &.required::after {
      content: "*";
      color: red;
      margin-left: 4px;
    }
  }

  .info-item {
    margin-bottom: 12px;
    font-size: 14px;
    display: flex;
    align-items: flex-start;

    .label {
      font-weight: 500;
      color: #666;
      min-width: 100px;
    }
    
    .value {
      color: #333;
      flex: 1;
    }
  }
}

.images-scroll {
  width: 100%;
  white-space: nowrap;

  .images-wrapper {
    display: inline-flex;
    gap: 10px;
  }

  .image-item {
    position: relative;
    width: 100px;
    height: 100px;
    border-radius: 8px;
    overflow: hidden;
    flex-shrink: 0;

    .task-img {
      width: 100%;
      height: 100%;
    }
    
    .image-tag {
      position: absolute;
      top: 6px;
      right: 6px;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 500;
      
      &.pass {
        background: rgba(82, 196, 26, 0.9);
        color: #fff;
      }
      
      &.fail {
        background: rgba(245, 34, 45, 0.9);
        color: #fff;
      }
    }
  }
}

/* 编辑模式样式 */
.form-section {
  .radio-group {
    margin-bottom: 20px;
    
    :deep(.u-radio) {
      margin-right: 20px;
      
      .u-radio__label {
        font-size: 15px;
        color: #333;
      }
    }
    
    :deep(.u-radio.is-checked) {
      .u-radio__label {
        color: #1890ff;
        font-weight: 500;
      }
    }
  }
  
  .input-item {
    margin-bottom: 20px;
    
    .textarea {
      width: 100%;
      min-height: 80px;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 6px;
      font-size: 14px;
      box-sizing: border-box;
    }
    
    .char-count {
      text-align: right;
      font-size: 12px;
      color: #999;
      margin-top: 4px;
    }
  }
}

/* 详情模式样式 */
.detail-section {
  .result-card {
    padding: 16px;
    border-radius: 8px;
    margin-bottom: 20px;
    
    &.pass-card {
      background: linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%);
      border: 1px solid #b7eb8f;
    }
    
    &.fail-card {
      background: linear-gradient(135deg, #fff1f0 0%, #ffccc7 100%);
      border: 1px solid #ffa39e;
    }
    
    &.default-card {
      background: #fafafa;
      border: 1px solid #d9d9d9;
    }
    
    .result-header {
      display: flex;
      align-items: center;
      margin-bottom: 12px;
      
      .result-icon {
        margin-right: 12px;
      }
      
      .result-text {
        flex: 1;
        display: flex;
        flex-direction: column;
        
        .result-title {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 4px;
          
          .pass-card & {
            color: #52c41a;
          }
          
          .fail-card & {
            color: #f5222d;
          }
        }
        
        .result-time {
          font-size: 12px;
          color: #999;
        }
      }
    }
    
    .checker-info {
      display: flex;
      align-items: center;
      background: rgba(255, 255, 255, 0.8);
      padding: 8px 12px;
      border-radius: 6px;
      
      .checker-avatar {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        margin-right: 8px;
        border: 2px solid #fff;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }
      
      .checker-details {
        flex: 1;
        display: flex;
        flex-direction: column;
        
        .checker-name {
          font-size: 14px;
          font-weight: 500;
          color: #333;
        }
        
        .checker-position {
          font-size: 12px;
          color: #666;
        }
      }
    }
  }
  
  .remark-box {
    background: #fafafa;
    padding: 12px;
    border-radius: 6px;
    border-left: 4px solid #1890ff;
    
    .remark-text {
      font-size: 14px;
      color: #333;
      line-height: 1.5;
    }
  }
  
  .detail-list {
    background: #fafafa;
    border-radius: 8px;
    padding: 12px;
    
    .detail-item {
      display: flex;
      align-items: center;
      margin-bottom: 8px;
      font-size: 14px;
      
      .detail-label {
        color: #666;
        min-width: 90px;
        font-weight: 500;
      }
      
      .detail-value {
        color: #333;
        flex: 1;
      }
    }
  }
  
  .recheck-section {
    margin-top: 20px;
    padding-top: 16px;
    border-top: 1px solid #eee;
    
    .recheck-btn {
      width: 100%;
      height: 40px;
      background: #e6f7ff;
      color: #1890ff;
      border-radius: 20px;
      font-size: 15px;
      font-weight: 500;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      
      &:active {
        background: #bae7ff;
      }
    }
  }
}

.fixed-bottom {
  padding: 12px 16px 20px;
  background: #fff;
  border-top: 1px solid #eee;

  .submit-btn {
    width: 100%;
    height: 44px;
    background: #1890ff;
    color: #fff;
    border-radius: 22px;
    font-size: 16px;
    font-weight: 500;
    
    &:active {
      background: #096dd9;
    }
  }
}
</style>