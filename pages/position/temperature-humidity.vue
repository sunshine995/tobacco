<template>
	<!-- 增温增湿验证 -->
	<view class="container">
		<!-- 顶部卡片区域 -->
		<view class="header-card">
			<WorkOrderInfoCard :order-info="myOrder" />
		</view>
		<!-- 三压图上传组件 -->
		<view class="upload-section">
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
		<view class="submit-section">
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
	</view>
</template>
  
<script setup>
import WorkOrderInfoCard from '@/components/orderInfo.vue';
import UploadImage from '@/components/UploadImage.vue'; // 引入你的UploadImage组件
import { ref, onMounted } from 'vue';
import { onLoad } from '@dcloudio/uni-app'; // 注意：在 script setup 中需显式引入 onLoad
  
const currentUserInfo = ref(null); // 当前用户信息
const pressureUploadRef = ref(null);
const brandUploadRef = ref(null);
const moistureUploadRef = ref(null);

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

// 提交状态
const submitting = ref(false);

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

const publish = async () => {
  // if (submitting.value) return;

  // submitting.value = true;
  
  const resultsPressure = await pressureUploadRef.value.triggerUpload()
  
  // 上传三亚到服务器
  const imageUrlsPressure = await pressureUploadRef.value.getUploadedUrls()
   console.log(imageUrlsPressure)
  form.value.imagesPressure = imageUrlsPressure
  
  const resultsBrand = await brandUploadRef.value.triggerUpload()
  
  // 上传三亚到服务器
  const imageUrlsBrand = brandUploadRef.value.getUploadedUrls()
  
  form.value.imagesBrand = imageUrlsBrand
  
  const resultsMoisture = await moistureUploadRef.value.triggerUpload()
  
  // 上传三亚到服务器
  const imageUrlsMoisture = moistureUploadRef.value.getUploadedUrls()
  
  form.value.imagesMoisture = imageUrlsMoisture
  

  // 构建表单数据
  let publishData = {
    title: form.value.title || '三压验证数据',
    content: form.value.content || '三压验证相关图片',
    type: form.value.type, // ALL, DEPT, SELECTED
    username: currentUserInfo.value?.username || '系统用户',
    userId: uni.getStorageSync('userId') ? Number(uni.getStorageSync('userId')) : null,
    // 包含订单信息
    orderId: myOrder.value.id,
    batchNo: myOrder.value.batchNo,
    brand: myOrder.value.brand
  };
  
  // 处理选择员工类型
  if (form.value.type === 'SELECTED' && form.value.selectedUserIds && form.value.selectedUserIds.length > 0) {
    publishData.selectedUserIds = form.value.selectedUserIds.map(id => Number(id));
  }
  
  // 处理部门选择
  if (form.value.type === 'DEPT' && form.value.selectedDeptIds) {
    publishData.selectedDeptIds = form.value.selectedDeptIds.map(id => Number(id));
  }
  
  // try {
  //   // 合并所有图片数组
  //   const allImages = [
  //     ...(form.value.imagesPressure || []),
  //     ...(form.value.imagesBrand || []),
  //     ...(form.value.imagesMoisture || [])
  //   ];
    
    console.log('提交表单数据:', publishData);
    console.log('提交三压图数据:', form.value.imagesPressure);
    console.log('提交批次号图数据:', form.value.imagesBrand);
    console.log('提交水分仪图数据:', form.value.imagesMoisture);
    
  //   // 触发所有上传组件的上传操作
  //   const uploadPromises = [];
    
  //   if (form.value.imagesPressure.length > 0) {
  //     uploadPromises.push(pressureUploadRef.value?.triggerUpload());
  //   }
  //   if (form.value.imagesBrand.length > 0) {
  //     uploadPromises.push(brandUploadRef.value?.triggerUpload());
  //   }
  //   if (form.value.imagesMoisture.length > 0) {
  //     uploadPromises.push(moistureUploadRef.value?.triggerUpload());
  //   }
    
  //   // 等待所有上传完成
  //   const uploadResults = await Promise.all(uploadPromises);
  //   console.log('所有上传结果:', uploadResults);
    
  //   // 获取上传后的图片URL
  //   const uploadedUrls = [
  //     ...pressureUploadRef.value?.getAllImageUrls() || [],
  //     ...brandUploadRef.value?.getAllImageUrls() || [],
  //     ...moistureUploadRef.value?.getAllImageUrls() || []
  //   ];
    
  //   console.log('上传后的图片URL:', uploadedUrls);
    
  //   // 调用API提交数据和图片
  //   // await publishTemperatureHumidity(publishData, uploadedUrls);
    
  //   uni.$u.toast('提交成功！');
  //   setTimeout(() => {
  //     uni.navigateBack();
  //   }, 800);
  // } catch (error) {
  //   console.error('提交失败:', error);
  //   uni.$u.toast(error.message || '提交失败，请重试');
  // } finally {
  //   submitting.value = false;
  // }
}

// 创建订单信息响应式对象
const myOrder = ref({
  id: '',
  batchNo: '',
  brand: ''
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
        brand: app.globalData.currentOrder.brand || ''
      };
      console.log('通过全局状态更新订单信息:', myOrder.value);
      return true;
    }
  } catch (e) {
    console.error('从全局状态获取数据失败:', e);
  }
  return false;
};

// 页面加载时接收参数并更新订单信息
onLoad((options) => {
  // 注意：options 中的值都是字符串，且可能包含编码后的中文
  console.log('接收到的URL参数:', options);
  
  // 优先尝试从URL参数获取数据
  if (options && (options.id || options.batchNo || options.brand)) {
    // 获取并解码URL参数，直接更新myOrder对象
    myOrder.value = {
      id: options.id ? decodeURIComponent(options.id) : '',
      batchNo: options.batchNo ? decodeURIComponent(options.batchNo) : '',
      brand: options.brand ? decodeURIComponent(options.brand) : ''
    };
    
    console.log('通过URL参数更新后的订单信息:', myOrder.value);
  } else {
    // 如果URL没有参数，尝试从全局状态获取
    getDataFromGlobal();
  }
});

// 页面挂载后再尝试一次从全局状态获取数据（确保全局数据已设置完成）
onMounted(() => {
  // 如果当前myOrder还没有有效的数据，再尝试从全局获取一次
  if (!myOrder.value.batchNo && !myOrder.value.brand) {
    console.log('onMounted: 尝试从全局状态获取数据...');
    getDataFromGlobal();
  }
});

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



