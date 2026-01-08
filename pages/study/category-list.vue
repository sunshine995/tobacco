<template>
  <view class="page">
    <!-- 页面顶部区域 -->
    <view class="top-section">
      <view class="category-header">
        <view class="category-badge">
          <text class="badge-text">{{ categoryName }}</text>
        </view>
        <text class="category-title">学习资源</text>
        <text class="category-desc">选择下方内容开始学习，提升技能</text>
      </view>

      <!-- 学习统计 -->
      <view class="stats-card">
        <view class="stat-item">
          <text class="stat-number">{{ totalResources }}</text>
          <text class="stat-label">总资源</text>
        </view>
        <view class="stat-divider"></view>
        <view class="stat-item">
          <text class="stat-number">{{ studiedResources }}</text>
          <text class="stat-label">已学习</text>
        </view>
        <view class="stat-divider"></view>
        <view class="stat-item">
          <text class="stat-number">{{ unstudiedResources }}</text>
          <text class="stat-label">待学习</text>
        </view>
      </view>
    </view>

    <!-- 学习资源列表 -->
    <view class="resource-list">
      <view
        class="resource-card"
        v-for="item in resourceList"
        :key="item.id"
        @click="goDetail(item)"
        :class="{ 'unstudied': item.studyCount === 0 }"
      >
        <view class="card-left">
          <!-- 资源类型图标 -->
          <view class="resource-icon" :class="item.resourceType.toLowerCase()">
            <up-icon
              :name="item.resourceType === 'VIDEO' ? 'play-circle-fill' : 'file-text'"
              size="22"
              color="#FFFFFF"
            />
          </view>
          
          <view class="resource-content">
            <text class="resource-title">{{ item.title }}</text>
            <view class="resource-meta">
              <view class="meta-tag">
                <up-icon name="clock" size="12" color="#909399" />
                <text class="tag-text">{{ item.resourceType === 'VIDEO' ? '视频课程' : '文档资料' }}</text>
              </view>
              <view class="meta-tag">
                <up-icon name="eye" size="12" color="#909399" />
                <text class="tag-text">{{ item.studyCount }}次学习</text>
              </view>
            </view>
          </view>
        </view>

        <!-- 学习状态指示器 -->
        <view class="status-indicator">
          <view 
            class="progress-dot" 
            :class="{ 'studied': item.studyCount > 0, 'unstudied': item.studyCount === 0 }"
          ></view>
          <up-icon name="arrow-right" size="16" color="#C0C4CC" />
        </view>
      </view>
    </view>

    <!-- 底部提示 -->
    <view class="bottom-tips">
      <up-icon name="info-circle" size="14" color="#409EFF" />
      <text class="tips-text">点击任意资源卡片开始学习</text>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue';
import { onLoad } from '@dcloudio/uni-app'
import { getLearnResource } from '@/api/learn.js'

const categoryId = ref(null)
const categoryName = ref('')

onLoad((options) => {
  categoryId.value = Number(options.categoryId)
  categoryName.value = options.title || '学习资源'
  loadResourceList()
})

const resourceList = ref([]);

const loadResourceList = async () => {
  uni.showLoading({ title: '加载中...' })

  try {
	const res = await getLearnResource(categoryId.value)
	console.log(res)
    resourceList.value = res || []

  } catch (e) {
    uni.showToast({
      title: '加载失败',
      icon: 'none'
    })
  } finally {
    uni.hideLoading()
  }
}


// 计算属性
const totalResources = computed(() => resourceList.value.length);
const studiedResources = computed(() => 
  resourceList.value.filter(item => item.studyCount > 0).length
);
const unstudiedResources = computed(() => 
  resourceList.value.filter(item => item.studyCount === 0).length
);

const goDetail = (item) => {
  uni.navigateTo({
    url: `/pages/study/resource-detail`
       + `?id=${item.id}`
       + `&type=${item.resourceType}`
       + `&title=${encodeURIComponent(item.title)}`
  });
};

</script>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  background: linear-gradient(180deg, #f5f9ff 0%, #f0f7ff 100%);
  padding: 20rpx 24rpx 40rpx;
}

/* 顶部区域 */
.top-section {
  margin-bottom: 32rpx;
}

