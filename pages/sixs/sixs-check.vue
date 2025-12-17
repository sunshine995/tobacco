<template>
  <view class="spot-check-container">
    <!-- 顶部导航栏 -->
    <view class="custom-navbar">
      <view class="navbar-left">
        <text class="navbar-title">6S抽检管理</text>
      </view>
      <view class="navbar-right">
        <view class="user-info">
          <image class="user-avatar" :src="currentUser.avatar" mode="aspectFill"></image>
          <text class="user-name">{{ currentUser.name }}</text>
          <view class="position-tag" :class="getPositionClass(currentUser.position)">
            {{ currentUser.position }}
          </view>
        </view>
      </view>
    </view>

    <!-- 统计卡片 -->
    <scroll-view class="stats-scroll" scroll-x="true" show-scrollbar="false">
      <view class="stats-wrapper">
        <view class="stat-card">
          <view class="stat-icon pending">
            <uni-icons type="time" size="22" color="#1890ff"></uni-icons>
          </view>
          <view class="stat-content">
            <text class="stat-number">{{ stats.pending || 0 }}</text>
            <text class="stat-label">待抽检</text>
          </view>
        </view>
        
        <view class="stat-card">
          <view class="stat-icon checked">
            <uni-icons type="checkbox-filled" size="22" color="#52c41a"></uni-icons>
          </view>
          <view class="stat-content">
            <text class="stat-number">{{ stats.checked || 0 }}</text>
            <text class="stat-label">已抽检</text>
          </view>
        </view>
        
        <view class="stat-card">
          <view class="stat-icon failed">
            <uni-icons type="close" size="22" color="#f5222d"></uni-icons>
          </view>
          <view class="stat-content">
            <text class="stat-number">{{ stats.failed || 0 }}</text>
            <text class="stat-label">不合格</text>
          </view>
        </view>
        
        <view class="stat-card">
          <view class="stat-icon date">
            <uni-icons type="calendar" size="22" color="#722ed1"></uni-icons>
          </view>
          <view class="stat-content">
            <text class="stat-date">{{ formatDate(today) }}</text>
            <text class="stat-label">今日</text>
          </view>
        </view>
      </view>
    </scroll-view>

    <!-- 筛选条件 -->
    <view class="filter-section">
      <view class="filter-tabs">
        <view 
          v-for="tab in tabs" 
          :key="tab.value"
          class="filter-tab"
          :class="{ active: activeTab === tab.value }"
          @tap="changeTab(tab.value)"
        >
          <text>{{ tab.label }}</text>
        </view>
      </view>

    </view>


    <!-- 任务卡片列表 -->
    <scroll-view 
        class="task-list-cards" 
        scroll-y="true"
      >
      <!-- 任务卡片 -->
      <view v-if="spotCheckTasks.length > 0" class="cards-container">
        <view 
          v-for="task in filteredTasks"
          :key="task.id"
          class="task-card"
          :class="getCardStatusClass(task.spotCheckStatus)"
          @tap="goToDetail(task)"
        >
          <!-- 卡片状态标识 -->
          <view class="card-status-bar" :class="getStatusBarClass(task.spotCheckStatus)">
            <text class="status-text">{{ getSpotCheckStatusText(task.spotCheckStatus) }}</text>
          </view>

          <view class="card-header">
            <view class="card-title-section">
              <text class="card-title">{{ task.templateName }}</text>
              <view class="card-subtitle">
                <uni-icons type="person" size="12" color="#666"></uni-icons>
                <text class="subtitle-text">{{ task.employeeName }}</text>
              </view>
            </view>
            <view class="card-time">
              <uni-icons type="time" size="12" color="#999"></uni-icons>
              <text class="time-text">{{ formatTime(task.plannedCompletionTime) }}</text>
            </view>
          </view>

          <!-- 任务内容 -->
          <view class="card-content">
            <text class="content-text">{{ truncateText(task.taskContent, 80) }}</text>
          </view>

          <!-- 图片预览 -->
          <view v-if="task.submittedImages && task.submittedImages.length > 0" class="card-images">
            <scroll-view class="images-scroll" scroll-x="true">
              <view class="images-wrapper">
                <view 
                  v-for="(img, index) in task.submittedImages.slice(0, 3)"
                  :key="index"
                  class="image-item"
                  @tap.stop="previewImage(img, task.submittedImages)"
                >
                  <image class="card-img" :src="img" mode="aspectFill"></image>
                  <view v-if="task.submittedImages.length > 3 && index === 2" class="image-more">
                    <text>+{{ task.submittedImages.length - 3 }}</text>
                  </view>
                </view>
              </view>
            </scroll-view>
          </view>

          <!-- 抽检信息 -->
          <view v-if="task.spotCheckStatus !== 'not_checked'" class="check-info">
            <view class="checker-info">
              <image class="checker-avatar" :src="getCheckerAvatar(task)" mode="aspectFill"></image>
              <view class="checker-details">
                <text class="checker-name">{{ task.spotCheckerName || '未知' }}</text>
                <text class="check-time">{{ formatTime(task.spotCheckTime) }}</text>
              </view>
            </view>
            <view class="result-badge" :class="task.spotCheckResult === 'pass' ? 'pass' : 'fail'">
              <uni-icons 
                :type="task.spotCheckResult === 'pass' ? 'checkmark' : 'close'" 
                size="12" 
                color="#fff"
              ></uni-icons>
              <text>{{ task.spotCheckResult === 'pass' ? '合格' : '不合格' }}</text>
            </view>
          </view>

          <!-- 操作按钮 -->
          <view class="card-actions">
            <button 
              v-if="task.spotCheckStatus === 'not_checked'"
              class="action-btn primary"
              @tap.stop="startSpotCheck(task)"
            >
              <uni-icons type="checkbox-filled" size="14" color="#fff"></uni-icons>
              <text>开始抽检</text>
            </button>
            <button 
              v-else 
              class="action-btn secondary"
              @tap.stop="viewCheckDetail(task)"
            >
              <uni-icons type="eye" size="14" color="#1890ff"></uni-icons>
              <text>查看详情</text>
            </button>
          </view>

          <!-- 卡片底部信息 -->
          <view class="card-footer">
            <view class="footer-item">
              <uni-icons type="calendar" size="12" color="#999"></uni-icons>
              <text class="footer-text">{{ formatDate(task.scheduledDate) }}</text>
            </view>
            <view class="footer-item">
              <uni-icons type="flag" size="12" color="#999"></uni-icons>
              <text class="footer-text" :class="getTaskStatusTextClass(task.status)">
                {{ task.status === 'completed' ? '已完成' : '进行中' }}
              </text>
            </view>
          </view>
        </view>
      </view>

      <!-- 空状态 -->
      <view v-if="filteredTasks.length === 0" class="cards-empty">
        <image class="empty-illustration" src="/static/empty-card.png" mode="aspectFit"></image>
        <text class="empty-title">暂无抽检任务</text>
        <text class="empty-desc">当前岗位组没有需要抽检的任务</text>
        <button class="empty-action" @tap="refreshData">
          <uni-icons type="refresh" size="14" color="#1890ff"></uni-icons>
          <text>刷新数据</text>
        </button>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad, onPullDownRefresh } from '@dcloudio/uni-app'
