<template>
  <view class="container">
    <!-- 页面标题 -->
    <view class="title-box">
      <text class="date">{{ currentDate }}</text>
    </view>

    <!-- 基本信息 -->
    <u-cell-group title="基本信息" title-style="font-weight: 500;">
      <u--form labelWidth="60">
        <u-form-item label="线别 *" prop="line">
			<up-select v-model:current="form.line" :options="lineOptions" label="请选择线路"></up-select>
          <u--text :text="form.line" margin="0rpx 10rpx" />
        </u-form-item>
      </u--form>
    </u-cell-group>

    <!-- 批次信息 -->
    <u-cell-group title="批次信息" title-style="font-weight: 500;">
      <view v-for="(item, index) in form.tasks" :key="index" class="batch-item">
        <u--form labelWidth="90">
          <u-form-item label="次序 *" prop="order">
            <u-select v-model:current="item.order" :options="orderOptions" value-name="id"
    label-name="name" label="选择次序" />
			<u--text :text="item.order || '请选择'" margin="0rpx 10rpx" />
          </u-form-item>
          <u-form-item label="牌号 *" prop="brand">
            <u-select v-model:current="item.brand" :options="brandOptions" label="选择牌号"  @select="onBrandChange(item)"/>
			<u--text :text="item.brand || '请选择'" margin="0rpx 10rpx" />
          </u-form-item>
          <u-form-item label="批次号 *" prop="batchNo">
            <u--input v-model="item.batchNo" placeholder="输入批次号" />
          </u-form-item>
          <u-form-item label="产量(KG) *" prop="yield">
            <u--input v-model.number="item.yield" type="digit" placeholder="0.00" />
          </u-form-item>
          <u-form-item label="备注（可选）" prop="remark">
            <u--textarea v-model="item.remark" placeholder="如：新配方、拉运等" />
          </u-form-item>
        </u--form>
		
		<!-- ================================ -->
		<!-- ✅ 修复：图片上传组件 - 添加事件监听 -->
		<!-- ================================ -->
		<upload-image
		  :ref="el => setUploadRef(el, index)"
		  :max-count="3"
		  title="上传照片"
		  @select="onImageSelect(index, $event)"
		  @success="onImageUploadSuccess(index, $event)"
		  @fail="onImageUploadFail(index, $event)"
		  @upload-complete="onUploadComplete(index, $event)"
		/>

        <!-- 删除按钮 -->
        <u-icon
          name="close"
          size="24"
          color="#fa3534"
          @click="removeBatch(index)"
          class="delete-btn"
          v-if="form.tasks.length > 1"
        />
		
		<u-button
		  :type="item.submitted ? 'warning' : 'success'"
		  :text="item.submitted ? '✓ 已提交' : '✓ 提交该批次'"
		  :disabled="item.submitted"
		  @click="submitSingleTask(item, index)"
		  class="submit-single-btn"
		>
		</u-button>
      </view>

      <!-- 添加批次按钮 -->
      <view class="add-batch-btn">
		  <u-button type="primary" size="small" @click="addBatchFromLast" icon="plus">+ 添加批次（复制上条）</u-button>
	  </view>
    </u-cell-group>

    <!-- 提交按钮 -->
    <!-- <view class="submit-box">
      <u-button type="primary" text="✓ 提交生产任务" @click="handleSubmit" shape="circle" />
    </view> -->
  </view>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue'
import { formatDate } from '@/utils/date'
import { submitSingleBatch, getTobaccoAll } from '@/api/production'

import UploadImage from '@/components/UploadImage.vue'

// ================================
// ✅ 修复：组件引用和状态管理
// ================================
const uploadRefs = ref([])
// 存储每个批次的图片URL
const batchImageUrls = ref({})

// 当前日期
const currentDate = ref(formatDate(new Date()))

let taskIdCounter = 0

// 或从本地存储获取
const userInfo = uni.getStorageSync('userInfo')
const userId = userInfo?.id

// 动态牌号选项，从数据库获取
const brandOptions = ref([])
// 烟品数据缓存，用于快速查找批次号前缀和默认重量
const tobaccoDataMap = ref({})

// ================================
// ✅ 修复：设置组件引用
// ================================
const setUploadRef = (el, index) => {
  if (el) {
    uploadRefs.value[index] = el
    // 初始化批次的图片URL数组
    if (!batchImageUrls.value[index]) {
      batchImageUrls.value[index] = []
    }
  }
}

// ================================
// ✅ 修复：图片上传事件处理
// ================================
const onImageSelect = (index, files) => {
  console.log(`批次 ${index} 选择图片:`, files)
}

