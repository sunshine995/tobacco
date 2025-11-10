<template>
  <view class="container">

    <!-- 状态流程条 -->
    <view class="step-bar">
      <u-steps :current="currentStep" :active-color="currentColor">
        <u-steps-item
          v-for="(step, index) in steps"
          :key="index"
          :title="step.text"
          :inactive-icon="step.icon"
        />
      </u-steps>
    </view>

    <!-- 故障信息 -->
    <view class="detail-card">
      <u-cell-group>
        <u-cell title="区域" :value="fault.section" />
        <u-cell title="上报时间" :value="formatTime(fault.reportTime)" />
		 <u-cell title="开始时间" :value="formatTime(fault.arrivalTime)" />
		 <u-cell title="完成时间" :value="formatTime(fault.repairTime)" />
		  <u-cell title="持续时间(分钟)" :value="fault.durationMinutes" />
        <u-cell title="上报人" :value="fault.reporterName || '未知'" />
        <u-cell title="故障描述" :value="fault.description" />
		<u-cell title="维修说明" :value="fault.repairNotes " />
      </u-cell-group>
    </view>
	
	<!-- 上报图片（只读） -->
	<view v-if="reportImages.length > 0" class="image-section">
	  <view class="upload-title">上报图片</view>
	  <!-- 横向滚动容器 -->
	  <scroll-view class="image-scroll" scroll-x enable-flex>
		<view class="image-wrapper">
		  <u-image
			v-for="(img, index) in reportImages"
			:key="index"
			:src="img.url"
			width="200rpx"
			height="150rpx"
			style="margin: 0 10rpx;"
			border-radius="4"
			@click="previewImage(reportImages.map(i => i.url), index)"
		  />
		</view>
	  </scroll-view>
	</view>
	
	<view v-if="repairImages.length > 0" class="image-section">
	  <view class="upload-title">到达现场开始维修</view>
	  <scroll-view class="image-scroll" scroll-x enable-flex>
		<view class="image-wrapper">
		  <u-image
			v-for="(img, index) in repairImages"
			:key="index"
			:src="img.url"
			width="200rpx"
			height="150rpx"
			style="margin: 0 10rpx;"
			border-radius="4"
			@click="previewImage(repairImages.map(i => i.url), index)"
		  />
		</view>
	  </scroll-view>
	</view>
	
	<view v-if="repairedImages.length > 0" class="image-section">
	  <view class="upload-title">维修完成</view>
	  <scroll-view class="image-scroll" scroll-x enable-flex>
		<view class="image-wrapper">
		  <u-image
			v-for="(img, index) in repairedImages"
			:key="index"
			:src="img.url"
			width="200rpx"
			height="150rpx"
			style="margin: 0 10rpx;"
			border-radius="4"
			@click="previewImage(repairedImages.map(i => i.url), index)"
		  />
		</view>
	  </scroll-view>
	</view>
	
	<!-- 到达现场上传（仅 status === 'reported' 时显示） -->
	<view v-if="showArrivalUpload" class="upload-section">
	  <view class="upload-title">上传到达现场照片</view>	  
	  <upload-image
	    ref="uploadRef"
	    :max-count="3"
	    title="上传图片"
	  />	
	</view>


	
	<!-- 维修完成上传（仅在 status === 'progress' 时显示） -->
	<view v-if="showCompleteUpload" class="upload-section">
	  <view class="upload-title">上传维修完成照片</view>
	  <!-- <view class="upload-tip">点击添加维修完成照片（最多3张）</view> -->
	  <upload-image
	    ref="uploadRef"
	    :max-count="3"
	    title="上传图片"
	  />		   
	   <view class="upload-title" style="margin-top: 20rpx;">维修问题及主要步骤</view>
	   <u--textarea
		 v-model="repairNotes"
		 placeholder="请简要描述故障原因、处理措施及主要维修步骤（建议100字以上）"
		 :border="true"
		 height="180"
		 maxlength="500"
		 show-word-limit
	   />
	</view>
		

    <!-- 操作按钮 -->
	<view v-if="showAction" style="height: 100rpx;"></view>
   <view class="action-bar" v-if="showAction">
      <u-button
        :type="actionButton.type"
        :text="actionButton.text"
        @click="handleAction"
        :loading="submitting"
        block
      />
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getFaultDetail, updateFaultStatusApi } from '@/api/fault.js'
import UploadImage from '@/components/UploadImage.vue';

// 页面参数
const repairType = ref('')
const faultId = ref(null)

const uploadRef = ref(null); // 上传组件的ref
 const imageFiles = ref([]); // 存原始 file 对象 { url: '临时路径' }

// 故障数据
const fault = ref({})

// 上报图片（只读）
const reportImages = ref([])

// 维修图片（可操作）
const repairImages = ref([])  

const repairedImages = ref([])

// 图片列表（拆分）
const arrivalImages = ref([])    // 到达现场照片
const completeImages = ref([])   // 维修完成照片

const role = uni.getStorageSync('userInfo').role

// 新增：维修说明
const repairNotes = ref('')


// 步骤条配置
const steps = [
  { key: 'reported', text: '上报故障', icon: 'clock' },
  { key: 'acknowledged',text: '已接收',   icon: 'checkmark-circle' },
  { key: 'progress', text: '维修中', icon: 'wrench' },
  { key: 'repaired', text: '已修复', icon: 'checkmark' }
]

// 当前状态映射
const statusMap = {
	reported: 0,
    acknowledged: 1,
    progress: 2,
    repaired: 3
}

// // 图片上传
const imageList = ref([]) // 上传的图片列表


