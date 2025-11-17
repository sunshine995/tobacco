<!-- components/UploadImage.vue -->
<template>
  <view class="upload-container">
    <!-- 已选图片项 -->
    <view
      v-for="(item, index) in displayFiles"
      :key="index"
      class="file-item"
      @click="previewImage(item)" 
    >
      <image
        :src="item.localPreviewUrl || item.previewUrl || item.url"
        mode="aspectFill"
        class="preview"
      />
      <!-- 只有非外部设置的图片才显示删除按钮 -->
      <button 
        v-if="!item.isExternal" 
        class="delete-btn" 
        @click.stop="removeFile(index)"
      >
        ×
      </button>
      <text class="file-name">{{ item.fileName || item.selectedFileName || getFileName(item.url) }}</text>
      
      <!-- 上传进度显示 -->
      <view v-if="item.uploading" class="upload-progress">
        <view class="progress-bar">
          <view class="progress-fill" :style="{ width: (item.progress || 0) + '%' }"></view>
        </view>
      </view>
      
      <!-- 外部图片标识 -->
      <view v-if="item.isExternal" class="external-badge">已上传</view>
    </view>

    <!-- 添加按钮 -->
    <view
      v-if="displayFiles.length < maxCount"
      class="add-btn"
      @click="chooseImage()" 
    >
      <image src="/static/相机.png" class="icon" mode="aspectFit" />
      <text class="text">{{ title }}</text>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  maxCount: {
    type: Number,
    default: 1,
    validator: (v) => v >= 1 && v <= 9
  },
  title: {
    type: String,
    default: '添加图片'
  },
  uploadUrl: {
    type: String,
    default: ''
  },
  // 新增：外部图片URL数组
  externalImages: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['select', 'success', 'fail', 'upload-complete']);

// 本地文件列表
const localFiles = ref([]);
// 外部设置的图片列表
const externalFiles = ref([]);

const BASE_URL = 'http://192.168.215.185:8081/api';
const fullUploadUrl = computed(() => props.uploadUrl || `${BASE_URL}/upload`);

// 计算属性：合并显示的文件列表
const displayFiles = computed(() => {
  return [...externalFiles.value, ...localFiles.value];
});

// ================================
// ✅ 新增：从外部设置预览图片的方法
// ================================
const setPreviewImages = (imageUrls) => {
  if (!imageUrls || !Array.isArray(imageUrls)) {
    console.warn('setPreviewImages: 参数必须是数组');
    return;
  }
  
  externalFiles.value = imageUrls.map(url => ({
    url: url,
    isExternal: true, // 标记为外部图片
    fileName: getFileName(url)
  }));
  
  console.log('设置外部预览图片:', externalFiles.value);
};

// ================================
// ✅ 新增：从文件名中提取文件名
// ================================
const getFileName = (url) => {
  if (!url) return '未知文件';
  // 从URL中提取文件名
  const fileName = url.split('/').pop() || url;
  // 解码URL编码的文件名
  try {
    return decodeURIComponent(fileName);
  } catch {
    return fileName;
  }
};

// 工具函数：将 uni.uploadFile 转换为 Promise
const uploadFilePromise = (options) => {
  return new Promise((resolve, reject) => {
    const uploadTask = uni.uploadFile({
      ...options,
      success: (res) => resolve(res),
      fail: (err) => reject(err)
    });

    // 监听进度更新
    if (options.onProgress) {
      uploadTask.onProgressUpdate(options.onProgress);
    }
  });
};

// 选择图片
const chooseImage = (index) => {
  const availableCount = props.maxCount - displayFiles.value.length;
  if (availableCount <= 0) {
    uni.showToast({ 
      title: `最多只能上传 ${props.maxCount} 张图片`, 
      icon: 'none' 
    });
    return;
  }

  uni.chooseImage({
    count: index !== undefined ? 1 : availableCount,
    success: (res) => {
      const paths = res.tempFilePaths;
      const names = res.tempFiles.map(f => f.name || 'unknown.jpg');

      if (index !== undefined) {
        // 替换指定位置
        localFiles.value[index] = {
          localFilePath: paths[0],
          localPreviewUrl: paths[0],
          selectedFileName: names[0],
          uploading: false,
          progress: 0,
          isExternal: false
        };
      } else {
        // 新增
        paths.forEach((path, i) => {
          localFiles.value.push({
            localFilePath: path,
            localPreviewUrl: path,
            selectedFileName: names[i],
            uploading: false,
            progress: 0,
            isExternal: false
          });
        });
      }

      emit('select', [...localFiles.value]);
    },
    fail: (err) => {
      console.error('选择图片失败:', err);
      uni.showToast({ title: '选择失败', icon: 'none' });
    }
  });
};

const previewImage = (item) => {
  const url = item.previewUrl || item.localPreviewUrl || item.url;
  if (url) {
    // 获取所有可预览的图片URL
    const previewUrls = displayFiles.value
      .map(file => file.previewUrl || file.localPreviewUrl || file.url)
      .filter(url => url);
    
    const currentIndex = previewUrls.indexOf(url);
    
    uni.previewImage({
      urls: previewUrls,
      current: currentIndex >= 0 ? currentIndex : 0
    });
  }
};

