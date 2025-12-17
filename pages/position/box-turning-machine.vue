<template>
<view class="container">
    <!-- 顶部卡片区域 -->
    <view class="header-card">
      <WorkOrderInfoCard :order-info="myOrder" />
    </view>
    
    <!-- 页面内容 -->
    <view class="content-section">
       <!-- 开班检查 --> 
       <view v-if="myOrder.number === '1'" class="check-section">
         <text class="section-title">开班检查</text>
         
         <!-- 三压图片上传 -->
         <view class="upload-section">
           <text class="upload-title">三压图片</text>
           <upload-image
             ref="pressureUploadRef"
             title="添加三压图片"
             :max-count="3"
           />
         </view>
         
         <!-- 提交按钮 -->
         <up-button
           type="primary"
           @click="submitModule('startCheck')"
           :loading="submitting"
           class="submit-btn-main-check"
           :disabled="submitting || hasSubmittedModules.startCheck"
         >
           {{ submitting ? '提交中...' : hasSubmittedModules.startCheck ? '已提交' : '提交检查' }}
         </up-button>
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
        <up-button
          type="primary"
          @click="submitModule('mainCheck')"
          :loading="submitting"
          class="submit-btn-main-check"
          :disabled="submitting || hasSubmittedModules.mainCheck"
        >
          {{ submitting ? '提交中...' : hasSubmittedModules.mainCheck ? '已提交' : '提交检查' }}
        </up-button>
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

// 上传组件的ref
const pressureUploadRef = ref(null);
const brandPhotoRef = ref(null);
const batchPhotoRef = ref(null);
const finalBoxPhotoRef = ref(null);

// 提交状态
const submitting = ref(false);

// 切片机周转箱数量
const slicerBoxCount = ref('');

// 模块提交状态追踪
const hasSubmittedModules = ref({
  startCheck: false,      // 开班检查
  mainCheck: false        // 主要检查（过料前检查）
});

// 全局已提交数据容器
const allData = ref({
  imagesPressure: [],     // 三压图片
  brandPhotoUrl: '',
  finalBoxPhotoUrl: '',
  batchPhotoUrl: ''
});

// 处理图片上传成功
const handleImageUploadSuccess = (e, type) => {
  console.log('图片上传成功:', e, type);
};

