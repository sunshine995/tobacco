<template>
  <view class="container">
    <!-- 顶部卡片区域 -->
    <view class="header-card">
      <WorkOrderInfoCard :order-info="myOrder" />
    </view>

    <!-- 上传组件区域 -->
    <view class="upload-section"> 
      <text class="upload-label">牌号+批次号+开料前进柜号</text>
      <!-- 合并为一个图片上传组件 -->
      <UploadImage
        ref="brandBatchCabinetUploadRef"
        title="添加牌号+批次号+开料前进柜号图"
        :max-count="1"
        @success="(e) => handleImageUploadSuccess(e, 'imagesBrandBatchCabinet')"
        @remove="(e) => handleImageRemove(e, 'imagesBrandBatchCabinet')"
        class="upload-card-item"
      />
      <text class="upload-label">来料后拍照</text> 
      <UploadImage
        ref="incomingMaterialUploadRef"
        title="添加来料后拍照"
        :max-count="1"
        @success="(e) => handleImageUploadSuccess(e, 'imagesIncomingMaterial')"
        @remove="(e) => handleImageRemove(e, 'imagesIncomingMaterial')"
        class="upload-card-item"
      />
      <text class="upload-label">尾料拍照</text> 
      <UploadImage
        ref="endMaterialUploadRef"
        title="添加尾料拍照"
        :max-count="1"
        @success="(e) => handleImageUploadSuccess(e, 'imagesEndMaterial')"
        @remove="(e) => handleImageRemove(e, 'imagesEndMaterial')"
        class="upload-card-item"
      />
    </view>

    <!-- 操作按钮区域 -->
    <view class="action-buttons-section">
      <button 
        type="primary" 
        @click="publish"
        :loading="submitting"
        class="submit-btn primary-btn"
        v-if="!hasSubmitted"
      >
        {{ submitting ? '提交中...' : '提交验证' }}
      </button>
      
      <!-- 三级验证按钮 -->
      <VerifyButton 
        buttonText="三级验证" 
        :batchId="myOrder.batchNo" 
        :brand="myOrder.brand" 
        segment="混丝柜" 
        :dataCount="3" 
        @success="handleVerifySuccess" 
        @fail="handleVerifyFail" 
        @validate="handleValidate" 
      />
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import WorkOrderInfoCard from '@/components/orderInfo.vue';
import UploadImage from '@/components/UploadImage.vue';
import VerifyButton from '@/components/VerifyButton.vue';
import { byBatchIdAndSegment, submitMaterialCheck } from '@/api/production.js';

// 订单信息响应式对象
const myOrder = ref({
  id: '',
  batchNo: '',
  brand: ''
});

// 表单数据（图片上传相关）
const form = ref({
  imagesBrandBatchCabinet: [],    // 合并的牌号+批次号+开料前进柜号图（存储{url}格式）
  imagesIncomingMaterial: [],     // 来料后拍照
  imagesEndMaterial: [],     // 尾料拍照
  // 外部图片URL数组，用于组件回显
  externalImagesBrandBatchCabinet: [],
  externalImagesIncomingMaterial: [],
  externalImagesEndMaterial: []
});

// 上传组件引用
const brandBatchCabinetUploadRef = ref(null);
const incomingMaterialUploadRef = ref(null);
const endMaterialUploadRef = ref(null);

// 提交状态（防止重复提交）
const submitting = ref(false);
// 是否已提交状态（用于控制按钮显示）
const hasSubmitted = ref(false);

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
  console.log('验证过程数据:', data);
  // 可以在这里添加验证过程中的逻辑，如显示加载状态等
};

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
  
  loadExistingCheckRecord();
});

