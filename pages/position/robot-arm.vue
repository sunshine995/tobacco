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
          核对批次烟叶配方是否正常(请上传两张照片：1、烟叶配方单  2、最后一包烟叶)
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

      <!-- 提交按钮 -->
      <view class="submit-btn" @click="handleSubmit">
        <text>
          {{ (batchStatus === 'abnormal' || moldStatus === 'yes') ? '进入质量报警' : '提交验证' }}
        </text>
      </view>
    </view>
  </view>
</template>

<script setup>
import WorkOrderInfoCard from '@/components/orderInfo.vue';
import UploadImage from '@/components/UploadImage.vue';
import { ref, nextTick } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { submitMaterialCheck, byBatchIdAndSegment } from '@/api/production.js';

// refs
const moldUploadRef = ref(null);
const batchUploadRef = ref(null);

// 页面参数
const batchNo = ref('');
const brand = ref('');

// 验证状态
const moldStatus = ref('no');      // 'yes' / 'no'
const batchStatus = ref('normal'); // 'normal' / 'abnormal'

// 订单信息
const myOrder = ref({});

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
    const record = await byBatchIdAndSegment(batchNo, '机械手');
	console.log(record)
    if (!record) return;

    // 霉变状态
    moldStatus.value = record.verificationResult.moldStatus || 'no';

    // 批次状态
    batchStatus.value = record.verificationResult.batchStatus || 'normal';
    if (batchStatus.value === 'normal' && record.verificationResult.batchImages?.length) {
      nextTick(() => {
        batchUploadRef.value?.setPreviewImages(record.verificationResult.batchImages);
      });
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

    // 3. 获取上传结果
    const batchUrls = batchUploadRef.value?.getUploadedUrls() || [];

    if (batchUrls.length < 2) {
      uni.showToast({ title: '批次图片上传不完整', icon: 'none' });
      return;
    }

    // 4. 提交数据
    const submitData = {
      batchId: batchNo.value,
      brand: brand.value,
      segment: '机械手',
	  verificationResult:{  // JSON格式的验证结果
	  	moldStatus: moldStatus.value,
	  	batchStatus: batchStatus.value,
	  	batchImages: batchUrls,
	  
	  },
      dataCount: batchUrls.length,
      operatorId: uni.getStorageSync('userId') || 'unknown'
    };

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

.desc-content {
  color: #666;
  font-size: 28rpx;
  line-height: 44rpx;
  margin-bottom: 16rpx;
}
</style>



