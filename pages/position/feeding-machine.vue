<template>
  <view class="container">
    <!-- 顶部卡片区域 -->
    <view class="header-card">
      <WorkOrderInfoCard :order-info="myOrder" />
    </view>

    <!-- 上传组件区域 -->
    <view class="upload-section">
      <!-- 开班检查 -->
      <view class="check-section">
        <view class="check-section-title">
          <text class="section-sub-title">开班检查</text>
        </view>
        <text class="upload-label">三压图片</text>
        <UploadImage
          ref="pressureUploadRef"
          title="添加三压图片"
          :max-count="3"
          @success="(e) => handleImageUploadSuccess(e, 'imagesPressure')"
          @remove="(e) => handleImageRemove(e, 'imagesPressure')"
          class="upload-card-item"
        />
      </view>
      
      <!-- 开料前检查 -->
      <view class="check-section">
        <view class="check-section-title">
          <text class="section-sub-title">开料前检查</text>
        </view>
        <text class="upload-label">牌号+批次号照片</text>
        <UploadImage
          ref="brandBatchUploadRef"
          title="添加牌号+批次号照片"
          :max-count="1"
          @success="(e) => handleImageUploadSuccess(e, 'imagesBrandBatch')"
          @remove="(e) => handleImageRemove(e, 'imagesBrandBatch')"
          class="upload-card-item"
        />
        <text class="upload-label">规定的预填充值照片</text>
        <UploadImage
          ref="preFillUploadRef"
          title="添加预填充值照片"
          :max-count="1"
          @success="(e) => handleImageUploadSuccess(e, 'imagesPreFill')"
          @remove="(e) => handleImageRemove(e, 'imagesPreFill')"
          class="upload-card-item"
        />
      </view>
      
      <!-- 过完料检查 -->
      <view class="check-section">
        <view class="check-section-title">
          <text class="section-sub-title">过完料检查</text>
        </view>
        <text class="upload-label">筛网清吹照片</text>
        <UploadImage
          ref="screenCleanUploadRef"
          title="添加筛网清吹照片"
          :max-count="1"
          @success="(e) => handleImageUploadSuccess(e, 'imagesScreenClean')"
          @remove="(e) => handleImageRemove(e, 'imagesScreenClean')"
          class="upload-card-item"
        />
      </view>
      
      <!-- 回收烟沫重量输入 -->
      <view class="check-section">
        <view class="check-section-title">
          <text class="section-sub-title">回收烟沫重量</text>
        </view>
        <view class="weight-input-section">
          <text class="upload-label">回收烟沫重量(kg)</text>
          <input
            type="number"
            step="0.1"
            v-model.number="formData.recoveredTobaccoWeight"
            class="form-input weight-input"
            placeholder="请输入回收烟沫重量"
            @blur="onWeightInput"
          />
        </view>
      </view>
    </view>

    <!-- 操作按钮区域 -->
    <view class="action-buttons-section">
      <up-button 
        type="primary" 
        @click="publish"
        :loading="submitting"
        class="submit-btn primary-btn"
        v-if="!hasSubmitted"
      >
        {{ submitting ? '提交中...' : '提交验证' }}
      </up-button>
      
      <!-- 三级验证按钮 -->
      <VerifyButton 
        buttonText="三级验证" 
        :batchId="myOrder.batchNo" 
        :brand="myOrder.brand" 
        segment="喂料机" 
        :dataCount="4" 
        @success="handleVerifySuccess" 
        @fail="handleVerifyFail" 
        @validate="handleValidate" 
      />
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

// 表单数据（图片上传相关）
const form = ref({
  imagesPressure: [],          // 三压图片
  imagesBrandBatch: [],        // 牌号+批次号照片
  imagesPreFill: [],           // 预填充值照片
  imagesScreenClean: [],       // 筛网清吹照片
  // 外部图片URL数组，用于组件回显
  externalImagesPressure: [],
  externalImagesBrandBatch: [],
  externalImagesPreFill: [],
  externalImagesScreenClean: []
});

// 表单数据（重量输入）
const formData = ref({
  recoveredTobaccoWeight: ''
});

