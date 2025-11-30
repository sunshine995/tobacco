<template>
<view class="container">
    <!-- 顶部卡片区域 -->
    <view class="header-card">
      <WorkOrderInfoCard :order-info="myOrder" />
    </view>
    
    <!-- 页面内容 -->
    <view class="content-section">
      <!-- 进柜验证区域 -->
      <view class="check-section">
        <text class="section-title">进柜验证</text>
        
        <!-- 牌号+批次号照片上传 -->
        <view class="upload-section">
          <text class="upload-title">牌号+批次号照片</text>
          <upload-image
            ref="brandBatchPhotoRef"
            :max-count="1"
            title="上传图片"
          />
        </view>
        
        <!-- 料头照片上传 -->
        <view class="upload-section">
          <text class="upload-title">料头照片</text>
          <upload-image
            ref="inHeadPhotoRef"
            :max-count="1"
            title="上传图片"
          />
        </view>
        
        <!-- 料中照片上传 -->
        <view class="upload-section">
          <text class="upload-title">料中照片</text>
          <upload-image
            ref="inMiddlePhotoRef"
            :max-count="1"
            title="上传图片"
          />
        </view>
        
        <!-- 料尾照片上传 -->
        <view class="upload-section">
          <text class="upload-title">料尾照片</text>
          <upload-image
            ref="inTailPhotoRef"
            :max-count="1"
            title="上传图片"
          />
        </view>
        
        <!-- 进柜提交按钮 -->
        <view class="submit-btn in-check" @click="submitInCheck" :class="{ 'disabled': submitting }">
          <text>{{ submitting ? '提交中...' : '提交进柜验证' }}</text>
        </view>
      </view>
      
      <!-- 出柜验证区域 -->
      <view class="check-section" style="margin-top: 50rpx;">
        <text class="section-title">出柜验证</text>
        
        <!-- 料头照片上传 -->
        <view class="upload-section">
          <text class="upload-title">料头照片</text>
          <upload-image
            ref="outHeadPhotoRef"
            :max-count="1"
            title="上传图片"
          />
        </view>
        
        <!-- 料尾照片上传 -->
        <view class="upload-section">
          <text class="upload-title">料尾照片</text>
          <upload-image
            ref="outTailPhotoRef"
            :max-count="1"
            title="上传图片"
          />
        </view>
        
        <!-- 出柜提交按钮 -->
        <view class="submit-btn out-check" @click="submitOutCheck" :class="{ 'disabled': submitting }">
          <text>{{ submitting ? '提交中...' : '提交出柜验证' }}</text>
        </view>
      </view>
      
      <!-- 三级验证区域 -->
      <view class="verify-section">
        <verify-button
          button-text="三级验证"
          :batch-id="myOrder.batchNo"
          :brand="myOrder.brand"
          segment="储叶柜"
          :data-count="1"
          @success="handleVerifySuccess"
          @fail="handleVerifyFail"
          @validate="handleValidate"
        />
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import WorkOrderInfoCard from '@/components/orderInfo.vue';
import UploadImage from '@/components/UploadImage.vue';
import VerifyButton from '@/components/VerifyButton.vue';
import { submitMaterialCheck, byBatchIdAndSegment } from '@/api/production.js';

// 订单信息响应式对象
const myOrder = ref({
  id: '',
  batchNo: '',
  brand: ''
});

// 上传组件的ref集合
const brandBatchPhotoRef = ref(null); // 牌号+批次号
const inHeadPhotoRef = ref(null);    // 进柜-料头
const inMiddlePhotoRef = ref(null);  // 进柜-料中
const inTailPhotoRef = ref(null);    // 进柜-料尾
const outHeadPhotoRef = ref(null);   // 出柜-料头
const outTailPhotoRef = ref(null);   // 出柜-料尾

// 全局提交状态（避免同时提交）
const submitting = ref(false);
// 存储历史提交数据（用于提交时合并）
const historyData = ref({
  verificationResult: {
    brandBatchPhotoUrl: '',
    inHeadPhotoUrl: '',
    inMiddlePhotoUrl: '',
    inTailPhotoUrl: '',
    outHeadPhotoUrl: '',
    outTailPhotoUrl: '',
    inCheckStatus: '',
    outCheckStatus: '',
    Status: 'normal'
  }
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
  
  // 尝试加载已有检查记录（初始化历史数据）
  if (myOrder.value.batchNo) {
    loadExistingCheckRecord(myOrder.value.batchNo);
  }
});

