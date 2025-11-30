<template>
  <view class="article-detail">
    <!-- 导航栏 -->
    <view class="navbar">
      <view class="nav-left" @click="goBack">
        <text class="back-icon">←</text>
        <text class="back-text">返回</text>
      </view>
      <view class="nav-title">文章详情</view>
      <view class="nav-right">
        <text class="action-btn" @click="handleMore">⋮</text>
      </view>
    </view>

    <!-- 加载状态 -->
    <view v-if="loading" class="loading-container">
      <text class="loading-text">加载中...</text>
    </view>

    <!-- 错误状态 -->
    <view v-else-if="error" class="error-container">
      <text class="error-text">{{ error }}</text>
      <button class="retry-btn" @click="fetchArticleDetail">重试</button>
    </view>

    <!-- 内容区域 -->
    <scroll-view v-else class="content-scroll" scroll-y @scroll="onScroll">

      <!-- 文章头部信息 -->
      <view class="article-header">
        <text class="article-title">{{ article.title }}</text>
        <view class="article-meta">
          <text class="meta-item">{{ formatTime(article.createTime) }}</text>
          <text class="meta-separator">|</text>
          <text class="meta-item">{{ article.viewCount || 0 }} 阅读</text>
          <text v-if="article.imageCount > 0" class="meta-separator">|</text>
          <text v-if="article.imageCount > 0" class="meta-item">{{ article.imageCount }} 图</text>
        </view>
      </view>

      <!-- 文章内容 -->
      <view class="article-content">
        <rich-text 
          :nodes="processedContent" 
          class="rich-content"
        ></rich-text>
      </view>

      <!-- 文章底部信息 -->
      <view class="article-footer">
        <view class="footer-info">
          <text class="footer-text">发布于 {{ formatFullTime(article.createTime) }}</text>
        </view>
      </view>
    </scroll-view>

    <!-- 底部操作栏 -->
    <view class="bottom-actions">
      <view class="action-btn" @click="handleLike">
        <text class="btn-icon">{{ isLiked ? '❤️' : '🤍' }}</text>
        <text class="btn-text">{{ likeCount }}</text>
      </view>
      <view class="action-btn" @click="handleShare">
        <text class="btn-icon">↗️</text>
        <text class="btn-text">分享</text>
      </view>
      <view class="action-btn" @click="handleComment">
        <text class="btn-icon">💬</text>
        <text class="btn-text">评论</text>
      </view>
    </view>

    <!-- 操作菜单 -->
    <uni-popup ref="actionPopup" type="bottom">
      <view class="action-popup">
        <view class="popup-item" @click="handleEdit">
          <text class="popup-icon">✏️</text>
          <text class="popup-text">编辑文章</text>
        </view>
        <view class="popup-item" @click="handleDelete">
          <text class="popup-icon">🗑️</text>
          <text class="popup-text">删除文章</text>
        </view>
        <view class="popup-item" @click="handleCopyLink">
          <text class="popup-icon">🔗</text>
          <text class="popup-text">复制链接</text>
        </view>
        <button class="cancel-btn" @click="closeActionPopup">取消</button>
      </view>
    </uni-popup>

    <!-- 回到顶部按钮 -->
    <view 
      class="back-to-top" 
      :class="{ show: showBackToTop }"
      @click="scrollToTop"
    >
      <text class="top-icon">↑</text>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getArticleDetail } from '@/api/notice.js'

// 响应式数据
const loading = ref(true)
const error = ref('')
const article = reactive({
  id: null,
  title: '',
  content: '',
  coverImage: '',
  createTime: null,
  updateTime: null,
  viewCount: 0,
  imageCount: 0,
  images: []
})
const isLiked = ref(false)
const likeCount = ref(0)
const showBackToTop = ref(false)

// 组件引用
const actionPopup = ref(null)

// 计算属性
const processedContent = computed(() => {
  if (!article.content) return ''
  
  let processed = article.content
  
  // 处理图片样式
  processed = processed.replace(
    /<img/gi, 
    '<img style="max-width:100%;height:auto;border-radius:8px;margin:10px 0;display:block;"'
  )
  
  // 处理段落样式
  processed = processed.replace(
    /<p/gi, 
    '<p style="margin:10px 0;line-height:1.8;word-wrap:break-word;"'
  )
  
  // 处理标题样式
  processed = processed.replace(
    /<h1/gi, 
    '<h1 style="font-size:20px;font-weight:bold;margin:20px 0 10px 0;border-left:4px solid #007aff;padding-left:10px;"'
  )
  
  processed = processed.replace(
    /<h2/gi, 
    '<h2 style="font-size:18px;font-weight:bold;margin:18px 0 9px 0;border-left:3px solid #34c759;padding-left:10px;"'
  )
  
  return processed
})