import { getAllSixDay } from '@/api/sixs'

// 当前用户信息（可后续从 store 或 API 获取）
const currentUser = ref({
  id: 1,
  name: '张三',
  position: '生产主管',
  avatar: '/static/avatar.png'
})

// 所有抽检任务（一次性加载）
const spotCheckTasks = ref([])

// 加载状态
const loading = ref(false)

// 今日日期
const today = ref(new Date())

// 统计数据（可选，若不需要可删）
const stats = ref({
  pending: 0,
  checked: 0,
  failed: 0
})

// 选项卡
const tabs = ref([
  { label: '全部', value: 'all' },
  { label: '待抽检', value: 'pending' },
  { label: '已抽检', value: 'checked' }
])
const activeTab = ref('all')

// ========================
// 计算属性：根据 activeTab 过滤任务（前端过滤）
// ========================
const filteredTasks = computed(() => {
  const tasks = spotCheckTasks.value || []
  
  if (activeTab.value === 'pending') {
    return tasks.filter(task => task.spotCheckStatus === 'not_checked')
  } else if (activeTab.value === 'checked') {
    return tasks.filter(task => task.spotCheckStatus !== 'not_checked')
  }
  // 'all'：返回全部
  return tasks
})

// ========================
// 格式化工具函数
// ========================
const formatDate = (date) => {
  if (!date) return ''
  const d = new Date(date)
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${month}-${day}`
}

const formatTime = (datetime) => {
  if (!datetime) return ''
  const d = new Date(datetime)
  return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

const truncateText = (text, length) => {
  if (!text) return ''
  return text.length > length ? text.substring(0, length) + '...' : text
}

// ========================
// UI 辅助函数
// ========================
const getPositionClass = (position) => {
  const map = {
    '生产主管': 'production',
    '质量主管': 'quality',
    '安全主管': 'safety',
    '行政主管': 'admin'
  }
  return map[position] || 'default'
}

const getCardStatusClass = (status) => {
  return { not_checked: 'pending', passed: 'passed', failed: 'failed' }[status] || 'default'
}

const getStatusBarClass = (status) => {
  return { not_checked: 'pending-bar', passed: 'passed-bar', failed: 'failed-bar' }[status] || 'default'
}

const getSpotCheckStatusText = (status) => {
  return { not_checked: '待抽检', passed: '已通过', failed: '未通过' }[status] || '未知'
}

const getCheckerAvatar = (task) => {
  return task.spotCheckerAvatar || '/static/default-avatar.png'
}

const getTaskStatusTextClass = (status) => {
  return status === 'completed' ? 'completed-text' : 'pending-text'
}

// ========================
// 事件处理
// ========================
const changeTab = (value) => {
  activeTab.value = value
}

const goToDetail = (task) => {
  uni.navigateTo({ url: `/pages/sixs/check?id=${task.id}` })
}

const startSpotCheck = (task) => {
  uni.navigateTo({ url: `/pages/sixs/check?id=${task.id}` })
}

const viewCheckDetail = (task) => {
  uni.navigateTo({ url: `/pages/sixs/check?id=${task.id}` })
}

const previewImage = (current, urls) => {
  uni.previewImage({ current, urls, indicator: 'number', loop: true })
}

// ========================
// 数据获取
// ========================
const fetchSpotCheckTasks = async () => {
  if (loading.value) return
  loading.value = true

  try {
    const response = await getAllSixDay()
    const taskList = Array.isArray(response) ? response : []
    spotCheckTasks.value = taskList

    // 可选：计算统计数据（如果后端不提供）
    const pending = taskList.filter(t => t.spotCheckStatus === 'not_checked').length
    const checked = taskList.filter(t => t.spotCheckStatus !== 'not_checked').length
    const failed = taskList.filter(t => t.spotCheckResult === 'fail' || t.spotCheckStatus === 'failed').length
    stats.value = { pending, checked, failed }

  } catch (error) {
    console.error('获取抽检任务失败:', error)
    uni.showToast({ title: '获取数据失败', icon: 'error' })
  } finally {
    loading.value = false
  }
}

const refreshData = async () => {
  await fetchSpotCheckTasks()
}

// ========================
// 生命周期
// ========================
onLoad(() => {
  fetchSpotCheckTasks()
})

onPullDownRefresh(() => {
  refreshData().finally(() => {
    uni.stopPullDownRefresh()
  })
})
</script>

<style lang="scss" scoped>
.spot-check-container {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: calc(50px + env(safe-area-inset-bottom));
}

.custom-navbar {
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  color: #fff;
  padding: 10px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  .navbar-left {
    .navbar-title {
      font-size: 18px;
      font-weight: 600;
    }
  }
  
  .navbar-right {
    .user-info {
      display: flex;
      align-items: center;
      gap: 8px;
      
      .user-avatar {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border: 2px solid rgba(255, 255, 255, 0.3);
      }
      
      .user-name {
        font-size: 14px;
        max-width: 80px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      
      .position-tag {
        font-size: 10px;
        padding: 2px 6px;
        border-radius: 10px;
        background: rgba(255, 255, 255, 0.2);
        
        &.production {
          background: #52c41a;
        }
        &.quality {
          background: #1890ff;
        }
        &.safety {
          background: #faad14;
        }
        &.admin {
          background: #722ed1;
        }
      }
    }
  }
}

.stats-scroll {
  width: 100%;
  white-space: nowrap;
  background: #fff;
  padding: 12px 0;
  
  .stats-wrapper {
    display: inline-flex;
    gap: 12px;
    padding: 0 16px;
  }
  
  .stat-card {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    background: #fafafa;
    border-radius: 12px;
    padding: 12px 16px;
    min-width: 140px;
    
    .stat-icon {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      
      &.pending {
        background: #e6f7ff;
      }
      &.checked {
        background: #f6ffed;
      }
      &.failed {
        background: #fff1f0;
      }
      &.date {
        background: #f9f0ff;
      }
    }
    
    .stat-content {
      display: flex;
      flex-direction: column;
      
      .stat-number {
        font-size: 20px;
        font-weight: bold;
        color: #333;
        line-height: 1;
      }
      
      .stat-date {
        font-size: 16px;
        font-weight: bold;
        color: #333;
        line-height: 1;
      }
      
      .stat-label {
        font-size: 12px;
        color: #666;
        margin-top: 4px;
      }
    }
  }
}

.filter-section {
  background: #fff;
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #f0f0f0;
  
  .filter-tabs {
    display: flex;
    gap: 8px;
    
    .filter-tab {
      padding: 6px 16px;
      border-radius: 16px;
      background: #f5f5f5;
      font-size: 14px;
      color: #666;
      
      &.active {
        background: #1890ff;
        color: #fff;
      }
    }
  }
  
  .filter-actions {
    display: flex;
    gap: 16px;
    
    .filter-btn {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 14px;
      color: #666;
    }
  }
}

.filter-panel {
  background: #fff;
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
  
  .filter-row {
    margin-bottom: 16px;
    
    &:last-child {
      margin-bottom: 0;
    }
    
    .filter-label {
      display: block;
      font-size: 14px;
      color: #333;
      margin-bottom: 8px;
      font-weight: 500;
    }
    
    .filter-picker {
      .picker-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 12px;
        background: #fafafa;
        border-radius: 8px;
        font-size: 14px;
        color: #333;
      }
    }
    
    .status-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      
      .status-tag {
        padding: 6px 12px;
        background: #f5f5f5;
        border-radius: 16px;
        font-size: 12px;
        color: #666;
        
        &.active {
          background: #e6f7ff;
          color: #1890ff;
        }
      }
    }
  }
  
  .filter-actions-row {
    display: flex;
    gap: 12px;
    margin-top: 16px;
    
    button {
      flex: 1;
      height: 36px;
      line-height: 36px;
      border-radius: 18px;
      font-size: 14px;
      
      &.reset-btn {
        background: #f5f5f5;
        color: #666;
        border: none;
      }
      
      &.confirm-btn {
        background: #1890ff;
        color: #fff;
        border: none;
      }
    }
  }
}

.cards-container {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
  padding: 12px 0 24px;
}

.task-card {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  overflow: hidden;
  transition: all 0.3s ease;
  position: relative;
  
  &:active {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
  }
  
  &.pending {
    border-left: 4px solid #faad14;
  }
  
  &.passed {
    border-left: 4px solid #52c41a;
  }
  
  &.failed {
    border-left: 4px solid #f5222d;
  }
  
  .card-status-bar {
    padding: 6px 16px;
    font-size: 12px;
    font-weight: 500;
    
    &.pending-bar {
      background: #fffbe6;
      color: #faad14;
    }
    
    &.passed-bar {
      background: #f6ffed;
      color: #52c41a;
    }
    
    &.failed-bar {
      background: #fff1f0;
      color: #f5222d;
    }
  }
  
  .card-header {
    padding: 16px 16px 12px;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    border-bottom: 1px solid #f0f0f0;
    
    .card-title-section {
      flex: 1;
      
      .card-title {
        font-size: 16px;
        font-weight: 600;
        color: #333;
        display: block;
        margin-bottom: 4px;
        line-height: 1.4;
      }
      
      .card-subtitle {
        display: flex;
        align-items: center;
        gap: 4px;
        
        .subtitle-text {
          font-size: 13px;
          color: #666;
        }
      }
    }
    
    .card-time {
      display: flex;
      align-items: center;
      gap: 4px;
      
      .time-text {
        font-size: 12px;
        color: #999;
      }
    }
  }
  
  .card-content {
    padding: 12px 16px;
    
    .content-text {
      font-size: 14px;
      color: #666;
      line-height: 1.5;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  }
  
  .card-images {
    padding: 0 16px 12px;
    
    .images-scroll {
      width: 100%;
      white-space: nowrap;
      
      .images-wrapper {
        display: inline-flex;
        gap: 8px;
      }
      
      .image-item {
        position: relative;
        width: 80px;
        height: 80px;
        border-radius: 6px;
        overflow: hidden;
        flex-shrink: 0;
        
        .card-img {
          width: 100%;
          height: 100%;
        }
        
        .image-more {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          
          text {
            color: #fff;
            font-size: 16px;
            font-weight: 600;
          }
        }
      }
    }
  }
  
  .check-info {
    padding: 12px 16px;
    background: #fafafa;
    margin: 0 16px 12px;
    border-radius: 8px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    .checker-info {
      display: flex;
      align-items: center;
      gap: 8px;
      
      .checker-avatar {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border: 2px solid #fff;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }
      
      .checker-details {
        display: flex;
        flex-direction: column;
        
        .checker-name {
          font-size: 13px;
          font-weight: 500;
          color: #333;
        }
        
        .check-time {
          font-size: 11px;
          color: #999;
        }
      }
    }
    
    .result-badge {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
      
      &.pass {
        background: #52c41a;
        color: #fff;
      }
      
      &.fail {
        background: #f5222d;
        color: #fff;
      }
    }
  }
  
  .card-actions {
    padding: 0 16px 16px;
    display: flex;
    gap: 8px;
    
    .action-btn {
      flex: 1;
      height: 36px;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 500;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      transition: all 0.2s ease;
      
      &.primary {
        background: #1890ff;
        color: #fff;
        border: none;
        
        &:active {
          background: #096dd9;
        }
      }
      
      &.secondary {
        background: #e6f7ff;
        color: #1890ff;
        border: none;
        
        &:active {
          background: #bae7ff;
        }
      }
      
      &.outline {
        background: #fff;
        color: #666;
        border: 1px solid #d9d9d9;
        
        &:active {
          background: #f5f5f5;
        }
      }
    }
  }
  
  .card-footer {
    padding: 12px 16px;
    border-top: 1px solid #f0f0f0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    .footer-item {
      display: flex;
      align-items: center;
      gap: 4px;
      
      .footer-text {
        font-size: 12px;
        color: #999;
        
        &.completed-text {
          color: #52c41a;
        }
        
        &.pending-text {
          color: #faad14;
        }
      }
    }
  }
}

.cards-empty {
  padding: 60px 0;
  text-align: center;
  
  .empty-illustration {
    width: 200px;
    height: 150px;
    margin-bottom: 16px;
    opacity: 0.8;
  }
  
  .empty-title {
    display: block;
    font-size: 16px;
    font-weight: 500;
    color: #666;
    margin-bottom: 8px;
  }
  
  .empty-desc {
    display: block;
    font-size: 14px;
    color: #999;
    margin-bottom: 20px;
  }
  
  .empty-action {
    width: 120px;
    margin: 0 auto;
    background: #fff;
    color: #1890ff;
    border: 1px solid #1890ff;
    border-radius: 20px;
    font-size: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    
    &:active {
      background: #e6f7ff;
    }
  }
}

.cards-loading {
  padding: 24px 0;
  text-align: center;
  
  .loading-dots {
    display: flex;
    justify-content: center;
    gap: 6px;
    margin-bottom: 8px;
    
    .dot {
      width: 8px;
      height: 8px;
      background: #1890ff;
      border-radius: 50%;
      animation: loadingDot 1.4s ease-in-out infinite;
      
      &:nth-child(2) {
        animation-delay: 0.2s;
      }
      
      &:nth-child(3) {
        animation-delay: 0.4s;
      }
    }
  }
  
  .loading-text {
    font-size: 13px;
    color: #999;
  }
}

@keyframes loadingDot {
  0%, 100% {
    transform: scale(0.8);
    opacity: 0.6;
  }
  50% {
    transform: scale(1);
    opacity: 1;
  }
}

.no-more-data {
  padding: 24px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  
  .no-more-line {
    flex: 1;
    height: 1px;
    background: #e8e8e8;
  }
  
  .no-more-text {
    font-size: 12px;
    color: #999;
    white-space: nowrap;
  }
}

.batch-actions {
  position: fixed;
  bottom: 60px;
  left: 0;
  right: 0;
  padding: 0 16px;
  
  .batch-btn {
    background: #1890ff;
    color: #fff;
    border-radius: 25px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    font-size: 16px;
    box-shadow: 0 4px 12px rgba(24, 144, 255, 0.3);
  }
}
</style>