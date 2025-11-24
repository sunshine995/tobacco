<template>
  <view class="page">
    <WorkOrderInfoCard :order-info="myOrder" />
    
    <!-- 任务列表模块 -->
    <view class="task-list-container">
      <!-- 每批检查牌号和批次号拍照 -->
      <view class="photo-section">
<!-- 三压检查拍照 -->

      <view v-if="myOrder.number && (myOrder.number.includes('预混柜') || myOrder.number.replace(/\s+/g, '') === '1')" class="photo-section">
         <h2 class="group-title">开班检查项目</h2>
        <view class="section-title">
          <text>三压检查</text>
        </view>
        <upload-image
          ref="threePressureRef"
          :max-count="1"
          title="上传图片"
        />
        
        <!-- 开班检查提交验证按钮 -->
        <view class="submit-btn" @click="submitStartCheck">
          <text>提交验证</text>
        </view>
      </view>
<h2 class="group-title">开料前检查项目</h2>
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

      <!-- 界面验证拍照 -->
      <view class="photo-section">
        <view class="section-title">
          <text class="required">*</text>
          <text>界面验证</text>
        </view>
        <upload-image
          ref="interfaceVerifyRef"
          :max-count="1"
          title="上传图片"
        />
      </view>

      <!-- 水分仪通道拍照 -->
      <view class="photo-section">
        <view class="section-title">
          <text class="required">*</text>
          <text>水分仪通道</text>
        </view>
        <upload-image
          ref="moistureChannelRef"
          :max-count="1"
          title="上传图片"
        />
      </view>

      

      <!-- 香料剩余量输入 -->
      <view class="photo-section">
        <view class="section-title">
          <text class="required">*</text>
          <text>香料剩余量（公斤数）</text>
        </view>
        <up-input
          v-model="flavorRemaining"
          type="number"
          placeholder="请输入香料剩余量"
          class="flavor-remaining-input"
          step="0.01"
        />
      </view>

      <!-- 开料前检查提交验证按钮 -->
      <view class="submit-btn" @click="submitBeforeCheck">
        <text>提交验证</text>
      </view>

      <!-- 换牌验证酒精清洗照片 -->
      <view class="photo-section">
        <view class="section-title">
          
          <text>酒精清洗照片</text>
          <text class="change-brand-tip">（换牌必须填）</text>
        </view>
        <upload-image
          ref="alcoholCleaningRef"
          :max-count="1"
          title="上传图片"
        />
      </view>

      <!-- 皮带清扫照片 -->
      <view class="photo-section">
        <view class="section-title">
         
          <text>皮带清扫照片</text>
          <text class="change-brand-tip">（换牌必须填）</text>
        </view>
        <upload-image
          ref="beltCleaningRef"
          :max-count="1"
          title="上传图片"
        />
      </view>

      <!-- 电子称清扫照片 -->
      <view class="photo-section">
        <view class="section-title">
          
          <text>电子称清扫照片</text>
          <text class="change-brand-tip">（换牌必须填）</text>
        </view>
        <upload-image
          ref="scaleCleaningRef"
          :max-count="1"
          title="上传图片"
        />
      </view>

      <!-- 提交按钮 -->
      <view class="submit-btn" @click="submitCheck">
        <text>提交验证</text>
      </view>
     
      <!-- 验证按钮 -->
      <VerifyButton 
        buttonText="三级验证" 
        :batchId="myOrder.batchNo" 
        :brand="myOrder.brand" 
        segment="加香机" 
        :dataCount="7" 
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
import { formatDate } from '@/utils/date.js';

// 上传组件的ref
const brandBatchRef = ref(null);
const interfaceVerifyRef = ref(null);
const moistureChannelRef = ref(null);
const threePressureRef = ref(null);
const alcoholCleaningRef = ref(null);
const beltCleaningRef = ref(null);
const scaleCleaningRef = ref(null);

const submitting = ref(false); // 提交状态
// 新增：保存图片数据，用于传递给三级验证组件
const verificationImages = ref({});
// 新增：香料剩余量输入值
const flavorRemaining = ref('');

// 定义响应式变量
const id = ref('');
const batchNo = ref('');
const brand = ref('');