const articleImages = computed(() => {
  // 从内容中提取图片 + 文章关联的图片
  const contentImages = extractImagesFromContent(article.content)
  const associatedImages = article.images || []
  
  // 合并并去重
  const allImages = [...new Set([...contentImages, ...associatedImages])]
  return allImages.filter(img => img && img.trim() !== '')
})

// 页面加载
onLoad((options) => {
  if (options.id) {
    article.id = options.id
	//console.log(article.id)
    fetchArticleDetail()
  } else {
    error.value = '文章ID不存在'
    loading.value = false
  }
})

// 方法
const fetchArticleDetail = async () => {
  try {
    loading.value = true
    error.value = ''
    
    const response = await getArticleDetail(article.id)
    //console.log(response)
    // 更新文章数据
    Object.assign(article, {
          id: response.id,
          title: response.title,
          content: response.content,
          coverImage: response.coverImage,
          createTime: response.createTime,
          viewCount: 0,
          imageCount: 1,
        })
	
    // 更新点赞信息
    loading.value = false
    
  } catch (err) {
    console.error('获取文章详情失败:', err)
    error.value = '加载失败，请重试'
    loading.value = false
  }
}

const extractImagesFromContent = (html) => {
  if (!html) return []
  
  const imgRegex = /<img[^>]+src="([^">]+)"/g
  const images = []
  let match
  
  while ((match = imgRegex.exec(html)) !== null) {
    if (match[1]) {
      images.push(match[1])
    }
  }
  
  return images
}

const goBack = () => {
  uni.navigateBack()
}

const onScroll = (e) => {
  const scrollTop = e.detail.scrollTop
  showBackToTop.value = scrollTop > 400
}

const scrollToTop = () => {
  uni.pageScrollTo({
    scrollTop: 0,
    duration: 300
  })
}

const handleMore = () => {
  actionPopup.value.open()
}

const closeActionPopup = () => {
  actionPopup.value.close()
}

const handleLike = async () => {
  try {
    const response = await likeArticle(article.id)
    isLiked.value = response.data.liked
    likeCount.value = response.data.likeCount
  } catch (error) {
    uni.showToast({ title: '操作失败', icon: 'none' })
    console.error('点赞操作失败:', error)
  }
}

const handleShare = () => {
  uni.share({
    provider: 'weixin',
    scene: 'WXSceneSession',
    type: 0,
    title: article.title,
    summary: article.content.replace(/<[^>]+>/g, '').substring(0, 50) + '...',
    href: window.location.href,
    success: () => {
      uni.showToast({ title: '分享成功', icon: 'success' })
    },
    fail: (err) => {
      console.error('分享失败:', err)
    }
  })
}

const handleComment = () => {
  uni.navigateTo({
    url: `/pages/article/comments?id=${article.id}`
  })
}

const handleEdit = () => {
  uni.navigateTo({
    url: `/pages/admin/editor?id=${article.id}`
  })
  closeActionPopup()
}

const handleDelete = () => {
  uni.showModal({
    title: '确认删除',
    content: '确定要删除这篇文章吗？此操作不可恢复。',
    success: async (res) => {
      if (res.confirm) {
        try {
          await deleteArticle(article.id)
          uni.showToast({ title: '删除成功', icon: 'success' })
          setTimeout(() => {
            uni.navigateBack()
          }, 1500)
        } catch (error) {
          uni.showToast({ title: '删除失败', icon: 'none' })
          console.error('删除文章失败:', error)
        }
      }
    }
  })
  closeActionPopup()
}

const handleCopyLink = () => {
  const link = `${window.location.origin}/pages/article/detail?id=${article.id}`
  uni.setClipboardData({
    data: link,
    success: () => {
      uni.showToast({ title: '链接已复制', icon: 'success' })
    }
  })
  closeActionPopup()
}

const previewImage = (url) => {
  if (url) {
    uni.previewImage({
      urls: [url],
      current: 0
    })
  }
}

const previewGalleryImage = (index) => {
  uni.previewImage({
    urls: articleImages.value,
    current: index
  })
}

const formatTime = (date) => {
  if (!date) return ''
  
  const now = new Date()
  const targetDate = new Date(date)
  const diff = now - targetDate
  
  const minute = 60 * 1000
  const hour = minute * 60
  const day = hour * 24
  const month = day * 30
  const year = day * 365
  
  if (diff < minute) {
    return '刚刚'
  } else if (diff < hour) {
    return Math.floor(diff / minute) + '分钟前'
  } else if (diff < day) {
    return Math.floor(diff / hour) + '小时前'
  } else if (diff < month) {
    return Math.floor(diff / day) + '天前'
  } else if (diff < year) {
    return Math.floor(diff / month) + '个月前'
  } else {
    return Math.floor(diff / year) + '年前'
  }
}