const onImageUploadSuccess = (index, event) => {
  console.log(`批次 ${index} 图片上传成功:`, event)
  
  if (event.file && event.file.previewUrl) {
    // 添加到对应批次的图片URL数组
    if (!batchImageUrls.value[index]) {
      batchImageUrls.value[index] = []
    }
    
    const imageUrl = event.file.previewUrl
    if (!batchImageUrls.value[index].includes(imageUrl)) {
      batchImageUrls.value[index].push(imageUrl)
    }
    
    console.log(`批次 ${index} 当前图片URLs:`, batchImageUrls.value[index])
  }
}

const onImageUploadFail = (index, event) => {
  console.error(`批次 ${index} 图片上传失败:`, event)
  uni.showToast({
    title: `第${event.index + 1}张图片上传失败`,
    icon: 'none'
  })
}

const onUploadComplete = (index, event) => {
  console.log(`批次 ${index} 批量上传完成:`, event)
  
  // 更新批次的图片URL数组
  if (event && event.results) {
    const urls = event.results
      .filter(result => result.success && result.file && result.file.previewUrl)
      .map(result => result.file.previewUrl)
    
    batchImageUrls.value[index] = urls
  }
  
  console.log(`批次 ${index} 所有图片URLs:`, batchImageUrls.value[index])
}

// ================================
// ✅ 从数据库获取烟品数据
// ================================
const loadTobaccoData = async () => {
  try {
    uni.showLoading({ title: '加载烟品数据...' })
    const response = await getTobaccoAll()
    
    // 检查响应格式，如果直接返回数组，则使用该数组
    let tobaccoData = []
    if (Array.isArray(response)) {
      // 如果response直接是数组
      tobaccoData = response
    } else if (response && response.code === 200 && Array.isArray(response.data)) {
      // 如果是Result格式
      tobaccoData = response.data
    } else if (response && Array.isArray(response.data)) {
      // 其他可能的格式
      tobaccoData = response.data
    }
    
    if (tobaccoData.length > 0) {
      // 构建牌号选项
      const options = tobaccoData.map(item => ({
        id: item.gradeName,
        name: item.gradeName
      }))
      brandOptions.value = options
      
      // 构建烟品数据映射，用于快速查找
      tobaccoData.forEach(item => {
        tobaccoDataMap.value[item.gradeName] = {
          gradeName: item.gradeName,
          batchPrefix: item.batchNumber || '', // 直接使用数据库中的批次号作为前缀
          defaultWeight: parseFloat(item.weight) || 0
        }
      })
    } else {
      uni.$u.toast('获取烟品数据失败或数据为空')
    }
  } catch (error) {
    console.error('加载烟品数据失败:', error)
    uni.$u.toast('加载烟品数据失败')
  } finally {
    uni.hideLoading()
  }
}

// 表单数据
const form = reactive({
  line: '',       // 线别：叶线 / 丝线
  shift: '',      // 班组：甲班 / 乙班
  tasks: []       // 批次列表
})

// 选项数据
const lineOptions = [
  { id: '叶A', name: '叶A线' },
  { id: '叶B', name: '叶B线' },
  { id: '丝A', name: '丝A线' },
  { id: '丝B/C', name: '丝B/C线' },
]

const orderOptions = [
  { id: '预混柜', name: '预混柜' },
  { id: '1', name: '1' },
  { id: '2', name: '2' },
  { id: '3', name: '3' },
  { id: '4', name: '4' },
  { id: '5', name: '5' },
  { id: '混丝柜', name: '混丝柜' }
]

// ================================
// ✅ 新增：批次号自动递增工具函数
// ================================
const extractTrailingNumber = (str) => {
  const match = str?.match(/^(.*?)(\d+)$/)
  return match ? { prefix: match[1], number: parseInt(match[2]) } : null
}

const padNumber = (num, length) => {
  return num.toString().padStart(length, '0')
}

const generateNextBatchNo = (current) => {
  if (!current) return ''
  const result = extractTrailingNumber(current)
  if (!result) return current + '-001'

  const { prefix, number } = result
  const digitCount = current.match(/\d+$/)[0].length
  const nextNumber = number + 1
  return prefix + padNumber(nextNumber, digitCount)
}

const generateDefaultBatchNo = (brand) => {
  const tobaccoInfo = tobaccoDataMap.value[brand]
  if (!tobaccoInfo || !tobaccoInfo.batchPrefix) return ''
  
  const prefix = tobaccoInfo.batchPrefix
  // 如果批次号已经包含数字，我们只在末尾添加当前日期
  const now = new Date()
  const y = (now.getFullYear() % 100).toString().padStart(2, '0')
  const m = (now.getMonth() + 1).toString().padStart(2, '0')
  const d = now.getDate().toString().padStart(2, '0')
  
  // 检查批次号是否已经包含日期信息
  if (prefix.match(/\d{4,6}$/)) {
    // 如果已有日期，直接返回批次号
    return prefix
  } else {
    // 如果没有日期，添加日期信息
    return `${prefix}${y}${m}${d}`
  }
}

