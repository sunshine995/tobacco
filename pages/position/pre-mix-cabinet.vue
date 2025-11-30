<template>
  <view class="container">
    <!-- 顶部卡片区域 -->
    <view class="header-card">
      <WorkOrderInfoCard :order-info="myOrder" />
    </view>
    
    <!-- 页面内容 -->
    <view class="content-section">
      <!-- 进柜验证区域 -->
      <view class="section-title">进柜验证</view>
      
      <!-- 牌号+批次号拍照 -->
      <view class="verify-section">
        <text class="upload-title">牌号+批次号拍照</text>
        <upload-image
          ref="brandBatchPhotoRef"
          :max-count="1"
          title="上传牌号+批次号照片"
        />
      </view>
      
      <!-- 进柜料头照片 -->
      <view class="verify-section">
        <text class="upload-title">料头照片</text>
        <upload-image
          ref="inCabinetHeadPhotoRef"
          :max-count="2"
          title="上传料头验证照片"
        />
      </view>
      
      <!-- 进柜料中照片 -->
      <view class="verify-section">
        <text class="upload-title">料中照片</text>
        <upload-image
          ref="inCabinetMiddlePhotoRef"
          :max-count="2"
          title="上传料中验证照片"
        />
      </view>
      
      <!-- 进柜料尾照片 -->
      <view class="verify-section">
        <text class="upload-title">料尾照片</text>
        <upload-image
          ref="inCabinetTailPhotoRef"
          :max-count="2"
          title="上传料尾验证照片"
        />
      </view>
      
      <!-- 提交按钮 -->
      <view class="submit-btn" @click="handleSubmit('inCabinet')" :disabled="submitting">
        <text>{{ submitting ? '提交中...' : '提交进柜验证' }}</text>
      </view>
      
      <!-- 出柜验证区域 -->
      <view class="section-title">出柜验证</view>
      
      <!-- 出柜料头照片 -->
      <view class="verify-section">
        <text class="upload-title">料头照片</text>
        <upload-image
          ref="outCabinetHeadPhotoRef"
          :max-count="2"
          title="上传料头验证照片"
        />
      </view>
      
      <!-- 出柜料尾照片 -->
      <view class="verify-section">
        <text class="upload-title">料尾照片</text>
        <upload-image
          ref="outCabinetTailPhotoRef"
          :max-count="2"
          title="上传料尾验证照片"
        />
      </view>
      
      <!-- 提交按钮 -->
      <view class="submit-btn" @click="handleSubmit('outCabinet')" :disabled="submitting">
        <text>{{ submitting ? '提交中...' : '提交出柜验证' }}</text>
      </view>
      
      <!-- 三级验证区域 -->
      <view class="verify-section">
        <verify-button
          button-text="三级验证"
          :batch-id="myOrder.batchNo"
          :brand="myOrder.brand"
          segment="预混柜"
          :data-count="totalImageCount"
          @success="handleVerifySuccess"
          @fail="handleVerifyFail"
          @validate="handleValidate"
        />
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, nextTick, computed } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import WorkOrderInfoCard from '@/components/orderInfo.vue';
import UploadImage from '@/components/UploadImage.vue';
import VerifyButton from '@/components/VerifyButton.vue';
import { submitMaterialCheck, byBatchIdAndSegment } from '@/api/production.js';

// refs
const brandBatchPhotoRef = ref(null);
const inCabinetHeadPhotoRef = ref(null);
const inCabinetMiddlePhotoRef = ref(null);
const inCabinetTailPhotoRef = ref(null);
const outCabinetHeadPhotoRef = ref(null);
const outCabinetTailPhotoRef = ref(null);

// 订单信息响应式对象
const myOrder = ref({
  id: '',
  batchNo: '',
  brand: ''
});

// 状态变量
const submitting = ref(false);
const brandBatchUrls = ref([]);
const inCabinetHeadUrls = ref([]);
const inCabinetMiddleUrls = ref([]);
const inCabinetTailUrls = ref([]);
const outCabinetHeadUrls = ref([]);
const outCabinetTailUrls = ref([]);

// 存储完整的历史提交数据（包含进柜和出柜所有信息）
const fullHistoryData = ref({
  verificationResult: {
    inCabinet: {
      brandBatchImages: [],
      headImages: [],
      middleImages: [],
      tailImages: []
    },
    outCabinet: {
      headImages: [],
      tailImages: []
    },
    images: []
  }
});

// 计算总图片数量（基于完整历史数据）
const totalImageCount = computed(() => {
  return fullHistoryData.value.verificationResult.images.length;
});

