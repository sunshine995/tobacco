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

    <!-- 新增：三级验证按钮 -->
    <VerifyButton
      buttonText="三级验证"
      :batchId="myOrder.batchNo"
      :brand="myOrder.brand"
      segment="机械手"
      :dataCount="3"
      @success="handleVerifySuccess"
      @fail="handleVerifyFail"
      @validate="handleValidate"
    />
  </view>
</template>

<script setup>
import WorkOrderInfoCard from '@/components/orderInfo.vue';
import UploadImage from '@/components/UploadImage.vue';
import VerifyButton from '@/components/VerifyButton.vue'; // 引入三级验证组件
import { ref, nextTick } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { submitMaterialCheck, byBatchIdAndSegment } from '@/api/production.js';

// refs
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

/**
 * 加载已有记录（增强版回显逻辑）
 */
const loadExistingRecord = async (batchNo) => {
  try {
    const record = await byBatchIdAndSegment(batchNo, '机械手');
    console.log('加载历史记录:', record);

    if (!record || !record.verificationResult) return;

    const vr = record.verificationResult;

    // 1. 回显霉变状态
    moldStatus.value = vr.moldStatus || 'no';

    // 2. 回显批次状态
    batchStatus.value = vr.batchStatus || 'normal';

    // 3. 回显批次图片（处理多种格式）
    if (vr.batchImages) {
      let imageUrls = vr.batchImages;

      // 如果是对象，转换为数组
      if (imageUrls && typeof imageUrls === 'object' && !Array.isArray(imageUrls)) {
        console.log('发现 batchImages 为对象格式，已自动转换为数组');
        imageUrls = Object.values(imageUrls);
      }

      // 清理 URL 中的特殊字符和空值
      if (Array.isArray(imageUrls)) {
        imageUrls = imageUrls
          .map(url => typeof url === 'string' ? url.replace(/`/g, '').trim() : url)
          .filter(url => url);
      }

      // 等待 UploadImage 组件挂载后再设置
      nextTick(() => {
        if (batchUploadRef.value && batchUploadRef.value.setPreviewImages) {
          batchUploadRef.value.setPreviewImages(imageUrls);
        }
      });
    }

  } catch (err) {
    console.warn('加载历史记录失败:', err);
  }
};

// 事件处理
const onMoldChange = (e) => {
  moldStatus.value = e.detail.value;
};

const onBatchChange = (e) => {
  batchStatus.value = e.detail.value;
};

/**
 * 提交检查结果
 */
const handleSubmit = async () => {
  // 如果批次异常或霉变，跳转到质量报警页面
  if (batchStatus.value === 'abnormal' || moldStatus.value === 'yes') {
    let qualityAlarmUrl = `/pages/fault/fault-report?quality=true&batchNo=${encodeURIComponent(batchNo.value)}&brand=${encodeURIComponent(brand.value)}`;
    uni.navigateTo({ url: qualityAlarmUrl });
    return;
  }

  // 批次正常：必须验证批次图片
  try {
    // 检查图片数量
    const batchFiles = batchUploadRef.value?.getFiles() || [];
    if (batchFiles.length < 2) {
      uni.showToast({ title: '请上传2张批次验证图片', icon: 'none' });
      return;
    }

    // 触发上传
    await batchUploadRef.value?.triggerUpload();

    // 获取上传成功的图片URL
    const batchUrls = batchUploadRef.value?.getUploadedUrls() || [];
    if (batchUrls.length < 2) {
      throw new Error(`图片上传失败，成功${batchUrls.length}张`);
    }

    // 构造提交数据
    const submitData = {
      batchId: batchNo.value,
      brand: brand.value,
      segment: '机械手',
      verificationResult: {
        moldStatus: moldStatus.value,
        batchStatus: batchStatus.value,
        batchImages: batchUrls,
      },
      dataCount: batchUrls.length,
      operatorId: uni.getStorageSync('userId') || 'unknown'
    };

    console.log('提交数据:', submitData);
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

/**
 * 三级验证成功回调
 */
const handleVerifySuccess = () => {
  uni.showToast({
    title: '三级验证成功',
    icon: 'success'
  });
  // 可以在这里添加跳转或刷新逻辑
};

/**
 * 三级验证失败回调
 */
const handleVerifyFail = (error) => {
  uni.showToast({
    title: `验证失败: ${error.message || '未知错误'}`,
    icon: 'none'
  });
};

/**
 * 三级验证过程回调
 */
const handleValidate = (data) => {
  console.log('验证过程数据:', data);
  // 可以在这里显示加载状态
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