const onBrandChange = (task) => {
  const newBrand = task.brand
  if (!task.batchNo?.trim()) {
    task.batchNo = generateDefaultBatchNo(newBrand)
  }
  if (!task.yield || task.yield <= 0) {
      const tobaccoInfo = tobaccoDataMap.value[newBrand]
          if (tobaccoInfo && tobaccoInfo.defaultWeight > 0) {
            task.yield = tobaccoInfo.defaultWeight
          }
	}
}

// 初始化：默认添加一条批次
onMounted(async() => {
  await loadTobaccoData() // 先加载烟品数据
  addBatch()
})

const addBatchFromLast = () => {
  let newTask
  if (form.tasks.length === 0) {
    // 第一条：空对象
    newTask = {
      id: ++taskIdCounter,
      order: '',
      brand: '',
      batchNo: '',
      yield: 0,
      remark: '',
      submitted: false
    }
  } else {
    const last = form.tasks[form.tasks.length - 1]
    // 复制上一条数据，但不包括备注和图片
    newTask = { 
      ...last, 
      id: ++taskIdCounter,
      remark: '', // 不复制备注，保持为空
    }

    // ✅ 1. 次序（order）智能递增：仅当是数字时 +1
    if (/^[1-5]$/.test(last.order)) {
      const nextOrder = parseInt(last.order) + 1
      // 限制最大为 5（可选）
      newTask.order = nextOrder <= 5 ? String(nextOrder) : last.order
    }

    // ✅ 2. 批次号自动递增
    if (newTask.batchNo) {
      newTask.batchNo = generateNextBatchNo(newTask.batchNo)
    }
	
	// ✅ 3. 添加提交状态标记
	newTask.submitted = false
  }
  form.tasks.push(newTask)
  
  // ================================
  // ✅ 修复：添加批次后初始化图片URL数组
  // ================================
  nextTick(() => {
    const newIndex = form.tasks.length - 1
    if (!batchImageUrls.value[newIndex]) {
      batchImageUrls.value[newIndex] = []
    }
  })
}

// ================================
// ✅ 修复：提交单个批次 - 集成图片上传
// ================================
const submitSingleTask = async (task, index) => {
  console.log("开始提交批次:", index)
  
  // 检查是否已经提交过
  if (task.submitted) {
    uni.$u.toast('该批次已提交，无需重复提交')
    return
  }
  
  // 1. 前端校验
  if (!task.order || !task.brand || !task.batchNo.trim() || !task.yield || task.yield <= 0) {
    uni.$u.toast(`第${index + 1}条批次信息不完整`)
    return
  }

  if (!uni.getStorageSync('userId')) {
    uni.$u.toast('用户未登录，请重新登录')
    return
  }

  try {
    uni.showLoading({ title: '准备提交...' })

    // ================================
    // ✅ 修复：先触发图片上传
    // ================================
    const uploadRef = uploadRefs.value[index]
    if (uploadRef && uploadRef.triggerUpload) {
      
      uni.showLoading({ title: '上传图片中...' })
      const uploadResults = await uploadRef.triggerUpload()
      
      // 等待上传完成，更新图片URL数组
      if (uploadResults && uploadResults.length > 0) {
        const successfulUploads = uploadResults.filter(result => result.success)
        if (successfulUploads.length > 0) {
          batchImageUrls.value[index] = successfulUploads.map(result => 
            result.file.previewUrl || result.file.url
          )
          //console.log(`批次 ${index} 上传成功的图片URLs:`, batchImageUrls.value[index])
        }
      }
    } else {
      console.warn(`批次 ${index} 的上传组件引用不存在`)
    }

    // 3. 构造提交数据 - 使用上传成功的图片URL
    const imageUrls = batchImageUrls.value[index] || []
	console.log(imageUrls)
    
    const submitData = {
      line: form.line,              // 产线
      classes: uni.getStorageSync('userInfo').class,            // 班组
      userId: uni.getStorageSync('userId'),               // 用户ID
      number: task.order,            // 次序
      brand: task.brand,            // 牌号
      batchNo: task.batchNo.trim(), // 批次号
      yield: task.yield,            // 产量
      remark: task.remark || '',    // 备注（可选）
      images: imageUrls             // 已上传的图片URL数组
    }

    console.log('提交数据:', submitData)

    // 4. 调用 API
    await submitSingleBatch(submitData)

    uni.hideLoading()
    uni.$u.toast(`✅ 批次 ${task.batchNo} 提交成功！`)

    // 标记该批次已提交
    task.submitted = true

  } catch (error) {
    uni.hideLoading()
    console.error('单条提交失败:', error)
    uni.$u.toast('❌ 提交失败，请重试')
  }
}

