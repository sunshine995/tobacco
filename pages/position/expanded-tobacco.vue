<template>
  <view class="page">
    <WorkOrderInfoCard :order-info="myOrder" />
    
    <!-- 任务列表模块 -->
    <view class="task-list-container">
      <!-- 牌号和批次号拍照 -->
      <view class="photo-section">
        <view class="section-title">
          <text class="required">*</text>
          <text>牌号和批次号</text>
        </view>
        <upload-image
          ref="brandBatchRef"
          :max-count="1"
          title="上传图片"
        />
      </view>

      <!-- 掺对比例拍照 -->
      <view class="photo-section">
        <view class="section-title">
          <text class="required">*</text>
          <text>掺对比例</text>
        </view>
        <upload-image
          ref="mixRatioRef"
          :max-count="1"
          title="上传图片"
        />
      </view>

      <!-- 填充拍照 -->
      <view class="photo-section">
        <view class="section-title">
          <text class="required">*</text>
          <text>填充</text>
        </view>
        <upload-image
          ref="fillingRef"
          :max-count="1"
          title="上传图片"
        />
      </view>

      <!-- 掺对公斤数输入 -->
      <view class="photo-section">
        <view class="section-title">
          <text class="required">*</text>
          <text>掺对公斤数</text>
        </view>
        <view class="input-container">
          <u-input
            v-model="mixWeight"
            type="number"
            placeholder="请输入掺对公斤数"
            class="weight-input"
            @change="handleWeightInput"
            border="none"
          />
        </view>
      </view>

      <!-- 提交按钮 -->
      <view class="submit-btn" @click="submitCheck">
        <text>提交验证</text>
      </view>
      
      <!-- 三级验证按钮 -->
      <VerifyButton 
        buttonText="三级验证" 
        :batchId="myOrder.batchNo" 
        :brand="myOrder.brand" 
        segment="膨化烟丝" 
        :dataCount="3" 
        @success="handleVerifySuccess" 
        @fail="handleVerifyFail" 
        @validate="handleValidate" 
      />
    </view>
  </view>
</template>

<script setup>
import WorkOrderInfoCard from '@/components/orderInfo.vue';
import { ref, nextTick } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import UploadImage from '@/components/UploadImage.vue';
import VerifyButton from '@/components/VerifyButton.vue';
import { submitMaterialCheck, byBatchIdAndSegment } from '@/api/production.js';

// 上传组件的ref
const brandBatchRef = ref(null);
const mixRatioRef = ref(null);
const fillingRef = ref(null);

const submitting = ref(false); // 提交状态

// 定义响应式变量
const id = ref('');
const batchNo = ref('');
const brand = ref('');
const mixWeight = ref(''); // 掺对公斤数

// 页面加载时接收参数
onLoad((options) => {
  console.log('页面加载参数:', options);
  id.value = options.id ? decodeURIComponent(options.id) : '';
  batchNo.value = options.batchNo ? decodeURIComponent(options.batchNo) : '';
  brand.value = options.brand ? decodeURIComponent(options.brand) : '';
  
  // 方式1：从URL参数更新myOrder
  if (batchNo.value || brand.value) {
    myOrder.value = {
      id: id.value,
      batchNo: batchNo.value,
      brand: brand.value,
      number: options.number ? decodeURIComponent(options.number) : '',
      yield: options.yield ? decodeURIComponent(options.yield) : ''
    };
    console.log('通过URL参数更新订单信息:', myOrder.value);
  } else {
    // 方式2：如果URL参数没有，则尝试从全局状态获取
    getDataFromGlobal();
  }
  
  // 尝试加载已有核对记录
  if (myOrder.value.batchNo) {
    loadExistingCheckRecord(myOrder.value.batchNo);
  }
});

// 创建订单信息响应式对象
const myOrder = ref({
  id: '',
  batchNo: '',
  brand: '',
  number: '',
  yield: ''
});

// 从全局状态获取数据的函数
const getDataFromGlobal = () => {
  try {
    // 尝试获取全局数据
    const app = getApp();
    console.log('获取app实例:', app);
    
    if (app && app.globalData && app.globalData.currentOrder) {
      console.log('从全局状态找到订单信息:', app.globalData.currentOrder);
      // 更新myOrder对象
      myOrder.value = {
        id: app.globalData.currentOrder.id || '',
        batchNo: app.globalData.currentOrder.batchNo || '',
        brand: app.globalData.currentOrder.brand || '',
        number: app.globalData.currentOrder.number || '',
        yield: app.globalData.currentOrder.yield || ''
      };
      console.log('通过全局状态更新订单信息:', myOrder.value);
      return true;
    }
  } catch (e) {
    console.error('从全局状态获取数据失败:', e);
  }
  return false;
};

// 加载已有核对记录
const loadExistingCheckRecord = async (targetBatchNo) => {
  try {
    const res = await byBatchIdAndSegment(targetBatchNo, "膨化烟丝");
    console.log('加载历史记录结果:', res);
    
    if (res && res.verificationResult) {
      const record = res;
      
      // 等待组件挂载后再设置预览图片
      nextTick(async () => {
        // 回显各部分图片
        const images = record.verificationResult.images || {};
        
        // 牌号和批次号图片
        if (images.brandBatch && brandBatchRef.value) {
          brandBatchRef.value.setPreviewImages([images.brandBatch]);
        }
        
        // 掺对比例图片
        if (images.mixRatio && mixRatioRef.value) {
          mixRatioRef.value.setPreviewImages([images.mixRatio]);
        }
        
        // 填充图片
        if (images.filling && fillingRef.value) {
          fillingRef.value.setPreviewImages([images.filling]);
        }
        
        // 掺对公斤数
        if (images.mixWeight) {
          mixWeight.value = images.mixWeight;
        }
      });
      
      console.log('已加载历史核对记录:', record);
    } else {
      console.log('该批次无历史核对记录');
    }
  } catch (error) {
    console.warn('加载历史记录失败:', error);
    // 不阻断流程，允许用户重新提交
  }
};