// 上传组件引用
const pressureUploadRef = ref(null);
const brandBatchUploadRef = ref(null);
const preFillUploadRef = ref(null);
const screenCleanUploadRef = ref(null);

// 提交状态（防止重复提交）
const submitting = ref(false);
// 是否已提交状态（用于控制按钮显示）
const hasSubmitted = ref(false);

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

// 加载已有核对记录 - 实现图片回显功能
const loadExistingCheckRecord = async (batchNo) => {
   if (!batchNo) return;
   
   try {
     const res = await byBatchIdAndSegment(batchNo, "喂料机");
     console.log('加载历史记录结果:', res);
     
     if (res) {
       const record = res;
       // 处理verificationResult：如果是JSON字符串则解析成对象
       let verificationResult = record.verificationResult || {};
       if (typeof verificationResult === 'string') {
         try {
           verificationResult = JSON.parse(verificationResult);
           console.log('成功解析verificationResult:', verificationResult);
         } catch (e) {
           console.error('解析verificationResult失败:', e);
           verificationResult = {};
         }
       }
       
       // 如果有历史记录，则设置为已提交状态
       hasSubmitted.value = true;
       
       // 填充回收烟沫重量
       if (verificationResult.weight) {
         formData.value.recoveredTobaccoWeight = verificationResult.weight;
       }
       
       // 确保images对象存在
       const images = verificationResult.images || {};
       console.log('需要回显的图片数据:', images);

       // 等待所有 UploadImage 组件都已挂载到DOM
       await nextTick();

       // 定义需要回显的图片类型及其对应的组件引用
       const imageTypesToEcho = [
         { key: 'imagesPressure', ref: pressureUploadRef, urls: images.imagesPressure },
         { key: 'imagesBrandBatch', ref: brandBatchUploadRef, urls: images.imagesBrandBatch },
         { key: 'imagesPreFill', ref: preFillUploadRef, urls: images.imagesPreFill },
         { key: 'imagesScreenClean', ref: screenCleanUploadRef, urls: images.imagesScreenClean }
       ];

       // 遍历并执行回显操作
       for (const { key, ref: componentRef, urls } of imageTypesToEcho) {
         // 检查组件是否存在且有 setPreviewImages 方法
         if (componentRef.value && typeof componentRef.value.setPreviewImages === 'function') {
           // 统一处理 urls 为数组
           const imageUrls = Array.isArray(urls) ? urls : urls ? [urls] : [];
           
           // 直接调用组件方法进行回显，组件内部应处理好URL格式化
           componentRef.value.setPreviewImages(imageUrls);
           console.log(`✅ ${key} 图片回显成功，共 ${imageUrls.length} 张。`);
         } else {
           console.warn(`⚠️ ${key} 组件未找到或不支持 setPreviewImages 方法，跳过回显。`);
         }
       }
       
       console.log('已加载历史核对记录并完成图片回显。');
     } else {
       console.log('该批次无历史核对记录');
       // 当无历史记录时，重置已提交状态
       hasSubmitted.value = false;
     }
   } catch (error) {
     console.error('加载历史核对记录失败:', error);
     // 出错时重置已提交状态
     hasSubmitted.value = false;
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
  
  // 加载历史记录
  if (myOrder.value.batchNo) {
    loadExistingCheckRecord(myOrder.value.batchNo);
  }
});

// 组件挂载完成后，如果还没有数据，尝试再次获取
onMounted(async () => {
  // 如果当前myOrder还没有有效的数据，再尝试从全局获取一次
  if (!myOrder.value.batchNo && !myOrder.value.brand) {
    console.log('onMounted: 尝试从全局状态获取数据...');
    getDataFromGlobal();
  }
  
  // 加载历史记录
  if (myOrder.value.batchNo) {
    await loadExistingCheckRecord(myOrder.value.batchNo);
  }
});

// 处理图片上传成功
const handleImageUploadSuccess = (e, type) => {
  console.log(`${type}图片上传成功`, e);
  // 使用getAllImageUrls获取最新的图片列表
  if (refMap[type]) {
    form.value[type] = refMap[type].value.getAllImageUrls();
  }
};