// 加载历史检查记录（核心修改：适配组件的externalImages格式）
const loadExistingCheckRecord = async () => {
  if (!myOrder.value || !myOrder.value.batchNo) return;
  
  try {
    console.log('加载历史检查记录，参数:', myOrder.value.batchNo, "混丝柜");
    const res = await byBatchIdAndSegment(myOrder.value.batchNo, "混丝柜");
    console.log('历史检查记录返回数据:', res);
    
    // 清空旧数据
    form.value.imagesBrandBatchCabinet = [];
    form.value.imagesIncomingMaterial = [];
    form.value.imagesEndMaterial = [];

    // request.js已经将res.data.data作为resolve值返回，所以这里的res直接是业务数据
    if (res && res.verificationResult) {
        // 处理verificationResult（如果是字符串则解析）
        const verificationResult = typeof res.verificationResult === 'string'
          ? JSON.parse(res.verificationResult)
          : res.verificationResult;
        
        console.log('解析后的verificationResult:', verificationResult);
        
        const images = verificationResult.images || {};
        console.log('需要回显的图片数据:', images);

        // 使用组件的setPreviewImages方法设置预览图片
        // 确保传递的是字符串URL数组
        const processImageUrls = (urls) => {
          if (!urls || !Array.isArray(urls)) return [];
          return urls.map(item => typeof item === 'string' ? item : (item.url || ''))
                    .filter(url => url);
        };
        
        // 处理合并的图片字段，如果没有新的字段名，则尝试使用旧字段名
        const brandBatchCabinetImages = images.imagesBrandBatchCabinet || images.imagesBrandBatch || images.imagesCabinetNumber;
        if (brandBatchCabinetUploadRef.value && brandBatchCabinetUploadRef.value.setPreviewImages) {
          brandBatchCabinetUploadRef.value.setPreviewImages(processImageUrls(brandBatchCabinetImages));
        }
        if (incomingMaterialUploadRef.value && incomingMaterialUploadRef.value.setPreviewImages) {
          incomingMaterialUploadRef.value.setPreviewImages(processImageUrls(images.imagesIncomingMaterial));
        }
        if (endMaterialUploadRef.value && endMaterialUploadRef.value.setPreviewImages) {
          endMaterialUploadRef.value.setPreviewImages(processImageUrls(images.imagesEndMaterial));
        }
      
      hasSubmitted.value = true;
      console.log('历史记录加载成功，图片已回显');
    } else {
      console.log('无历史检查记录或数据格式不正确');
      hasSubmitted.value = false;
    }
  } catch (error) {
    console.error('加载历史检查记录失败:', error);
    hasSubmitted.value = false;
  }
};

// 图片上传成功处理
const handleImageUploadSuccess = (e, imageType = 'images') => {
  const { file } = e;
  form.value[imageType] = [{
    url: file.previewUrl || file.localPreviewUrl,
    name: file.fileName || file.selectedFileName || 'image.jpg'
  }];
};

// 图片移除处理
const handleImageRemove = (e, imageType = 'images') => {
  form.value[imageType] = [];
};

// 提交图片信息
const publish = async () => {
  if (submitting.value) return;
  submitting.value = true;

  try {
    // 触发上传
    const uploadPromises = [];
    if (brandBatchCabinetUploadRef.value) uploadPromises.push(brandBatchCabinetUploadRef.value.triggerUpload());
    if (incomingMaterialUploadRef.value) uploadPromises.push(incomingMaterialUploadRef.value.triggerUpload());
    if (endMaterialUploadRef.value) uploadPromises.push(endMaterialUploadRef.value.triggerUpload());

    const allResults = await Promise.all(uploadPromises);
    
    // 检查失败的上传
    const failedUploads = allResults.flat().filter(r => !r.success);
    if (failedUploads.length > 0) {
      uni.showToast({
        title: `${failedUploads.length}张图片上传失败`,
        icon: 'none'
      });
      return;
    }

    // 获取上传后的URL
    const imagesBrandBatchCabinet = brandBatchCabinetUploadRef.value.getAllImageUrls();
    const imagesIncomingMaterial = incomingMaterialUploadRef.value.getAllImageUrls();
    const imagesEndMaterial = endMaterialUploadRef.value.getAllImageUrls();

    // 构建提交数据
    const verificationResult = {
      images: {
        imagesBrandBatchCabinet,
        imagesIncomingMaterial,
        imagesEndMaterial
      },
      state: "normal"
    };
    
    const submitData = {
      batchId: myOrder.value.batchNo,
      brand: myOrder.value.brand,
      segment: "混丝柜",
      verificationResult: verificationResult, // 直接传递对象
      dataCount: 3,
      operatorId: uni.getStorageSync('userId') || ''
    };
    
    console.log('准备提交的数据:', submitData);
    
    const res = await submitMaterialCheck(submitData);
    console.log('API调用成功，返回数据:', res);
    
    uni.showModal({
      title: '提交成功',
      content: '您的表单已成功提交！',
      showCancel: false,
      success: () => {
        hasSubmitted.value = true;
      }
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
/* 样式保持不变 */
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
}

.section-main-title {
  font-size: 36rpx;
  font-weight: 600;
  color: #333;
}

.upload-label {
  display: block;
  margin: 20rpx 0 10rpx 0;
  font-size: 28rpx;
  color: #666;
}

.upload-card-item {
  margin-bottom: 20rpx;
}

.action-buttons-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20rpx;
  padding: 0 20rpx;
}

.submit-btn {
  width: 100%;
  max-width: 600rpx;
  height: 88rpx;
  font-size: 32rpx;
}

.primary-btn {
  background-color: #1989fa;
  border-color: #1989fa;
}
</style>

