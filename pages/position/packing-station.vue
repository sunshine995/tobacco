<template>
  <view class="container">
    <view class="form-container">
      <!-- 顶部卡片区域 -->
      <view class="header-card">
        <WorkOrderInfoCard :order-info="myOrder" />
      </view>
      <!-- 表单区域 -->
      <view class="form-group">
        <!-- 牌号+批次号照片 -->
        <view class="form-row">
          <label class="form-label">牌号+批次号照片</label>
          <upload-image 
            ref="brandBatchPhotoRef"
            :max-count="1"
            title="牌号+批次号照片"
            @select="onImageSelect('brandBatchPhoto', $event)"
            @success="onImageUploadSuccess('brandBatchPhoto', $event)"
            @fail="onImageUploadFail('brandBatchPhoto', $event)"
          />
          <view class="photo-tip">提示：拍摄显示牌号和批次号</view>
        </view>

        <!-- 进巷道的照片 -->
        <view class="form-row">
          <label class="form-label">进巷道的照片</label>
          <upload-image 
            ref="tunnelPhotoRef"
            :max-count="1"
            title="进巷道的照片"
            @select="onImageSelect('tunnelPhoto', $event)"
            @success="onImageUploadSuccess('tunnelPhoto', $event)"
            @fail="onImageUploadFail('tunnelPhoto', $event)"
          />
          <view class="photo-tip">提示：拍摄物料进入巷道的状态</view>
        </view>

        <!-- 高速带照片1 -->
        <view class="form-row">
          <label class="form-label">高速带照片</label>
          <upload-image 
            ref="highSpeedBelt1PhotoRef"
            :max-count="2"
            title="高速带照片"
            @select="onImageSelect('highSpeedBelt1Photo', $event)"
            @success="onImageUploadSuccess('highSpeedBelt1Photo', $event)"
            @fail="onImageUploadFail('highSpeedBelt1Photo', $event)"
          />
          <view class="photo-tip">提示：拍摄高速带运行状态</view>
        </view>

        <!-- 清扫站烟丝公斤数 -->
        <view class="form-row">
          <label class="form-label">清扫站烟丝公斤数 (kg)</label>
          <input type="number" step="0.1" v-model.number="formData.cleaningStationWeight" class="form-input" placeholder="请输入清扫站烟丝公斤数">
        </view>

        <!-- 装箱数量 -->
        <view class="form-row">
          <label class="form-label">装箱数量</label>
          <input type="number" step="0.1" v-model.number="formData.packagingQuantity" class="form-input" placeholder="请输入装箱数量">
        </view>

        <!-- 提交验证按钮 -->
        <button type="button" class="submit-btn" 
                @click="submitToDatabase" 
                :loading="submitting" 
                :disabled="submitting">
          {{ submitting ? '提交中...' : '提交验证' }}
        </button>
        <view class="save-status" v-if="saveStatus">
          <text class="status-icon" :class="saveStatus === 'success' ? 'success' : 'error'">{{ saveStatus === 'success' ? '✓' : '✗' }}</text>
          <text class="status-text">{{ saveStatus === 'success' ? '已提交数据库' : '提交失败' }}</text>
        </view>
      </view>
      
      <!-- 三级验证按钮 -->
      <VerifyButton 
        buttonText="三级验证" 
        :batchId="myOrder.batchNo" 
        :brand="myOrder.brand" 
        segment="装箱站" 
        :dataCount="1" 
        @success="handleVerifySuccess" 
        @fail="handleVerifyFail" 
        @validate="handleValidate" 
      />
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue';
import { onLoad, onUnload } from '@dcloudio/uni-app';
import WorkOrderInfoCard from '@/components/orderInfo.vue';
import UploadImage from '@/components/UploadImage.vue';
import VerifyButton from '@/components/VerifyButton.vue';
import { submitMaterialCheck, byBatchIdAndSegment } from '@/api/production.js';

// 表单数据
const formData = ref({
  cleaningStationWeight: '',
  packagingQuantity: '',
  images: {
    brandBatchPhoto: [],
    tunnelPhoto: [],
    highSpeedBelt1Photo: []
  }
});

// 订单信息响应式对象
const myOrder = ref({
  id: '',
  batchNo: '',
  brand: '',
  number: ''
});

// 上传组件的ref
const brandBatchPhotoRef = ref(null);
const tunnelPhotoRef = ref(null);
const highSpeedBelt1PhotoRef = ref(null);

// 提交状态
const submitting = ref(false);
const saveStatus = ref('');