// 处理图片删除
const handleImageRemove = (e, type) => {
  console.log(`${type}图片删除成功`, e);
  // 使用getAllImageUrls获取最新的图片列表
  if (refMap[type]) {
    form.value[type] = refMap[type].value.getAllImageUrls();
  }
};

// 组件引用映射
const refMap = {
  imagesPressure: pressureUploadRef,
  imagesBrandBatch: brandBatchUploadRef,
  imagesPreFill: preFillUploadRef,
  imagesScreenClean: screenCleanUploadRef
};

// 重量输入处理
const onWeightInput = () => {
  console.log('回收烟沫重量输入:', formData.value.recoveredTobaccoWeight);
  // 可以在这里添加重量输入的验证逻辑
};

// 获取图片数据
const getImageData = () => {
  // 直接获取所有图片URL，确保即使没有上传组件引用也能返回空数组
  const imagesPressure = pressureUploadRef.value ? pressureUploadRef.value.getAllImageUrls() : [];
  const imagesBrandBatch = brandBatchUploadRef.value ? brandBatchUploadRef.value.getAllImageUrls() : [];
  const imagesPreFill = preFillUploadRef.value ? preFillUploadRef.value.getAllImageUrls() : [];
  const imagesScreenClean = screenCleanUploadRef.value ? screenCleanUploadRef.value.getAllImageUrls() : [];
  
  return { imagesPressure, imagesBrandBatch, imagesPreFill, imagesScreenClean };
};

// 提交验证
const publish = async () => {
  if (submitting.value || hasSubmitted.value) return;
  
  try {
    submitting.value = true;
    
    // 检查工单信息是否完整
    if (!myOrder.value.id || !myOrder.value.batchNo || !myOrder.value.brand) {
      uni.showToast({
        title: '工单信息不完整，请刷新页面重试',
        icon: 'none'
      });
      return;
    }
    
    // 检查必填字段
    if (!formData.value.recoveredTobaccoWeight) {
      uni.showToast({
        title: '请输入回收烟沫重量',
        icon: 'none'
      });
      return;
    }
    
    // 先逐个上传所有本地图片
    if (pressureUploadRef.value) {
      await pressureUploadRef.value.triggerUpload();
    }
    if (brandBatchUploadRef.value) {
      await brandBatchUploadRef.value.triggerUpload();
    }
    if (preFillUploadRef.value) {
      await preFillUploadRef.value.triggerUpload();
    }
    if (screenCleanUploadRef.value) {
      await screenCleanUploadRef.value.triggerUpload();
    }
    
    // 获取图片数据
    const imageData = getImageData();
    
    // 验证图片上传
    if (!imageData.imagesPressure || imageData.imagesPressure.length === 0) {
      uni.showToast({
        title: '请上传三压图片',
        icon: 'none'
      });
      return;
    }
    if (!imageData.imagesBrandBatch || imageData.imagesBrandBatch.length === 0) {
      uni.showToast({
        title: '请上传牌号+批次号照片',
        icon: 'none'
      });
      return;
    }
    if (!imageData.imagesPreFill || imageData.imagesPreFill.length === 0) {
      uni.showToast({
        title: '请上传预填充值照片',
        icon: 'none'
      });
      return;
    }
    if (!imageData.imagesScreenClean || imageData.imagesScreenClean.length === 0) {
      uni.showToast({
        title: '请上传筛网清吹照片',
        icon: 'none'
      });
      return;
    }
    
    // 构建验证结果 - 严格匹配后端API要求的结构
    const verificationResult = {
      images: {
        imagesPressure: imageData.imagesPressure || [],
        imagesBrandBatch: imageData.imagesBrandBatch || [],
        imagesPreFill: imageData.imagesPreFill || [],
        imagesScreenClean: imageData.imagesScreenClean || []
      },
      weight: formData.value.recoveredTobaccoWeight,
      state: "normal"
    };
    
    // 准备提交数据 - 确保所有必填字段都存在且格式正确
    const submitData = {
      batchId: myOrder.value.batchNo,  // 使用batchId而不是batchNo
      brand: myOrder.value.brand,
      segment: "喂料机",  // 设备类型
      verificationResult: verificationResult,
      dataCount: 4,  // 图片类型数量
      operatorId: uni.getStorageSync('userId') || '',  // 操作员ID
      workOrderId: myOrder.value.id
    };
    
    // 再次检查提交数据格式
    console.log('最终提交数据格式:', JSON.stringify(submitData, null, 2));
    
    console.log('提交数据:', submitData);
    
    // 调用接口提交数据
    await submitMaterialCheck(submitData);
    
    uni.showToast({
      title: '提交成功',
      icon: 'success'
    });
    hasSubmitted.value = true;
  } catch (error) {
    console.error('提交验证失败:', error);
    uni.showToast({
      title: '提交失败，请重试',
      icon: 'none'
    });
  } finally {
    submitting.value = false;
  }
};

