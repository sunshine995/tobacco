<template>
  <view class="page">

    <!-- 顶部标题卡片 -->
    <view class="header-card">
      <view class="title-row">
        <text class="title">{{ title }}</text>
        <view class="type-badge" :class="type.toLowerCase()">
          {{ type === 'VIDEO' ? '视频' : '文档' }}
        </view>
      </view>
      <view class="meta-info">
        <text class="duration" v-if="type === 'VIDEO'">
          时长: {{ formatTime(resource.duration || 0) }}
        </text>
        <text class="size" v-else-if="type === 'PDF' && resource.fileSize">
          大小: {{ formatFileSize(resource.fileSize) }}
        </text>
      </view>
    </view>

    <!-- 内容区域 -->
    <view class="content-card">
      <!-- 视频播放器 -->
      <view v-if="type === 'VIDEO'" class="video-section">
        <video
          class="video"
          :src="resource.fileUrl"
          controls
          :autoplay="false"
          :show-center-play-btn="false"
          @play="onPlay"
          @pause="onPause"
          @ended="onEnded"
        />
        <view class="video-controls" v-if="!completed">
          <button 
            class="control-btn" 
            @click="togglePlayback"
            :class="isPlaying ? 'pause-btn' : 'play-btn'"
          >
            <text class="icon">{{ isPlaying ? '⏸️' : '▶️' }}</text>
            {{ isPlaying ? '暂停' : '播放' }}
          </button>
        </view>
      </view>

      <!-- PDF 文档显示 -->
      <view v-if="type === 'PDF'" class="pdf-section">
        <view class="pdf-preview" @click="openPDF">
          <view class="pdf-icon-container">
            <image 
              src="/static/pdf-icon.png" 
              class="pdf-icon"
              mode="aspectFit"
            />
            <view class="pdf-overlay">
              <text class="overlay-text">点击打开</text>
            </view>
          </view>
          <view class="pdf-info">
            <text class="pdf-name">{{ resource.fileName || title }}</text>
            <view class="pdf-meta">
              <text class="pdf-type">PDF文档</text>
              <text class="pdf-size" v-if="resource.fileSize">
                {{ formatFileSize(resource.fileSize) }}
              </text>
            </view>
          </view>
        </view>
        
        <!-- 学习状态提示 -->
        <view class="study-status" v-if="isStudying">
          <text class="studying-text">⏱️ 正在学习，已学习 {{ formatTime(studySeconds) }}</text>
        </view>
        
        <!-- 手动控制按钮 -->
        <view class="pdf-controls">
          <button 
            class="pdf-btn primary" 
            @click="openPDF"
          >
            <text class="btn-icon">📄</text>
            打开文档
          </button>
          <button 
            class="pdf-btn secondary" 
            @click="toggleStudy"
            v-if="studyStarted"
          >
            <text class="btn-icon">{{ isStudying ? '⏸️' : '▶️' }}</text>
            {{ isStudying ? '暂停学习' : '继续学习' }}
          </button>
        </view>
      </view>
    </view>

    <!-- 学习进度卡片 -->
    <view class="progress-card">
      <view class="progress-header">
        <view class="progress-title-row">
          <text class="progress-title">学习进度</text>
          <text class="progress-percent">{{ Math.round(progress) }}%</text>
        </view>
        <view class="progress-stats">
          <text class="progress-time">
            ⏱️ {{ Math.floor(studySeconds / 60) }} 分钟 {{ studySeconds % 60 }} 秒
          </text>
          <text class="progress-total" v-if="resource.duration">
            总时长: {{ resource.duration }} 分钟
          </text>
        </view>
      </view>
      
      <!-- 进度条 -->
      <view class="progress-bar-container">
        <view class="progress-bar-bg">
          <view 
            class="progress-bar-fill" 
            :style="{ width: progress + '%' }"
          ></view>
        </view>
        <view class="progress-marks">
          <text class="progress-mark" :style="{ left: '0%' }">0%</text>
          <text class="progress-mark" :style="{ left: '50%' }">50%</text>
          <text class="progress-mark" :style="{ left: '100%' }">100%</text>
        </view>
      </view>
      
      <!-- 进度控制 -->
      <view class="progress-controls">
        <text class="progress-hint" v-if="progress < 30">继续加油！</text>
        <text class="progress-hint" v-else-if="progress < 80">保持学习！</text>
        <text class="progress-hint" v-else-if="progress < 100">快完成了！</text>
        <text class="progress-hint" v-else>学习完成！</text>
      </view>
    </view>

    <!-- 学习状态 -->
    <view class="status-section">
      <view class="status-card" :class="{ completed: completed }">
        <view class="status-icon">
          <text v-if="completed">✅</text>
          <text v-else-if="isStudying">📚</text>
          <text v-else>⏸️</text>
        </view>
        <view class="status-content">
          <text class="status-title">
            {{ completed ? '已完成学习' : isStudying ? '正在学习中...' : '学习已暂停' }}
          </text>
          <text class="status-desc" v-if="!completed">
            {{ isStudying ? '学习时长将持续累计' : '点击"继续学习"恢复计时' }}
          </text>
          <text class="status-desc" v-else>
            恭喜你完成学习！
          </text>
        </view>
        <up-tag
          :text="completed ? '已完成' : isStudying ? '进行中' : '已暂停'"
          :type="completed ? 'success' : isStudying ? 'primary' : 'warning'"
          size="small"
          class="status-tag"
        />
      </view>
      
      <!-- 操作按钮 -->
      <view class="action-buttons">
        <button 
          class="action-btn finish-btn" 
          @click="finishStudy"
          :disabled="!studyStarted"
        >
          结束学习
        </button>
        <button 
          class="action-btn restart-btn" 
          @click="restartStudy"
          v-if="studySeconds > 0"
        >
          重新开始
        </button>
      </view>
    </view>

    <!-- 加载提示 -->
    <uni-popup ref="loadingPopup" type="center" background-color="rgba(0,0,0,0.5)">
      <view class="loading-popup">
        <view class="loading-spinner">
          <text class="spinner">⏳</text>
        </view>
        <text class="loading-text">{{ loadingText }}</text>
      </view>
    </uni-popup>

  </view>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { onLoad, onUnload, onShow, onHide } from '@dcloudio/uni-app'
