<template>
  <view class="page">
    <WorkOrderInfoCard :order-info="myOrder" />
    
    <!-- 任务列表模块 -->
    <view class="task-list-container">
      <!-- 任务说明 -->
      <view class="task-desc">
        <text class="desc-title">【原料核对】</text>
        <text class="desc-content">
          核对批次烟叶配方是否正常(请上传两张照片：1、烟叶配方单  2、最后一包烟叶)
        </text>
      </view>

      <!-- 修改：使用 radio-group 包裹 -->
      <radio-group class="radio-group" @change="onStatusChange">
        <view class="radio-item">
          <radio value="normal" :checked="status === 'normal'" color="#007AFF" />
          <text class="radio-text">正常</text>
        </view>
        <view class="radio-item">
          <radio value="abnormal" :checked="status === 'abnormal'" color="#007AFF" />
          <text class="radio-text">异常</text>
        </view>
      </radio-group>

      <!-- 拍照区域 -->
      <view v-if="status === 'normal'" class="photo-section">
       <!-- 替换为自定义上传组件 -->
       <upload-image
         ref="uploadRef"
         :max-count="2"
         title="上传图片"
       />
    
      </view>

      <!-- 提交按钮 -->
      <view class="submit-btn" @click="submitCheck">
        <text>{{ status === 'normal' ? '提交验证' : '进入质量报警' }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import WorkOrderInfoCard from '@/components/orderInfo.vue';
import { ref, nextTick  } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import UploadImage from '@/components/UploadImage.vue';
import { submitMaterialCheck, byBatchIdAndSegment } from '@/api/production.js'


const uploadRef = ref(null); // 上传组件的ref
const imageFiles = ref([]); // 存原始 file 对象 { url: '临时路径' }
const submitting = ref(false) // 提交状态

// 定义响应式变量
const id = ref('');
const batchNo = ref('');
const brand = ref('');

// 核对状态：normal / abnormal
const status = ref('normal');

// 已上传的图片路径数组（最多2张）
const photos = ref([]);

// 页面加载时接收参数
onLoad((options) => {
  console.log(options.batchNo)
  id.value = options.id ? decodeURIComponent(options.id) : '';
  batchNo.value = options.batchNo ? decodeURIComponent(options.batchNo) : '';
  brand.value = options.brand ? decodeURIComponent(options.brand) : '';
  
// ✅ 新增：尝试加载已有核对记录
  if (batchNo.value) {
     loadExistingCheckRecord(batchNo.value)
  }  
});


// ✅ 新增：加载已有核对记录
const loadExistingCheckRecord = async (batchNo) => {
  try {
    const res = await byBatchIdAndSegment(batchNo, "片烟出库")
	console.log(res)
    
    if (res) {
      const record = res
      
      // 1. 回显状态
      status.value = record.verificationResult?.status || 'normal'
      
      // 2. 如果是 normal，回显图片
      if (status.value === 'normal') {
        const imageUrls = record.verificationResult?.images || []
		console.log(imageUrls)
        
        // 等待 UploadImage 组件挂载后再设置
        nextTick(() => {
          if (uploadRef.value && uploadRef.value.setPreviewImages) {
            uploadRef.value.setPreviewImages(imageUrls)
          }
        })
      }
      
      console.log('已加载历史核对记录:', record)
    } else {
      console.log('该批次无历史核对记录')
    }
  } catch (error) {
    console.warn('加载历史记录失败:', error)
    // 不阻断流程，允许用户重新提交
  }
}

const myOrder = ref({
  batchNo: batchNo,
  brand: brand,
});

// 修改：使用 radio-group 的 change 事件
const onStatusChange = (e) => {
  status.value = e.detail.value;
  // 如果切换为异常，清空图片
  if (status.value === 'abnormal') {
    photos.value = [];
  }
};

// 提交检查结果
const submitCheck = async() => {
	const pages = getCurrentPages();
	const currentPage = pages[pages.length - 1];
	const title = currentPage.data;

	 // 如果是异常状态，直接跳转到质量报警页面
	if (status.value === 'abnormal') {
		uni.navigateTo({
		  url: '/pages/fault/fault-report?quality=true'
		});
		return
	}
	
	try {
	    submitting.value = true
	
	    // 1. 检查是否有上传组件引用
	    if (!uploadRef.value) {
	      throw new Error('上传组件未初始化')
	    }
	
	    // 2. 获取当前选择的图片数量
	    const selectedFiles = uploadRef.value.getFiles()
	    const selectedCount = selectedFiles.length
	
	
	    if (selectedCount < 2) {
	      uni.showToast({
	        title: `请选择2张图片，当前只选择了${selectedCount}张`,
	        icon: 'none'
	      })
	      return
	    }
	
	
	    const uploadResults = await uploadRef.value.triggerUpload()
	    // 5. 获取所有上传成功的图片URL
	    const imageUrls = uploadRef.value.getUploadedUrls()
	    console.log('上传成功的图片URLs:', imageUrls)
	
	    // 6. 检查实际上传成功的图片数量
	    if (imageUrls.length < 2) {
	      uni.showToast({
	        title: `图片上传失败，成功${imageUrls.length}张`,
	        icon: 'none'
	      })
	      return
	    }
	
	
	    // 8. 构造提交数据 - 适配 verification_data 表结构
		const submitData = {
		  batchId: batchNo.value,                    // 批次ID
		  brand: brand.value,  
		  segment: "片烟出库",			
		  verificationResult:{  // JSON格式的验证结果
			status: 'normal',
			images: imageUrls,

		  },
		  dataCount: 2,                         // 验证总数（固定为2张照片）
		  operatorId: uni.getStorageSync('userId'),          // 操作工ID
		}
	
	    console.log('提交验证数据:', submitData)
	
	    // 调用提交验证的API
	    await submitMaterialCheck(submitData)
	    
	    // 模拟API调用
	    await new Promise(resolve => setTimeout(resolve, 1000))
	
	   
	
	    // 11. 可选：跳转到其他页面或重置表单
	    setTimeout(() => {
	      // 跳转到成功页面或返回上一页
	      // uni.navigateBack()
	      
	      // 或者重置表单
	      resetForm()
	    }, 1500)
	
	  } catch (error) {
	    console.error('提交失败:', error)
	    uploadStatus.value = {
	      type: 'error',
	      message: error.message || '提交失败，请重试'
	    }
	    uni.showToast({
	      title: error.message || '提交失败，请重试',
	      icon: 'none'
	    })
	  } finally {
	    submitting.value = false
	  }
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

/* 任务描述 */
.task-desc {
  padding: 16rpx;
  border-bottom: 1rpx solid #eee;
  margin-bottom: 20rpx;
}

.desc-title {
  font-weight: bold;
  color: #333;
  font-size: 32rpx;
  margin-bottom: 8rpx;
}

.desc-content {
  color: #666;
  font-size: 28rpx;
  line-height: 44rpx;
}

/* 单选按钮组 */
.radio-group {
  margin-bottom: 30rpx;
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

/* 拍照区域 */
.photo-section {
  margin-top: 20rpx;
}

.section-title {
  display: flex;
  align-items: center;
  font-size: 28rpx;
  color: #333;
  margin-bottom: 16rpx;
}

.required {
  color: red;
  margin-right: 4rpx;
}

.photo-grid {
  display: flex;
  gap: 20rpx;
  margin-bottom: 20rpx;
}

.photo-item {
  width: 160rpx;
  height: 160rpx;
  position: relative;
  border: 1rpx solid #ddd;
  border-radius: 8rpx;
  overflow: hidden;
}

.photo-item.empty {
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f9f9f9;
}

.add-icon {
  font-size: 48rpx;
  color: #999;
}

.photo-preview {
  width: 100%;
  height: 100%;
}

.delete-btn {
  position: absolute;
  top: 8rpx;
  right: 8rpx;
  font-size: 28rpx;
  color: #ff4d4d;
  z-index: 10;
}

.clear-btn {
  text-align: center;
  padding: 12rpx 0;
  color: #007AFF;
  font-size: 26rpx;
  border: 1rpx solid #007AFF;
  border-radius: 6rpx;
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
</style>