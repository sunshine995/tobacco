<template>
	<!-- 增温增湿验证 -->
	<view class="container">
		<!-- 顶部卡片区域 -->
		<view class="header-card">
			<WorkOrderInfoCard :order-info="myOrder" />
		</view>
		<!-- 三压图上传组件 -->
		<view class="upload-section" v-if="myOrder.number && (myOrder.number.includes('预混柜') || myOrder.number.replace(/\s+/g, '') === '1')">
			<text class="upload-label">开料验证 三压图</text>
			<UploadImage 
				ref="pressureUploadRef"
				:max-count="3"
				title="上传三压图"
			/>
		</view>

		<view class="upload-section">
			<text class="upload-label">批次号 牌号图</text>
			<UploadImage 
				ref="brandUploadRef"
				v-model="form.imagesBrand"
				:max-count="1"
				title="上传批次号 牌号图"
				@select="onImageSelect('imagesBrand', $event)"
				@success="onImageUploadSuccess('imagesBrand', $event)"
				@fail="onImageUploadFail('imagesBrand', $event)"
				@upload-complete="onImageUploadComplete('imagesBrand', $event)"
			/>
		</view>

		<view class="upload-section">
			<text class="upload-label">进出口水分仪空压和通道图</text>
			<UploadImage 
				ref="moistureUploadRef"
				v-model="form.imagesMoisture"
				:max-count="3"
				title="上传进出口水分仪空压和通道图"
				@select="onImageSelect('imagesMoisture', $event)"
				@success="onImageUploadSuccess('imagesMoisture', $event)"
				@fail="onImageUploadFail('imagesMoisture', $event)"
				@upload-complete="onImageUploadComplete('imagesMoisture', $event)"
			/>
		</view>

		<!-- 提交按钮区域 -->
		<view class="submit-section" v-if="!hasSubmitted">
			<u-button 
				type="primary" 
				@click="publish"
				:loading="submitting"
				:disabled="submitting"
				class="submit-btn"
			>
				{{ submitting ? '提交中...' : '提交' }}
			</u-button>
		</view>
     <!-- 验证按钮 -->
      <VerifyButton 
        buttonText="三级验证" 
        :batchId="myOrder.batchNo" 
        :brand="myOrder.brand" 
        segment="增温增湿" 
        :dataCount="3" 
        @success="handleVerifySuccess" 
        @fail="handleVerifyFail" 
        @validate="handleValidate" 
      />
	</view>
</template>
  
<script setup>
import WorkOrderInfoCard from '@/components/orderInfo.vue';
import UploadImage from '@/components/UploadImage.vue'; // 引入你的UploadImage组件
import VerifyButton from '@/components/VerifyButton.vue'; // 引入三级验证按钮组件
import { ref, onMounted, nextTick } from 'vue';
import { onLoad } from '@dcloudio/uni-app'; // 注意：在 script setup 中需显式引入 onLoad
import { submitMaterialCheck, byBatchIdAndSegment } from '@/api/production.js';
  
const currentUserInfo = ref(null); // 当前用户信息
const pressureUploadRef = ref(null);
const brandUploadRef = ref(null);
const moistureUploadRef = ref(null);

// 提交状态控制
const submitting = ref(false); // 提交中状态
const hasSubmitted = ref(false); // 是否已提交

const form = ref({
  title: '',
  content: '',
  type: 'ALL',
  selectedUserIds: [],
  selectedDeptIds: [],
  selectedProcessIds: [],
  images: [],// 用于 u-upload 显示
  attachments: [],
  // 新增图片类型字段
  imagesPressure: [], // 三压图
  imagesBrand: [], // 批次号 牌号图
  imagesMoisture: [] // 进出口水分仪空压和通道图
});

onMounted(async () => {
  try {
    // 获取当前用户信息
    const userId = uni.getStorageSync('userId');
    const userInfo = uni.getStorageSync('userInfo');
    currentUserInfo.value = userInfo;
  } catch (err) {
    console.error('获取用户信息失败:', err);
  }
  
  // 如果当前myOrder还没有有效的数据，再尝试从全局获取一次
  if (!myOrder.value.batchNo && !myOrder.value.brand) {
    console.log('onMounted: 尝试从全局状态获取数据...');
    getDataFromGlobal();
  }
  
  // ✅ 参考strip-tobacco-warehousing模式：无论数据来源，只要有批次号就加载历史记录
  if (myOrder.value.batchNo) {
    loadExistingCheckRecord(myOrder.value.batchNo);
  }
});

// 图片选择事件
const onImageSelect = (imageType, files) => {
  console.log(`${imageType} 选择图片:`, files);
  // 这里可以做进一步处理
};

// 图片上传成功事件
const onImageUploadSuccess = (imageType, result) => {
  console.log(`${imageType} 上传成功:`, result);
  // 更新表单数据
  if (result.file && result.file.previewUrl) {
    // 更新对应类型的图片列表
    const index = form.value[imageType].findIndex(f => f.localFilePath === result.file.localFilePath);
    if (index !== -1) {
      form.value[imageType][index].url = result.file.previewUrl;
      form.value[imageType][index].uploaded = true;
    }
  }
};

