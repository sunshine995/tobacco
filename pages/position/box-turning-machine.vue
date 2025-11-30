<template>
<view class="container">
    <!-- 顶部卡片区域 -->
    <view class="header-card">
      <WorkOrderInfoCard :order-info="myOrder" />
    </view>
    
    <!-- 页面内容 -->
    <view class="content-section">
       <!-- 开班检查 --> 
        <view class="check-section" v-if="myOrder.number && (myOrder.number.includes('预混柜') || myOrder.number.trim() === '1' || myOrder.number.includes('1'))">
          <view class="check-section-title"> 
            <text class="section-sub-title">开班检查</text> 
          </view> 
         <text class="upload-title">三压图片</text>
          <upload-image
            ref="pressureUploadRef"
            title="添加三压图片"
            :max-count="3"
            @success="(e) => handleImageUploadSuccess(e, 'imagesPressure')"
            @remove="(e) => handleImageRemove(e, 'imagesPressure')"
            class="upload-card-item"
          />
        </view>
      <!-- 过料前检查区域 -->
      <view class="check-section">
        <text class="section-title">过料前检查</text>
        
        <!-- 过料前牌号照片上传 -->
        <view class="upload-section">
          <text class="upload-title">牌号+批次号照片</text>
          <upload-image
            ref="brandPhotoRef"
            :max-count="1"
            title="上传图片"
          />
        </view>
        
       
        
        <!-- 切片机周转箱数量显示 -->
        <view class="info-section">
          <text class="info-title">切片机周转箱数量</text>
          <text class="info-value">{{ slicerBoxCount || '--' }}</text>
        </view>
        
        <!-- 料结束后周转箱数量拍照核对 -->
        <view class="upload-section">
          <text class="upload-title">料结束后周转箱数量拍照</text>
          <upload-image
            ref="finalBoxPhotoRef"
            :max-count="1"
            title="上传图片"
          />
        </view>
        <!-- 提交按钮 -->
        <view class="submit-btn" @click="submitCheck" :class="{ 'disabled': submitting }">
          <text>{{ submitting ? '提交中...' : '提交检查' }}</text>
        </view>
      </view>
      
      <!-- 三级验证区域 -->
      <view class="verify-section">
     
        <verify-button
        button-text="三级验证"
        :batch-id="myOrder.batchNo"
        :brand="myOrder.brand"
        segment="翻箱机"
        :data-count="
          (brandPhotoRef?.value?.getFileCount() || 0) +
          (batchPhotoRef?.value?.getFileCount() || 0) +
          (finalBoxPhotoRef?.value?.getFileCount() || 0)
        "
        :disabled="submitting"
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
  brand: '',
  number: '' // 添加number属性用于v-if判断
});
const imagesPressure = ref([]); // 存储三压图片URL

// 上传组件的ref
const brandPhotoRef = ref(null);
const batchPhotoRef = ref(null);
const finalBoxPhotoRef = ref(null); // 料结束后周转箱数量照片引用
const pressureUploadRef = ref(null); // 三压图片引用

// 提交状态
const submitting = ref(false);
// 切片机周转箱数量
const slicerBoxCount = ref('');

// 处理图片上传成功
const handleImageUploadSuccess = (e, type) => {
  console.log('图片上传成功:', e, type);
  if (type === 'imagesPressure') {
    // 将上传的图片URL添加到imagesPressure数组
    if (e.url) {
      imagesPressure.value.push(e.url);
      console.log('三压图片已添加:', imagesPressure.value);
    }
  }
};

// 处理图片移除
const handleImageRemove = (e, type) => {
  console.log('图片移除:', e, type);
  if (type === 'imagesPressure') {
    // 从imagesPressure数组中移除对应的图片URL
    const index = imagesPressure.value.indexOf(e.url);
    if (index > -1) {
      imagesPressure.value.splice(index, 1);
      console.log('三压图片已移除:', imagesPressure.value);
    }
  }
};

