<template>
  <view class="container">
    <!-- 顶部卡片区域 -->
    <view class="header-card">
      <WorkOrderInfoCard :order-info="myOrder" />
    </view>
    
    <!-- 页面内容 -->
    <view class="content-section">

      
      <!-- 箱子实际进入巷道照片上传（必填） -->
      <view class="verify-section">
        <view class="section-title">【箱子实际进入巷道照片】</view>
        <text class="desc-content" style="color: #E64340;">必填：请上传箱子实际进入巷道的照片</text>
        <view class="photo-section">
          <upload-image
            ref="tunnelUploadRef"
            :max-count="1"
            title="添加巷道照片"
          />
        </view>
      </view>
      
      <!-- 入库烟丝实际存放位置照片上传（非必填） -->
      <view class="verify-section">
        <view class="section-title">【入库烟丝实际存放位置照片】</view>
        <text class="desc-content">非必填：请上传入库烟丝实际存放位置的照片</text>
        <view class="photo-section">
          <upload-image
            ref="storageUploadRef"
            :max-count="3"
            title="添加存放位置照片"
          />
        </view>
      </view>
      
      <!-- 充电间正常与否选择 -->
      <view class="verify-section">
        <view class="section-title">【充电间状态】</view>
        <radio-group @change="onChargingRoomChange">
          <view class="radio-item">
            <radio value="normal" :checked="chargingRoomStatus === 'normal'" color="#007AFF" />
            <text class="radio-text">正常</text>
          </view>
          <view class="radio-item">
            <radio value="abnormal" :checked="chargingRoomStatus === 'abnormal'" color="#007AFF" />
            <text class="radio-text">异常</text>
          </view>
        </radio-group>
      </view>
      
      <!-- 提交按钮 -->
      <view class="submit-btn" @click="handleSubmit">
        <text>{{ submitting ? '提交中...' : '提交' }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, nextTick } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import WorkOrderInfoCard from '@/components/orderInfo.vue';
import UploadImage from '@/components/UploadImage.vue';
import { submitMaterialCheck, byBatchIdAndSegment } from '@/api/production.js';

// refs
const tunnelUploadRef = ref(null);
const storageUploadRef = ref(null);

// 订单信息响应式对象
const myOrder = ref({
  id: '',
  batchNo: '',
  brand: ''
});

// 状态变量
const chargingRoomStatus = ref('normal'); // 'normal' / 'abnormal'
const submitting = ref(false);

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

// 加载已有记录（用于回显）
const loadExistingRecord = async (batchNo) => {
  try {
    const record = await byBatchIdAndSegment(batchNo, '丝库');
    console.log('加载到的记录:', record);
    if (!record) return;

    // 充电间状态
    if (record.verificationResult?.chargingRoomStatus) {
      chargingRoomStatus.value = record.verificationResult.chargingRoomStatus;
    }

    // 巷道照片
    if (record.verificationResult?.tunnelImages?.length) {
      nextTick(() => {
        tunnelUploadRef.value?.setPreviewImages(record.verificationResult.tunnelImages);
      });
    }

    // 存放位置照片
    if (record.verificationResult?.storageImages?.length) {
      nextTick(() => {
        storageUploadRef.value?.setPreviewImages(record.verificationResult.storageImages);
      });
    }
  } catch (err) {
    console.warn('加载历史记录失败', err);
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
  
  // 尝试加载历史记录（用于回显）
  if (myOrder.value.batchNo) {
    loadExistingRecord(myOrder.value.batchNo);
  }
});

// 充电间状态变更
const onChargingRoomChange = (e) => {
  chargingRoomStatus.value = e.detail.value;
};

// 提交
const handleSubmit = async () => {
  if (submitting.value) return;
  
  // 验证必填项
  const tunnelFiles = tunnelUploadRef.value?.getFiles() || [];
  if (tunnelFiles.length === 0) {
    uni.showToast({ title: '请上传箱子实际进入巷道的照片', icon: 'none' });
    return;
  }
  
  submitting.value = true;
  try {
    // 如果充电间异常，跳转到质量报警页面
    if (chargingRoomStatus.value === 'abnormal') {
      // 构建参数传递给质量报警页面
      let qualityAlarmUrl = '/pages/fault/fault-report?quality=true';
      uni.navigateTo({ 
        url: qualityAlarmUrl 
      });
      return;
    }

    // 上传图片（非必填）
    let tunnelUrls = [];
    let storageUrls = [];
    
    // 上传巷道照片
    const tunnelFiles = tunnelUploadRef.value?.getFiles() || [];
    if (tunnelFiles.length > 0) {
      await tunnelUploadRef.value?.triggerUpload();
      tunnelUrls = tunnelUploadRef.value?.getUploadedUrls() || [];
    }
    
    // 上传存放位置照片
    const storageFiles = storageUploadRef.value?.getFiles() || [];
    if (storageFiles.length > 0) {
      await storageUploadRef.value?.triggerUpload();
      storageUrls = storageUploadRef.value?.getUploadedUrls() || [];
    }

    // 提交数据
    const submitData = {
      batchId: myOrder.value.batchNo,
      brand: myOrder.value.brand,
      segment: '丝库',
      verificationResult: {
        chargingRoomStatus: chargingRoomStatus.value,
        tunnelImages: tunnelUrls,
        storageImages: storageUrls
      },
      dataCount: tunnelUrls.length + storageUrls.length,
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
  padding: 20rpx;
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