.category-header {
  margin-bottom: 28rpx;
  
  .category-badge {
    display: inline-block;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 8rpx 20rpx;
    border-radius: 20rpx;
    margin-bottom: 20rpx;
    
    .badge-text {
      color: white;
      font-size: 12px;
      font-weight: 500;
    }
  }
  
  .category-title {
    display: block;
    font-size: 24px;
    font-weight: 700;
    color: #1a1a1a;
    margin-bottom: 8rpx;
  }
  
  .category-desc {
    font-size: 14px;
    color: #666;
    opacity: 0.8;
  }
}

/* 统计卡片 */
.stats-card {
  background: white;
  border-radius: 20rpx;
  padding: 32rpx;
  display: flex;
  align-items: center;
  justify-content: space-around;
  box-shadow: 0 4rpx 20rpx rgba(64, 158, 255, 0.08);
  
  .stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    
    .stat-number {
      font-size: 24px;
      font-weight: 700;
      color: #409EFF;
      margin-bottom: 4rpx;
    }
    
    .stat-label {
      font-size: 12px;
      color: #909399;
    }
  }
  
  .stat-divider {
    width: 1px;
    height: 40rpx;
    background: #e4e7ed;
  }
}

/* 资源列表 */
.resource-list {
  margin-bottom: 40rpx;
}

.resource-card {
  background: white;
  border-radius: 20rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: all 0.3s ease;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
  border: 1px solid transparent;
  
  &:active {
    transform: translateY(-2rpx);
    box-shadow: 0 8rpx 24rpx rgba(64, 158, 255, 0.12);
    border-color: #409EFF;
  }
  
  &.unstudied {
    position: relative;
    overflow: hidden;
    
    &::before {
      content: '待学习';
      position: absolute;
      top: 16rpx;
      right: -32rpx;
      background: #f56c6c;
      color: white;
      font-size: 10px;
      padding: 4rpx 32rpx;
      transform: rotate(45deg);
      transform-origin: center;
    }
  }
  
  .card-left {
    display: flex;
    align-items: center;
    flex: 1;
  }
  
  .resource-icon {
    width: 64rpx;
    height: 64rpx;
    border-radius: 16rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 24rpx;
    
    &.video {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    }
    
    &.pdf {
      background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
    }
  }
  
  .resource-content {
    flex: 1;
    
    .resource-title {
      display: block;
      font-size: 16px;
      font-weight: 600;
      color: #1a1a1a;
      margin-bottom: 16rpx;
      line-height: 1.4;
    }
    
    .resource-meta {
      display: flex;
      gap: 20rpx;
      
      .meta-tag {
        display: flex;
        align-items: center;
        
        .tag-text {
          font-size: 12px;
          color: #909399;
          margin-left: 6rpx;
        }
      }
    }
  }
  
  .status-indicator {
    display: flex;
    align-items: center;
    gap: 16rpx;
    
    .progress-dot {
      width: 12rpx;
      height: 12rpx;
      border-radius: 50%;
      
      &.studied {
        background: #67c23a;
        box-shadow: 0 0 8rpx rgba(103, 194, 58, 0.5);
      }
      
      &.unstudied {
        background: #f56c6c;
        box-shadow: 0 0 8rpx rgba(245, 108, 108, 0.5);
      }
    }
  }
}

/* 底部提示 */
.bottom-tips {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  padding: 24rpx;
  background: rgba(64, 158, 255, 0.08);
  border-radius: 16rpx;
  
  .tips-text {
    font-size: 13px;
    color: #409EFF;
  }
}

/* 暗色模式适配 */
@media (prefers-color-scheme: dark) {
  .page {
    background: linear-gradient(180deg, #1a1a1a 0%, #2d3748 100%);
  }
  
  .category-title {
    color: #ffffff;
  }
  
  .category-desc {
    color: #a0aec0;
  }
  
  .stats-card {
    background: #2d3748;
    
    .stat-label {
      color: #a0aec0;
    }
  }
  
  .resource-card {
    background: #2d3748;
    
    &:active {
      border-color: #4299e1;
    }
    
    .resource-title {
      color: #ffffff;
    }
    
    .tag-text {
      color: #a0aec0;
    }
  }
  
  .bottom-tips {
    background: rgba(66, 153, 225, 0.15);
  }
}
</style>