// 图片上传失败事件
const onImageUploadFail = (imageType, result) => {
  console.log(`${imageType} 上传失败:`, result);
  uni.showToast({
    title: `上传失败: ${result.error.message || '未知错误'}`,
    icon: 'none'
  });
};

// 图片上传完成事件
const onImageUploadComplete = (imageType, results) => {
  console.log(`${imageType} 上传完成:`, results);
  // 可以在这里处理上传完成后的逻辑
};

// // 表单验证
// function validateForm() {
//   // 检查所有必需的图片字段
//   const requiredImages = [
//     { field: 'imagesPressure', message: '请上传三压图' },
//     { field: 'imagesBrand', message: '请上传批次号和牌号图' },
//     { field: 'imagesMoisture', message: '请上传进出口水分仪空压和通道图' }
//   ];
  
//   for (const { field, message } of requiredImages) {
//     if (!form.value[field] || form.value[field].length === 0) {
//       uni.$u.toast(message);
//       return false;
//     }
//   }
//   return true;
// }

// 提交功能
const publish = async () => {
	// 显示加载提示
	submitting.value = true;
	
	try {
		// 先上传所有图片
		if (pressureUploadRef.value) {
			await pressureUploadRef.value.triggerUpload();
		}
		if (brandUploadRef.value) {
			await brandUploadRef.value.triggerUpload();
		}
		if (moistureUploadRef.value) {
			await moistureUploadRef.value.triggerUpload();
		}
		
		// 调用各个UploadImage组件的getAllImageUrls方法获取所有已上传图片的URL
		let imagesPressure = pressureUploadRef.value ? pressureUploadRef.value.getAllImageUrls() : [];
		let imagesBrand = brandUploadRef.value ? brandUploadRef.value.getAllImageUrls() : [];
		let imagesMoisture = moistureUploadRef.value ? moistureUploadRef.value.getAllImageUrls() : [];
		
		console.log('三压图URL:', imagesPressure);
		console.log('批次号图URL:', imagesBrand);
		console.log('水分仪图URL:', imagesMoisture);
		
		// 表单验证：检查是否有未上传成功的图片
		// if (imagesPressure.length === 0) {
		// 	uni.showToast({
		// 		title: '三压图上传失败，请重试',
		// 		icon: 'none'
		// 	});
		// 	return;
		// }
		if (imagesBrand.length === 0) {
			uni.showToast({
				title: '批次号图上传失败，请重试',
				icon: 'none'
			});
			return;
		}
		if (imagesMoisture.length === 0) {
			uni.showToast({
				title: '水分仪图上传失败，请重试',
				icon: 'none'
			});
			return;
		}
		
		// 构建提交数据 - 匹配后端API要求的结构
		const verificationResult = {
			images: {
				imagesPressure,
				imagesBrand,
				imagesMoisture
			},
			state: "normal"
		};
		
		const submitData = {
			batchId: myOrder.value.batchNo,  // 使用batchId而不是batchNo
			brand: myOrder.value.brand,
			segment: "增温增湿",  // 使用segment而不是segmentName
			verificationResult: verificationResult,
			dataCount: 3,  // 图片数量
			operatorId: uni.getStorageSync('userId') || ''  // 操作员ID
		};
		
		console.log('准备提交的数据:', submitData);
		
		// 调用API提交数据
		console.log('开始调用submitMaterialCheck API');
		console.log('提交的数据:', JSON.stringify(submitData));
		try {
			const res = await submitMaterialCheck(submitData);
			console.log('API调用成功，返回数据:', res);
			// 根据request.js的实现，res已经是后端返回的data部分
		} catch (error) {
			console.error('API调用失败:', error);
			throw error; // 继续抛出错误，让上层catch处理
		}
		
		// 提交成功
		uni.showModal({
			title: '提交成功',
			content: '您的表单已成功提交！',
			showCancel: false,
			success: () => {
				// 设置为已提交状态，隐藏提交按钮
				hasSubmitted.value = true;
				
				// 返回上一页
				uni.navigateBack();
			}
		});
	} catch (error) {
		console.error('提交失败:', error);
		uni.showModal({
			title: '提交失败',
			content: '表单提交失败，请重试！',
			showCancel: false
		});
	} finally {
		// 隐藏加载提示
		submitting.value = false;
	}
};

// 创建订单信息响应式对象
const myOrder = ref({
  id: '',
  batchNo: '',
  brand: '',
  number: ''
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
        number: app.globalData.currentOrder.number || ''
      };
      console.log('通过全局状态更新订单信息:', myOrder.value);
      return true;
    }
  } catch (e) {
    console.error('从全局状态获取数据失败:', e);
  }
  return false;
};

// 三级验证成功事件处理函数
const handleVerifySuccess = (result) => {
  console.log('三级验证成功:', result);
  uni.showToast({
    title: '三级验证成功',
    icon: 'success'
  });
  // 可以在这里添加验证成功后的逻辑，比如显示成功信息、跳转页面等
};

// 三级验证失败事件处理函数
const handleVerifyFail = (error) => {
  console.error('三级验证失败:', error);
  uni.showToast({
    title: '三级验证失败',
    icon: 'none'
  });
  // 可以在这里添加验证失败后的逻辑，比如显示错误信息等
};