const formatFullTime = (date) => {
  if (!date) return ''
  
  const targetDate = new Date(date)
  const year = targetDate.getFullYear()
  const month = String(targetDate.getMonth() + 1).padStart(2, '0')
  const day = String(targetDate.getDate()).padStart(2, '0')
  const hours = String(targetDate.getHours()).padStart(2, '0')
  const minutes = String(targetDate.getMinutes()).padStart(2, '0')
  
  return `${year}-${month}-${day} ${hours}:${minutes}`
}
</script>

<style scoped>
.article-detail {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #ffffff;
}

/* 导航栏样式 */
.navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 30rpx;
  height: 88rpx;
  background: #ffffff;
  border-bottom: 1rpx solid #f0f0f0;
  position: sticky;
  top: 0;
  z-index: 100;
}

.nav-left {
  display: flex;
  align-items: center;
  flex: 1;
}

.back-icon {
  font-size: 36rpx;
  margin-right: 10rpx;
}

.back-text {
  font-size: 32rpx;
  color: #007aff;
}

.nav-title {
  flex: 2;
  text-align: center;
  font-size: 36rpx;
  font-weight: 600;
  color: #000000;
}

.nav-right {
  flex: 1;
  display: flex;
  justify-content: flex-end;
}

.action-btn {
  font-size: 36rpx;
  padding: 10rpx;
}

/* 加载和错误状态 */
.loading-container,
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100rpx 30rpx;
  text-align: center;
}

.loading-text {
  font-size: 32rpx;
  color: #666;
}

.error-text {
  font-size: 32rpx;
  color: #ff3b30;
  margin-bottom: 40rpx;
}

.retry-btn {
  background: #007aff;
  color: white;
  padding: 20rpx 40rpx;
  border-radius: 10rpx;
  font-size: 28rpx;
}

/* 内容区域 */
.content-scroll {
  flex: 1;
  background: #ffffff;
}

/* 封面图片 */
.cover-section {
  width: 100%;
  background: #f8f8f8;
}

.cover-image {
  width: 100%;
  display: block;
}

/* 文章头部 */
.article-header {
  padding: 40rpx 30rpx 20rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.article-title {
  display: block;
  font-size: 44rpx;
  font-weight: bold;
  line-height: 1.4;
  color: #000000;
  margin-bottom: 20rpx;
  word-wrap: break-word;
}

.article-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

.meta-item {
  font-size: 26rpx;
  color: #8e8e93;
}

.meta-separator {
  margin: 0 15rpx;
  color: #c6c6c8;
}

/* 文章内容 */
.article-content {
  padding: 30rpx;
}

.rich-content {
  font-size: 32rpx;
  line-height: 1.8;
  color: #333333;
}

/* 图片展示区域 */
.image-gallery {
  padding: 30rpx;
  border-top: 1rpx solid #f0f0f0;
}

.section-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #000000;
  margin-bottom: 30rpx;
}

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20rpx;
}

.gallery-item {
  position: relative;
  border-radius: 12rpx;
  overflow: hidden;
  aspect-ratio: 1;
}

.gallery-image {
  width: 100%;
  height: 100%;
}

.image-index {
  position: absolute;
  top: 8rpx;
  right: 8rpx;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  font-size: 20rpx;
  padding: 4rpx 8rpx;
  border-radius: 12rpx;
}

/* 文章底部 */
.article-footer {
  padding: 40rpx 30rpx;
  border-top: 1rpx solid #f0f0f0;
}

.footer-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10rpx;
}

.footer-text {
  font-size: 26rpx;
  color: #8e8e93;
}

/* 底部操作栏 */
.bottom-actions {
  display: flex;
  padding: 20rpx 30rpx;
  background: #ffffff;
  border-top: 1rpx solid #f0f0f0;
}

.action-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
  padding: 20rpx 0;
}

.btn-icon {
  font-size: 36rpx;
}

.btn-text {
  font-size: 24rpx;
  color: #666;
}

/* 操作菜单 */
.action-popup {
  background: #ffffff;
  border-radius: 24rpx 24rpx 0 0;
  padding: 40rpx 30rpx;
}

.popup-item {
  display: flex;
  align-items: center;
  padding: 30rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.popup-item:last-child {
  border-bottom: none;
}

.popup-icon {
  font-size: 36rpx;
  margin-right: 20rpx;
}

.popup-text {
  font-size: 32rpx;
  color: #333;
}

.cancel-btn {
  width: 100%;
  height: 80rpx;
  background: #f8f8f8;
  color: #333;
  border-radius: 12rpx;
  font-size: 32rpx;
  margin-top: 30rpx;
}

/* 回到顶部按钮 */
.back-to-top {
  position: fixed;
  right: 30rpx;
  bottom: 140rpx;
  width: 80rpx;
  height: 80rpx;
  background: rgba(0, 122, 255, 0.9);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s ease;
  z-index: 99;
}

.back-to-top.show {
  opacity: 1;
  visibility: visible;
}

.top-icon {
  color: white;
  font-size: 36rpx;
  font-weight: bold;
}

/* 响应式设计 */
@media (max-width: 750rpx) {
  .gallery-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>