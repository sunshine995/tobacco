<!-- components/UploadFile.vue -->
<template>
  <view class="upload-container">
    <!-- 已选文件项 -->
    <view
      v-for="(item, index) in displayFiles"
      :key="index"
      class="file-item"
      @click="handleFile(item)" 
      :class="{ 'h5-hover': isH5 }"
    >
      <!-- 文件图标 -->
      <view class="file-icon-container">
        <image 
          :src="getFileIcon(item.fileExtension)" 
          class="file-icon" 
          mode="aspectFit"
        />
      </view>
      
      <!-- 只有非外部设置的文件才显示删除按钮 -->
      <button 
        v-if="!item.isExternal" 
        class="delete-btn" 
        @click.stop="removeFile(index)"
      >
        ×
      </button>
      
      <text class="file-name">{{ getDisplayFileName(item) }}</text>
      <text class="file-size" v-if="item.fileSize">{{ formatFileSize(item.fileSize) }}</text>
      
      <!-- 上传进度显示 -->
      <view v-if="item.uploading" class="upload-progress">
        <view class="progress-bar">
          <view class="progress-fill" :style="{ width: (item.progress || 0) + '%' }"></view>
        </view>
        <text class="progress-text">{{ item.progress || 0 }}%</text>
      </view>
      
      <!-- 外部文件标识 -->
      <view v-if="item.isExternal" class="external-badge">已上传</view>
    </view>

    <!-- 添加按钮 -->
    <view
      v-if="displayFiles.length < maxCount"
      class="add-btn"
      @click="chooseFile()" 
    >
      <image src="/static/file-icons/文件.png" class="icon" mode="aspectFit" />
      <text class="text">{{ title }}</text>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';

const props = defineProps({
  maxCount: {
    type: Number,
    default: 1,
    validator: (v) => v >= 1 && v <= 9
  },
  title: {
    type: String,
    default: '添加文件'
  },
  uploadUrl: {
    type: String,
    default: ''
  },
  // 外部文件URL数组
  externalFiles: {
    type: Array,
    default: () => []
  },
  // 文件大小限制（字节）
  maxSize: {
    type: Number,
    default: 50 * 1024 * 1024 // 默认50MB
  },
  // 允许的文件扩展名
  accept: {
    type: String,
    default: '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar'
  }
});

const emit = defineEmits(['select', 'success', 'fail', 'upload-complete']);

// 平台检测
const isH5 = ref(false);
const isApp = ref(false);

// 本地文件列表
const localFiles = ref([]);
// 外部设置的文件列表
const externalFiles = ref([]);

const BASE_URL = 'http://192.168.179.185:8081/api';
const fullUploadUrl = computed(() => props.uploadUrl || `${BASE_URL}/upload`);

// 计算属性：合并显示的文件列表
const displayFiles = computed(() => {
  return [...externalFiles.value, ...localFiles.value];
});

// 平台初始化
onMounted(() => {
  // 使用条件编译检测平台
  // #ifdef H5
  isH5.value = true;
  // #endif
  
  // #ifdef APP-PLUS
  isApp.value = true;
  // #endif
});

// 获取文件扩展名
const getFileExtension = (fileName) => {
  if (!fileName) return '';
  const parts = fileName.split('.');
  return parts.length > 1 ? parts.pop().toLowerCase() : '';
};

// 获取文件图标
const getFileIcon = (extension) => {
  const iconMap = {
    'pdf': '/static/file-icons/pdf.png',
    'doc': '/static/file-icons/word.png',
    'docx': '/static/file-icons/word.png',
    'xls': '/static/file-icons/excel.png',
    'xlsx': '/static/file-icons/excel.png',
    'ppt': '/static/file-icons/ppt.png',
    'pptx': '/static/file-icons/ppt.png',
  };
  
  return iconMap[extension] || '/static/file-icons/文件.png';
};

// 从文件名中提取文件名
const getFileName = (url) => {
  if (!url) return '未知文件';
  const fileName = url.split('/').pop() || url;
  try {
    return decodeURIComponent(fileName);
  } catch {
    return fileName;
  }
};

// 获取显示的文件名 - 始终使用原始文件名
const getDisplayFileName = (item) => {
  // 优先使用原始文件名
  if (item.selectedFileName) {
    return item.selectedFileName;
  }
  // 其次使用服务器返回的文件名
  if (item.fileName) {
    return item.fileName;
  }
  // 最后从URL中提取
  if (item.url) {
    return getFileName(item.url);
  }
  return '未知文件';
};

// 格式化文件大小
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// 设置外部预览文件
const setPreviewFiles = (fileUrls) => {
  if (!fileUrls || !Array.isArray(fileUrls)) {
    console.warn('setPreviewFiles: 参数必须是数组');
    return;
  }
  
  externalFiles.value = fileUrls.map(url => {
    const fileName = getFileName(url);
    const extension = getFileExtension(fileName);
    
    return {
      url: url,
      isExternal: true,
      fileName: fileName,
      selectedFileName: fileName, // 确保外部文件也有原始文件名
      fileExtension: extension,
      type: 'file'
    };
  });
};