import { getLearnById } from'@/api/learn.js'

const id = ref(null)
const type = ref('')
const title = ref('')
const resource = ref({})
const recordId = ref(null)

const studySeconds = ref(0)
const progress = ref(0)
const completed = ref(false)
const isPlaying = ref(false)
const isStudying = ref(false)
const studyStarted = ref(false)
const studyStartTime = ref(0)
const backgroundStartTime = ref(0)

let timer = null
const loadingPopup = ref(null)
const loadingText = ref('')

onLoad((options) => {
  id.value = Number(options.id)
  type.value = options.type
  title.value = options.title
})

onMounted(async () => {
  await loadResource()
})

onUnload(() => {
  endStudy()
})

onShow(() => {
  // 应用回到前台
  if (backgroundStartTime.value > 0) {
    const backgroundTime = Math.floor((Date.now() - backgroundStartTime.value) / 1000)
    // 如果后台停留时间小于10分钟，认为还在学习
    if (backgroundTime < 600 && isStudying.value) {
      resumeStudy()
    } else {
      // 超过10分钟，暂停学习
      pauseStudy()
    }
  }
  backgroundStartTime.value = 0
})

onHide(() => {
  // 应用进入后台
  backgroundStartTime.value = Date.now()
  pauseStudy()
})

/** 加载资源详情 */
const loadResource = async () => {
  try {
    showLoading('加载资源中...')
    const res = await getLearnById(id.value)
    resource.value = res
    hideLoading()
  } catch (error) {
    hideLoading()
    uni.showToast({
      title: '加载失败',
      icon: 'error'
    })
  }
}

/** 显示加载提示 */
const showLoading = (text = '请稍候...') => {
  loadingText.value = text
  if (loadingPopup.value) {
    loadingPopup.value.open()
  }
}

/** 隐藏加载提示 */
const hideLoading = () => {
  if (loadingPopup.value) {
    loadingPopup.value.close()
  }
}

