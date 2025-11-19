<!-- pages/admin/preview.vue -->
<template>
  <view class="preview-container">
    <!-- 顶部导航栏 -->
    <view class="navbar">
      <view class="nav-left" @click="goBack">
        <text class="back-icon">←</text>
        <text class="back-text">返回</text>
      </view>
      <view class="nav-title">内容预览</view>
      <view class="nav-right"></view>
    </view>

    <!-- 内容区域 -->
    <scroll-view 
      class="content-scroll" 
      scroll-y 
      :scroll-top="scrollTop"
      @scroll="onScroll"
    >
      <!-- 封面图片 -->
      <view class="cover-section" v-if="coverImage">
        <image 
          :src="coverImage" 
          mode="widthFix"
          class="cover-image"
          :lazy-load="true"
        />
      </view>

      <!-- 文章头部信息 -->
      <view class="article-header" v-if="title">
        <text class="article-title">{{ title }}</text>
        <view class="article-meta" v-if="createTime">
          <text class="meta-item">{{ formatTime(createTime) }}</text>
        </view>
      </view>

      <!-- 富文本内容 -->
      <view class="content-wrapper">
        <rich-text 
          :nodes="processedContent" 
          class="rich-content"
        ></rich-text>
      </view>

      <!-- 独立的图片展示区域 -->
      <view class="image-gallery" v-if="imageList.length > 0">
        <view class="section-title">本文图片 ({{ imageList.length }})</view>
        <view class="gallery-grid">
          <view 
            v-for="(img, index) in imageList" 
            :key="index"
            class="gallery-item"
            @click="previewImage(index)"
          >
            <image 
              :src="img" 
              mode="aspectFill"
              class="gallery-image"
              :lazy-load="true"
            />
            <view class="image-index">{{ index + 1 }}</view>
          </view>
        </view>
      </view>
    </scroll-view>

    <!-- 回到顶部按钮 -->
    <view 
      class="back-to-top" 
      :class="{ show: showBackToTop && !loading && !error }"
      @click="scrollToTop"
    >
      <text class="top-icon">↑</text>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      // 内容数据
      content: '',
      title: '',
      coverImage: '',
      createTime: null,
      
      // 状态管理
      loading: true,
      error: '',
      
      // 滚动相关
      scrollTop: 0,
      showBackToTop: false,
      
      // 图片相关
      imageList: []
    }
  },

  computed: {
    // 处理富文本内容，确保空格和样式正确显示
    processedContent() {
      if (!this.content) return ''
      
      let processed = this.content
      
      // 1. 首先处理空格 - 将普通空格转换为HTML空格实体
      processed = this.processSpaces(processed)
      
      // 2. 处理图片样式
      processed = processed.replace(
        /<img/gi, 
        '<img style="max-width:100%;height:auto;border-radius:8px;margin:10px 0;display:block;"'
      )
      
      // 3. 处理段落样式，保留空格
      processed = processed.replace(
        /<p/gi, 
        '<p style="margin:10px 0;line-height:1.8;word-wrap:break-word;white-space:pre-wrap;"'
      )
      
      // 4. 处理div样式，保留空格
      processed = processed.replace(
        /<div/gi, 
        '<div style="white-space:pre-wrap;word-wrap:break-word;"'
      )
      
      // 5. 处理span样式，保留空格
      processed = processed.replace(
        /<span/gi, 
        '<span style="white-space:pre-wrap;"'
      )
      
      // 6. 处理标题样式
      processed = processed.replace(
        /<h1/gi, 
        '<h1 style="font-size:20px;font-weight:bold;margin:20px 0 10px 0;border-left:4px solid #007aff;padding-left:10px;white-space:pre-wrap;"'
      )
      
      processed = processed.replace(
        /<h2/gi, 
        '<h2 style="font-size:18px;font-weight:bold;margin:18px 0 9px 0;border-left:3px solid #34c759;padding-left:10px;white-space:pre-wrap;"'
      )
      
      processed = processed.replace(
        /<h3/gi, 
        '<h3 style="font-size:16px;font-weight:bold;margin:16px 0 8px 0;border-left:2px solid #ff9500;padding-left:10px;white-space:pre-wrap;"'
      )
      
      // 7. 确保列表样式
      processed = processed.replace(
        /<ul/gi, 
        '<ul style="margin:10px 0;padding-left:20px;white-space:pre-wrap;"'
      )
      
      processed = processed.replace(
        /<ol/gi, 
        '<ol style="margin:10px 0;padding-left:20px;white-space:pre-wrap;"'
      )
      
      // 8. 确保引用样式
      processed = processed.replace(
        /<blockquote/gi, 
        '<blockquote style="border-left:4px solid #8e8e93;padding:10px 15px;margin:10px 0;background:#f8f8f8;color:#666;white-space:pre-wrap;"'
      )
      
      return processed
    }
  },

  onLoad(options) {
    this.loadContent(options)
  },

  methods: {
    // 处理空格显示
    processSpaces(html) {
      if (!html) return ''
      
      // 方法1: 将连续空格转换为 &nbsp;
      let processed = html.replace(/  /g, ' &nbsp;')
      
      // 方法2: 确保行首空格被保留
      processed = processed.replace(/\n\s+/g, '\n&nbsp;')
      
      // 方法3: 处理pre标签内的空格（如果有的话）
      processed = processed.replace(/<pre[^>]*>([\s\S]*?)<\/pre>/gi, (match, content) => {
        return match.replace(content, content.replace(/ /g, '&nbsp;').replace(/\n/g, '<br>'))
      })
      
      return processed
    },

    // 安全的URL解码函数
    safeDecodeURIComponent(str) {
      if (!str) return ''
      
      try {
        return decodeURIComponent(str)
      } catch (error) {
        console.warn('URL解码失败，尝试替代方案:', error)
        try {
          return decodeURIComponent(str.replace(/%(?![0-9A-Fa-f]{2})/g, '%25'))
        } catch (e) {
          console.warn('替代方案失败:', e)
          return this.cleanMalformedURI(str)
        }
      }
    },

    // 清理格式错误的URI
    cleanMalformedURI(str) {
      return str.replace(/%[^0-9A-Fa-f]/g, '%25').replace(/[^\x20-\x7E]/g, '')
    },

    // 加载内容
    loadContent(options) {
      this.loading = true
      this.error = ''
      
      try {
        console.log('接收到的参数:', options)
        
        // 安全地解码参数
        if (options.content) {
          this.content = this.safeDecodeURIComponent(options.content)
          console.log('解码后的内容:', this.content)
        } else {
          this.content = '<p>暂无内容</p>'
        }
        
        if (options.title) {
          this.title = this.safeDecodeURIComponent(options.title)
        } else {
          const textContent = this.content.replace(/<[^>]+>/g, '')
          this.title = textContent.substring(0, 20) + (textContent.length > 20 ? '...' : '')
        }
        
        if (options.coverImage) {
          this.coverImage = this.safeDecodeURIComponent(options.coverImage)
        }
        
        if (options.createTime) {
          this.createTime = new Date(parseInt(options.createTime))
        } else {
          this.createTime = new Date()
        }
        
        // 提取图片
        this.extractImages()
        
        this.loading = false
        
      } catch (error) {
        console.error('加载内容失败:', error)
        this.error = '加载内容失败，请返回重试'
        this.loading = false
      }
    },

    // 重试加载
    retryLoad() {
      this.loadContent(this.$options || {})
    },

    // 提取内容中的图片
    extractImages() {
      try {
        const imgRegex = /<img[^>]+src="([^">]+)"/g
        const images = []
        let match
        
        while ((match = imgRegex.exec(this.content)) !== null) {
          if (match[1]) {
            images.push(match[1])
          }
        }
        
        this.imageList = images
        console.log('提取到的图片数量:', images.length)
      } catch (error) {
        console.error('提取图片失败:', error)
        this.imageList = []
      }
    },

    // 返回上一页
    goBack() {
      uni.navigateBack()
    },

    // 滚动事件
    onScroll(e) {
      const scrollTop = e.detail.scrollTop
      this.scrollTop = scrollTop
      
      this.showBackToTop = scrollTop > 400
    },

    // 回到顶部
    scrollToTop() {
      this.scrollTop = 0
    },

    // 预览图片
    previewImage(index) {
      uni.previewImage({
        urls: this.imageList,
        current: index
      })
    },

    // 格式化时间
    formatTime(date) {
      if (!date) return ''
      
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      
      return `${year}-${month}-${day} ${hours}:${minutes}`
    }
  }
}
</script>

<style scoped>
.preview-container {
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
}

/* 内容区域样式 */
.content-scroll {
  flex: 1;
  background: #ffffff;
}

/* 封面图片样式 */
.cover-section {
  width: 100%;
  background: #f8f8f8;
}

.cover-image {
  width: 100%;
  display: block;
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

/* 文章头部样式 */
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
}

.meta-item {
  font-size: 26rpx;
  color: #8e8e93;
}

/* 内容包装器 - 关键修改：确保空格显示 */
.content-wrapper {
  padding: 30rpx;
}

.rich-content {
  font-size: 32rpx;
  line-height: 1.8;
  color: #333333;
  /* 确保空格和换行符被保留 */
  white-space: pre-wrap;
  word-wrap: break-word;
  word-break: break-word;
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

/* 回到顶部按钮 */
.back-to-top {
  position: fixed;
  right: 30rpx;
  bottom: 120rpx;
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