// 从全局状态获取工单信息
const getDataFromGlobal = () => {
  try {
    const app = getApp();
    if (app?.globalData?.currentOrder) {
      myOrder.value = {
        id: app.globalData.currentOrder.id || '',
        batchNo: app.globalData.currentOrder.batchNo || '',
        brand: app.globalData.currentOrder.brand || ''
      };
      return true;
    }
  } catch (e) {
    console.error('全局状态获取失败:', e);
  }
  return false;
};

// 加载已有记录（回显+初始化完整历史数据）
const loadExistingRecord = async (batchNo) => {
  try {
    const record = await byBatchIdAndSegment(batchNo, '预混柜');
    console.log('加载历史记录:', record);
    
    // 初始化完整历史数据（如果有历史记录则使用历史数据，否则使用默认空结构）
    if (record && record.verificationResult) {
      fullHistoryData.value = { ...record };
      // 补全可能缺失的字段结构
      fullHistoryData.value.verificationResult.inCabinet = fullHistoryData.value.verificationResult.inCabinet || {
        brandBatchImages: [],
        headImages: [],
        middleImages: [],
        tailImages: []
      };
      fullHistoryData.value.verificationResult.outCabinet = fullHistoryData.value.verificationResult.outCabinet || {
        headImages: [],
        tailImages: []
      };
      fullHistoryData.value.verificationResult.images = fullHistoryData.value.verificationResult.images || [];
    }
    
    // 回显所有图片（基于完整历史数据）
    await nextTick();
    
    // 进柜相关图片回显
    if (fullHistoryData.value.verificationResult.inCabinet.brandBatchImages.length) {
      brandBatchPhotoRef.value?.setPreviewImages(fullHistoryData.value.verificationResult.inCabinet.brandBatchImages);
      brandBatchUrls.value = [...fullHistoryData.value.verificationResult.inCabinet.brandBatchImages];
    }
    if (fullHistoryData.value.verificationResult.inCabinet.headImages.length) {
      inCabinetHeadPhotoRef.value?.setPreviewImages(fullHistoryData.value.verificationResult.inCabinet.headImages);
      inCabinetHeadUrls.value = [...fullHistoryData.value.verificationResult.inCabinet.headImages];
    }
    if (fullHistoryData.value.verificationResult.inCabinet.middleImages.length) {
      inCabinetMiddlePhotoRef.value?.setPreviewImages(fullHistoryData.value.verificationResult.inCabinet.middleImages);
      inCabinetMiddleUrls.value = [...fullHistoryData.value.verificationResult.inCabinet.middleImages];
    }
    if (fullHistoryData.value.verificationResult.inCabinet.tailImages.length) {
      inCabinetTailPhotoRef.value?.setPreviewImages(fullHistoryData.value.verificationResult.inCabinet.tailImages);
      inCabinetTailUrls.value = [...fullHistoryData.value.verificationResult.inCabinet.tailImages];
    }
    
    // 出柜相关图片回显
    if (fullHistoryData.value.verificationResult.outCabinet.headImages.length) {
      outCabinetHeadPhotoRef.value?.setPreviewImages(fullHistoryData.value.verificationResult.outCabinet.headImages);
      outCabinetHeadUrls.value = [...fullHistoryData.value.verificationResult.outCabinet.headImages];
    }
    if (fullHistoryData.value.verificationResult.outCabinet.tailImages.length) {
      outCabinetTailPhotoRef.value?.setPreviewImages(fullHistoryData.value.verificationResult.outCabinet.tailImages);
      outCabinetTailUrls.value = [...fullHistoryData.value.verificationResult.outCabinet.tailImages];
    }
    
    console.log('历史记录加载完成，完整数据:', fullHistoryData.value);
  } catch (err) {
    console.warn('加载历史记录失败', err);
    // 加载失败时使用默认空结构
    fullHistoryData.value = {
      verificationResult: {
        inCabinet: {
          brandBatchImages: [],
          headImages: [],
          middleImages: [],
          tailImages: []
        },
        outCabinet: {
          headImages: [],
          tailImages: []
        },
        images: []
      }
    };
  }
};

// 页面加载时初始化
onLoad((options) => {
  console.log('接收的URL参数:', options);
  if (options && (options.id || options.batchNo || options.brand)) {
    myOrder.value = {
      id: options.id ? decodeURIComponent(options.id) : '',
      batchNo: options.batchNo ? decodeURIComponent(options.batchNo) : '',
      brand: options.brand ? decodeURIComponent(options.brand) : ''
    };
    console.log('通过URL参数设置的工单信息:', myOrder.value);
    
    if (!myOrder.value.id || !myOrder.value.batchNo || !myOrder.value.brand) {
      const globalDataSuccess = getDataFromGlobal();
      console.log('从全局状态补充工单信息结果:', globalDataSuccess);
    }
  } else {
    getDataFromGlobal();
  }
  
  // 尝试加载历史记录（包含所有进柜/出柜数据）
  if (myOrder.value.batchNo) {
    loadExistingRecord(myOrder.value.batchNo);
  }
});