// 加载已有检查记录（回显图片+存储历史数据）
const loadExistingCheckRecord = async (batchNo) => {
  try {
    const res = await byBatchIdAndSegment(batchNo, "储叶柜");
    
    if (res && res.verificationResult) {
      // 存储历史数据（用于后续提交合并）
      historyData.value = { ...res };
      const record = res.verificationResult;
      await nextTick(); // 等待DOM更新
      
      // 回显所有图片（包括进柜和出柜）
      if (record.brandBatchPhotoUrl) {
        brandBatchPhotoRef.value?.setPreviewImages([record.brandBatchPhotoUrl]);
      }
      if (record.inHeadPhotoUrl) {
        inHeadPhotoRef.value?.setPreviewImages([record.inHeadPhotoUrl]);
      }
      if (record.inMiddlePhotoUrl) {
        inMiddlePhotoRef.value?.setPreviewImages([record.inMiddlePhotoUrl]);
      }
      if (record.inTailPhotoUrl) {
        inTailPhotoRef.value?.setPreviewImages([record.inTailPhotoUrl]);
      }
      if (record.outHeadPhotoUrl) {
        outHeadPhotoRef.value?.setPreviewImages([record.outHeadPhotoUrl]);
      }
      if (record.outTailPhotoUrl) {
        outTailPhotoRef.value?.setPreviewImages([record.outTailPhotoUrl]);
      }
      
      console.log('加载到的历史数据:', historyData.value);
    }
  } catch (error) {
    console.warn('加载历史记录失败:', error);
    // 不阻断流程，使用默认空历史数据
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

// 合并历史数据和当前提交数据
const mergeSubmitData = (currentData) => {
  // 合并验证结果：用当前数据覆盖对应字段，保留历史数据中未被覆盖的字段
  const mergedVerificationResult = {
    ...historyData.value.verificationResult, // 历史数据
    ...currentData.verificationResult        // 当前提交数据（优先级更高）
  };
  
  // 合并完整提交数据
  return {
    ...historyData.value, // 历史完整数据
    ...currentData,       // 当前提交数据
    verificationResult: mergedVerificationResult,
    batchId: myOrder.value.batchNo, // 确保批次号一致
    brand: myOrder.value.brand,     // 确保牌号一致
    segment: "储叶柜",
    dataCount: 1,
    operatorId: uni.getStorageSync('userId')
  };
};

// 提交进柜验证（带历史数据）
const submitInCheck = async () => {
  try {
    submitting.value = true;
    
    // 检查进柜验证必填图片
    const brandBatchFiles = brandBatchPhotoRef.value?.getFiles() || [];
    const inHeadFiles = inHeadPhotoRef.value?.getFiles() || [];
    const inMiddleFiles = inMiddlePhotoRef.value?.getFiles() || [];
    const inTailFiles = inTailPhotoRef.value?.getFiles() || [];
    
    // 校验必填项
    if (brandBatchFiles.length === 0) {
      uni.showToast({ title: '请上传牌号+批次号照片', icon: 'none' });
      return;
    }
    if (inHeadFiles.length === 0) {
      uni.showToast({ title: '请上传进柜料头照片', icon: 'none' });
      return;
    }
    if (inMiddleFiles.length === 0) {
      uni.showToast({ title: '请上传进柜料中照片', icon: 'none' });
      return;
    }
    if (inTailFiles.length === 0) {
      uni.showToast({ title: '请上传进柜料尾照片', icon: 'none' });
      return;
    }
    
    // 上传进柜相关图片
    await Promise.all([
      brandBatchPhotoRef.value.triggerUpload(),
      inHeadPhotoRef.value.triggerUpload(),
      inMiddlePhotoRef.value.triggerUpload(),
      inTailPhotoRef.value.triggerUpload()
    ]);
    
    // 构造当前进柜提交数据
    const currentSubmitData = {
      verificationResult: {
        // 进柜相关图片URL（覆盖或新增）
        brandBatchPhotoUrl: brandBatchPhotoRef.value.getUploadedUrls()[0],
        inHeadPhotoUrl: inHeadPhotoRef.value.getUploadedUrls()[0],
        inMiddlePhotoUrl: inMiddlePhotoRef.value.getUploadedUrls()[0],
        inTailPhotoUrl: inTailPhotoRef.value.getUploadedUrls()[0],
        inCheckStatus: 'completed', // 进柜验证完成状态
        Status: 'normal'
      },
      checkType: 'in' // 标记为进柜验证
    };
    
    // 校验当前上传的图片是否成功
    const currentUrls = [
      currentSubmitData.verificationResult.brandBatchPhotoUrl,
      currentSubmitData.verificationResult.inHeadPhotoUrl,
      currentSubmitData.verificationResult.inMiddlePhotoUrl,
      currentSubmitData.verificationResult.inTailPhotoUrl
    ];
    
    if (currentUrls.some(url => !url)) {
      uni.showToast({ title: '部分图片上传失败，请重试', icon: 'none' });
      return;
    }
    
    // 合并历史数据和当前数据（关键步骤）
    const finalSubmitData = mergeSubmitData(currentSubmitData);
    console.log('合并后的进柜提交数据:', finalSubmitData);
    
    // 调用提交API
    await submitMaterialCheck(finalSubmitData);
    
    // 更新本地历史数据（避免下次提交重复加载）
    historyData.value = { ...finalSubmitData };
    
    uni.showToast({
      title: '进柜验证提交成功',
      icon: 'success'
    });
    
  } catch (error) {
    console.error('进柜验证提交失败:', error);
    uni.showToast({
      title: error.message || '提交失败，请重试',
      icon: 'none'
    });
  } finally {
    submitting.value = false;
  }
};

// 提交出柜验证（带历史数据）
const submitOutCheck = async () => {
  try {
    submitting.value = true;
    
    // 检查出柜验证必填图片
    const outHeadFiles = outHeadPhotoRef.value?.getFiles() || [];
    const outTailFiles = outTailPhotoRef.value?.getFiles() || [];
    
    // 校验必填项
    if (outHeadFiles.length === 0) {
      uni.showToast({ title: '请上传出柜料头照片', icon: 'none' });
      return;
    }
    if (outTailFiles.length === 0) {
      uni.showToast({ title: '请上传出柜料尾照片', icon: 'none' });
      return;
    }
    
    // 上传出柜相关图片
    await Promise.all([
      outHeadPhotoRef.value.triggerUpload(),
      outTailPhotoRef.value.triggerUpload()
    ]);
    
    // 构造当前出柜提交数据
    const currentSubmitData = {
      verificationResult: {
        // 出柜相关图片URL（覆盖或新增）
        outHeadPhotoUrl: outHeadPhotoRef.value.getUploadedUrls()[0],
        outTailPhotoUrl: outTailPhotoRef.value.getUploadedUrls()[0],
        outCheckStatus: 'completed', // 出柜验证完成状态
        Status: 'normal'
      },
      checkType: 'out' // 标记为出柜验证
    };
    
    // 校验当前上传的图片是否成功
    const currentUrls = [
      currentSubmitData.verificationResult.outHeadPhotoUrl,
      currentSubmitData.verificationResult.outTailPhotoUrl
    ];
    
    if (currentUrls.some(url => !url)) {
      uni.showToast({ title: '部分图片上传失败，请重试', icon: 'none' });
      return;
    }
    
    // 合并历史数据和当前数据（关键步骤）
    const finalSubmitData = mergeSubmitData(currentSubmitData);
    console.log('合并后的出柜提交数据:', finalSubmitData);
    
    // 调用提交API
    await submitMaterialCheck(finalSubmitData);
    
    // 更新本地历史数据（避免下次提交重复加载）
    historyData.value = { ...finalSubmitData };
    
    uni.showToast({
      title: '出柜验证提交成功',
      icon: 'success'
    });
    
  } catch (error) {
    console.error('出柜验证提交失败:', error);
    uni.showToast({
      title: error.message || '提交失败，请重试',
      icon: 'none'
    });
  } finally {
    submitting.value = false;
  }
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

/* 检查区域 */
.check-section {
  margin-top: 30rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 30rpx;
  padding-bottom: 15rpx;
  border-bottom: 1rpx solid #eee;
  display: block;
}

/* 上传区域 */
.upload-section {
  margin-bottom: 40rpx;
}

.upload-title {
  font-size: 28rpx;
  color: #555;
  margin-bottom: 20rpx;
  display: block;
}

/* 提交按钮 */
.submit-btn {
  width: 100%;
  padding: 24rpx;
  color: white;
  text-align: center;
  font-size: 30rpx;
  font-weight: 500;
  border-radius: 12rpx;
  margin-top: 20rpx;
  box-sizing: border-box;
  transition: background-color 0.3s ease;
}

.submit-btn:active {
  opacity: 0.9;
}

.submit-btn.disabled {
  background-color: #ccc !important;
  opacity: 0.7;
}

/* 进柜/出柜按钮区分样式 */
.submit-btn.in-check {
  background-color: #007AFF;
}

.submit-btn.out-check {
  background-color: #007AFF;
}

/* 三级验证区域 */
.verify-section {
  margin-top: 40rpx;
  padding-top: 30rpx;
  border-top: 1rpx solid #eee;
}
</style>
