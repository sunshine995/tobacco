<template>
  <view class="page">
    <WorkOrderInfoCard :order-info="myOrder" />

    <view class="task-list-container">
      <!-- 验证项 1：霉变烟叶 -->
      <view class="verify-section">
        <view class="section-title">【霉变烟叶检查】</view>
        <radio-group @change="onMoldChange">          
          <view class="radio-item">
            <radio value="no" :checked="moldStatus === 'no'" color="#007AFF" />
            <text class="radio-text">否（无霉变）</text>
          </view>
          <view class="radio-item">
            <radio value="yes" :checked="moldStatus === 'yes'" color="#007AFF" />
            <text class="radio-text">是（有霉变）</text>
          </view>
        </radio-group>

      </view>

      <!-- 验证项 2：批次核对 -->
      <view class="verify-section">
        <view class="section-title">【烟叶批次核对】</view>
        <text class="desc-content">
          核对本批次烟包数量是否正常(请上传两张照片：1、烟叶配方单  2、最后一包烟叶)
        </text>
        <radio-group @change="onBatchChange">
          <view class="radio-item">
            <radio value="normal" :checked="batchStatus === 'normal'" color="#007AFF" />
            <text class="radio-text">正常</text>
          </view>
          <view class="radio-item">
            <radio value="abnormal" :checked="batchStatus === 'abnormal'" color="#007AFF" />
            <text class="radio-text">异常</text>
          </view>
        </radio-group>

        <!-- 批次验证图片上传（仅在选择"正常"时显示） -->
        <view v-if="batchStatus === 'normal'" class="photo-section">
          <upload-image
            ref="batchUploadRef"
            :max-count="2"
            title="请上传验证图片"
          />
        </view>
      </view>

        <!-- 几刀几片照片上传 -->
        <view class="upload-section">
          <text class="upload-title">几刀几片</text>
          <upload-image
            ref="brandPhotoRef"
            :max-count="1"
            title="上传图片"
          />
        </view>
        
        <!-- 周转箱数量输入 -->
        <view class="upload-section">
          <text class="upload-title">周转箱数量</text>
          <view class="input-group">
            <u-input 
              type="number" 
              v-model="boxCount"
              class="box-count-input"
              placeholder="请输入周转箱数量"
              min="0"
            />
          </view>
        </view>
        
        <!-- 烟叶重量照片上传 -->
        <view class="upload-section weight-upload-section">
          <text class="upload-title">烟叶重量</text>
          <upload-image
            ref="weightPhotoRef"
            :max-count="1"
            title="上传图片"
          />
        </view>

      <!-- 提交按钮 -->
      <view class="submit-btn" @click="handleSubmit">
        <text>
          {{ (batchStatus === 'abnormal' || moldStatus === 'yes') ? '进入质量报警' : '提交验证' }}
        </text>
      </view>
    </view>
      <!-- 验证按钮 -->
      <VerifyButton 
        buttonText="三级验证" 
        :batchId="myOrder.batchNo" 
        :brand="myOrder.brand" 
        segment="切片机" 
        :dataCount="(batchUrls?.length || 0) + (brandUrls?.length || 0) + (weightUrls?.length || 0)" 
        @success="handleVerifySuccess" 
        @fail="handleVerifyFail" 
        @validate="handleValidate" 
      />
  </view>
</template>

<script setup>
import WorkOrderInfoCard from '@/components/orderInfo.vue';
import UploadImage from '@/components/UploadImage.vue';
import VerifyButton from '@/components/VerifyButton.vue';
import { ref, nextTick } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { submitMaterialCheck, byBatchIdAndSegment } from '@/api/production.js';

// refs
const moldUploadRef = ref(null);
const batchUploadRef = ref(null);
const brandPhotoRef = ref(null);
const weightPhotoRef = ref(null); // 烟叶重量照片引用

// 页面参数
const batchNo = ref('');
const brand = ref('');

// 验证状态
const moldStatus = ref('no');      // 'yes' / 'no'
const batchStatus = ref('normal'); // 'normal' / 'abnormal'
const boxCount = ref('');          // 周转箱数量

// 订单信息
const myOrder = ref({});

