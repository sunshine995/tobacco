<template>
<view class="container">
    <!-- 顶部卡片区域 -->
    <view class="header-card">
      <WorkOrderInfoCard :order-info="myOrder" />
    </view>
    
    <!-- 页面内容 -->
    <view class="content-section">
      <!-- 过料前检查区域 -->
      <view class="check-section">
        <text class="section-title">开料前验证</text>
        
        <!-- 牌号+批次号照片上传 -->
        <view class="upload-section">
          <text class="upload-title">牌号+批次号照片</text>
          <upload-image
            ref="brandPhotoRef"
            :max-count="1"
            title="上传牌号+批次号照片"
          />
        </view>
        
        <!-- 再造蒸不蒸选项（始终显示） -->
        <view class="check-option">
          <text class="option-title">再造蒸不蒸</text>
          <radio-group @change="handleReconstitutionChange" class="radio-group">
            <label class="radio-label">
              <radio :value="'蒸'" :checked="reconstitutionOption === '蒸'" />
              <text>蒸</text>
            </label>
            <label class="radio-label">
              <radio :value="'不蒸'" :checked="reconstitutionOption === '不蒸'" />
              <text>不蒸</text>
            </label>
          </radio-group>
        </view>
        
        <!-- 周期选择 -->
        <view class="check-option">
          <text class="option-title">当前牌号周期数</text>
          <radio-group @change="handleCycleChange" class="radio-group">
            <label class="radio-label">
              <radio :value="1" :checked="cycleCount === 1" />
              <text>1</text>
            </label>
            <label class="radio-label">
              <radio :value="2" :checked="cycleCount === 2" />
              <text>2</text>
            </label>
          </radio-group>
        </view>
        
        <!-- 整体参数拍照 -->
        <view class="upload-section">
          <text class="upload-title">整体参数照片</text>
          <upload-image
            ref="parameterPhotoRef"
            :max-count="1"
            title="上传整体参数照片"
          />
        </view>
        
        <!-- 提交按钮 -->
        <view class="submit-btn" @click="submitCheck" :class="{ 'disabled': submitting }">
          <text>{{ submitting ? '提交中...' : '提交验证' }}</text>
        </view>
      </view>
      
      <!-- 三级验证区域 -->
      <view class="verify-section">
        <verify-button
          button-text="三级验证"
          :batch-id="myOrder.batchNo"
          :brand="myOrder.brand"
          segment="真空回潮"
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

// 上传组件的ref
const brandPhotoRef = ref(null);
const parameterPhotoRef = ref(null);
// 提交状态
const submitting = ref(false);

// 新增响应式变量
const showReconstitutionCheck = ref(false);
const reconstitutionOption = ref('');
const cycleCount = ref(1);

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
      // 检查牌号条件
      checkBrandCondition();
      return true;
    }
  } catch (e) {
    console.error('全局状态获取失败:', e);
  }
  return false;
};

// 检查牌号是否包含利群或吉祥
const checkBrandCondition = () => {
  if (myOrder.value.brand && 
      (myOrder.value.brand.includes('利群') || myOrder.value.brand.includes('吉祥'))) {
    showReconstitutionCheck.value = true;
  } else {
    showReconstitutionCheck.value = false;
    reconstitutionOption.value = '';
  }
};

// 处理再造蒸不蒸选项变更
const handleReconstitutionChange = (e) => {
  reconstitutionOption.value = e.detail.value;
};

// 处理周期数选项变更
const handleCycleChange = (e) => {
  cycleCount.value = parseInt(e.detail.value);
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
    
    // 检查牌号条件
    checkBrandCondition();
    
    if (!myOrder.value.id || !myOrder.value.batchNo || !myOrder.value.brand) {
      const globalDataSuccess = getDataFromGlobal();
      console.log('从全局状态补充工单信息结果:', globalDataSuccess);
    }
  } else {
    getDataFromGlobal();
  }
  
  // 尝试加载已有检查记录
  if (myOrder.value.batchNo) {
    loadExistingCheckRecord(myOrder.value.batchNo);
    loadHistory(); // 加载三级验证历史数据
  }
});