/** 打开 PDF 文档 */
const openPDF = async () => {
  if (!resource.value.fileUrl) {
    uni.showToast({
      title: '文档链接无效',
      icon: 'none'
    })
    return
  }
  
  showLoading('正在打开文档...')
  
  try {
    // 如果还没开始学习，先开始学习记录
    if (!studyStarted.value) {
      await startStudy()
    }
    
    // 标记为学习中
    isStudying.value = true
    studyStartTime.value = Date.now()
    startStudyTimer()
    
    // 打开 PDF 文档
    uni.openDocument({
      filePath: resource.value.fileUrl,
      fileType: 'pdf',
      showMenu: true,
      success: () => {
        hideLoading()
        uni.showToast({
          title: '文档已打开',
          icon: 'success'
        })
      },
      fail: (err) => {
        hideLoading()
        console.error('打开文档失败:', err)
        
        // 尝试下载后打开
        uni.showModal({
          title: '提示',
          content: '在线打开失败，是否尝试下载后再打开？',
          success: (res) => {
            if (res.confirm) {
              downloadAndOpenPDF()
            }
          }
        })
      }
    })
  } catch (error) {
    hideLoading()
    console.error('打开文档异常:', error)
    uni.showToast({
      title: '打开失败',
      icon: 'error'
    })
  }
}

/** 下载并打开 PDF */
const downloadAndOpenPDF = async () => {
  showLoading('正在下载文档...')
  
  try {
    const downloadTask = uni.downloadFile({
      url: resource.value.fileUrl,
      success: (downloadResult) => {
        if (downloadResult.statusCode === 200) {
          const tempFilePath = downloadResult.tempFilePath
          
          // 打开本地文档
          uni.openDocument({
            filePath: tempFilePath,
            fileType: 'pdf',
            showMenu: true,
            success: () => {
              hideLoading()
            },
            fail: (openErr) => {
              hideLoading()
              console.error('打开本地文档失败:', openErr)
            }
          })
        } else {
          hideLoading()
          uni.showToast({
            title: '下载失败',
            icon: 'none'
          })
        }
      },
      fail: (downloadErr) => {
        hideLoading()
        console.error('下载失败:', downloadErr)
        uni.showToast({
          title: '下载失败，请检查网络',
          icon: 'none'
        })
      }
    })
    
    // 监听下载进度
    downloadTask.onProgressUpdate((progress) => {
      loadingText.value = `下载中 ${progress.progress}%`
    })
  } catch (error) {
    hideLoading()
    console.error('下载异常:', error)
  }
}

/** 开始学习 */
const startStudy = async () => {
  try {
    const res = await uni.request({
      url: `/api/learning/start/${id.value}`,
      method: 'POST'
    })
    recordId.value = res.data
    studyStarted.value = true
  } catch (error) {
    console.error('开始学习记录失败:', error)
  }
}

/** 开始学习计时器 */
const startStudyTimer = () => {
  if (timer) clearInterval(timer)
  
  timer = setInterval(() => {
    if (isStudying.value) {
      studySeconds.value++
      
      // 更新进度（如果设置了资源时长）
      if (resource.value.duration) {
        progress.value = Math.min(
          100,
          (studySeconds.value / (resource.value.duration * 60)) * 100
        )
        
        // 判断是否完成学习
        if (studySeconds.value >= resource.value.duration * 60) {
          completed.value = true
          pauseStudy()
        }
      }
      
      // 每30秒上报一次进度
      if (studySeconds.value % 30 === 0) {
        reportProgress(30)
      }
    }
  }, 1000)
}

/** 暂停学习 */
const pauseStudy = () => {
  isStudying.value = false
  // 计算本次学习时长并上报
  if (studyStartTime.value > 0) {
    const studyTime = Math.floor((Date.now() - studyStartTime.value) / 1000)
    if (studyTime > 0) {
      reportProgress(studyTime)
    }
    studyStartTime.value = 0
  }
}

/** 恢复学习 */
const resumeStudy = () => {
  if (!isStudying.value && studyStarted.value) {
    isStudying.value = true
    studyStartTime.value = Date.now()
  }
}

