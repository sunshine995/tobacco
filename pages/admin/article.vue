<template>
  <view class="rich-text-editor">
    <!-- 顶部标题和封面区域 -->
    <view class="header-section">
      <!-- 标题输入 -->
      <view class="title-input-section">
        <text class="section-label">文章标题</text>
        <input
          v-model="articleTitle"
          class="title-input"
          placeholder="请输入文章标题"
          maxlength="100"
          placeholder-style="color: #999;"
        />
        <text class="char-count">{{ articleTitle.length }}/100</text>
      </view>

      <!-- 封面图片上传 -->
      <view class="cover-upload-section">
        <text class="section-label">封面图片</text>
        <view class="cover-upload-container">
          <UploadImage
            ref="coverUploadRef"
            :max-count="1"
            title="选择封面"
            :upload-url="uploadUrl"
          />
          <text class="cover-tip">建议尺寸 750x400 像素</text>
        </view>
      </view>
    </view>

    <!-- 自定义工具栏 -->
    <view class="toolbar">
      <view class="toolbar-group">
        <text 
          class="toolbar-item" 
          :class="{ active: formats.bold }"
          @click="format('bold')"
        >B</text>
        <text 
          class="toolbar-item"
          :class="{ active: formats.italic }"
          @click="format('italic')"
        >I</text>
        <text 
          class="toolbar-item"
          :class="{ active: formats.underline }"
          @click="format('underline')"
        >U</text>
      </view>
      
      <view class="toolbar-group">
        <text class="toolbar-item" @click="showImageUpload">📷</text>
        <text class="toolbar-item" @click="insertLink">🔗</text>
        <text class="toolbar-item" @click="showFontSizePicker">A+</text>
      </view>
      
      <view class="toolbar-group">
        <text class="toolbar-item" @click="undo">↶</text>
        <text class="toolbar-item" @click="redo">↷</text>
        <text class="toolbar-item" @click="clear">🗑️</text>
      </view>
    </view>

    <!-- 富文本编辑器 -->
    <editor
      id="editor"
      class="editor"
      :placeholder="placeholder"
      :show-img-size="true"
      :show-img-toolbar="true"
      :show-img-resize="true"
      @ready="onEditorReady"
      @focus="onFocus"
      @blur="onBlur"
      @input="onInput"
      @statuschange="onStatusChange"
    ></editor>

    <!-- 内容图片上传组件 -->
    <view class="image-upload-section" v-if="showImageUploader">
      <UploadImage
        ref="contentImageRef"
        :max-count="9"
        title="插入内容图片"
        :upload-url="uploadUrl"
        @success="onImageUploadSuccess"
        @fail="onImageUploadFail"
        @upload-complete="onImageUploadComplete"
      />
      
      <view class="upload-actions">
        <button class="btn-upload" @click="triggerImageUpload">上传图片</button>
        <button class="btn-cancel" @click="hideImageUploader">取消</button>
      </view>
    </view>

    <!-- 底部操作栏 -->
    <view class="bottom-actions">
      <button class="btn-save" @click="saveContent" :disabled="!articleTitle.trim()">保存内容</button>
      <button class="btn-preview" @click="previewContent" :disabled="!articleTitle.trim()">预览</button>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import UploadImage from '@/components/UploadImage.vue'
import { saveArticled } from '@/api/notice.js'

// 响应式数据
const articleTitle = ref('')
const coverImageUrl = ref('')
const placeholder = ref('请输入内容...')
const editorCtx = ref(null)
const formats = ref({})
const content = ref('')
const showImageUploader = ref(false)
const uploadUrl = ref('http://192.168.47.1:8081/api/upload')
const undoStack = ref([])
const redoStack = ref([])
const maxStackSize = ref(50)

// 组件引用
const coverUploadRef = ref(null)
const contentImageRef = ref(null)

// 编辑器准备就绪
const onEditorReady = () => {
  uni.createSelectorQuery()
    .select('#editor')
    .context((res) => {
      editorCtx.value = res.context
      console.log('编辑器初始化完成')
    })
    .exec()
}


// 显示内容图片上传组件
const showImageUpload = () => {
  showImageUploader.value = true
  // 重置上传组件状态
  contentImageRef.value?.reset()
}

// 隐藏内容图片上传组件
const hideImageUploader = () => {
  showImageUploader.value = false
}

// 触发内容图片上传
const triggerImageUpload = async () => {
  if (!contentImageRef.value) {
    uni.showToast({ title: '上传组件未就绪', icon: 'none' })
    return
  }

  try {
    uni.showLoading({ title: '上传中...' })
    
    const results = await contentImageRef.value.triggerUpload()
    console.log(results)
    uni.hideLoading()
    
    // 检查上传结果
    const successfulUploads = results.filter(r => r.success)
    if (successfulUploads.length > 0) {
      uni.showToast({ 
        title: `成功上传${successfulUploads.length}张图片`, 
        icon: 'success' 
      })
      // 上传完成后自动隐藏上传面板
      hideImageUploader()
    }
    
  } catch (error) {
    uni.hideLoading()
    uni.showToast({ title: '上传失败', icon: 'none' })
    console.error('上传失败:', error)
  }
}