// 创建订单信息响应式对象
const myOrder = ref({
  id: '',
  batchNo: '',
  brand: '',
  number: '',
  yield: ''
});

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

// 【核心修改】加载已有核对记录，并增加批次号和牌号校验
const loadExistingCheckRecord = async (targetBatchNo) => {
  try {
    const record = await byBatchIdAndSegment(targetBatchNo, "加香机");
    console.log('加载历史记录结果:', record);
    
    // 检查record是否有效，并校验批次号和牌号是否匹配
    if (record && record.verificationResult) {
      // 关键判断：确保历史记录的批次号和品牌与当前页面的完全一致
      // 注意：这里假设 record.batchId 和 record.brand 是历史记录中的批次号和品牌字段
      // 如果你的API返回字段名不同，请根据实际情况修改，例如 record.batchNo, record.productBrand 等
      if (record.batchId !== myOrder.value.batchNo || record.brand !== myOrder.value.brand) {
        console.warn('历史记录的批次号或牌号与当前页面不一致，不回显数据。');
        console.warn('历史记录:', {batchId: record.batchId, brand: record.brand});
        console.warn('当前页面:', {batchNo: myOrder.value.batchNo, brand: myOrder.value.brand});
        return; // 如果不匹配，则直接返回，不执行回显操作
      }
      
      // 更新verificationImages变量，确保三级验证组件能获取到图片数据
      verificationImages.value = record.verificationResult.images || {};
      
      // 等待组件挂载后再设置预览图片
      nextTick(async () => {
        // 回显各部分图片
        const images = record.verificationResult.images || {};
        
        // 牌号和批次号图片
        if (images.brandBatch && brandBatchRef.value) {
          brandBatchRef.value.setPreviewImages([images.brandBatch]);
        }
        
        // 界面验证图片
        if (images.interfaceVerify && interfaceVerifyRef.value) {
          interfaceVerifyRef.value.setPreviewImages([images.interfaceVerify]);
        }
        
        // 水分仪通道图片
        if (images.moistureChannel && moistureChannelRef.value) {
          moistureChannelRef.value.setPreviewImages([images.moistureChannel]);
        }
        
        // 三压检查图片
        if (images.threePressure && threePressureRef.value) {
          threePressureRef.value.setPreviewImages([images.threePressure]);
        }
        
        // 加载香料剩余量文本值
        if (record.verificationResult.flavorRemaining) {
          flavorRemaining.value = record.verificationResult.flavorRemaining;
        }
        
        // 酒精清洗照片
        if (images.alcoholCleaning && alcoholCleaningRef.value) {
          alcoholCleaningRef.value.setPreviewImages([images.alcoholCleaning]);
        }
        
        // 皮带清扫照片
        if (images.beltCleaning && beltCleaningRef.value) {
          beltCleaningRef.value.setPreviewImages([images.beltCleaning]);
        }
        
        // 电子称清扫照片
        if (images.scaleCleaning && scaleCleaningRef.value) {
          scaleCleaningRef.value.setPreviewImages([images.scaleCleaning]);
        }
      });
      
      console.log('已加载并回显历史核对记录:', record);
    } else {
      console.log('该批次无历史核对记录或记录格式不正确。');
    }
  } catch (error) {
    console.warn('加载历史记录失败:', error);
    // 不阻断流程，允许用户重新提交
  }
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
    const allRefs = [brandBatchRef, interfaceVerifyRef, moistureChannelRef, threePressureRef,
                    alcoholCleaningRef, beltCleaningRef, scaleCleaningRef];
    const refNames = ['牌号和批次号', '界面验证', '水分仪通道', '三压检查',
                     '酒精清洗照片', '皮带清扫照片', '电子称清扫照片'];
    
    for (let i = 0; i < allRefs.length; i++) {
      // 跳过三压检查组件，因为它可能因为v-if条件不满足而不存在
      if (i === 3) {
        continue;
      }
      if (!allRefs[i].value) {
        throw new Error(`${refNames[i]}上传组件未初始化`);
      }
    }
    
    // 验证组件是否都上传了图片（酒精清洗、皮带清扫、电子称清扫、三压检查为非必传）
    for (let i = 0; i < allRefs.length; i++) {
      // 跳过非必传的四个图片：三压检查（3）、酒精清洗（4）、皮带清扫（5）、电子称清扫（6）
      if (i === 3 || i === 4 || i === 5 || i === 6) {
        continue;
      }
      const files = allRefs[i].value.getFiles();
      if (files.length === 0) {
        uni.showToast({
          title: `${refNames[i]}请上传图片`,
          icon: 'none'
        });
        return;
      }
    }
    
    // 验证香料剩余量是否输入
    if (!flavorRemaining.value) {
      uni.showToast({
        title: '请输入香料剩余量',
        icon: 'none'
      });
      return;
    }
    
    // 执行所有图片上传，跳过不存在的三压检查组件
    await Promise.all(allRefs.map((ref, index) => {
      // 跳过三压检查组件如果它不存在
      if (index === 3 && !ref.value) {
        return Promise.resolve();
      }
      return ref.value.triggerUpload();
    }));
    
    // 获取所有上传成功的图片URL
    const brandBatchUrls = brandBatchRef.value.getUploadedUrls();
    const interfaceVerifyUrls = interfaceVerifyRef.value.getUploadedUrls();
    const moistureChannelUrls = moistureChannelRef.value.getUploadedUrls();
    const threePressureUrls = threePressureRef.value ? threePressureRef.value.getUploadedUrls() : [];
    const alcoholCleaningUrls = alcoholCleaningRef.value.getUploadedUrls();
    const beltCleaningUrls = beltCleaningRef.value.getUploadedUrls();
    const scaleCleaningUrls = scaleCleaningRef.value.getUploadedUrls();
    
    // 验证所有图片是否上传成功（酒精清洗、皮带清扫、电子称清扫、三压检查为非必传）
    const allUrls = [brandBatchUrls, interfaceVerifyUrls, moistureChannelUrls, threePressureUrls,
                    alcoholCleaningUrls, beltCleaningUrls, scaleCleaningUrls];
    
    for (let i = 0; i < allUrls.length; i++) {
      // 跳过非必传的四个图片：三压检查（3）、酒精清洗（4）、皮带清扫（5）、电子称清扫（6）
      if (i === 3 || i === 4 || i === 5 || i === 6) {
        continue;
      }
      if (allUrls[i].length === 0) {
        uni.showToast({
          title: `${refNames[i]}图片上传失败，请重试`,
          icon: 'none'
        });
        return;
      }
    }
    
    // 构造提交数据
    const submitData = {
      batchId: myOrder.value.batchNo,
      brand: myOrder.value.brand,
      segment: "加香机",
      verificationResult: {
        status: 'pending', // 初始状态为待验证，允许后续进行三级验证
        flavorRemaining: parseFloat(flavorRemaining.value) || 0, // 新增：香料剩余量作为数字字段
        images: {
          brandBatch: brandBatchUrls[0],
          interfaceVerify: interfaceVerifyUrls[0],
          moistureChannel: moistureChannelUrls[0]
        }
      },
      dataCount: 7, // 数据项数量从8减少到7（移除了香料剩余量图片）
      operatorId: uni.getStorageSync('userId'),
      verified_time: formatDate(new Date(), 'yyyy-MM-dd HH:mm:ss')  // 验证时间
    };
    
    // 非必传图片，只有上传了才添加到提交数据中
    if (threePressureUrls.length > 0) {
      submitData.verificationResult.images.threePressure = threePressureUrls[0];
    }
    if (alcoholCleaningUrls.length > 0) {
      submitData.verificationResult.images.alcoholCleaning = alcoholCleaningUrls[0];
    }
    if (beltCleaningUrls.length > 0) {
      submitData.verificationResult.images.beltCleaning = beltCleaningUrls[0];
    }
    if (scaleCleaningUrls.length > 0) {
      submitData.verificationResult.images.scaleCleaning = scaleCleaningUrls[0];
    }
    
    console.log('提交验证数据:', submitData);
    
    // 调用提交验证的API
    await submitMaterialCheck(submitData);
    
    uni.showToast({
      title: '提交成功',
      icon: 'success'
    });
    
    // 保存图片数据到verificationImages，用于传递给三级验证组件
    verificationImages.value = {
      brandBatch: brandBatchUrls[0],
      interfaceVerify: interfaceVerifyUrls[0],
      moistureChannel: moistureChannelUrls[0]
    };
    
    // 非必传图片，只有上传了才添加
    if (threePressureUrls[0]) {
      verificationImages.value.threePressure = threePressureUrls[0];
    }
    if (alcoholCleaningUrls[0]) {
      verificationImages.value.alcoholCleaning = alcoholCleaningUrls[0];
    }
    if (beltCleaningUrls[0]) {
      verificationImages.value.beltCleaning = beltCleaningUrls[0];
    }
    if (scaleCleaningUrls[0]) {
      verificationImages.value.scaleCleaning = scaleCleaningUrls[0];
    }
    
    // 重新加载数据以显示最新上传的图片
    setTimeout(() => {
      loadExistingCheckRecord(submitData.batchId);
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

// 开班检查提交验证
const submitStartCheck = async() => {
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
    
    // 验证三压检查上传组件是否初始化
    if (!threePressureRef.value) {
      throw new Error('三压检查上传组件未初始化');
    }
    
    // 验证三压检查是否上传了图片
    const files = threePressureRef.value.getFiles();
    if (files.length === 0) {
      uni.showToast({
        title: '三压检查请上传图片',
        icon: 'none'
      });
      return;
    }
    
    // 触发三压检查图片上传
    await threePressureRef.value.triggerUpload();
    
    // 获取上传成功的图片URL
    const threePressureUrls = threePressureRef.value.getUploadedUrls();
    
    // 验证图片是否上传成功
    if (threePressureUrls.length === 0) {
      uni.showToast({
        title: '三压检查图片上传失败，请重试',
        icon: 'none'
      });
      return;
    }
    
    // 构造提交数据
    const submitData = {
      batchId: myOrder.value.batchNo,
      brand: myOrder.value.brand,
      segment: "加香机",
      verificationResult: {
        status: 'pending',
        images: {
          threePressure: threePressureUrls[0]
        }
      },
      checkType: 'startCheck', // 标记为开班检查
      operatorId: uni.getStorageSync('userId'),
      verified_time: formatDate(new Date(), 'yyyy-MM-dd HH:mm:ss')
    };
    
    console.log('提交开班检查数据:', submitData);
    
    // 调用提交验证的API
    await submitMaterialCheck(submitData);
    
    uni.showToast({
      title: '开班检查提交成功',
      icon: 'success'
    });
    
    // 更新验证图片数据
    if (threePressureUrls[0]) {
      verificationImages.value.threePressure = threePressureUrls[0];
    }
    
    // 重新加载数据以显示最新上传的图片
    setTimeout(() => {
      loadExistingCheckRecord(submitData.batchId);
    }, 1500);
    
  } catch (error) {
    console.error('开班检查提交失败:', error);
    uni.showToast({
      title: error.message || '提交失败，请重试',
      icon: 'none'
    });
  } finally {
    submitting.value = false;
  }
};

// 开料前检查提交验证
const submitBeforeCheck = async() => {
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
    
    // 验证开料前检查相关上传组件是否初始化
    const beforeCheckRefs = [brandBatchRef, interfaceVerifyRef, moistureChannelRef];
    const refNames = ['牌号和批次号', '界面验证', '水分仪通道'];
    
    for (let i = 0; i < beforeCheckRefs.length; i++) {
      if (!beforeCheckRefs[i].value) {
        throw new Error(`${refNames[i]}上传组件未初始化`);
      }
    }
    
    // 验证组件是否都上传了图片
    for (let i = 0; i < beforeCheckRefs.length; i++) {
      const files = beforeCheckRefs[i].value.getFiles();
      if (files.length === 0) {
        uni.showToast({
          title: `${refNames[i]}请上传图片`,
          icon: 'none'
        });
        return;
      }
    }
    
    // 验证香料剩余量是否输入
    if (!flavorRemaining.value) {
      uni.showToast({
        title: '请输入香料剩余量',
        icon: 'none'
      });
      return;
    }
    
    // 执行开料前检查相关图片上传
    await Promise.all(beforeCheckRefs.map(ref => ref.value.triggerUpload()));
    
    // 获取所有上传成功的图片URL
    const brandBatchUrls = brandBatchRef.value.getUploadedUrls();
    const interfaceVerifyUrls = interfaceVerifyRef.value.getUploadedUrls();
    const moistureChannelUrls = moistureChannelRef.value.getUploadedUrls();
    
    // 验证所有图片是否上传成功
    const allUrls = [brandBatchUrls, interfaceVerifyUrls, moistureChannelUrls];
    
    for (let i = 0; i < allUrls.length; i++) {
      if (allUrls[i].length === 0) {
        uni.showToast({
          title: `${refNames[i]}图片上传失败，请重试`,
          icon: 'none'
        });
        return;
      }
    }
    
    // 构造提交数据
    const submitData = {
      batchId: myOrder.value.batchNo,
      brand: myOrder.value.brand,
      segment: "加香机",
      verificationResult: {
        status: 'pending',
        flavorRemaining: parseFloat(flavorRemaining.value) || 0,
        images: {
          brandBatch: brandBatchUrls[0],
          interfaceVerify: interfaceVerifyUrls[0],
          moistureChannel: moistureChannelUrls[0]
        }
      },
      checkType: 'beforeCheck', // 标记为开料前检查
      operatorId: uni.getStorageSync('userId'),
      verified_time: formatDate(new Date(), 'yyyy-MM-dd HH:mm:ss')
    };
    
    console.log('提交开料前检查数据:', submitData);
    
    // 调用提交验证的API
    await submitMaterialCheck(submitData);
    
    uni.showToast({
      title: '开料前检查提交成功',
      icon: 'success'
    });
    
    // 更新验证图片数据
    verificationImages.value = {
      brandBatch: brandBatchUrls[0],
      interfaceVerify: interfaceVerifyUrls[0],
      moistureChannel: moistureChannelUrls[0]
    };
    
    // 重新加载数据以显示最新上传的图片
    setTimeout(() => {
      loadExistingCheckRecord(submitData.batchId);
    }, 1500);
    
  } catch (error) {
    console.error('开料前检查提交失败:', error);
    uni.showToast({
      title: error.message || '提交失败，请重试',
      icon: 'none'
    });
  } finally {
    submitting.value = false;
  }
};

// 验证成功回调
const handleVerifySuccess = (data) => {
  console.log('验证成功:', data);
  uni.showToast({
    title: '验证成功',
    icon: 'success'
  });
};

// 验证失败回调
const handleVerifyFail = (error) => {
  console.log('验证失败:', error);
  uni.showToast({
    title: error.message || '验证失败',
    icon: 'none'
  });
};

// 验证过程回调
const handleValidate = (data) => {
  console.log('验证过程中:', data);
};
</script>

<style scoped>
/* 页面样式 */
.page {
  padding: 20rpx;
  background-color: #f5f5f5;
  min-height: 100vh;
}

/* 提交按钮样式 */
.submit-btn {
  margin: 30rpx auto;
  width: 500rpx;
  height: 88rpx;
  background-color: #007aff;
  border-radius: 44rpx;
  display: flex;
  justify-content: center;
  align-items: center;
  color: white;
  font-size: 32rpx;
  font-weight: bold;
  box-shadow: 0 4rpx 8rpx rgba(0, 0, 0, 0.1);
}

.submit-btn:active {
  background-color: #0056b3;
  transform: scale(0.98);
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

.change-brand-tip {
  color: #1989fa;
  font-size: 24rpx;
  margin-left: 12rpx;
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
/* 香料剩余量输入框样式 */
.flavor-remaining-input {
  width: 100%;
  padding: 20rpx;
  border: 1rpx solid #e8e8e8;
  border-radius: 8rpx;
  font-size: 28rpx;
  color: #333;
  box-sizing: border-box;
  background-color: #fafafa;
}

.flavor-remaining-input:focus {
  outline: none;
  border-color: #007AFF;
  background-color: #fff;
}
</style>