// 三级验证成功处理函数
const handleVerifySuccess = () => {
  uni.showToast({
    title: '三级验证成功',
    icon: 'success'
  });
  // 可以在这里添加验证成功后的额外逻辑，如刷新页面或跳转到其他页面
};

// 三级验证失败处理函数
const handleVerifyFail = (error) => {
  uni.showToast({
    title: `验证失败: ${error.message || '未知错误'}`,
    icon: 'none'
  });
};

// 三级验证过程中的验证处理函数
const handleValidate = (data) => {
  console.log('三级验证步骤信息:', data);
  // data包含step（当前步骤）、success（是否成功）、user（验证用户）等信息
  if (data.success) {
    uni.showToast({
      title: `${data.step === 1 ? '段长' : data.step === 2 ? '跟班' : '车间'}验证通过`,
      icon: 'success',
      duration: 1500
    });
  } else {
    uni.showToast({
      title: `${data.step === 1 ? '段长' : data.step === 2 ? '跟班' : '车间'}验证失败`,
      icon: 'none',
      duration: 1500
    });
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
  margin-bottom: 20rpx;
}

.page-title {
  font-size: 36rpx;
  font-weight: 600;
  color: #333;
  text-align: center;
  display: block;
  margin-bottom: 20rpx;
}

/* 上传区域样式 */
.upload-section {
  background-color: #fff;
  border-radius: 16rpx;
  padding: 20rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
}

.section-title-wrapper {
  display: flex;
  align-items: center;
  margin-bottom: 20rpx;
  padding-bottom: 10rpx;
  border-bottom: 1rpx solid #e8e8e8;
}

.section-main-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
}

.section-sub-title {
  font-size: 28rpx;
  font-weight: 500;
  color: #666;
}

.upload-label {
  display: block;
  font-size: 26rpx;
  color: #666;
  margin: 15rpx 0;
}

.upload-card-item {
  margin-bottom: 20rpx;
}

/* 检查区域样式 */
.check-section {
  margin-bottom: 30rpx;
  padding-bottom: 20rpx;
  border-bottom: 1rpx dashed #e8e8e8;
}

.check-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.check-section-title {
  background-color: #f5f5f5;
  padding: 10rpx 15rpx;
  border-radius: 8rpx;
  margin-bottom: 15rpx;
}

/* 重量输入区域样式 */
.weight-input-section {
  background-color: #f9f9f9;
  padding: 20rpx;
  border-radius: 12rpx;
  margin: 10rpx 0;
}

.form-input {
  width: 100%;
  height: 80rpx;
  background-color: #fff;
  border: 1rpx solid #e8e8e8;
  border-radius: 8rpx;
  padding: 0 20rpx;
  font-size: 28rpx;
  color: #333;
  box-sizing: border-box;
}

/* 按钮区域样式 */
.action-buttons-section {
  background-color: #fff;
  border-radius: 16rpx;
  padding: 20rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
}

.submit-btn {
  margin-bottom: 20rpx;
}

.primary-btn {
  background-color: #007aff;
  border-radius: 8rpx;
}
</style>
