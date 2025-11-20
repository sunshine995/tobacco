<template>
  <view class="container">
    <view class="form-container">
      <!-- 顶部卡片区域 -->
      <view class="header-card">
        <WorkOrderInfoCard :order-info="myOrder" />
      </view>

      <!-- 一、开班检查项目 -->
      <view class="form-group" v-if="myOrder.number && (myOrder.number.includes('预混柜') || myOrder.number.trim() === '1' || myOrder.number.includes('1'))">
        <h2 class="group-title">开班检查项目</h2>
        <!-- 皮带照片上传 -->
        <view class="form-row">
          <label class="form-label">皮带照片</label>
          <upload-image 
            ref="beltPhotoRef"
            :max-count="1"
            title="皮带照片"
            @select="onImageSelect('beltPhoto', $event)"
            @success="onImageUploadSuccess('beltPhoto', $event)"
            @fail="onImageUploadFail('beltPhoto', $event)"
          />
          <view class="photo-tip">提示：拍摄皮带整体状态，重点展示是否跑偏、破损</view>
        </view>
        
        <!-- 提交验证按钮（直接上传数据库） -->
        <button type="button" class="submit-btn section-submit-btn" 
                @click="submitToDatabase('startup')" 
                :loading="submitting" 
                :disabled="submitting">
          {{ submitting ? '提交中...' : '提交验证' }}
        </button>
        <view class="save-status" v-if="saveStatus.startup">
          <text class="status-icon" :class="saveStatus.startup === 'success' ? 'success' : 'error'">{{ saveStatus.startup === 'success' ? '✓' : '✗' }}</text>
          <text class="status-text">{{ saveStatus.startup === 'success' ? '已提交数据库' : '提交失败' }}</text>
        </view>
      </view>

      <!-- 二、开料中检查项目 -->
      <view class="form-group feed-ingroup">
        <h2 class="group-title">开料中检查项目</h2>
        <!-- 风门开度照片上传 -->
        <view class="form-row">
          <label class="form-label">再造过完风门开度照片</label>
          <upload-image 
            ref="damperOpeningRef"
            :max-count="1"
            title="风门开度照片"
            @select="onImageSelect('damperOpening', $event)"
            @success="onImageUploadSuccess('damperOpening', $event)"
            @fail="onImageUploadFail('damperOpening', $event)"
          />
          <view class="photo-tip">提示：拍摄风门开度显示，确保开度值清晰可见</view>
        </view>
        
        <!-- 提交验证按钮（直接上传数据库） -->
        <button type="button" class="submit-btn section-submit-btn" 
                @click="submitToDatabase('feedIng')" 
                :loading="submitting" 
                :disabled="submitting">
          {{ submitting ? '提交中...' : '提交验证' }}
        </button>
        <view class="save-status" v-if="saveStatus.feedIng">
          <text class="status-icon" :class="saveStatus.feedIng === 'success' ? 'success' : 'error'">{{ saveStatus.feedIng === 'success' ? '✓' : '✗' }}</text>
          <text class="status-text">{{ saveStatus.feedIng === 'success' ? '已提交数据库' : '提交失败' }}</text>
        </view>
      </view>

      <!-- 三、料结束检查项目 -->
      <view class="form-group feed-post-group">
        <h2 class="group-title">料结束检查项目</h2>
        <!-- 杂物照片上传 -->
        <view class="form-row">
          <label class="form-label">杂物照片</label>
          <upload-image 
            ref="debrisPhotoRef"
            :max-count="1"
            title="杂物照片"
            @select="onImageSelect('debrisPhoto', $event)"
            @success="onImageUploadSuccess('debrisPhoto', $event)"
            @fail="onImageUploadFail('debrisPhoto', $event)"
          />
          <view class="photo-tip">提示：拍摄杂物清理情况</view>
        </view>
        
        <!-- 剔除梗签重量 -->
        <view class="form-row">
          <label class="form-label">剔除梗签重量 (kg)</label>
          <input type="number" step="0.1" v-model.number="formData.stemWeight" class="form-input" placeholder="请输入剔除梗签重量">
        </view>
        
        <!-- 烟饼重量 -->
        <view class="form-row">
          <label class="form-label">烟饼重量 (kg)</label>
          <input type="number" step="0.1" v-model.number="formData.cakeWeight" class="form-input" placeholder="请输入烟饼重量">
        </view>
        
        <!-- 提交验证按钮（直接上传数据库） -->
        <button type="button" class="submit-btn section-submit-btn" 
                @click="submitToDatabase('feedPost')" 
                :loading="submitting" 
                :disabled="submitting">
          {{ submitting ? '提交中...' : '提交验证' }}
        </button>
        <view class="save-status" v-if="saveStatus.feedPost">
          <text class="status-icon" :class="saveStatus.feedPost === 'success' ? 'success' : 'error'">{{ saveStatus.feedPost === 'success' ? '✓' : '✗' }}</text>
          <text class="status-text">{{ saveStatus.feedPost === 'success' ? '已提交数据库' : '提交失败' }}</text>
        </view>
      </view>
      
      <!-- 三级验证按钮 -->
      <VerifyButton 
        buttonText="三级验证" 
        :batchId="myOrder.batchNo" 
        :brand="myOrder.brand" 
        segment="激光除杂" 
        :dataCount="3" 
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