/** 切换学习状态 */
const toggleStudy = () => {
  if (isStudying.value) {
    pauseStudy()
    uni.showToast({
      title: '学习已暂停',
      icon: 'none'
    })
  } else {
    if (!studyStarted.value) {
      startStudy()
    }
    resumeStudy()
    uni.showToast({
      title: '继续学习',
      icon: 'success'
    })
  }
}

/** 切换视频播放状态 */
const togglePlayback = () => {
  const videoContext = uni.createVideoContext('video', this)
  if (isPlaying.value) {
    videoContext.pause()
  } else {
    videoContext.play()
  }
}

/* 视频事件 */
const onPlay = () => {
  isPlaying.value = true
  if (!studyStarted.value) {
    startStudy()
  }
  startStudyTimer()
  isStudying.value = true
  studyStartTime.value = Date.now()
}

const onPause = () => {
  isPlaying.value = false
  pauseStudy()
}

const onEnded = () => {
  isPlaying.value = false
  completed.value = true
  pauseStudy()
}

/** 上报学习进度 */
const reportProgress = async (seconds) => {
  if (!recordId.value || seconds <= 0) return
  
  try {
    await uni.request({
      url: '/api/learning/progress',
      method: 'POST',
      data: {
        recordId: recordId.value,
        incrementTime: seconds
      }
    })
  } catch (error) {
    console.error('进度上报失败:', error)
  }
}

/** 结束学习 */
const endStudy = async () => {
  // 暂停计时
  if (timer) {
    clearInterval(timer)
    timer = null
  }
  
  // 上报最后一次学习时长
  if (studyStartTime.value > 0) {
    const finalStudyTime = Math.floor((Date.now() - studyStartTime.value) / 1000)
    if (finalStudyTime > 0) {
      await reportProgress(finalStudyTime)
    }
  }
  
  // 结束学习记录
  if (recordId.value) {
    try {
      await uni.request({
        url: `/api/learning/end/${recordId.value}`,
        method: 'POST',
        data: {
          totalTime: studySeconds.value,
          completed: completed.value
        }
      })
    } catch (error) {
      console.error('结束学习记录失败:', error)
    }
  }
}

/** 完成学习 */
const finishStudy = async () => {
  if (!studyStarted.value) return
  
  uni.showModal({
    title: '确认结束学习？',
    content: `当前已学习 ${formatTime(studySeconds.value)}`,
    success: async (res) => {
      if (res.confirm) {
        completed.value = true
        await endStudy()
        uni.showToast({
          title: '学习已完成',
          icon: 'success'
        })
      }
    }
  })
}

/** 重新开始学习 */
const restartStudy = () => {
  uni.showModal({
    title: '重新开始学习？',
    content: '这将重置当前学习进度',
    success: async (res) => {
      if (res.confirm) {
        studySeconds.value = 0
        progress.value = 0
        completed.value = false
        isStudying.value = false
        studyStarted.value = false
        recordId.value = null
        
        uni.showToast({
          title: '已重置',
          icon: 'success'
        })
      }
    }
  })
}

/** 格式化时间（秒转分:秒） */
const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