// 添加批次
const addBatch = () => {
  form.tasks.push({
    order: '',
    brand: '',
    batchNo: '',
    yield: 0,
    remark: '',
    submitted: false
  })
  
  // ================================
  // ✅ 修复：添加批次后初始化图片URL数组
  // ================================
  nextTick(() => {
    const newIndex = form.tasks.length - 1
    if (!batchImageUrls.value[newIndex]) {
      batchImageUrls.value[newIndex] = []
    }
  })
}

// 删除批次
const removeBatch = (index) => {
  if (form.tasks.length > 1) {
    form.tasks.splice(index, 1)
    // ================================
    // ✅ 修复：删除批次时同时删除对应的图片URL数组
    // ================================
    delete batchImageUrls.value[index]
    // 重新索引 uploadRefs
    uploadRefs.value.splice(index, 1)
  }
}

// 验证
const validateForm = () => {
  if (!form.line) {
    uni.$u.toast('请选择线别')
    return false
  }
  if (!form.shift) {
    uni.$u.toast('请选择班组')
    return false
  }
  for (let i = 0; i < form.tasks.length; i++) {
    const task = form.tasks[i]
    if (!task.order) {
      uni.$u.toast(`第${i+1}条批次：请选择次序`)
      return false
    }
    if (!task.brand) {
      uni.$u.toast(`第${i+1}条批次：请选择牌号`)
      return false
    }
    if (!task.batchNo.trim()) {
      uni.$u.toast(`第${i+1}条批次：请输入批次号`)
      return false
    }
    if (!task.yield || task.yield <= 0) {
      uni.$u.toast(`第${i+1}条批次：请输入有效产量`)
      return false
    }
  }
  return true
}

// 提交
const handleSubmit = async () => {
  if (!validateForm()) return

  try {
    // 示例提交数据
    const data = {
      date: currentDate.value,
      line: form.line,
      shift: form.shift,
      tasks: form.tasks
    }

    // 调用接口
    // await submitProductionTask(data)

    uni.$u.toast('提交成功！')
    setTimeout(() => {
      uni.navigateBack()
    }, 800)
  } catch (err) {
    uni.$u.toast('提交失败，请重试')
  }
}

// ================================
// ✅ 新增：获取批次图片URL的辅助方法
// ================================
const getBatchImageUrls = (index) => {
  return batchImageUrls.value[index] || []
}

const getAllImageUrls = () => {
  return Object.values(batchImageUrls.value).flat()
}
</script>


<style lang="scss" scoped>
	
:v-deep .u-select-option {
  color: #333 !important; // 确保文字颜色可见
}
.container {
  min-height: 100vh;
  background-color: #f5f7fa;
  padding: 10rpx;
}

.title-box {
  text-align: center;
}

.title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
}

.date {
  font-size: 24rpx;
  color: #666;
  margin-top: 5rpx;
}

.batch-item {
  background-color: #fff;
  border-radius: 12rpx;
  padding: 20rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.05);
  position: relative;
}

.delete-btn {
  position: absolute;
  right: 20rpx;
  top: 20rpx;
  z-index: 10;
}

.add-batch-btn {
  text-align: center;
  margin: 20rpx 0;
}

.submit-box {
  padding: 30rpx 0;
  text-align: center;
}

// 图片上传区域样式
.image-upload-section {
  margin-top: 15rpx;
  padding-top: 15rpx;
  border-top: 1rpx solid #eee;
}

.image-upload-title {
  font-size: 28rpx;
  color: #606266;
  margin-bottom: 10rpx;
}

.image-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 10rpx;
}

.image-item {
  position: relative;
  width: 120rpx;
  height: 120rpx;
}

.uploaded-image {
  width: 100%;
  height: 100%;
  border-radius: 8rpx;
}

.image-delete {
  position: absolute;
  top: -8rpx;
  right: -8rpx;
  width: 32rpx;
  height: 32rpx;
  background-color: #fa3534;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  font-weight: bold;
  z-index: 2;
}

.add-image-btn {
  width: 120rpx;
  height: 120rpx;
  border: 2rpx dashed #409EFF;
  border-radius: 8rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #f8f9ff;
}

.add-text {
  font-size: 24rpx;
  color: #409EFF;
  margin-top: 5rpx;
}

// 提交按钮样式
.submit-single-btn {
  margin-top: 15rpx;
  width: 100%;
}
</style>