// 内容图片上传成功
const onImageUploadSuccess = ({ file, index }) => {
  console.log(`内容图片 ${index} 上传成功:`, file)
  
  // 自动插入图片到编辑器
  insertImageToEditor(file.previewUrl || file.url)
}

// 内容图片上传失败
const onImageUploadFail = ({ error, index }) => {
  console.error(`内容图片 ${index} 上传失败:`, error)
  uni.showToast({ title: `第${index + 1}张图片上传失败`, icon: 'none' })
}

// 所有内容图片上传完成
const onImageUploadComplete = (results) => {
  console.log('所有内容图片上传完成:', results)
  
  const successfulUploads = results.filter(r => r.success)
  const failedUploads = results.filter(r => !r.success)
  
  if (failedUploads.length > 0) {
    uni.showToast({ 
      title: `${failedUploads.length}张图片上传失败`, 
      icon: 'none',
      duration: 3000
    })
  }
}

// 插入图片到编辑器
const insertImageToEditor = async (imageUrl) => {
  if (!editorCtx.value) {
    uni.showToast({ title: '编辑器未就绪', icon: 'none' })
    return
  }

  try {
    await new Promise((resolve, reject) => {
      editorCtx.value.insertImage({
        src: imageUrl,
        width: '80%',
        alt: '图片',
        success: resolve,
        fail: reject
      })
    })
    
    console.log('图片插入编辑器成功')
  } catch (error) {
    console.error('插入图片失败:', error)
    uni.showToast({ title: '插入图片失败', icon: 'none' })
  }
}

// 其他编辑器方法
const format = (command, value = null) => {
  if (!editorCtx.value) return
  editorCtx.value.format(command, value)
}

const insertLink = () => {
  uni.showModal({
    title: '插入链接',
    content: '请输入链接地址',
    editable: true,
    placeholderText: 'https://',
    success: (res) => {
      if (res.confirm && res.content) {
        format('link', res.content)
      }
    }
  })
}

const showFontSizePicker = () => {
  const fontSizes = ['12px', '14px', '16px', '18px', '20px', '24px']
  uni.showActionSheet({
    itemList: fontSizes,
    success: (res) => {
      format('fontSize', fontSizes[res.tapIndex])
    }
  })
}

const undo = () => {
  if (undoStack.value.length === 0) return
  
  const currentContent = content.value
  const lastContent = undoStack.value.pop()
  redoStack.value.push(currentContent)
  
  setContent(lastContent)
}

const redo = () => {
  if (redoStack.value.length === 0) return
  
  const nextContent = redoStack.value.pop()
  undoStack.value.push(content.value)
  
  setContent(nextContent)
}

const setContent = (html) => {
  if (!editorCtx.value) return
  
  editorCtx.value.setContents({
    html: html,
    success: () => {
      content.value = html
    }
  })
}

const clear = () => {
  if (!editorCtx.value) return
  
  editorCtx.value.clear({
    success: () => {
      content.value = ''
      undoStack.value = []
      redoStack.value = []
    }
  })
}

// 获取编辑器内容
const getContent = () => {
  return new Promise((resolve, reject) => {
    if (!editorCtx.value) {
      reject(new Error('编辑器未就绪'))
      return
    }
    
    editorCtx.value.getContents({
      success: (res) => {
        resolve(res)
      },
      fail: reject
    })
  })
}

// 保存内容
const saveContent = async () => {
  // 验证标题
  if (!articleTitle.value.trim()) {
    uni.showToast({ title: '请输入文章标题', icon: 'none' })
    return
  }

  try {
    uni.showLoading({ title: '保存中...' })
	
	await coverUploadRef.value.triggerUpload()
    const imageUrls = coverUploadRef.value.getUploadedUrls()
	console.log(imageUrls)
    const contentData = await getContent()
    
    // 获取内容图片URL
    const contentImageUrls = contentImageRef.value?.getAllImageUrls() || []
    
    // 获取封面图片URL
    console.log(coverImageUrl.value)
    
    await saveArticled({
      title: articleTitle.value,
      content: contentData.html,
      text: contentData.text,
      coverImages: imageUrls,
      type: 'rich_text',
      images: contentImageUrls,
      imageCount: contentImageUrls.length,
      createdBy: uni.getStorageSync('userId')
    })

    uni.hideLoading()
    uni.showToast({ title: '保存成功' })
    
    // 清空历史记录
    undoStack.value = []
    redoStack.value = []
    
  } catch (error) {
    uni.hideLoading()
    uni.showToast({ title: '保存失败', icon: 'none' })
    console.error('保存失败:', error)
  }
}