/** 格式化文件大小 */
const formatFileSize = (bytes) => {
  if (bytes === 0 || !bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
</script>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  background: linear-gradient(180deg, #f5f9ff 0%, #f0f7ff 100%);
  padding: 20rpx;
}

/* 顶部标题卡片 */
.header-card {
  background: white;
  border-radius: 24rpx;
  padding: 32rpx 28rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 8rpx 32rpx rgba(64, 158, 255, 0.08);
  
  .title-row {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 16rpx;
    
    .title {
      flex: 1;
      font-size: 36rpx;
      font-weight: 700;
      color: #1a1a1a;
      line-height: 1.4;
    }
    
    .type-badge {
      padding: 8rpx 24rpx;
      border-radius: 24rpx;
      font-size: 24rpx;
      color: #fff;
      font-weight: 500;
      margin-left: 20rpx;
      white-space: nowrap;
      
      &.video {
        background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      }
      
      &.pdf {
        background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
      }
    }
  }
  
  .meta-info {
    .duration,
    .size {
      font-size: 26rpx;
      color: #666;
      background: #f5f9ff;
      padding: 6rpx 16rpx;
      border-radius: 16rpx;
      margin-right: 12rpx;
    }
  }
}

/* 内容卡片 */
.content-card {
  background: white;
  border-radius: 24rpx;
  overflow: hidden;
  margin-bottom: 24rpx;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.06);
  
  /* 视频区域 */
  .video-section {
    .video {
      width: 100%;
      height: 420rpx;
      background: #000;
    }
    
    .video-controls {
      padding: 20rpx 28rpx;
      border-top: 1rpx solid #f0f0f0;
      
      .control-btn {
        width: 100%;
        height: 80rpx;
        line-height: 80rpx;
        border-radius: 40rpx;
        border: none;
        font-size: 30rpx;
        font-weight: 500;
        
        &.play-btn {
          background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
          color: white;
        }
        
        &.pause-btn {
          background: #f0f7ff;
          color: #4facfe;
          border: 2rpx solid #4facfe;
        }
        
        .icon {
          margin-right: 12rpx;
          font-size: 32rpx;
        }
      }
    }
  }
  
  /* PDF 区域 */
  .pdf-section {
    padding: 32rpx 28rpx;
    
    .pdf-preview {
      background: #f8fbff;
      border-radius: 20rpx;
      padding: 32rpx;
      margin-bottom: 32rpx;
      border: 2rpx dashed #d1e9ff;
      display: flex;
      align-items: center;
      
      .pdf-icon-container {
        position: relative;
        margin-right: 28rpx;
        
        .pdf-icon {
          width: 120rpx;
          height: 160rpx;
        }
        
        .pdf-overlay {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: rgba(0, 0, 0, 0.6);
          padding: 8rpx;
          text-align: center;
          
          .overlay-text {
            color: white;
            font-size: 22rpx;
          }
        }
      }
      
      .pdf-info {
        flex: 1;
        
        .pdf-name {
          font-size: 32rpx;
          font-weight: 600;
          color: #1a1a1a;
          display: block;
          margin-bottom: 12rpx;
          line-height: 1.4;
        }
        
        .pdf-meta {
          display: flex;
          align-items: center;
          gap: 16rpx;
          
          .pdf-type {
            font-size: 24rpx;
            color: #4facfe;
            background: #e6f2ff;
            padding: 4rpx 12rpx;
            border-radius: 12rpx;
          }
          
          .pdf-size {
            font-size: 24rpx;
            color: #999;
          }
        }
      }
    }
    
    .study-status {
      background: #f0f9ff;
      border-radius: 16rpx;
      padding: 20rpx;
      text-align: center;
      margin-bottom: 24rpx;
      
      .studying-text {
        font-size: 26rpx;
        color: #4facfe;
        font-weight: 500;
      }
    }
    
    .pdf-controls {
      display: flex;
      gap: 20rpx;
      
      .pdf-btn {
        flex: 1;
        height: 80rpx;
        line-height: 80rpx;
        border-radius: 40rpx;
        border: none;
        font-size: 28rpx;
        font-weight: 500;
        
        &.primary {
          background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
          color: white;
        }
        
        &.secondary {
          background: #f0f7ff;
          color: #4facfe;
          border: 2rpx solid #4facfe;
        }
        
        .btn-icon {
          margin-right: 10rpx;
          font-size: 30rpx;
        }
      }
    }
  }
}

/* 进度卡片 */
.progress-card {
  background: white;
  border-radius: 24rpx;
  padding: 32rpx 28rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 8rpx 32rpx rgba(64, 158, 255, 0.08);
  
  .progress-header {
    margin-bottom: 32rpx;
    
    .progress-title-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16rpx;
      
      .progress-title {
        font-size: 32rpx;
        font-weight: 600;
        color: #1a1a1a;
      }
      
      .progress-percent {
        font-size: 36rpx;
        font-weight: 700;
        color: #4facfe;
      }
    }
    
    .progress-stats {
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      .progress-time {
        font-size: 26rpx;
        color: #4facfe;
        font-weight: 500;
      }
      
      .progress-total {
        font-size: 24rpx;
        color: #999;
      }
    }
  }
  
  .progress-bar-container {
    position: relative;
    margin-bottom: 48rpx;
    
    .progress-bar-bg {
      height: 16rpx;
      background: #f0f0f0;
      border-radius: 8rpx;
      overflow: hidden;
      
      .progress-bar-fill {
        height: 100%;
        background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%);
        border-radius: 8rpx;
        transition: width 0.3s ease;
      }
    }
    
    .progress-marks {
      position: relative;
      height: 32rpx;
      margin-top: 8rpx;
      
      .progress-mark {
        position: absolute;
        transform: translateX(-50%);
        font-size: 22rpx;
        color: #999;
        top: 0;
      }
    }
  }
  
  .progress-controls {
    text-align: center;
    
    .progress-hint {
      font-size: 28rpx;
      color: #666;
      font-weight: 500;
    }
  }
}