// 表单数据（整合所有模块数据）
const formData = ref({
  stemWeight: '',
  cakeWeight: '',
  images: {
    beltPhoto: [],
    damperOpening: [],
    debrisPhoto: []
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
const beltPhotoRef = ref(null);
const damperOpeningRef = ref(null);
const debrisPhotoRef = ref(null);

// 提交状态（全局统一，避免同时提交）
const submitting = ref(false);

// 各模块提交状态（区分显示）
const saveStatus = ref({
  startup: '',
  feedIng: '',
  feedPost: ''
});

// 本地缓存的历史数据（用于提交时携带）
const localHistoryData = ref({
  startup: null,
  feedIng: null,
  feedPost: null
});

// 确保数据结构正确
const ensureDataStructure = () => {
  if (localHistoryData.value.feeding !== undefined) {
    localHistoryData.value.feedIng = localHistoryData.value.feedIng || localHistoryData.value.feeding;
    delete localHistoryData.value.feeding;
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
  
  // 加载历史数据（本地缓存+数据库记录）
  if (myOrder.value.batchNo) {
    loadHistoryData();
  } else {
    console.error('未获取到有效的工单信息，无法加载历史数据');
  }
});

// 页面卸载时保存当前工单信息到全局状态
onUnload(() => {
  try {
    const app = getApp();
    if (app?.globalData && myOrder.value?.batchNo) {
      app.globalData.currentOrder = { ...myOrder.value };
    }
  } catch (e) {
    console.error('保存工单信息到全局状态失败:', e);
  }
});

// 加载历史数据（本地缓存+数据库记录）
const loadHistoryData = async () => {
  try {
    // 1. 加载本地缓存数据
    loadFromLocalStorage();
    
    // 2. 加载数据库历史记录（优先数据库数据）
    const dbData = await byBatchIdAndSegment(myOrder.value.batchNo, "激光除杂");
    if (dbData && dbData.verificationResult) {
      const verificationResult = typeof dbData.verificationResult === 'string' 
        ? JSON.parse(dbData.verificationResult) 
        : dbData.verificationResult;
      
      // 回显表单数据
      formData.value.stemWeight = verificationResult.stemWeight || '';
      formData.value.cakeWeight = verificationResult.cakeWeight || '';
      
      // 回显图片
      const images = verificationResult.images || {};
      await nextTick();
      
      if (images.beltPhoto && images.beltPhoto.length > 0 && beltPhotoRef.value) {
        beltPhotoRef.value.setPreviewImages(images.beltPhoto);
        localHistoryData.value.startup = { images: { beltPhoto: images.beltPhoto } };
      }
      if (images.damperOpening && images.damperOpening.length > 0 && damperOpeningRef.value) {
        damperOpeningRef.value.setPreviewImages(images.damperOpening);
        localHistoryData.value.feedIng = { images: { damperOpening: images.damperOpening } };
      }
      if (images.debrisPhoto && images.debrisPhoto.length > 0 && debrisPhotoRef.value) {
        debrisPhotoRef.value.setPreviewImages(images.debrisPhoto);
        localHistoryData.value.feedPost = { 
          stemWeight: verificationResult.stemWeight || '',
          cakeWeight: verificationResult.cakeWeight || '',
          images: { debrisPhoto: images.debrisPhoto } 
        };
      }
      
      // 更新提交状态
      saveStatus.value = {
        startup: images.beltPhoto?.length ? 'success' : '',
        feedIng: images.damperOpening?.length ? 'success' : '',
        feedPost: verificationResult.stemWeight ? 'success' : ''
      };
    }
  } catch (e) {
    console.error('加载历史数据失败:', e);
  }
};

// 从本地存储加载数据
const loadFromLocalStorage = () => {
  try {
    const startupData = uni.getStorageSync(`laser_cleaning_startup_${myOrder.value.batchNo}`);
    const feedIngData = uni.getStorageSync(`laser_cleaning_feedIng_${myOrder.value.batchNo}`);
    const feedPostData = uni.getStorageSync(`laser_cleaning_feedPost_${myOrder.value.batchNo}`);
    
    if (startupData) localHistoryData.value.startup = startupData;
    if (feedIngData) localHistoryData.value.feedIng = feedIngData;
    if (feedPostData) localHistoryData.value.feedPost = feedPostData;
    
    ensureDataStructure();
  } catch (error) {
    console.error('从本地加载失败:', error);
  }
};

// 图片选择事件
const onImageSelect = (type, files) => {
  console.log(`${type} 选择图片:`, files);
  if (!formData.value.images[type]) formData.value.images[type] = [];
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

// 显示提示消息
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
    console.warn('uni.showToast API不可用:', e);
  }
};

// 保存到本地存储
const saveToLocalStorage = (section, data) => {
  try {
    const key = `laser_cleaning_${section}_${myOrder.value.batchNo}`;
    uni.setStorageSync(key, data);
    localHistoryData.value[section] = data;
    return true;
  } catch (e) {
    console.error('保存到本地存储失败:', e);
    return false;
  }
};

// 核心：提交到数据库（携带所有历史数据）
const submitToDatabase = async (section) => {
  // 1. 验证当前模块必填项
  if (!validateSection(section)) return;
  
  submitting.value = true;
  saveStatus.value[section] = '';
  
  try {
    // 2. 触发当前模块图片上传
    const { uploadedUrls, currentData } = await uploadSectionImages(section);
    
    // 3. 保存到本地缓存
    saveToLocalStorage(section, currentData);
    
    // 4. 构建完整提交数据（整合所有历史数据）
    const submitData = buildCompleteSubmitData(section, uploadedUrls);
    
    // 5. 调用API提交到数据库
    await submitMaterialCheck(submitData);
    
    // 6. 更新状态
    saveStatus.value[section] = 'success';
    showToastMessage(`${getSectionName(section)}已提交数据库`);
    
  } catch (error) {
    console.error(`${section}提交失败:`, error);
    saveStatus.value[section] = 'error';
    showToastMessage('提交失败，请重试', 'error');
  } finally {
    submitting.value = false;
  }
};

// 验证当前模块必填项
const validateSection = (section) => {
  switch (section) {
    case 'startup':
      // 开班检查非必填，无需强制验证
      return true;
    case 'feedIng':
      if (damperOpeningRef.value && damperOpeningRef.value.getAllFiles && damperOpeningRef.value.getAllFiles().length === 0) {
        showToastMessage('请上传再造过完风门开度照片', 'error');
        return false;
      }
      return true;
    case 'feedPost':
      if (!formData.value.stemWeight && formData.value.stemWeight !== 0) {
        showToastMessage('请输入剔除梗签重量', 'error');
        return false;
      }
      if (!formData.value.cakeWeight && formData.value.cakeWeight !== 0) {
        showToastMessage('请输入烟饼重量', 'error');
        return false;
      }
      return true;
    default:
      return true;
  }
};

// 上传当前模块图片
const uploadSectionImages = async (section) => {
  let uploadedUrls = [];
  let currentData = {};
  
  switch (section) {
    case 'startup':
      if (beltPhotoRef.value && beltPhotoRef.value.getFiles && beltPhotoRef.value.getFiles().length > 0) {
        await beltPhotoRef.value.triggerUpload();
        uploadedUrls = beltPhotoRef.value.getUploadedUrls() || [];
      }
      currentData = {
        images: { beltPhoto: uploadedUrls },
        savedAt: new Date().toISOString()
      };
      break;
      
    case 'feedIng':
      if (damperOpeningRef.value && damperOpeningRef.value.getFiles && damperOpeningRef.value.getFiles().length > 0) {
        await damperOpeningRef.value.triggerUpload();
        uploadedUrls = damperOpeningRef.value.getUploadedUrls() || [];
      }
      currentData = {
        images: { damperOpening: uploadedUrls },
        savedAt: new Date().toISOString()
      };
      break;
      
    case 'feedPost':
      if (debrisPhotoRef.value && debrisPhotoRef.value.getFiles && debrisPhotoRef.value.getFiles().length > 0) {
        await debrisPhotoRef.value.triggerUpload();
        uploadedUrls = debrisPhotoRef.value.getUploadedUrls() || [];
      }
      currentData = {
        stemWeight: formData.value.stemWeight,
        cakeWeight: formData.value.cakeWeight,
        images: { debrisPhoto: uploadedUrls },
        savedAt: new Date().toISOString()
      };
      break;
  }
  
  return { uploadedUrls, currentData };
};

// 构建完整提交数据（整合所有历史数据）
const buildCompleteSubmitData = (section, uploadedUrls) => {
  // 从本地历史数据中获取其他模块的数据
  const startupData = localHistoryData.value.startup || {};
  const feedIngData = localHistoryData.value.feedIng || {};
  const feedPostData = localHistoryData.value.feedPost || {};
  
  // 整合所有图片URL
  const allImages = {
    beltPhoto: startupData.images?.beltPhoto || [],
    damperOpening: feedIngData.images?.damperOpening || [],
    debrisPhoto: feedPostData.images?.debrisPhoto || []
  };
  
  // 更新当前模块的图片URL
  switch (section) {
    case 'startup':
      allImages.beltPhoto = uploadedUrls;
      break;
    case 'feedIng':
      allImages.damperOpening = uploadedUrls;
      break;
    case 'feedPost':
      allImages.debrisPhoto = uploadedUrls;
      break;
  }
  
  // 构建提交数据
  return {
    batchId: myOrder.value.batchNo,
    brand: myOrder.value.brand,
    segment: "激光除杂",
    verificationResult: {
      stemWeight: feedPostData.stemWeight !== undefined ? parseFloat(feedPostData.stemWeight) : null,
      cakeWeight: feedPostData.cakeWeight !== undefined ? parseFloat(feedPostData.cakeWeight) : null,
      images: allImages
    },
    dataCount: 3,
    operatorId: uni.getStorageSync('userId') || ''
  };
};

// 获取模块名称（用于提示消息）
const getSectionName = (section) => {
  switch (section) {
    case 'startup':
      return '开班检查项目';
    case 'feedIng':
      return '开料中检查项目';
    case 'feedPost':
      return '料结束检查项目';
    default:
      return '检查项目';
  }
};

// 重置表单（如需使用可保留）
const resetForm = () => {
  formData.value = {
    stemWeight: '',
    cakeWeight: '',
    images: {
      beltPhoto: [],
      damperOpening: [],
      debrisPhoto: []
    }
  };
  
  const resetRefs = [beltPhotoRef, damperOpeningRef, debrisPhotoRef];
  resetRefs.forEach(ref => {
    if (ref.value && ref.value.reset) {
      ref.value.reset();
    }
  });
};

// 三级验证成功处理
const handleVerifySuccess = () => {
  showToastMessage('三级验证成功');
};

// 三级验证失败处理
const handleVerifyFail = () => {
  showToastMessage('三级验证失败', 'error');
};

// 三级验证过程数据处理
const handleValidate = (data) => {
  console.log('三级验证过程数据:', data);
};
</script>

<style scoped>
.container {
  padding: 20px;
  background: #f5f5f5;
  min-height: 100vh;
}

.form-container {
  max-width: 1000px;
  margin: 0 auto;
  background: #fff;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 0 10px rgba(0,0,0,0.1);
}

.header-card {
  background-color: #fff;
  border-radius: 12rpx;
  padding: 20rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
}

.form-group {
  margin-bottom: 35px;
}

.group-title {
  font-size: 18px;
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 15px;
  padding-left: 10px;
  border-left: 4px solid #3498db;
}

.form-row {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin-bottom: 20px;
  align-items: center;
}

.form-label {
  flex: 0 0 160px;
  font-weight: 500;
  color: #444;
}

.form-input {
  flex: 1;
  min-width: 220px;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
}

.form-input:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 5px rgba(52,152,219,0.3);
}

.photo-tip {
  margin-top: 10px;
  font-size: 14px;
  color: #666;
}

.submit-btn {
  width: 100%;
  padding: 20rpx;
  background-color: #007AFF;
  color: white;
  text-align: center;
  font-size: 28rpx;
  border-radius: 8rpx;
  margin-top: 20rpx;
}

.submit-btn:hover {
  background: #2980b9;
  transform: translateY(-2px);
  box-shadow: 0 3px 8px rgba(52,152,219,0.2);
}

.submit-btn:disabled {
  background: #95a5a6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.section-submit-btn {
  margin-bottom: 20px;
}

.save-status {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 10px;
  font-size: 14px;
}

.status-icon {
  font-size: 18px;
  margin-right: 5px;
}

.status-icon.success {
  color: #4CAF50;
}

.status-icon.error {
  color: #F44336;
}

.status-text {
  color: #666;
}

.feed-ingroup {
  border-top: 2px dashed #eee;
  padding-top: 25px;
  margin-top: 10px;
}

.feed-ingroup .group-title {
  border-left-color: #f39c12;
}

.feed-post-group {
  border-top: 2px dashed #eee;
  padding-top: 25px;
  margin-top: 10px;
}

.feed-post-group .group-title {
  border-left-color: #e74c3c;
}
</style>