// 预览内容
const previewContent = async () => {
  // 验证标题
  if (!articleTitle.value.trim()) {
    uni.showToast({ title: '请输入文章标题', icon: 'none' })
    return
  }

  try {
    const contentData = await getContent()
    
    // 获取封面图片URL
    const coverImageUrlValue = coverImageUrl.value || coverUploadRef.value?.getAllImageUrls()[0] || ''
    
    const params = {
      content: encodeURIComponent(contentData.html),
      title: encodeURIComponent(articleTitle.value),
      coverImage: encodeURIComponent(coverImageUrlValue)
    }
    
    const queryString = Object.keys(params)
      .map(key => `${key}=${params[key]}`)
      .join('&')
    
    uni.navigateTo({
      url: `/pages/admin/preview?${queryString}`
    })
  } catch (error) {
    uni.showToast({ title: '获取内容失败', icon: 'none' })
  }
}

// 事件处理
const onFocus = () => {
  console.log('编辑器聚焦')
}

const onBlur = () => {
  console.log('编辑器失焦')
}

const onInput = (e) => {
  // 保存到历史记录
  if (content.value && undoStack.value.length < maxStackSize.value) {
    undoStack.value.push(content.value)
  }
  content.value = e.detail.html
  redoStack.value = []
}

const onStatusChange = (e) => {
  formats.value = e.detail
}

// 页面加载
onLoad(() => {
  // 页面加载时恢复草稿
  const draft = uni.getStorageSync('rich_text_draft')
  const savedTitle = uni.getStorageSync('article_title')
  const savedCover = uni.getStorageSync('article_cover')
  
  if (savedTitle) {
    articleTitle.value = savedTitle
  }
  
  if (draft) {
    setTimeout(() => {
      setContent(draft)
    }, 500)
  }
})

// 页面卸载
onUnmounted(() => {
  // 页面卸载时保存草稿
  if (content.value) {
    uni.setStorageSync('rich_text_draft', content.value)
  }
  if (articleTitle.value) {
    uni.setStorageSync('article_title', articleTitle.value)
  }
})

// 监听标题变化
watch(articleTitle, (newTitle) => {
  // 实时保存标题到本地存储
  if (newTitle) {
    uni.setStorageSync('article_title', newTitle)
  }
})
</script>

<style scoped>
.rich-text-editor {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f5f5f5;
}

/* 头部区域样式 */
.header-section {
  background: #fff;
  padding: 30rpx;
  border-bottom: 1rpx solid #eee;
}

.title-input-section {
  margin-bottom: 40rpx;
  position: relative;
}

.section-label {
  display: block;
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 20rpx;
}

.title-input {
  width: 100%;
  height: 80rpx;
  padding: 0 30rpx;
  background: #f8f8f8;
  border-radius: 12rpx;
  font-size: 32rpx;
  color: #333;
  border: 2rpx solid #e0e0e0;
  box-sizing: border-box;
}

.title-input:focus {
  border-color: #007aff;
  background: #fff;
}

.char-count {
  position: absolute;
  right: 20rpx;
  bottom: 20rpx;
  font-size: 24rpx;
  color: #999;
}

.cover-upload-section {
  margin-bottom: 20rpx;
}

.cover-upload-container {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.cover-tip {
  font-size: 24rpx;
  color: #999;
  margin-top: 15rpx;
  align-self: flex-start;
}

/* 工具栏样式 */
.toolbar {
  background: #fff;
  padding: 20rpx;
  border-bottom: 1rpx solid #eee;
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
}

.toolbar-group {
  display: flex;
  gap: 20rpx;
}

.toolbar-item {
  padding: 12rpx 24rpx;
  background: #f8f8f8;
  border-radius: 8rpx;
  font-size: 26rpx;
  color: #333;
  cursor: pointer;
}

.toolbar-item.active {
  background: #007aff;
  color: #fff;
}

/* 编辑器样式 */
.editor {
  flex: 1;
  background: #fff;
  padding: 30rpx;
  margin: 20rpx;
  border-radius: 12rpx;
  box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.1);
}

/* 图片上传区域 */
.image-upload-section {
  background: #fff;
  margin: 20rpx;
  padding: 30rpx;
  border-radius: 12rpx;
  box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.1);
}

.upload-actions {
  display: flex;
  gap: 20rpx;
  margin-top: 30rpx;
}

.btn-upload, .btn-cancel {
  flex: 1;
  height: 80rpx;
  border-radius: 12rpx;
  font-size: 32rpx;
}

.btn-upload {
  background: #007aff;
  color: #fff;
}

.btn-cancel {
  background: #f8f8f8;
  color: #333;
}

/* 底部操作栏 */
.bottom-actions {
  padding: 30rpx;
  background: #fff;
  border-top: 1rpx solid #eee;
  display: flex;
  gap: 20rpx;
}

.btn-save, .btn-preview {
  flex: 1;
  height: 80rpx;
  border-radius: 12rpx;
  font-size: 32rpx;
  transition: all 0.3s ease;
}

.btn-save {
  background: #007aff;
  color: #fff;
}

.btn-save:disabled {
  background: #ccc;
  color: #999;
}

.btn-preview {
  background: #34c759;
  color: #fff;
}

.btn-preview:disabled {
  background: #ccc;
  color: #999;
}
</style>