// 合并所有图片为一个数组（去重处理）
const mergeAllImages = (inCabinetData, outCabinetData) => {
  const allImages = [
    ...(inCabinetData.brandBatchImages || []),
    ...(inCabinetData.headImages || []),
    ...(inCabinetData.middleImages || []),
    ...(inCabinetData.tailImages || []),
    ...(outCabinetData.headImages || []),
    ...(outCabinetData.tailImages || [])
  ];
  // 去重（避免重复图片URL）
  return [...new Set(allImages)];
};

// 提交
const handleSubmit = async (cabinetType) => {
  if (submitting.value) return;
  
  // 获取当前选择的文件
  const brandBatchFiles = brandBatchPhotoRef.value?.getFiles() || [];
  const inCabinetHeadFiles = inCabinetHeadPhotoRef.value?.getFiles() || [];
  const inCabinetMiddleFiles = inCabinetMiddlePhotoRef.value?.getFiles() || [];
  const inCabinetTailFiles = inCabinetTailPhotoRef.value?.getFiles() || [];
  const outCabinetHeadFiles = outCabinetHeadPhotoRef.value?.getFiles() || [];
  const outCabinetTailFiles = outCabinetTailPhotoRef.value?.getFiles() || [];
  
  // 验证当前提交类型的必填项
  if (cabinetType === 'inCabinet') {
    if (brandBatchFiles.length === 0 && fullHistoryData.value.verificationResult.inCabinet.brandBatchImages.length === 0) {
      uni.showToast({ title: '请上传牌号+批次号照片', icon: 'none' });
      return;
    }
    if (inCabinetHeadFiles.length === 0 && fullHistoryData.value.verificationResult.inCabinet.headImages.length === 0) {
      uni.showToast({ title: '请上传进柜料头照片', icon: 'none' });
      return;
    }
    if (inCabinetMiddleFiles.length === 0 && fullHistoryData.value.verificationResult.inCabinet.middleImages.length === 0) {
      uni.showToast({ title: '请上传进柜料中照片', icon: 'none' });
      return;
    }
    if (inCabinetTailFiles.length === 0 && fullHistoryData.value.verificationResult.inCabinet.tailImages.length === 0) {
      uni.showToast({ title: '请上传进柜料尾照片', icon: 'none' });
      return;
    }
  } else if (cabinetType === 'outCabinet') {
    if (outCabinetHeadFiles.length === 0 && fullHistoryData.value.verificationResult.outCabinet.headImages.length === 0) {
      uni.showToast({ title: '请上传出柜料头照片', icon: 'none' });
      return;
    }
    if (outCabinetTailFiles.length === 0 && fullHistoryData.value.verificationResult.outCabinet.tailImages.length === 0) {
      uni.showToast({ title: '请上传出柜料尾照片', icon: 'none' });
      return;
    }
  }
  
  submitting.value = true;
  try {
    // 上传当前提交类型的图片（只上传有变更的图片）
    if (cabinetType === 'inCabinet') {
      // 上传进柜相关图片
      if (brandBatchFiles.length > 0) {
        await brandBatchPhotoRef.value?.triggerUpload();
        brandBatchUrls.value = brandBatchPhotoRef.value?.getUploadedUrls() || [];
      }
      if (inCabinetHeadFiles.length > 0) {
        await inCabinetHeadPhotoRef.value?.triggerUpload();
        inCabinetHeadUrls.value = inCabinetHeadPhotoRef.value?.getUploadedUrls() || [];
      }
      if (inCabinetMiddleFiles.length > 0) {
        await inCabinetMiddlePhotoRef.value?.triggerUpload();
        inCabinetMiddleUrls.value = inCabinetMiddlePhotoRef.value?.getUploadedUrls() || [];
      }
      if (inCabinetTailFiles.length > 0) {
        await inCabinetTailPhotoRef.value?.triggerUpload();
        inCabinetTailUrls.value = inCabinetTailPhotoRef.value?.getUploadedUrls() || [];
      }
    } else if (cabinetType === 'outCabinet') {
      // 上传出柜相关图片
      if (outCabinetHeadFiles.length > 0) {
        await outCabinetHeadPhotoRef.value?.triggerUpload();
        outCabinetHeadUrls.value = outCabinetHeadPhotoRef.value?.getUploadedUrls() || [];
      }
      if (outCabinetTailFiles.length > 0) {
        await outCabinetTailPhotoRef.value?.triggerUpload();
        outCabinetTailUrls.value = outCabinetTailPhotoRef.value?.getUploadedUrls() || [];
      }
    }
    
    // 构造当前提交的部分数据
    const currentInCabinetData = cabinetType === 'inCabinet' ? {
      brandBatchImages: brandBatchUrls.value.length > 0 ? brandBatchUrls.value : fullHistoryData.value.verificationResult.inCabinet.brandBatchImages,
      headImages: inCabinetHeadUrls.value.length > 0 ? inCabinetHeadUrls.value : fullHistoryData.value.verificationResult.inCabinet.headImages,
      middleImages: inCabinetMiddleUrls.value.length > 0 ? inCabinetMiddleUrls.value : fullHistoryData.value.verificationResult.inCabinet.middleImages,
      tailImages: inCabinetTailUrls.value.length > 0 ? inCabinetTailUrls.value : fullHistoryData.value.verificationResult.inCabinet.tailImages
    } : fullHistoryData.value.verificationResult.inCabinet;
    
    const currentOutCabinetData = cabinetType === 'outCabinet' ? {
      headImages: outCabinetHeadUrls.value.length > 0 ? outCabinetHeadUrls.value : fullHistoryData.value.verificationResult.outCabinet.headImages,
      tailImages: outCabinetTailUrls.value.length > 0 ? outCabinetTailUrls.value : fullHistoryData.value.verificationResult.outCabinet.tailImages
    } : fullHistoryData.value.verificationResult.outCabinet;
    
    // 构造完整的提交数据（合并历史数据和当前数据）
    const verificationResult = {
      inCabinet: currentInCabinetData,
      outCabinet: currentOutCabinetData,
      images: mergeAllImages(currentInCabinetData, currentOutCabinetData) // 合并所有图片
    };
    
    // 完整的提交数据（包含所有历史信息）
    const submitData = {
      batchId: myOrder.value.batchNo,
      brand: myOrder.value.brand,
      segment: '预混柜',
      verificationResult,
      dataCount: verificationResult.images.length,
      operatorId: uni.getStorageSync('userId') || 'unknown',
      // 保留历史数据中的其他字段（如果有）
      ...(fullHistoryData.value.batchId ? { batchId: fullHistoryData.value.batchId } : {}),
      ...(fullHistoryData.value.brand ? { brand: fullHistoryData.value.brand } : {})
    };
    
    console.log('提交完整数据（包含历史记录）:', submitData);
    await submitMaterialCheck(submitData);
    
    // 更新本地完整历史数据（同步为最新提交的数据）
    fullHistoryData.value = {
      ...fullHistoryData.value,
      ...submitData
    };
    
    uni.showToast({ 
      title: cabinetType === 'inCabinet' ? '进柜验证提交成功' : '出柜验证提交成功', 
      icon: 'success' 
    });
  } catch (error) {
    console.error('提交失败:', error);
    uni.showToast({ title: error.message || '提交失败，请重试', icon: 'none' });
  } finally {
    submitting.value = false;
  }
};