// 三级验证步骤事件处理函数
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

// 页面加载时接收参数并更新订单信息
onLoad((options) => {
  // 注意：options 中的值都是字符串，且可能包含编码后的中文
  console.log('接收到的URL参数:', options);
  
  // 优先尝试从URL参数获取数据
  if (options && (options.id || options.batchNo || options.brand || options.number)) {
    // 获取并解码URL参数，直接更新myOrder对象
    myOrder.value = {
      id: options.id ? decodeURIComponent(options.id) : '',
      batchNo: options.batchNo ? decodeURIComponent(options.batchNo) : '',
      brand: options.brand ? decodeURIComponent(options.brand) : '',
      number: options.number ? decodeURIComponent(options.number) : ''
    };
    
    console.log('通过URL参数更新后的订单信息:', myOrder.value);
  } else {
    // 如果URL没有参数，尝试从全局状态获取
    getDataFromGlobal();
  }
});

// 加载已有核对记录 - 优化图片回显功能
const loadExistingCheckRecord = async (batchNo) => {
   if (!batchNo) return;
   
   try {
     const res = await byBatchIdAndSegment(batchNo, "增温增湿");
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
       
       // 确保images对象存在
       const images = verificationResult.images || {};
       console.log('需要回显的图片数据:', images);

       // 等待所有 UploadImage 组件都已挂载到DOM
       await nextTick();

       // 定义需要回显的图片类型及其对应的组件引用
       const imageTypesToEcho = [
         { key: 'imagesPressure', ref: pressureUploadRef, urls: images.imagesPressure },
         { key: 'imagesBrand', ref: brandUploadRef, urls: images.imagesBrand },
         { key: 'imagesMoisture', ref: moistureUploadRef, urls: images.imagesMoisture }
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
</script>
  
<style scoped>
/* 全局容器样式 */
.container {
  padding: 20rpx;
  background-color: #f5f5f5;
  min-height: 100vh;
  max-height: 100vh;
  overflow-y: scroll;
  -webkit-overflow-scrolling: touch;
  position: relative;
}

/* 确保父元素也允许滚动 */
* {
  box-sizing: border-box;
}

body, html {
  overflow: visible !important;
}

/* 修复可能导致滚动问题的样式 */
.page {
  overflow: visible !important;
}

/* 确保内容不会被截断 */
.submit-section {
  margin-top: 40rpx;
  margin-bottom: 40rpx;
}

/* 顶部卡片样式 */
.header-card {
  background-color: #fff;
  border-radius: 12rpx;
  padding: 20rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
}

/* 表单容器样式 */
.form-container {
  background-color: #fff;
  border-radius: 12rpx;
  padding: 30rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
}

/* 标题区域样式 */
.title-section {
  text-align: center;
  margin-bottom: 40rpx;
  padding-bottom: 20rpx;
  border-bottom: 1rpx solid #e0e0e0;
}

/* 上传区域样式 */
.upload-section {
  margin-bottom: 50rpx;
}

.upload-label {
  display: block;
  margin-bottom: 20rpx;
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
}

.count-info {
  margin-left: 10rpx;
  color: #999;
  font-size: 24rpx;
}

.upload-area {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
  padding: 10rpx;
  background-color: #fafafa;
  border-radius: 8rpx;
  border: 1rpx dashed #dcdcdc;
  transition: all 0.3s ease;
}

.upload-area:hover {
  border-color: #1989fa;
  background-color: #f0f9ff;
}

/* 提交按钮区域样式 */
.submit-section {
  display: flex;
  justify-content: center;
  padding: 20rpx 0;
}

.submit-btn {
  width: 80%;
  height: 90rpx;
  line-height: 90rpx;
  font-size: 32rpx;
  border-radius: 45rpx;
  background: linear-gradient(135deg, #1989fa, #409eff);
  transition: all 0.3s ease;
  box-shadow: 0 4rpx 20rpx rgba(25, 137, 250, 0.3);
}

.submit-btn::before {
  content: '';
  opacity: 0;
  transition: opacity 0.3s;
}

.submit-btn:active {
  transform: scale(0.98);
  box-shadow: 0 2rpx 10rpx rgba(25, 137, 250, 0.4);
}

/* 图片预览样式 */
::v-deep(.u-upload__preview) {
  border-radius: 8rpx;
  overflow: hidden;
}

::v-deep(.u-upload__btn) {
  border-radius: 8rpx;
  transition: all 0.3s ease;
}

::v-deep(.u-upload__btn-icon) {
  font-size: 40rpx;
  margin-bottom: 8rpx;
}

::v-deep(.u-upload__btn-text) {
  font-size: 24rpx;
  line-height: 1.2;
}

/* 动画效果 */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.container {
  animation: fadeIn 0.5s ease-out;
}

/* 响应式调整 */
@media (max-width: 375px) {
  .container {
    padding: 15rpx;
  }
  
  .form-container {
    padding: 25rpx;
  }
  
  .submit-btn {
    width: 90%;
  }
}
</style>