// 工具函数：将 uni.uploadFile 转换为 Promise
const uploadFilePromise = (options) => {
  return new Promise((resolve, reject) => {
    const uploadTask = uni.uploadFile({
      ...options,
      success: (res) => resolve(res),
      fail: (err) => reject(err)
    });

    if (options.onProgress) {
      uploadTask.onProgressUpdate(options.onProgress);
    }
  });
};

// 选择文件
const chooseFile = (index) => {
  const availableCount = props.maxCount - displayFiles.value.length;
  if (availableCount <= 0) {
    uni.showToast({ 
      title: `最多只能上传 ${props.maxCount} 个文件`, 
      icon: 'none' 
    });
    return;
  }

  if (isH5.value) {
    chooseFileH5(index, availableCount);
  } else {
    chooseFileApp(index, availableCount);
  }
};

// H5选择文件
const chooseFileH5 = (index, availableCount) => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = props.accept;
  input.multiple = index === undefined && availableCount > 1;
  input.style.display = 'none';
  
  input.onchange = (e) => {
    const files = Array.from(e.target.files);
    files.forEach((file) => {
      if (file.size > props.maxSize) {
        uni.showToast({
          title: `文件大小不能超过 ${formatFileSize(props.maxSize)}`,
          icon: 'none'
        });
        return;
      }
      
      const extension = getFileExtension(file.name);
      const fileItem = {
        localFilePath: file.name,
        selectedFileName: file.name, // 保存原始文件名
        originalFileName: file.name, // 额外保存原始文件名，确保不会丢失
        fileSize: file.size,
        fileExtension: extension,
        type: 'file',
        uploading: false,
        progress: 0,
        isExternal: false,
        _fileObject: file
      };
      
      if (index !== undefined) {
        localFiles.value[index] = fileItem;
      } else {
        localFiles.value.push(fileItem);
      }
    });
    
    emit('select', [...localFiles.value]);
    document.body.removeChild(input);
  };
  
  document.body.appendChild(input);
  input.click();
};

// APP选择文件
const chooseFileApp = (index, availableCount) => {
  uni.chooseFile({
    count: index !== undefined ? 1 : availableCount,
    type: 'all',
    extension: props.accept ? props.accept.split(',') : undefined,
    success: (res) => {
      const files = res.tempFiles;
      
      files.forEach((file) => {
        if (file.size > props.maxSize) {
          uni.showToast({
            title: `文件大小不能超过 ${formatFileSize(props.maxSize)}`,
            icon: 'none'
          });
          return;
        }
        
        const extension = getFileExtension(file.name);
        const fileItem = {
          localFilePath: file.path,
          selectedFileName: file.name, // 保存原始文件名
          originalFileName: file.name, // 额外保存原始文件名，确保不会丢失
          fileSize: file.size,
          fileExtension: extension,
          type: 'file',
          uploading: false,
          progress: 0,
          isExternal: false
        };
        
        if (index !== undefined) {
          localFiles.value[index] = fileItem;
        } else {
          localFiles.value.push(fileItem);
        }
      });
      
      emit('select', [...localFiles.value]);
    },
    fail: (err) => {
      console.error('选择文件失败:', err);
      uni.showToast({ title: '选择失败', icon: 'none' });
    }
  });
};

// 处理文件点击
const handleFile = (item) => {
  const url = item.previewUrl || item.url;
  if (url) {
    if (isH5.value) {
      handleFileH5(url, getDisplayFileName(item));
    } else {
      handleFileApp(url);
    }
  }
};