/* 学习状态区域 */
.status-section {
  .status-card {
    background: white;
    border-radius: 24rpx;
    padding: 32rpx 28rpx;
    margin-bottom: 24rpx;
    box-shadow: 0 8rpx 32rpx rgba(103, 194, 58, 0.08);
    display: flex;
    align-items: center;
    
    &.completed {
      box-shadow: 0 8rpx 32rpx rgba(103, 194, 58, 0.15);
    }
    
    .status-icon {
      width: 80rpx;
      height: 80rpx;
      border-radius: 50%;
      background: #f0f9ff;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 24rpx;
      font-size: 36rpx;
    }
    
    .status-content {
      flex: 1;
      
      .status-title {
        font-size: 30rpx;
        font-weight: 600;
        color: #1a1a1a;
        display: block;
        margin-bottom: 8rpx;
      }
      
      .status-desc {
        font-size: 24rpx;
        color: #999;
        display: block;
      }
    }
    
    .status-tag {
      margin-left: 16rpx;
    }
  }
  
  .action-buttons {
    display: flex;
    gap: 20rpx;
    
    .action-btn {
      flex: 1;
      height: 88rpx;
      line-height: 88rpx;
      border-radius: 44rpx;
      border: none;
      font-size: 30rpx;
      font-weight: 500;
      
      &.finish-btn {
        background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
        color: white;
        
        &:disabled {
          background: #f0f0f0;
          color: #ccc;
        }
      }
      
      &.restart-btn {
        background: #f0f7ff;
        color: #4facfe;
        border: 2rpx solid #4facfe;
      }
    }
  }
}

/* 加载弹窗 */
.loading-popup {
  background: white;
  border-radius: 24rpx;
  padding: 48rpx;
  text-align: center;
  width: 300rpx;
  
  .loading-spinner {
    margin-bottom: 32rpx;
    
    .spinner {
      font-size: 60rpx;
      animation: rotate 1.5s linear infinite;
    }
  }
  
  .loading-text {
    font-size: 28rpx;
    color: #666;
  }
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 暗色模式 */
@media (prefers-color-scheme: dark) {
  .page {
    background: linear-gradient(180deg, #1a1a1a 0%, #2d3748 100%);
  }
  
  .header-card,
  .content-card,
  .progress-card,
  .status-card {
    background: #2d3748;
  }
  
  .title,
  .progress-title,
  .pdf-name,
  .status-title {
    color: #fff;
  }
  
  .meta-info .duration,
  .meta-info .size {
    background: #374151;
    color: #ccc;
  }
  
  .pdf-preview {
    background: #374151 !important;
    border-color: #4b5563 !important;
  }
  
  .study-status {
    background: #374151 !important;
  }
  
  .video-controls .pause-btn,
  .pdf-btn.secondary,
  .action-btn.restart-btn {
    background: #374151 !important;
    border-color: #4facfe !important;
    color: #4facfe !important;
  }
  
  .progress-bar-bg {
    background: #4b5563 !important;
  }
  
  .status-icon {
    background: #374151 !important;
  }
}
</style>