<template>
  <view class="file-uploader">
    <!-- 标题区域 -->
    <view class="header">
      <text class="title">文件上传</text>
      <text class="subtitle">支持各种文档、压缩包等格式，最大 50MB</text>
    </view>

    <!-- 上传区域 -->
    <view class="upload-area" @click="chooseFile">
      <view class="upload-content">
        <view class="upload-icon">📁</view>
        <text class="upload-text">点击选择文件</text>
        <text class="upload-hint">支持多选，最大 {{ maxSize }} MB</text>
      </view>
    </view>

    <!-- 上传进度 -->
    <view v-if="uploading && progress > 0" class="progress-section">
      <view class="progress-header">
        <text class="progress-title">上传进度</text>
        <text class="progress-percent">{{ progress }}%</text>
      </view>
      <view class="progress-bar">
        <view class="progress-fill" :style="{ width: progress + '%' }"></view>
      </view>
    </view>

    <!-- 文件列表 -->
    <view v-if="fileList.length > 0" class="file-list-section">
      <view class="section-header">
        <text class="section-title">已上传文件 ({{ fileList.length }})</text>
        <text class="clear-all" @click="clearAll">清空全部</text>
      </view>

      <view class="file-list">
        <view 
          v-for="(file, index) in fileList" 
          :key="index" 
          class="file-item"
          :class="{ 'uploading': file.uploading }"
        >
          <view class="file-icon">
            {{ getFileIcon(file.name) }}
          </view>
          
          <view class="file-info">
            <text class="file-name">{{ getFileName(file.name) }}</text>
            <text class="file-meta">
              {{ formatFileSize(file.size) }} • {{ formatTime(file.uploadTime) }}
            </text>
            <view v-if="file.uploading" class="file-progress">
              <view class="file-progress-bar">
                <view 
                  class="file-progress-fill" 
                  :style="{ width: file.progress + '%' }"
                ></view>
              </view>
              <text class="file-progress-text">{{ file.progress }}%</text>
            </view>
          </view>

          <view class="file-actions">
            <view 
              class="action-btn preview-btn" 
              @click="previewFile(file)"
              v-if="isPreviewable(file.name)"
            >
              👁️
            </view>
            <view class="action-btn delete-btn" @click="removeFile(index)">
              🗑️
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 操作按钮 -->
    <view v-if="fileList.length > 0" class="action-section">
      <button 
        class="action-btn save-btn" 
        :disabled="uploading"
        @click="saveFiles"
      >
        {{ uploading ? '上传中...' : `保存 ${fileList.length} 个文件` }}
      </button>
    </view>

    <!-- 空状态 -->
    <view v-if="fileList.length === 0 && !uploading" class="empty-state">
      <view class="empty-icon">📄</view>
      <text class="empty-text">暂无上传文件</text>
      <text class="empty-hint">点击上方区域选择文件开始上传</text>
    </view>
  </view>
</template>

<script>
import uploadPlugin from './upload-plugin.js';