// 从全局状态获取工单信息
const getDataFromGlobal = () => {
  try {
    const app = getApp();
    if (app?.globalData?.currentOrder) {
      myOrder.value = {
        id: app.globalData.currentOrder.id || '',
        batchNo: app.globalData.currentOrder.batchNo || '',
        brand: app.globalData.currentOrder.brand || '',
        number: app.globalData.currentOrder.number || ''
      };
      return true;
    }
  } catch (e) {
    console.error('全局状态获取失败:', e);
  }
  return false;
};

// 页面加载时初始化
onLoad((options) => {
  console.log('接收的URL参数:', options);
  
  // 从URL参数获取工单信息
  let hasValidParams = false;
  if (options && (options.id || options.batchNo || options.brand)) {
    myOrder.value = {
      id: options.id ? decodeURIComponent(options.id) : '',
      batchNo: options.batchNo ? decodeURIComponent(options.batchNo) : '',
      brand: options.brand ? decodeURIComponent(options.brand) : '',
      number: options.number ? decodeURIComponent(options.number) : ''
    };
    hasValidParams = !!myOrder.value.batchNo;
  }
  
  // 补充全局状态数据
  if (!hasValidParams) {
    getDataFromGlobal();
  }
  
  // 加载历史记录
  if (myOrder.value.batchNo) {
    loadExistingRecord(myOrder.value.batchNo);
  } else {
    console.error('未获取到有效的工单信息');
  }
});

// 加载历史记录
const loadExistingRecord = async (batchNo) => {
  if (!batchNo) return;
  
  try {
    const res = await byBatchIdAndSegment(batchNo, "装箱站");
    if (res) {
      let verificationResult = res.verificationResult || {};
      if (typeof verificationResult === 'string') {
        verificationResult = JSON.parse(verificationResult);
      }
      
      // 回显表单数据
      formData.value.cleaningStationWeight = verificationResult.cleaningStationWeight || '';
      formData.value.packagingQuantity = verificationResult.packagingQuantity || '';
      
      // 回显图片
      const images = verificationResult.images || {};
      await nextTick();
      
      if (images.brandBatchPhoto && images.brandBatchPhoto.length && brandBatchPhotoRef.value) {
        brandBatchPhotoRef.value.setPreviewImages(images.brandBatchPhoto);
      }
      if (images.tunnelPhoto && images.tunnelPhoto.length && tunnelPhotoRef.value) {
        tunnelPhotoRef.value.setPreviewImages(images.tunnelPhoto);
      }
      if (images.highSpeedBelt1Photo && images.highSpeedBelt1Photo.length && highSpeedBelt1PhotoRef.value) {
        highSpeedBelt1PhotoRef.value.setPreviewImages(images.highSpeedBelt1Photo);
      }
    }
  } catch (error) {
    console.error('历史记录加载失败:', error);
  }
};

// 图片选择事件
const onImageSelect = (type, files) => {
  console.log(`${type} 选择图片:`, files);
  if (!formData.value.images[type]) {
    formData.value.images[type] = [];
  }
  files.forEach(file => {
    formData.value.images[type].push({
      localFilePath: file.localFilePath,
      url: '',
      uploaded: false
    });
  });
};

// 图片上传成功事件
const onImageUploadSuccess = (type, result) => {
  console.log(`${type} 上传成功:`, result);
  if (result.file && result.file.previewUrl) {
    const index = formData.value.images[type].findIndex(
      f => f.localFilePath === result.file.localFilePath
    );
    if (index !== -1) {
      formData.value.images[type][index].url = result.file.previewUrl;
      formData.value.images[type][index].uploaded = true;
    }
  }
  showToastMessage('图片上传成功');
};

// 图片上传失败事件
const onImageUploadFail = (type, event) => {
  console.error(`${type}图片上传失败:`, event);
  showToastMessage('图片上传失败', 'error');
};

// 提示消息
const showToastMessage = (message, type = 'success') => {
  try {
    let icon = 'success';
    if (type === 'error') icon = 'error';
    else if (type === 'warning') icon = 'warn';
    
    uni.showToast({
      title: message,
      icon: icon,
      duration: 2000
    });
  } catch (e) {
    console.warn('Toast提示失败:', e);
  }
};

