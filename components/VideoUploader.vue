<template>
  <view class="video-uploader">
    <!-- 多视频预览 -->
    <view v-if="videos.length > 0" class="preview-list">
      <view v-for="(item, index) in videos" :key="index" class="preview-item">
        <video
          :src="item.tempPath"
          controls
          style="width: 100%; height: 150px; background: #000;"
        />
        <button @click="removeVideo(index)" size="mini" type="warn">删除</button>
        <text v-if="item.uploadedUrl" class="url-text">{{ item.uploadedUrl }}</text>
        <progress
          v-if="item.uploading && item.progress > 0"
          :percent="item.progress"
          stroke-width="4"
          active
        />
        <text v-if="item.error" class="error-inline">{{ item.error }}</text>
      </view>
    </view>

    <button
      :disabled="globalUploading"
      @click="chooseAndUploadOne"
      type="primary"
      style="margin-top: 16rpx;"
    >
      {{ globalUploading ? '上传中...' : '添加视频' }}
    </button>

    <text v-if="globalError" class="error">{{ globalError }}</text>
  </view>
</template>

<script setup>
import { ref } from 'vue';

const UPLOAD_URL = 'http://192.168.215.185:8081/api/upload';

const props = defineProps({
  formData: { type: Object, default: () => ({}) },
  maxDuration: { type: Number, default: 60 },
  compressed: { type: Boolean, default: false },
  maxSize: { type: Number, default: 100 * 1024 * 1024 }, // 100MB
  maxCount: { type: Number, default: 5 },
});

const emit = defineEmits(['success', 'error', 'progress', 'all-success']);

const videos = ref([]); // 所有已选视频
const globalUploading = ref(false);
const globalError = ref('');

// 标准化 URL 提取
const getUrlFromResponse = (responseData) => {
  if (typeof responseData === 'string') {
    const trimmed = responseData.trim();
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
  }
  const candidates = [
    responseData?.url,
    responseData?.data?.url,
    responseData?.path,
    responseData?.fileUrl,
  ];
  for (const c of candidates) {
    if (typeof c === 'string' && /^https?:\/\//i.test(c)) return c;
  }
  return null;
};

const removeVideo = (index) => {
  videos.value.splice(index, 1);
};

const clearAll = () => {
  videos.value = [];
  globalError.value = '';
};

// 上传单个视频项
const uploadSingle = (item) => {
  return new Promise((resolve, reject) => {
    item.uploading = true;
    item.progress = 0;
    item.error = '';

    const task = uni.uploadFile({
      url: UPLOAD_URL,
      filePath: item.tempPath,
      name: 'file',
      formData: props.formData,
      success: (res) => {
        let data;
        try {
          data = JSON.parse(res.data);
        } catch {
          data = res.data;
        }

        if (res.statusCode === 200) {
          const url = getUrlFromResponse(data);
          item.uploadedUrl = url;
          resolve({ url, raw: data });
        } else {
          const msg = data?.message || '上传失败';
          item.error = msg;
          reject(new Error(msg));
        }
      },
      fail: (err) => {
        item.error = '上传失败';
        reject(err);
      },
      complete: () => {
        item.uploading = false;
      },
    });

    task?.onProgressUpdate?.((e) => {
      if (e.totalBytesExpectedToSend > 0) {
        item.progress = Math.min(100, Math.round((e.totalBytesSent / e.totalBytesExpectedToSend) * 100));
        emit('progress', { ...e, file: item });
      }
    });
  });
};

// 选择并上传一个视频
const chooseAndUploadOne = async () => {
  if (videos.value.length >= props.maxCount) {
    globalError.value = `最多只能上传 ${props.maxCount} 个视频`;
    return;
  }

  try {
    const res = await new Promise((resolve, reject) => {
      uni.chooseVideo({
        sourceType: ['album', 'camera'],
        compressed: props.compressed,
        maxDuration: props.maxDuration,
        success: resolve,
        fail: reject,
      });
    });

    const { tempFilePath, size } = res;
    if (!tempFilePath) throw new Error('未选择视频');

    if (size && size > props.maxSize) {
      globalError.value = `视频不能超过 ${(props.maxSize / 1024 / 1024).toFixed(0)}MB`;
      return;
    }

    const newItem = {
      tempPath: tempFilePath,
      size,
      uploading: false,
      progress: 0,
      uploadedUrl: '',
      error: '',
    };

    videos.value.push(newItem);

    // 上传这个新视频
    globalUploading.value = true;
    try {
      const result = await uploadSingle(newItem);
      emit('success', result, newItem);
    } catch (err) {
      emit('error', err);
    } finally {
      globalUploading.value = false;
    }
  } catch (err) {
    console.error('选择视频失败:', err);
    if (!err.errMsg?.includes('cancel')) {
      globalError.value = '选择视频失败，请重试';
      emit('error', err);
    }
  }
};

// 暴露方法
defineExpose({
  getUploadedUrls: () => videos.value.map(v => v.uploadedUrl).filter(Boolean),
  getAllVideos: () => videos.value,
  clear: clearAll,
});
</script>

<style scoped>
.video-uploader {
  padding: 20rpx;
}
.preview-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  margin-bottom: 20rpx;
}
.preview-item {
  border: 1px solid #eee;
  border-radius: 8rpx;
  padding: 10rpx;
}
.url-text {
  font-size: 20rpx;
  color: #1890ff;
  display: block;
  margin-top: 6rpx;
  word-break: break-all;
}
.error-inline {
  color: #ff4d4f;
  font-size: 20rpx;
  display: block;
  margin-top: 4rpx;
}
.error {
  color: #ff4d4f;
  font-size: 24rpx;
  margin-top: 10rpx;
  display: block;
}
</style>