// 删除图片
const removeFile = (index) => {
  // 计算在localFiles中的实际索引
  const externalCount = externalFiles.value.length;
  if (index >= externalCount) {
    // 删除的是本地文件
    const localIndex = index - externalCount;
    localFiles.value.splice(localIndex, 1);
    emit('select', [...localFiles.value]);
  } else {
    // 外部图片不允许删除
    uni.showToast({
      title: '外部图片不可删除',
      icon: 'none'
    });
  }
};

// 父组件调用：批量上传
const triggerUpload = async () => {
  console.log('localFiles:', localFiles.value);
  if (localFiles.value.length === 0) {
    uni.showToast({ title: '请先选择图片', icon: 'none' });
    return [];
  }

  try {
    const uploadPromises = localFiles.value.map((file, index) => {
      if (!file.localFilePath) {
        return Promise.resolve({ success: false, error: '无文件路径', index });
      }

      // 标记为上传中
      file.uploading = true;
      file.progress = 0;

      return uploadFilePromise({
        url: fullUploadUrl.value,
        filePath: file.localFilePath,
        name: 'file',
        formData: { type: 'image' },
        onProgress: (res) => {
          // 更新上传进度
          file.progress = res.progress;
        }
      }).then(res => {
        file.uploading = false;
        
        if (res.statusCode === 200) {
          const data = JSON.parse(res.data);
      console.log(data)
          if (data.success) {
            file.previewUrl = data.data.url;
            file.fileName = data.data.originalName;
            emit('success', { file: file, index });
            return { success: true, file: file, index };
          } else {
            throw new Error(data.message || '上传失败');
          }
        } else {
          throw new Error(`HTTP ${res.statusCode}`);
        }
      }).catch(error => {
        file.uploading = false;
        emit('fail', { error, index });
        return { success: false, error, index };
      });
    });

    const results = await Promise.all(uploadPromises);
    emit('upload-complete', results);
    
    // 检查上传结果
    const successfulUploads = results.filter(r => r.success);
    const failedUploads = results.filter(r => !r.success);
    
    if (failedUploads.length > 0) {
      uni.showToast({ 
        title: `${failedUploads.length}张图片上传失败`, 
        icon: 'none',
        duration: 3000
      });
    } else if (successfulUploads.length > 0) {
      uni.showToast({ 
        title: `成功上传${successfulUploads.length}张图片`, 
        icon: 'success' 
      });
    }

    return results;

  } catch (error) {
    console.error('上传过程出错:', error);
    uni.showToast({ title: '上传过程出错', icon: 'none' });
    throw error;
  }
};

// ================================
// ✅ 新增：清空外部图片
// ================================
const clearExternalImages = () => {
  externalFiles.value = [];
};

// ================================
// ✅ 新增：获取所有图片（包括外部和本地）
// ================================
const getAllFiles = () => {
  return [...displayFiles.value];
};

// ================================
// ✅ 新增：获取所有图片URL（包括外部和已上传的本地图片）
// ================================
const getAllImageUrls = () => {
  return displayFiles.value
    .map(file => file.previewUrl || file.url)
    .filter(url => url);
};

// 暴露方法
defineExpose({
  triggerUpload,
  reset: () => {
    localFiles.value = [];
    externalFiles.value = [];
  },
  getFiles: () => [...localFiles.value],
  getUploadedUrls: () => {
    return localFiles.value
      .filter(file => file.previewUrl)
      .map(file => file.previewUrl);
  },
  // ================================
  // ✅ 新增：暴露新方法
  // ================================
  setPreviewImages,
  clearExternalImages,
  getAllFiles,
  getAllImageUrls
});
</script>

<style scoped>
.upload-container {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 20rpx;
}

.file-item,
.add-btn {
  width: 160rpx;
  height: 160rpx;
  position: relative;
  border-radius: 12rpx;
  overflow: hidden;
  background: #f8f8f8;
}

.preview {
  width: 100%;
  height: 100%;
}

.delete-btn {
  position: absolute;
  top: -8rpx;
  right: -8rpx;
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  font-size: 32rpx;
  line-height: 40rpx;
  text-align: center;
  padding: 0;
  margin: 0;
  z-index: 10;
}

.file-name {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  font-size: 20rpx;
  padding: 4rpx 0;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 上传进度样式 */
.upload-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 6rpx;
  background: rgba(255, 255, 255, 0.3);
}

.progress-bar {
  height: 100%;
  background: #e0e0e0;
  border-radius: 3rpx;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #4CAF50;
  border-radius: 3rpx;
  transition: width 0.3s ease;
}

.add-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 2rpx dashed #ccc;
  cursor: pointer;
}

.icon {
  width: 40rpx;
  height: 40rpx;
  margin-bottom: 8rpx;
}

.text {
  font-size: 24rpx;
  color: #666;
  text-align: center;
}

/* ================================ */
/* ✅ 新增：外部图片标识样式 */
/* ================================ */
.external-badge {
  position: absolute;
  top: 8rpx;
  left: 8rpx;
  background: rgba(0, 122, 255, 0.8);
  color: white;
  font-size: 18rpx;
  padding: 4rpx 8rpx;
  border-radius: 12rpx;
  z-index: 5;
}
</style>