// 处理掺对公斤数输入
const handleWeightInput = (e) => {
  // 限制只能输入数字和小数点
  let value = e.detail.value;
  value = value.replace(/[^0-9.]/g, '');
  // 限制只能有一个小数点
  const dotIndex = value.indexOf('.');
  if (dotIndex !== -1) {
    value = value.slice(0, dotIndex + 1) + value.slice(dotIndex + 1).replace(/\./g, '');
  }
  // 限制小数点后两位
  const parts = value.split('.');
  if (parts.length === 2 && parts[1].length > 2) {
    value = parts[0] + '.' + parts[1].slice(0, 2);
  }
  mixWeight.value = value;
};

// 提交检查结果
const submitCheck = async() => {
  try {
    submitting.value = true;
    
    // 如果没有订单信息，尝试从全局状态获取
    if (!myOrder.value.batchNo && !myOrder.value.brand) {
      getDataFromGlobal();
    }
    
    // 验证是否有订单信息
    if (!myOrder.value.batchNo) {
      uni.showToast({
        title: '无法获取批次信息，请重试',
        icon: 'none'
      });
      return;
    }
    
    // 验证所有上传组件是否初始化
    if (!brandBatchRef.value || !mixRatioRef.value || !fillingRef.value) {
      throw new Error('上传组件未初始化');
    }
    
    // 验证掺对公斤数是否输入
    if (!mixWeight.value) {
      uni.showToast({
        title: '掺对公斤数不能为空',
        icon: 'none'
      });
      return;
    }
    
    // 验证数字格式是否正确
    if (isNaN(Number(mixWeight.value)) || Number(mixWeight.value) <= 0) {
      uni.showToast({
        title: '请输入有效的掺对公斤数',
        icon: 'none'
      });
      return;
    }
    
    // 执行图片上传（除了掺对公斤数）
    const allUploadResults = await Promise.all([
      brandBatchRef.value.triggerUpload(),
      mixRatioRef.value.triggerUpload(),
      fillingRef.value.triggerUpload()
    ]);
    
    // 获取所有上传成功的图片URL
    const brandBatchUrls = brandBatchRef.value.getUploadedUrls();
    const mixRatioUrls = mixRatioRef.value.getUploadedUrls();
    const fillingUrls = fillingRef.value.getUploadedUrls();
    
    // 验证图片是否上传成功
    if (brandBatchUrls.length === 0 || mixRatioUrls.length === 0 || fillingUrls.length === 0) {
      uni.showToast({
        title: '图片上传失败，请重试',
        icon: 'none'
      });
      return;
    }
    
    // 构造提交数据
    const submitData = {
      batchId: myOrder.value.batchNo,
      brand: myOrder.value.brand,
      segment: "膨化烟丝",
      verificationResult: {
        Status: 'normal',
        images: {
          brandBatch: brandBatchUrls[0],
          mixRatio: mixRatioUrls[0],
          filling: fillingUrls[0],
          mixWeight: mixWeight.value
        }
      },
      dataCount: 4,
      operatorId: uni.getStorageSync('userId')
    };
    
    console.log('提交验证数据:', submitData);
    
    // 调用提交验证的API
    await submitMaterialCheck(submitData);
    
    uni.showToast({
      title: '提交成功',
      icon: 'success'
    });
    
    // 重置表单
    setTimeout(() => {
     uni.navigateBack();
    }, 1500);
    
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

// 三级验证成功处理
const handleVerifySuccess = () => {
  uni.showToast({
    title: '三级验证成功',
    icon: 'success',
    duration: 2000
  });
};

// 三级验证失败处理
const handleVerifyFail = () => {
  uni.showToast({
    title: '三级验证失败',
    icon: 'error',
    duration: 2000
  });
};

// 三级验证过程数据处理
const handleValidate = (data) => {
  console.log('三级验证过程数据:', data);
};
</script>

<style scoped>
.page {
  padding: 20rpx;
}

.task-list-container {
  margin-top: 20rpx;
  background-color: #fff;
  border-radius: 12rpx;
  padding: 20rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
}

/* 拍照区域 */
.photo-section {
  margin-top: 30rpx;
}

/* 输入框容器 */
.input-container {
  background-color: #f5f5f5;
  border-radius: 8rpx;
  padding: 0 20rpx;
}

/* 公斤数输入框 */
:deep(.weight-input) {
  width: 100%;
  height: 80rpx;
  line-height: 80rpx;
  font-size: 28rpx;
  color: #333;
  background-color: transparent;
  border: none;
  outline: none;
}

/* 适配u--input组件的内部结构 */
:deep(.u-input__wrapper) {
  background-color: transparent;
  border: none;
}

:deep(.u-input__input) {
  width: 100%;
  height: 80rpx;
  line-height: 80rpx;
  font-size: 28rpx;
  color: #333;
}

.section-title {
  display: flex;
  align-items: center;
  font-size: 28rpx;
  color: #333;
  margin-bottom: 16rpx;
  font-weight: 500;
}

.required {
  color: red;
  margin-right: 4rpx;
  font-size: 30rpx;
}

.submit-btn {
  width: 94%;
  padding: 20rpx;
  background-color: #007AFF;
  color: white;
  text-align: center;
  font-size: 28rpx;
  border-radius: 8rpx;
  margin-top: 40rpx;
  font-weight: 500;
}

.submit-btn:active {
  background-color: #0051D5;
}
</style>