// 从全局状态获取工单信息
const getDataFromGlobal = () => {
  try {
    const app = getApp();
    if (app?.globalData?.currentOrder) {
      myOrder.value = {
        id: app.globalData.currentOrder.id || '',
        batchNo: app.globalData.currentOrder.batchNo || '',
        brand: app.globalData.currentOrder.brand || '',
        number: app.globalData.currentOrder.number || '' // 获取number属性用于v-if判断
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
  if (options && (options.id || options.batchNo || options.brand || options.number)) {
    myOrder.value = {
      id: options.id ? decodeURIComponent(options.id) : '',
      batchNo: options.batchNo ? decodeURIComponent(options.batchNo) : '',
      brand: options.brand ? decodeURIComponent(options.brand) : '',
      number: options.number ? decodeURIComponent(options.number) : '' // 获取number参数用于v-if判断
    };
    console.log('通过URL参数设置的工单信息:', myOrder.value);
    
    if (!myOrder.value.id || !myOrder.value.batchNo || !myOrder.value.brand || !myOrder.value.number) {
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
    // 获取翻箱机记录
    const res = await byBatchIdAndSegment(batchNo, "翻箱机");
    
    if (res && res.verificationResult) {
      const record = res;
      
      // 回显图片
    if (record.verificationResult.brandPhotoUrl) {
      await nextTick();
      if (brandPhotoRef.value && brandPhotoRef.value.setPreviewImages) {
        brandPhotoRef.value.setPreviewImages([record.verificationResult.brandPhotoUrl]);
      }
    }
    
    // 回显料结束后周转箱数量照片
    if (record.verificationResult.finalBoxPhotoUrl) {
      await nextTick();
      if (finalBoxPhotoRef.value && finalBoxPhotoRef.value.setPreviewImages) {
        finalBoxPhotoRef.value.setPreviewImages([record.verificationResult.finalBoxPhotoUrl]);
      }
    }
    
    // 回显三压图片
    if (record.verificationResult.pressurePhotos && record.verificationResult.pressurePhotos.length > 0) {
      await nextTick();
      if (pressureUploadRef.value && pressureUploadRef.value.setPreviewImages) {
        pressureUploadRef.value.setPreviewImages(record.verificationResult.pressurePhotos);
        // 更新imagesPressure数组
        imagesPressure.value = [...record.verificationResult.pressurePhotos];
        console.log('三压图片已回显:', imagesPressure.value);
      }
    }
      
      // 验证相关数据处理
      if (record.verificationResult) {
        console.log('加载到的验证记录:', record.verificationResult);
      }
    }
    
    // 获取切片机周转箱数量（从切片机的数据中获取）
    try {
      const slicerData = await byBatchIdAndSegment(batchNo, "切片机");
      if (slicerData && slicerData.verificationResult && slicerData.verificationResult.boxCount) {
        slicerBoxCount.value = slicerData.verificationResult.boxCount;
        console.log('获取到切片机周转箱数量:', slicerBoxCount.value);
      }
    } catch (slicerError) {
      console.warn('获取切片机周转箱数量失败:', slicerError);
      // 不阻断流程
    }
  } catch (error) {
    console.warn('加载历史记录失败:', error);
    // 不阻断流程，允许用户重新提交
  }
};

// 加载历史记录
const loadHistory = async () => {
  try {
    const historyData = await byBatchIdAndSegment(myOrder.value.batchNo, "翻箱机");
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
    const finalBoxFiles = finalBoxPhotoRef.value?.getFiles() || [];
    
    // 检查batchPhotoRef是否存在并验证
    if (batchPhotoRef.value) {
      const batchFiles = batchPhotoRef.value.getFiles() || [];
      if (batchFiles.length === 0) {
        uni.showToast({ title: '请上传批次号照片', icon: 'none' });
        return;
      }
    }
    
    if (brandFiles.length === 0) {
      uni.showToast({ title: '请上传过料前牌号照片', icon: 'none' });
      return;
    }
    
    if (finalBoxFiles.length === 0) {
      uni.showToast({ title: '请上传料结束后周转箱数量照片', icon: 'none' });
      return;
    }
   
    
    // 上传图片
    const brandUploadResults = await brandPhotoRef.value.triggerUpload();
    const finalBoxUploadResults = await finalBoxPhotoRef.value.triggerUpload();
    
    // 如果存在batchPhotoRef，也上传相关图片
    let batchPhotoUrl = '';
    if (batchPhotoRef.value) {
      await batchPhotoRef.value.triggerUpload();
      batchPhotoUrl = batchPhotoRef.value.getUploadedUrls()[0] || '';
    }
   
    
    // 获取上传成功的图片URL
    const brandPhotoUrl = brandPhotoRef.value.getUploadedUrls()[0];
    const finalBoxPhotoUrl = finalBoxPhotoRef.value.getUploadedUrls()[0];
    
    
    if (!brandPhotoUrl || !finalBoxPhotoUrl) {
      uni.showToast({ title: '图片上传失败，请重试', icon: 'none' });
      return;
    }
    
    // 构造提交数据
    const submitData = {
      batchId: myOrder.value.batchNo,
      brand: myOrder.value.brand,
      segment: "翻箱机",
      verificationResult: {
        brandPhotoUrl,
        finalBoxPhotoUrl,
        ...(batchPhotoUrl && { batchPhotoUrl }),
        Status: 'normal',
        pressurePhotos: imagesPressure.value // 三压图片数据
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

/* 信息显示区域 */
.info-section {
  margin-bottom: 40rpx;
  padding: 20rpx;
  background-color: #f8f8f8;
  border-radius: 8rpx;
}

.info-title {
  font-size: 28rpx;
  color: #555;
  margin-bottom: 10rpx;
  display: block;
}

.info-value {
  font-size: 32rpx;
  font-weight: 600;
  color: #007AFF;
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