// 处理图片移除
const handleImageRemove = (e, type) => {
  console.log('图片移除:', e, type);
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
      
      // 回显开班检查数据
      if (record.verificationResult.imagesPressure && record.verificationResult.imagesPressure.length > 0) {
        await nextTick();
        if (pressureUploadRef.value && pressureUploadRef.value.setPreviewImages) {
          pressureUploadRef.value.setPreviewImages(record.verificationResult.imagesPressure);
          allData.value.imagesPressure = [...record.verificationResult.imagesPressure];
          hasSubmittedModules.value.startCheck = true;
          console.log('三压图片已回显:', allData.value.imagesPressure);
        }
      }
      
      // 回显其他图片
      if (record.verificationResult.brandPhotoUrl) {
        await nextTick();
        if (brandPhotoRef.value && brandPhotoRef.value.setPreviewImages) {
          brandPhotoRef.value.setPreviewImages([record.verificationResult.brandPhotoUrl]);
          allData.value.brandPhotoUrl = record.verificationResult.brandPhotoUrl;
          hasSubmittedModules.value.mainCheck = true;
        }
      }
    
      if (record.verificationResult.finalBoxPhotoUrl) {
        await nextTick();
        if (finalBoxPhotoRef.value && finalBoxPhotoRef.value.setPreviewImages) {
          finalBoxPhotoRef.value.setPreviewImages([record.verificationResult.finalBoxPhotoUrl]);
          allData.value.finalBoxPhotoUrl = record.verificationResult.finalBoxPhotoUrl;
        }
      }
      
      if (record.verificationResult.batchPhotoUrl) {
        await nextTick();
        if (batchPhotoRef.value && batchPhotoRef.value.setPreviewImages) {
          batchPhotoRef.value.setPreviewImages([record.verificationResult.batchPhotoUrl]);
          allData.value.batchPhotoUrl = record.verificationResult.batchPhotoUrl;
        }
      }
    }
    
    // 获取切片机周转箱数量
    try {
      const slicerData = await byBatchIdAndSegment(batchNo, "切片机");
      if (slicerData && slicerData.verificationResult && slicerData.verificationResult.boxCount) {
        slicerBoxCount.value = slicerData.verificationResult.boxCount;
        console.log('获取到切片机周转箱数量:', slicerBoxCount.value);
      }
    } catch (slicerError) {
      console.warn('获取切片机周转箱数量失败:', slicerError);
    }
  } catch (error) {
    console.warn('加载历史记录失败:', error);
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

// 合并当前模块的数据到全局数据容器
const mergeCurrentModuleData = (moduleType) => {
  switch (moduleType) {
    case 'startCheck':
      allData.value.imagesPressure = pressureUploadRef.value?.getAllImageUrls() || [];
      break;
    case 'mainCheck':
      allData.value.brandPhotoUrl = brandPhotoRef.value?.getUploadedUrls()[0] || '';
      allData.value.finalBoxPhotoUrl = finalBoxPhotoRef.value?.getUploadedUrls()[0] || '';
      if (batchPhotoRef.value) {
        allData.value.batchPhotoUrl = batchPhotoRef.value?.getUploadedUrls()[0] || '';
      }
      break;
  }
};

// 模块化提交方法
const submitModule = async (moduleType) => {
  if (submitting.value || hasSubmittedModules.value[moduleType]) return;
  try {
    submitting.value = true;

    // 1. 验证当前模块
    let validatePass = true;
    let errorMsg = '';
    const uploadPromises = [];

    switch (moduleType) {
      case 'startCheck':
        if (pressureUploadRef.value.getAllImageUrls().length === 0) {
          validatePass = false;
          errorMsg = '请上传三压图片';
        } else {
          uploadPromises.push(pressureUploadRef.value.triggerUpload());
        }
        break;
      case 'mainCheck':
        if (brandPhotoRef.value.getAllImageUrls().length === 0) {
          validatePass = false;
          errorMsg = '请上传过料前牌号照片';
        } else {
          uploadPromises.push(brandPhotoRef.value.triggerUpload());
        }
        
        if (finalBoxPhotoRef.value.getAllImageUrls().length === 0) {
          validatePass = false;
          errorMsg = '请上传料结束后周转箱数量照片';
        } else {
          uploadPromises.push(finalBoxPhotoRef.value.triggerUpload());
        }
        
        if (batchPhotoRef.value && batchPhotoRef.value.getAllImageUrls().length === 0) {
          validatePass = false;
          errorMsg = '请上传批次号照片';
        } else if (batchPhotoRef.value) {
          uploadPromises.push(batchPhotoRef.value.triggerUpload());
        }
        break;
    }

    if (!validatePass) {
      uni.showToast({ title: errorMsg, icon: 'none' });
      return;
    }

    // 2. 上传当前模块图片
    if (uploadPromises.length > 0) await Promise.all(uploadPromises);

    // 3. 合并当前模块数据到全局已提交数据
    mergeCurrentModuleData(moduleType);

    // 4. 构建并提交（包含所有已提交模块的内容）
    const submitData = {
      batchId: myOrder.value.batchNo || '',
      brand: myOrder.value.brand,
      segment: "翻箱机",
      verificationResult: allData.value,
      dataCount: Object.keys(allData.value).filter(key => {
        const val = allData.value[key];
        return (Array.isArray(val) && val.length > 0) || (typeof val === 'string' && val.length > 0) || (typeof val === 'object' && val !== null && Object.keys(val).length > 0);
      }).length,
      operatorId: uni.getStorageSync('userId') || '',
      workOrderId: myOrder.value.id
    };

    console.log('最终提交数据（包含所有已提交模块）:', submitData);
    await submitMaterialCheck(submitData);

    // 5. 标记当前模块为已提交
    hasSubmittedModules.value[moduleType] = true;
    uni.showToast({ title: '提交成功', icon: 'success' });

    // 6. 重新加载数据，确保页面显示最新内容
    setTimeout(() => {
      if (myOrder.value.batchNo) {
        loadExistingCheckRecord(myOrder.value.batchNo);
      }
    }, 1500);
  } catch (error) {
    console.error('提交失败:', error);
    uni.showToast({ title: error.message || '提交失败，请重试', icon: 'none' });
  } finally {
    submitting.value = false;
  }
};

// 提交检查结果
const submitCheck = async () => {
  await submitModule('mainCheck');
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

/* 开班检查区域 */
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
.submit-btn-main-check {
  background-color: #007AFF;
  border-radius: 12rpx;
  font-size: 28rpx;
  font-weight: 600;
  height: 52rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 122, 255, 0.3);
  margin-top: 20rpx;
}

.submit-btn-main-check:disabled {
  background-color: #c0c0c0;
  box-shadow: 0 2rpx 8rpx rgba(192, 192, 192, 0.3);
}

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