// 加载已有检查记录
const loadExistingCheckRecord = async (batchNo) => {
  try {
    const res = await byBatchIdAndSegment(batchNo, "真空回潮");
    
    if (res && res.verificationResult) {
      const record = res;
      
      // 回显图片
      if (record.verificationResult.brandPhotoUrl) {
        await nextTick();
        if (brandPhotoRef.value && brandPhotoRef.value.setPreviewImages) {
          brandPhotoRef.value.setPreviewImages([record.verificationResult.brandPhotoUrl]);
        }
      }
      
      // 回显整体参数照片
      if (record.verificationResult.parameterPhotoUrl) {
        await nextTick();
        if (parameterPhotoRef.value && parameterPhotoRef.value.setPreviewImages) {
          parameterPhotoRef.value.setPreviewImages([record.verificationResult.parameterPhotoUrl]);
        }
      }
      
      // 回显再造蒸不蒸选项
      if (record.verificationResult.reconstitutionOption) {
        reconstitutionOption.value = record.verificationResult.reconstitutionOption;
      }
      
      // 回显周期数
      if (record.verificationResult.cycleCount) {
        cycleCount.value = record.verificationResult.cycleCount;
      }
      
      console.log('加载到的验证记录:', record.verificationResult);
    }
  } catch (error) {
    console.warn('加载历史记录失败:', error);
    // 不阻断流程，允许用户重新提交
  }
};

// 加载历史记录
const loadHistory = async () => {
  try {
    const historyData = await byBatchIdAndSegment(myOrder.value.batchNo, "真空回潮");
    if (historyData && historyData.verificationResult) {
      // 设置已上传的图片（实现图片回显）
      if (historyData.verificationResult.brandPhotoUrl) {
        await nextTick();
        brandPhotoRef.value?.setPreviewImages([historyData.verificationResult.brandPhotoUrl]);
      }
      
      // 验证相关数据
      console.log('三级验证历史数据:', historyData.verificationResult);
    }
  } catch (error) {
    console.error('加载历史记录失败:', error);
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

// 提交检查结果
const submitCheck = async () => {
  try {
    submitting.value = true;
    
    // 检查是否已选择图片
    const brandFiles = brandPhotoRef.value?.getFiles() || [];
    const parameterFiles = parameterPhotoRef.value?.getFiles() || [];
    
    if (brandFiles.length === 0) {
      uni.showToast({ title: '请上传牌号+批次号照片', icon: 'none' });
      return;
    }
    
    if (parameterFiles.length === 0) {
      uni.showToast({ title: '请上传整体参数照片', icon: 'none' });
      return;
    }
    
    // 再造蒸不蒸选项必须选择
    if (!reconstitutionOption.value) {
      uni.showToast({ title: '请选择再造蒸不蒸选项', icon: 'none' });
      return;
    }
    
    // 上传图片
    const brandUploadResults = await brandPhotoRef.value.triggerUpload();
    const parameterUploadResults = await parameterPhotoRef.value.triggerUpload();
    
    // 获取上传成功的图片URL
    const brandPhotoUrl = brandPhotoRef.value.getUploadedUrls()[0];
    const parameterPhotoUrl = parameterPhotoRef.value.getUploadedUrls()[0];
    
    if (!brandPhotoUrl) {
      uni.showToast({ title: '牌号照片上传失败，请重试', icon: 'none' });
      return;
    }
    
    if (!parameterPhotoUrl) {
      uni.showToast({ title: '整体参数照片上传失败，请重试', icon: 'none' });
      return;
    }
    
    // 构造提交数据
    const submitData = {
      batchId: myOrder.value.batchNo,
      brand: myOrder.value.brand,
      segment: "真空回潮",
      verificationResult: {
          brandPhotoUrl,
          parameterPhotoUrl,
          reconstitutionOption: reconstitutionOption.value,
          cycleCount: cycleCount.value,
          Status: 'normal'
        },
      dataCount: 1,
      operatorId: uni.getStorageSync('userId')
    };
    
    console.log('提交验证数据:', submitData);
    
    // 调用提交API
    await submitMaterialCheck(submitData);
    
    uni.showToast({
      title: '提交成功',
      icon: 'success'
    });
    
  } catch (error) {
    console.error('提交失败:', error);
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

.page-title {
  font-size: 36rpx;
  font-weight: 600;
  color: #333;
  text-align: center;
  display: block;
  margin-bottom: 30rpx;
}

/* 过料前检查区域 */
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

/* 检查选项区域 */
.check-option {
  margin-bottom: 30rpx;
}

.option-title {
  font-size: 28rpx;
  color: #555;
  margin-bottom: 15rpx;
  display: block;
}

.radio-group {
  display: flex;
  gap: 40rpx;
}

.radio-label {
  display: flex;
  align-items: center;
  font-size: 28rpx;
  color: #333;
}

.radio-label radio {
  margin-right: 8rpx;
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
  background-color: #007AFF;
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
  background-color: #0062cc;
}

.submit-btn.disabled {
  background-color: #ccc;
  opacity: 0.7;
}

/* 三级验证区域 */
.verify-section {
  margin-top: 40rpx;
  padding-top: 30rpx;
  border-top: 1rpx solid #eee;
}
</style>