// 三级验证成功处理函数
const handleVerifySuccess = () => {
  uni.showToast({
    title: '三级验证成功',
    icon: 'success'
  });
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
};

// 页面加载
onLoad(async (options) => {
  batchNo.value = options.batchNo ? decodeURIComponent(options.batchNo) : '';
  brand.value = options.brand ? decodeURIComponent(options.brand) : '';
  myOrder.value = { batchNo: batchNo.value, brand: brand.value };

  // 尝试加载历史记录（用于回显）
  if (batchNo.value) {
    await loadExistingRecord(batchNo.value);
  }
});

// 加载已有记录（回显）
const loadExistingRecord = async (batchNo) => {
  try {
    const record = await byBatchIdAndSegment(batchNo, '切片机');
    console.log('加载历史记录:', record);
    if (!record) return;

    // 霉变状态
    moldStatus.value = record.verificationResult.moldStatus || 'no';

    // 批次状态
    batchStatus.value = record.verificationResult.batchStatus || 'normal';
    
    // 批次图片回显
    if (batchStatus.value === 'normal' && record.verificationResult.batchImages?.length) {
      nextTick(() => {
        batchUploadRef.value?.setPreviewImages(record.verificationResult.batchImages);
      });
    }
    
    // 几刀几片照片回显
    if (record.verificationResult.brandImages?.length) {
      nextTick(() => {
        brandPhotoRef.value?.setPreviewImages(record.verificationResult.brandImages);
      });
    }
    
    // 周转箱数量回显
    if (record.verificationResult.boxCount) {
      boxCount.value = record.verificationResult.boxCount;
    }
    
    // 烟叶重量照片回显
    if (record.verificationResult.weightImages?.length) {
      nextTick(() => {
        weightPhotoRef.value?.setPreviewImages(record.verificationResult.weightImages);
      });
    }
    
    // 检查是否有整合的images字段（用于三级验证）
    if (record.verificationResult.images && Array.isArray(record.verificationResult.images) && record.verificationResult.images.length > 0) {
      console.log('找到整合的验证图片:', record.verificationResult.images);
    }
  } catch (err) {
    console.warn('加载历史记录失败', err);
  }
};

// 事件处理
const onMoldChange = (e) => {
  moldStatus.value = e.detail.value;
};

const onBatchChange = (e) => {
  batchStatus.value = e.detail.value;
};

// 提交
const handleSubmit = async () => {
  // 如果批次异常或霉变，跳转到质量报警页面
  if (batchStatus.value === 'abnormal' || moldStatus.value === 'yes') {
    // 构建参数传递给质量报警页面
    let qualityAlarmUrl = '/pages/fault/fault-report?quality=true';
    
    uni.navigateTo({ 
      url: qualityAlarmUrl 
    });
    return;
  }

  // 批次正常：必须验证霉变和批次图片
  try {
    // 批次验证：必须2张图
    const batchFiles = batchUploadRef.value?.getFiles() || [];
    if (batchFiles.length < 2) {
      uni.showToast({ title: '请上传2张批次验证图片', icon: 'none' });
      return;
    }
    await batchUploadRef.value?.triggerUpload();
    
    // 几刀几片照片验证
    const brandFiles = brandPhotoRef.value?.getFiles() || [];
    if (brandFiles.length < 1) {
      uni.showToast({ title: '请上传几刀几片照片', icon: 'none' });
      return;
    }
    await brandPhotoRef.value?.triggerUpload();
    
    // 周转箱数量验证
    if (!boxCount.value || boxCount.value <= 0) {
      uni.showToast({ title: '请输入有效的周转箱数量', icon: 'none' });
      return;
    }
    
    // 烟叶重量照片验证
    const weightFiles = weightPhotoRef.value?.getFiles() || [];
    if (weightFiles.length < 1) {
      uni.showToast({ title: '请上传烟叶重量照片', icon: 'none' });
      return;
    }
    await weightPhotoRef.value?.triggerUpload();

    // 获取上传结果
    const batchUrls = batchUploadRef.value?.getUploadedUrls() || [];
    const brandUrls = brandPhotoRef.value?.getUploadedUrls() || [];
    const weightUrls = weightPhotoRef.value?.getUploadedUrls() || [];

    if (batchUrls.length < 2) {
      uni.showToast({ title: '批次图片上传不完整', icon: 'none' });
      return;
    }
    
    if (brandUrls.length < 1) {
      uni.showToast({ title: '几刀几片照片上传失败', icon: 'none' });
      return;
    }
    
    if (weightUrls.length < 1) {
      uni.showToast({ title: '烟叶重量照片上传失败', icon: 'none' });
      return;
    }

    // 提交数据 - 适配verification_data表结构，便于三级验证使用
    const submitData = {
      batchId: batchNo.value,
      brand: brand.value,
      segment: '切片机',
      verificationResult:{
        moldStatus: moldStatus.value,
        batchStatus: batchStatus.value,
        batchImages: batchUrls,
        brandImages: brandUrls,
        boxCount: boxCount.value,
        weightImages: weightUrls,
        images: [...(batchUrls || []), ...(brandUrls || []), ...(weightUrls || [])] // 整合所有图片，用于三级验证
      },
      dataCount: (batchUrls?.length || 0) + (brandUrls?.length || 0) + (weightUrls?.length || 0), // 总图片数量
      operatorId: uni.getStorageSync('userId') || 'unknown'
    };

    console.log('提交验证数据:', submitData);
    await submitMaterialCheck(submitData);

    uni.showToast({ title: '提交成功', icon: 'success' });
    setTimeout(() => {
      uni.navigateBack();
    }, 1500);
  } catch (error) {
    console.error('提交失败:', error);
    uni.showToast({ title: error.message || '提交失败', icon: 'none' });
  }
};
</script>