// 处理验证成功
const handleVerifySuccess = (result) => {
  console.log('验证成功:', result);
  uni.showToast({
    title: '验证成功',
    icon: 'success'
  });
};

// 处理验证失败
const handleVerifyFail = (error) => {
  console.error('验证失败:', error);
  uni.showToast({
    title: error.message || '验证失败',
    icon: 'none'
  });
};

// 处理验证
const handleValidate = (status) => {
  console.log('验证状态:', status);
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
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
}

.page-title {
  font-size: 36rpx;
  font-weight: 600;
  color: #333;
  text-align: center;
  display: block;
  margin-bottom: 30rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #1989fa;
  margin: 30rpx 0 20rpx;
  padding-bottom: 10rpx;
  border-bottom: 2rpx solid #e8e8e8;
}

.verify-section {
  margin-bottom: 30rpx;
  padding-bottom: 20rpx;
}

.upload-section {
  margin-bottom: 30rpx;
}

.upload-title {
  font-size: 28rpx;
  font-weight: 500;
  color: #333;
  margin-bottom: 10rpx;
  display: block;
}

.desc-content {
  font-size: 24rpx;
  color: #999;
  margin-bottom: 20rpx;
  display: block;
}

.submit-btn {
  background-color: #1989fa;
  color: #ffffff;
  font-size: 32rpx;
  font-weight: 500;
  text-align: center;
  padding: 28rpx 0;
  border-radius: 8rpx;
  margin-top: 40rpx;
}

.submit-btn:disabled {
  background-color: #c8c9cc;
}
</style>