// 提交到数据库
const submitToDatabase = async () => {
  // 验证必填项
  if (!formData.value.cleaningStationWeight) {
    showToastMessage('请输入清扫站烟丝公斤数', 'error');
    return;
  }
  if (!formData.value.packagingQuantity) {
    showToastMessage('请输入装箱数量', 'error');
    return;
  }
  
  submitting.value = true;
  saveStatus.value = '';
  
  try {
    // 触发图片上传
    const uploadPromises = [];
    
    if (brandBatchPhotoRef.value && brandBatchPhotoRef.value.getFiles && brandBatchPhotoRef.value.getFiles().length > 0) {
      uploadPromises.push(brandBatchPhotoRef.value.triggerUpload());
    }
    if (tunnelPhotoRef.value && tunnelPhotoRef.value.getFiles && tunnelPhotoRef.value.getFiles().length > 0) {
      uploadPromises.push(tunnelPhotoRef.value.triggerUpload());
    }
    if (highSpeedBelt1PhotoRef.value && highSpeedBelt1PhotoRef.value.getFiles && highSpeedBelt1PhotoRef.value.getFiles().length > 0) {
      uploadPromises.push(highSpeedBelt1PhotoRef.value.triggerUpload());
    }
    
    if (uploadPromises.length > 0) {
      await Promise.all(uploadPromises);
    }
    
    // 收集图片URL
    const images = {
      brandBatchPhoto: brandBatchPhotoRef.value?.getAllImageUrls() || [],
      tunnelPhoto: tunnelPhotoRef.value?.getAllImageUrls() || [],
      highSpeedBelt1Photo: highSpeedBelt1PhotoRef.value?.getAllImageUrls() || []
    };
    
    // 构建提交数据
    const verificationResult = {
      cleaningStationWeight: parseFloat(formData.value.cleaningStationWeight),
      packagingQuantity: parseFloat(formData.value.packagingQuantity),
      images: images
    };
    
    const submitData = {
      batchId: myOrder.value.batchNo,
      brand: myOrder.value.brand,
      segment: "装箱站",
      verificationResult: verificationResult,
      dataCount: 1,
      operatorId: uni.getStorageSync('userId') || ''
    };
    
    // 确保至少有一个方式获取品牌信息
    if (!submitData.brand || !submitData.brand.trim()) {
      showToastMessage('未获取到物料牌号信息，请确认工单信息是否正确', 'error');
      return;
    }
    
    console.log('提交的表单数据:', submitData);
    
    // 调用API提交数据到服务器
    await submitMaterialCheck(submitData);
    
    showToastMessage('装箱站信息已上传到数据库');
    saveStatus.value = 'success';
  } catch (error) {
    console.error('上传失败:', error);
    saveStatus.value = 'error';
    showToastMessage('上传失败，请重试', 'error');
  } finally {
    submitting.value = false;
  }
};

// 三级验证成功回调
const handleVerifySuccess = () => {
  showToastMessage('三级验证成功');
};

// 三级验证失败回调
const handleVerifyFail = () => {
  showToastMessage('三级验证失败', 'error');
};

// 三级验证前的校验
const handleValidate = () => {
  // 检查是否已提交
  if (saveStatus.value !== 'success') {
    showToastMessage('请先完成装箱站信息的提交验证', 'error');
    return false;
  }
  return true;
};
</script>

<style scoped>
.container {
  padding: 20rpx;
  background-color: #f5f5f5;
  min-height: 100vh;
  overflow-x: hidden;
  box-sizing: border-box;
}

.form-container {
  max-width: 1200rpx;
  margin: 0 auto;
}

.header-card {
  background-color: #fff;
  border-radius: 16rpx;
  padding: 20rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
}

.content-section {
  background-color: #fff;
  border-radius: 16rpx;
  padding: 40rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
}

.page-title {
  font-size: 36rpx;
  font-weight: 600;
  color: #333;
  text-align: center;
  display: block;
}

.form-group {
  background-color: #fff;
  border-radius: 16rpx;
  padding: 20rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
}

.form-row {
  margin-bottom: 30rpx;
}

.form-label {
  display: block;
  font-size: 28rpx;
  font-weight: 500;
  color: #333;
  margin-bottom: 10rpx;
}

.form-input {
  width: 100%;
  height: 80rpx;
  padding: 0 20rpx;
  border: 2rpx solid #e0e0e0;
  border-radius: 10rpx;
  font-size: 28rpx;
  box-sizing: border-box;
}

.photo-tip {
  font-size: 24rpx;
  color: #666;
  margin-top: 10rpx;
}

.submit-btn {
  width: 100%;
  height: 80rpx;
  background-color: #007aff;
  color: #fff;
  border: none;
  border-radius: 10rpx;
  font-size: 28rpx;
  font-weight: 500;
  margin-bottom: 20rpx;
}

.save-status {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 10rpx;
}

.status-icon {
  font-size: 28rpx;
  margin-right: 10rpx;
}

.status-icon.success {
  color: #07c160;
}

.status-icon.error {
  color: #ee0a24;
}

.status-text {
  font-size: 24rpx;
  color: #666;
}
</style>