<style scoped>
.page {
  padding: 20rpx;
  background-color: #f5f5f5;
  min-height: 100vh;
}

.task-list-container {
  margin-top: 20rpx;
  background-color: #fff;
  border-radius: 12rpx;
  padding: 20rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
}

.verify-section {
  margin-bottom: 30rpx;
  padding-bottom: 20rpx;
  border-bottom: 1rpx solid #eee;
}

.verify-section:last-child {
  border-bottom: none;
}

.section-title {
  font-weight: bold;
  color: #333;
  font-size: 32rpx;
  margin-bottom: 16rpx;
}

.radio-group {
  margin-bottom: 16rpx;
}

.radio-item {
  display: flex;
  align-items: center;
  padding: 16rpx 0;
  border-bottom: 1rpx solid #eee;
}

.radio-item:last-child {
  border-bottom: none;
}

.radio-text {
  margin-left: 16rpx;
  font-size: 28rpx;
  color: #333;
}

.photo-section {
  margin-top: 16rpx;
}

.upload-section {
  margin-bottom: 30rpx;
  padding-bottom: 20rpx;
}

.upload-title {
  font-weight: bold;
  color: #333;
  font-size: 32rpx;
  margin-bottom: 16rpx;
  display: block;
}

.submit-btn {
  width: 100%;
  padding: 20rpx;
  background-color: #007AFF;
  color: white;
  text-align: center;
  font-size: 28rpx;
  border-radius: 8rpx;
  margin-top: 30rpx;
  margin-bottom: 30rpx;
}

/* 三级验证按钮样式 - 与页面风格保持一致 */
.verify-section {
  margin-bottom: 30rpx;
  padding-bottom: 20rpx;
}

.desc-content {
  color: #666;
  font-size: 28rpx;
  line-height: 44rpx;
  margin-bottom: 16rpx;
}

/* 周转箱数量输入样式 */
.input-group {
  margin-bottom: 40rpx;
}

.box-count-input {
  width: 100%;
  padding: 20rpx;
  border: 2rpx solid #e0e0e0;
  border-radius: 8rpx;
  font-size: 28rpx;
  color: #333;
  background-color: #f9f9f9;
  box-sizing: border-box;
}

.box-count-input:focus {
  border-color: #007AFF;
  background-color: #fff;
  outline: none;
}

/* 确保烟叶重量上传部分与其他上传部分样式一致 */
.weight-upload-section {
  margin-bottom: 30rpx;
  padding-bottom: 20rpx;
}
</style>