export default {
  name: 'FileUploader',
  props: {
    maxSize: {
      type: Number,
      default: 50
    },
    maxCount: {
      type: Number,
      default: 20
    },
    autoSave: {
      type: Boolean,
      default: false
    },
    config: {
      type: Object,
      default: () => ({})
    },
    allowedTypes: {
      type: Array,
      default: () => ['all'] // 'all', 'video', 'image', 'file'
    }
  },
  data() {
    return {
      fileList: [],
      uploading: false,
      progress: 0
    };
  },
  created() {
    // 初始化插件配置
    if (this.config) {
      uploadPlugin.setConfig({
        ...this.config,
        maxSize: this.maxSize * 1024 * 1024,
        onProgress: this.handleProgress
      });
    }
  },
  methods: {
    // 选择文件
    async chooseFile() {
      if (this.uploading) return;
      
      const availableCount = this.maxCount - this.fileList.length;
      if (availableCount <= 0) {
        uni.showToast({
          title: `最多只能上传 ${this.maxCount} 个文件`,
          icon: 'none'
        });
        return;
      }

      try {
        const results = await uploadPlugin.chooseAndUploadFile({
          count: availableCount,
          type: this.allowedTypes[0] === 'all' ? 'all' : this.allowedTypes
        });

        this.handleUploadResults(results);
      } catch (error) {
        this.handleUploadError(error);
      }
    },

    // 处理上传结果
    handleUploadResults(results) {
      const successfulUploads = results.filter(result => result.success);
      
      if (successfulUploads.length > 0) {
        const newFiles = successfulUploads.map(result => ({
          url: result.data.url,
          name: result.data.originalName,
          size: result.data.size,
          uploadTime: new Date(),
          uploading: false,
          progress: 100
        }));

        this.fileList = [...this.fileList, ...newFiles];
        
        this.$emit('upload-success', newFiles);
        
        uni.showToast({
          title: `成功上传 ${successfulUploads.length} 个文件`,
          icon: 'success'
        });

        // 自动保存
        if (this.autoSave) {
          this.saveFiles();
        }
      }

      // 处理失败的上传
      const failedUploads = results.filter(result => !result.success);
      if (failedUploads.length > 0) {
        failedUploads.forEach(result => {
          uni.showToast({
            title: result.error,
            icon: 'none',
            duration: 3000
          });
        });
      }
    },

    // 处理上传错误
    handleUploadError(error) {
      console.error('上传错误:', error);
      uni.showToast({
        title: error.message || '上传失败',
        icon: 'none'
      });
      this.$emit('upload-error', error);
    },

    // 处理上传进度
    handleProgress(progressEvent) {
      this.progress = progressEvent.progress;
      this.$emit('upload-progress', progressEvent);
    },

    // 保存文件信息
    async saveFiles() {
      if (this.fileList.length === 0) return;

      try {
        this.uploading = true;
        
        // 保存到业务后端
        const saveResults = [];
        for (const file of this.fileList) {
          const result = await uploadPlugin.saveFileInfo({
            fileUrl: file.url,
            fileName: file.name,
            fileType: this.getFileType(file.name),
            fileSize: file.size,
            description: '用户上传的文件',
            uploadTime: file.uploadTime
          });
          saveResults.push(result);
        }

        this.$emit('save-success', this.fileList);
        
        uni.showToast({
          title: `成功保存 ${this.fileList.length} 个文件`,
          icon: 'success'
        });
      } catch (error) {
        uni.showToast({
          title: '保存失败: ' + error.message,
          icon: 'none'
        });
        this.$emit('save-error', error);
      } finally {
        this.uploading = false;
        this.progress = 0;
      }
    },

    // 预览文件
    previewFile(file) {
      if (this.isImageFile(file.name)) {
        uni.previewImage({
          urls: [file.url],
          current: file.url
        });
      } else if (this.isPdfFile(file.name)) {
        // 对于 PDF，可以使用 web-view 打开
        uni.navigateTo({
          url: `/pages/pdf-viewer?url=${encodeURIComponent(file.url)}`
        });
      } else {
        uni.showToast({
          title: '该文件类型暂不支持预览',
          icon: 'none'
        });
      }
    },

    // 删除文件
    removeFile(index) {
      uni.showModal({
        title: '确认删除',
        content: '确定要删除这个文件吗？',
        success: (res) => {
          if (res.confirm) {
            const removedFile = this.fileList[index];
            this.fileList.splice(index, 1);
            this.$emit('file-removed', removedFile);
          }
        }
      });
    },

    // 清空全部
    clearAll() {
      if (this.fileList.length === 0) return;
      
      uni.showModal({
        title: '确认清空',
        content: `确定要清空所有 ${this.fileList.length} 个文件吗？`,
        success: (res) => {
          if (res.confirm) {
            const removedFiles = [...this.fileList];
            this.fileList = [];
            this.$emit('all-cleared', removedFiles);
          }
        }
      });
    },

    // 获取文件图标
    getFileIcon(filename) {
      const ext = this.getFileExtension(filename).toLowerCase();
      
      const iconMap = {
        pdf: '📕',
        doc: '📘',
        docx: '📘',
        xls: '📗',
        xlsx: '📗',
        ppt: '📙',
        pptx: '📙',
        zip: '🗜️',
        rar: '🗜️',
        txt: '📄',
        js: '⚡',
        html: '🌐',
        css: '🎨',
        json: '📋',
        mp4: '🎬',
        mp3: '🎵',
        jpg: '🖼️',
        jpeg: '🖼️',
        png: '🖼️',
        gif: '🖼️'
      };
      
      return iconMap[ext] || '📄';
    },

    // 获取文件扩展名
    getFileExtension(filename) {
      return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
    },

    // 获取文件名（去掉路径）
    getFileName(fullPath) {
      if (!fullPath) return '';
      return fullPath.split('/').pop() || fullPath;
    },

    // 格式化文件大小
    formatFileSize(bytes) {
      return uploadPlugin.formatFileSize(bytes);
    },

    // 格式化时间
    formatTime(date) {
      if (!(date instanceof Date)) {
        date = new Date(date);
      }
      return date.toLocaleTimeString('zh-CN', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    },

    // 判断是否为图片文件
    isImageFile(filename) {
      return uploadPlugin.isImageFile(filename);
    },

    // 判断是否为 PDF 文件
    isPdfFile(filename) {
      return this.getFileExtension(filename).toLowerCase() === 'pdf';
    },

    // 判断文件是否可预览
    isPreviewable(filename) {
      return this.isImageFile(filename) || this.isPdfFile(filename);
    },

    // 获取文件类型
    getFileType(filename) {
      const ext = this.getFileExtension(filename).toLowerCase();
      
      if (this.isImageFile(filename)) return 'image';
      if (['mp4', 'avi', 'mov', 'wmv'].includes(ext)) return 'video';
      if (['mp3', 'wav', 'aac'].includes(ext)) return 'audio';
      if (['pdf'].includes(ext)) return 'pdf';
      if (['doc', 'docx'].includes(ext)) return 'word';
      if (['xls', 'xlsx'].includes(ext)) return 'excel';
      if (['ppt', 'pptx'].includes(ext)) return 'powerpoint';
      if (['zip', 'rar', '7z'].includes(ext)) return 'archive';
      
      return 'other';
    },

    // 获取所有文件 URL（供父组件使用）
    getFileUrls() {
      return this.fileList.map(file => file.url);
    },

    // 获取所有文件信息（供父组件使用）
    getFileList() {
      return [...this.fileList];
    }
  }
};
</script>

<style scoped>
.file-uploader {
  background: white;
  border-radius: 16rpx;
  padding: 32rpx;
  box-shadow: 0 4rpx 24rpx rgba(0, 0, 0, 0.08);
}

.header {
  margin-bottom: 32rpx;
}

.title {
  display: block;
  font-size: 36rpx;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 8rpx;
}

.subtitle {
  font-size: 26rpx;
  color: #666;
}

.upload-area {
  border: 2rpx dashed #d1d1d6;
  border-radius: 16rpx;
  padding: 60rpx 32rpx;
  text-align: center;
  background: #fafafa;
  transition: all 0.3s ease;
  margin-bottom: 32rpx;
}

.upload-area:active {
  background: #f0f0f0;
  border-color: #007AFF;
}

.upload-icon {
  font-size: 64rpx;
  margin-bottom: 16rpx;
}

.upload-text {
  display: block;
  font-size: 32rpx;
  color: #1a1a1a;
  margin-bottom: 8rpx;
}

.upload-hint {
  font-size: 26rpx;
  color: #8e8e93;
}

/* 进度条样式 */
.progress-section {
  background: #f8f9fa;
  border-radius: 12rpx;
  padding: 24rpx;
  margin-bottom: 32rpx;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.progress-title {
  font-size: 28rpx;
  color: #1a1a1a;
  font-weight: 500;
}

.progress-percent {
  font-size: 28rpx;
  color: #007AFF;
  font-weight: 600;
}

.progress-bar {
  height: 8rpx;
  background: #e5e5ea;
  border-radius: 4rpx;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #007AFF, #34C759);
  border-radius: 4rpx;
  transition: width 0.3s ease;
}

/* 文件列表区域 */
.file-list-section {
  margin-bottom: 32rpx;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
}

.section-title {
  font-size: 30rpx;
  color: #1a1a1a;
  font-weight: 500;
}

.clear-all {
  font-size: 26rpx;
  color: #ff3b30;
  padding: 8rpx 16rpx;
}

.file-list {
  space-y: 16rpx;
}

.file-item {
  display: flex;
  align-items: center;
  padding: 24rpx;
  background: #f8f9fa;
  border-radius: 12rpx;
  border-left: 6rpx solid #007AFF;
  transition: all 0.3s ease;
}

.file-item:active {
  background: #e9ecef;
  transform: translateY(-2rpx);
}

.file-item.uploading {
  opacity: 0.7;
}

.file-icon {
  font-size: 48rpx;
  margin-right: 24rpx;
  width: 60rpx;
  text-align: center;
}

.file-info {
  flex: 1;
}

.file-name {
  display: block;
  font-size: 28rpx;
  color: #1a1a1a;
  font-weight: 500;
  margin-bottom: 4rpx;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-meta {
  font-size: 24rpx;
  color: #8e8e93;
}

.file-progress {
  display: flex;
  align-items: center;
  margin-top: 12rpx;
  gap: 16rpx;
}

.file-progress-bar {
  flex: 1;
  height: 4rpx;
  background: #e5e5ea;
  border-radius: 2rpx;
  overflow: hidden;
}

.file-progress-fill {
  height: 100%;
  background: #34C759;
  border-radius: 2rpx;
  transition: width 0.3s ease;
}

.file-progress-text {
  font-size: 22rpx;
  color: #34C759;
  font-weight: 500;
  min-width: 60rpx;
}

.file-actions {
  display: flex;
  gap: 12rpx;
}

.action-btn {
  width: 56rpx;
  height: 56rpx;
  border-radius: 8rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border: 1rpx solid #e5e5ea;
  font-size: 24rpx;
  transition: all 0.2s ease;
}

.action-btn:active {
  transform: scale(0.95);
  background: #f8f9fa;
}

/* 操作按钮区域 */
.action-section {
  margin-top: 32rpx;
}

.save-btn {
  background: linear-gradient(135deg, #007AFF, #5856D6);
  color: white;
  border-radius: 12rpx;
  font-size: 32rpx;
  font-weight: 600;
  height: 88rpx;
  line-height: 88rpx;
}

.save-btn:disabled {
  background: #c7c7cc;
  color: #8e8e93;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 80rpx 32rpx;
}

.empty-icon {
  font-size: 80rpx;
  margin-bottom: 24rpx;
  opacity: 0.5;
}

.empty-text {
  display: block;
  font-size: 32rpx;
  color: #8e8e93;
  margin-bottom: 12rpx;
}

.empty-hint {
  font-size: 26rpx;
  color: #c7c7cc;
}
</style>