// H5处理文件
const handleFileH5 = (url, fileName) => {
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName || 'download';
  link.target = '_blank';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// APP处理文件
const handleFileApp = (url) => {
  uni.showActionSheet({
    itemList: ['下载文件'],
    success: () => {
      uni.downloadFile({
        url: url,
        success: (res) => {
          if (res.statusCode === 200) {
            uni.openDocument({
              filePath: res.tempFilePath,
              success: () => {
                console.log('打开文档成功');
              },
              fail: (err) => {
                uni.showToast({
                  title: '无法打开该文件',
                  icon: 'none'
                });
              }
            });
          }
        },
        fail: (err) => {
          uni.showToast({
            title: '下载失败',
            icon: 'none'
          });
        }
      });
    }
  });
};

// 删除文件
const removeFile = (index) => {
  const externalCount = externalFiles.value.length;
  if (index >= externalCount) {
    const localIndex = index - externalCount;
    localFiles.value.splice(localIndex, 1);
    emit('select', [...localFiles.value]);
  } else {
    uni.showToast({
      title: '外部文件不可删除',
      icon: 'none'
    });
  }
};

// 上传文件
const triggerUpload = async () => {
  if (localFiles.value.length === 0) {
    uni.showToast({ title: '请先选择文件', icon: 'none' });
    return [];
  }

  try {
    const uploadPromises = localFiles.value.map((file, index) => {
      if ((!file.localFilePath && !file._fileObject) || file.isExternal) {
        return Promise.resolve({ success: false, error: '无效文件', index });
      }

      file.uploading = true;
      file.progress = 0;

      if (isH5.value && file._fileObject) {
        return uploadFileH5(file, index);
      } else {
        return uploadFileApp(file, index);
      }
    });

    const results = await Promise.all(uploadPromises);
    emit('upload-complete', results);
    
    const successfulUploads = results.filter(r => r.success);
    const failedUploads = results.filter(r => !r.success);
    
    if (failedUploads.length > 0) {
      uni.showToast({ 
        title: `${failedUploads.length}个文件上传失败`, 
        icon: 'none',
        duration: 3000
      });
    } else if (successfulUploads.length > 0) {
      uni.showToast({ 
        title: `成功上传${successfulUploads.length}个文件`, 
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

// H5平台文件上传
const uploadFileH5 = (file, index) => {
  return new Promise((resolve) => {
    const formData = new FormData();
    formData.append('file', file._fileObject);
    formData.append('type', 'file');
    // 传递原始文件名给服务器
    formData.append('originalFileName', file.selectedFileName);

    const xhr = new XMLHttpRequest();
    
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const progress = (e.loaded / e.total) * 100;
        file.progress = Math.round(progress);
      }
    };

    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4) {
        file.uploading = false;
        
        if (xhr.status === 200) {
          try {
            const data = JSON.parse(xhr.responseText);
            if (data.success) {
              file.previewUrl = data.data.url;
              // 优先使用服务器返回的文件名，如果没有则使用原始文件名
              file.fileName = data.data.originalName || file.selectedFileName;
              emit('success', { file: file, index });
              resolve({ success: true, file: file, index });
            } else {
              const error = new Error(data.message || '上传失败');
              emit('fail', { error, index });
              resolve({ success: false, error, index });
            }
          } catch (e) {
            const error = new Error('响应解析失败');
            emit('fail', { error, index });
            resolve({ success: false, error, index });
          }
        } else {
          const error = new Error(`HTTP ${xhr.status}`);
          emit('fail', { error, index });
          resolve({ success: false, error, index });
        }
      }
    };

    xhr.onerror = () => {
      file.uploading = false;
      const error = new Error('网络错误');
      emit('fail', { error, index });
      resolve({ success: false, error, index });
    };

    xhr.open('POST', fullUploadUrl.value);
    xhr.send(formData);
  });
};

// APP平台文件上传
const uploadFileApp = (file, index) => {
  return uploadFilePromise({
    url: fullUploadUrl.value,
    filePath: file.localFilePath,
    name: 'file',
    formData: { 
      type: 'file',
      originalFileName: file.selectedFileName // 传递原始文件名给服务器
    },
    onProgress: (res) => {
      file.progress = res.progress;
    }
  }).then(res => {
    file.uploading = false;
    
    if (res.statusCode === 200) {
      const data = JSON.parse(res.data);
      if (data.success) {
        file.previewUrl = data.data.url;
        // 优先使用服务器返回的文件名，如果没有则使用原始文件名
        file.fileName = data.data.originalName || file.selectedFileName;
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
};

// 清空外部文件
const clearExternalFiles = () => {
  externalFiles.value = [];
};

// 获取所有文件
const getAllFiles = () => {
  return [...displayFiles.value];
};

// 获取所有文件URL
const getAllFileUrls = () => {
  return displayFiles.value
    .map(file => file.previewUrl || file.url)
    .filter(url => url);
};

// 获取所有文件的原始文件名和URL
const getAllFilesWithNames = () => {
  return displayFiles.value.map(file => ({
    url: file.previewUrl || file.url,
    fileName: getDisplayFileName(file),
    fileSize: file.fileSize,
    fileExtension: file.fileExtension
  }));
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
  setPreviewFiles,
  clearExternalFiles,
  getAllFiles,
  getAllFileUrls,
  getAllFilesWithNames // 新增：获取带文件名的完整文件信息
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
  height: 180rpx;
  position: relative;
  border-radius: 12rpx;
  overflow: hidden;
  background: #f8f8f8;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding: 10rpx;
  box-sizing: border-box;
}

.file-icon-container {
  width: 80rpx;
  height: 80rpx;
  margin-top: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.file-icon {
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
  width: 100%;
  font-size: 20rpx;
  text-align: center;
  margin-top: 10rpx;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-size {
  width: 100%;
  font-size: 18rpx;
  color: #999;
  text-align: center;
  margin-top: 4rpx;
}

.upload-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 8rpx;
  background: rgba(255, 255, 255, 0.9);
}

.progress-bar {
  height: 6rpx;
  background: #e0e0e0;
  border-radius: 3rpx;
  overflow: hidden;
  margin-bottom: 4rpx;
}

.progress-fill {
  height: 100%;
  background: #4CAF50;
  border-radius: 3rpx;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 18rpx;
  color: #666;
  text-align: center;
  display: block;
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
 
  margin-bottom: 8rpx;
}

.text {
  font-size: 24rpx;
  color: #666;
  text-align: center;
}

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

/* H5平台悬停效果 */
.h5-hover:hover {
  transform: translateY(-2rpx);
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}
</style>