// 到达现场上传：仅在 acknowledged 状态显示（准备开始维修时）
const showArrivalUpload = computed(() => fault.value.status === 'acknowledged')

// 维修完成上传：仅在 progress 状态显示
const showCompleteUpload = computed(() => fault.value.status === 'progress')


// 操作状态
const submitting = ref(false)

// 页面加载
onLoad((query) => {
  repairType.value = query.repairType
  faultId.value = Number(query.id)
  loadDetail()
})

// 加载故障详情
async function loadDetail() {
  try {
	  
    const res = await getFaultDetail(faultId.value)
    fault.value = res
    // 上报图片（只读展示）
    reportImages.value = (res.imageUrls || []).map(url => ({ url }))
	// 初始化到达现场图片
	repairImages.value = (res.arrivalImageUrls || []).map(url => ({ url }))
	// 初始化维修完成图片
	repairedImages.value = (res.repairImageUrls || []).map(url => ({ url }))

  } catch (err) {
    console.error('加载详情失败:', err)
    uni.$u.toast('加载失败')
  }
}

// 计算当前步骤
const currentStep = computed(() => {
  return statusMap[fault.value.status] || 0
})

// 当前激活颜色
const currentColor = computed(() => {
  const colors = { 0: '#909399', 1: '#409eff', 2: '#67c23a' }
  return colors[currentStep.value] || '#909399'
})

// 是否显示操作按钮
const showAction = computed(() => {
	if (role === 'USER') {
	 return ['acknowledged'].includes(fault.value.status)
	}
	if(role === 'electrical' || role === 'mechanical'){
	return ['reported','progress'].includes(fault.value.status)
	}
	  // 维修工或管理员：只有在 'reported' 或 'progress' 状态时显示
  return ['reported','acknowledged', 'progress'].includes(fault.value.status)
})

// 操作按钮配置
const actionButton = computed(() => {
  if (fault.value.status === 'reported') {
    return { text: '接收报警', type: 'primary' }
  } else if (fault.value.status === 'acknowledged') {
    return { text: '开始维修', type: 'warning' }
  } else if (fault.value.status === 'progress') {
    return { text: '完成维修', type: 'success' }
  }
  return { text: '', type: 'default' }
})

async function handleAction() {
  const current = fault.value.status
  let newStatus, confirmText

  if (current === 'reported') {
    newStatus = 'acknowledged'
    confirmText = '确定接收此报警吗？'
  } else if (current === 'acknowledged') {
    newStatus = 'progress'
    confirmText = '确定开始维修吗？'
  } else if (current === 'progress') {
    newStatus = 'repaired'
    confirmText = '确定已完成维修吗？'
    if (!repairNotes.value.trim()) {
      uni.$u.toast('请填写维修问题及主要步骤')
      return
    }
  } else {
    return
  }

  uni.showModal({
    content: confirmText,
    success: async (res) => {
      if (res.confirm) {
        submitting.value = true
        try {
          const formData = { 
            status: newStatus,
            faultId: faultId.value
          }

          // 👇 只有需要上传图片的状态才处理上传
          if (current === 'acknowledged' || current === 'progress') {
            // 此时 uploadRef 应该存在（因为对应 upload-section 已显示）
            if (!uploadRef.value) {
              uni.$u.toast('上传组件未加载，请稍后重试')
              return
            }

            // 触发上传并获取结果
            const results = await uploadRef.value.triggerUpload()
            const imageUrls = uploadRef.value.getUploadedUrls()


            formData.images = imageUrls
            if (current === 'progress') {
              formData.repairNotes = repairNotes.value.trim()
            }
          }
          // 注意：current === 'reported' 时，不传 images，也不调用 uploadRef

          await updateFaultStatusApi(formData)
          uni.$u.toast('操作成功')
          fault.value.status = newStatus
          loadDetail() // 可选：刷新详情
        } catch (err) {
          console.error('操作失败:', err)
          uni.$u.toast('操作失败')
        } finally {
          submitting.value = false
        }
      }
    }
  })
}



// 格式化时间
function formatTime(isoString) {
  if (!isoString) return ''
  const date = new Date(isoString)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}`
}
</script>

<style lang="scss" scoped>
.container {
  min-height: 100vh;
  background-color: #f8f8f8;
  //padding-top: calc(env(safe-area-inset-top) + 44px);
}

.step-bar {
  padding: 20px 16px 10px;
  background-color: #fff;
  margin-bottom: 10px;
}

.detail-card {
  background-color: #fff;
  margin: 0 10px 10px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.upload-title {
  font-size: 14px;
  color: #333;
  margin: 10px 0 5px;
}

.upload-tip {
  color: #999;
  font-size: 12px;
  text-align: center;
  padding: 20px 0;
}

.action-bar {
  padding: 10px;
  background-color: #fff;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
}

.upload-section,
.image-section {
  padding: 0 10px;
  background-color: #fff;
  margin-bottom: 10px;
  border-radius: 8px;
}

.upload-title {
  font-size: 14px;
  color: #333;
  margin: 10px 0 5px;
}

.image-scroll {
  white-space: nowrap;
  width: 100%;
  // 可选：添加底部内边距，避免滚动条遮挡
  padding: 10rpx 0;
}

.image-wrapper {
  display: flex;
  align-items: center;
}

.upload-section {
  padding: 0 10px;
  background-color: #fff;
  margin-bottom: 10px;
  border-radius: 8px;

  // 让 textarea 与上传区域有间隔
  :deep(.u-textarea) {
    margin-top: 10rpx;
  }
}
</style>
