<template>
  <view class="container">
    <!-- 顶部标题和月份选择 -->
    <view class="header">
      <text class="title">残烟丝管理</text>
      <view class="month-selector">
        <text>11月</text>
        <text class="dropdown">▼</text>
      </view>
    </view>

    <!-- 快速操作按钮 -->
    <view class="actions-section">
      <view class="actions-title">🛠️ 快速操作</view>
      <view class="action-buttons">
        <view class="action-btn" @click="openReceiveForm">
          <text class="action-icon">📥</text>
          <text class="action-label">接收</text>
        </view>
        <view class="action-btn" @click="openBlendForm">
          <text class="action-icon">⚖️</text>
          <text class="action-label">掺兑</text>
        </view>
        <view class="action-btn" @click="showReturnForm = true">
          <text class="action-icon">🚚</text>
          <text class="action-label">超时</text>
        </view>
      </view>
    </view>

    <!-- 牌号筛选 -->
    <view class="filter-section">
      <view class="filter-title">🎯 牌号筛选</view>
      <scroll-view class="brand-scroll" scroll-x="true">
        <view 
          v-for="brand in brands" 
          :key="brand.batchNumber"
          :class="['brand-tag', selectedBrandId === brand.batchNumber ? 'active' : '']"
          @click="selectBrand(brand.batchNumber)"
        >
          <text>{{ brand.gradeName }}</text>
        </view>
      </scroll-view>
    </view>
    
    <!-- 批次库存列表 -->
    <view class="batch-section">
      <view class="batch-header">
        <text class="batch-title">📦 批次库存 (先进先出)</text>
        <text class="batch-sort">最早↑</text>
      </view>
      <view class="batch-list">
        <view 
          v-for="batch in filteredBatches" 
          :key="batch.id"
          :class="['batch-item', getStatusClass(batch.status)]"
        >
          <view class="batch-info">
            <text class="batch-id">{{ batch.batchId }}</text>
            <text class="batch-date">{{ batch.receiveDate }}</text>
            <text class="batch-brand">{{ batch.brandName }}</text>
          </view>
          <view class="batch-details">
            <text class="batch-remaining">{{ batch.remainingBags }}袋 {{ batch.remainingWeight }}kg</text>
            <view :class="['batch-status', getStatusClass(batch.status)]">
              <text>{{ getStatusText(batch.status, batch.daysRemaining) }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 接收烟丝表单 -->
    <view v-if="showReceiveForm" class="modal-overlay">
      <view class="modal-content">
        <view class="modal-header">
          <text class="modal-title">烟丝接收记录</text>
          <text class="modal-close" @click="showReceiveForm = false">×</text>
        </view>
        <view class="form-group">
          <text class="form-label">牌号：</text>
          <view class="brand-selector">
            <view class="picker" @click="showBrandPicker = true">
              {{ receiveForm.brandName || '请选择牌号' }}
            </view>
          </view>
        </view>
        <view class="form-group">
          <text class="form-label">批次号：</text>
          <text class="form-value">{{ generateBatchId() }}</text>
        </view>
        <view class="form-group">
          <text class="form-label">接收日期：</text>
          <text class="form-value">{{ getCurrentDate() }}</text>
        </view>
        <view class="form-group">
          <text class="form-label">过期日期：</text>
          <text class="form-value">{{ getExpireDate() }}</text>
        </view>
        <view class="form-group">
          <text class="form-label">数量：</text>
          <view class="input-group">
            <input v-model="receiveForm.bags" type="number" class="form-input" placeholder="袋" />
            <text class="input-unit">袋</text>
            <input v-model="receiveForm.weight" type="number" class="form-input" placeholder="公斤" />
            <text class="input-unit">公斤</text>
          </view>
        </view>
        <view class="form-group">
          <text class="form-label">班次：</text>
          <view class="radio-group">
            <view 
              :class="['radio-option', receiveForm.shift === '白班' ? 'selected' : '']"
              @click="receiveForm.shift = '白班'"
            >
              <text>白班</text>
            </view>
            <view 
              :class="['radio-option', receiveForm.shift === '中班' ? 'selected' : '']"
              @click="receiveForm.shift = '中班'"
            >
              <text>中班</text>
            </view>
          </view>
        </view>
        <view class="form-actions">
          <view class="btn btn-cancel" @click="showReceiveForm = false">取消</view>
          <view class="btn btn-confirm" @click="saveReceiveForm">确认保存</view>
        </view>
      </view>
    </view>

    <!-- 牌号选择器 -->
    <view v-if="showBrandPicker" class="modal-overlay">
      <view class="modal-content brand-picker-modal">
        <view class="modal-header">
          <text class="modal-title">选择牌号</text>
          <text class="modal-close" @click="showBrandPicker = false">×</text>
        </view>
        <view class="brand-picker-list">
          <view 
            v-for="brand in brands" 
            :key="brand.batchNumber"
            :class="['brand-picker-item', receiveForm.brandId === brand.batchNumber ? 'selected' : '']"
            @click="selectBrandForReceive(brand)"
          >
            <text>{{ brand.gradeName }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 今日掺兑记录 -->
    <view v-if="showBlendForm" class="modal-overlay">
      <view class="modal-content">
        <view class="modal-header">
          <text class="modal-title">今日掺兑记录</text>
          <text class="modal-close" @click="showBlendForm = false">×</text>
        </view>
        
        <!-- 掺兑记录列表 -->
        <view class="blend-records">
          <view class="records-header">
            <text class="header-text">今日掺兑批次</text>
            <view class="add-button" @click="openAddBlendForm">
              <text class="add-icon">+</text>
              <text>新增掺兑</text>
            </view>
          </view>
          
          <view class="records-list">
            <view 
              v-for="record in todayBlendRecords" 
              :key="record.id"
              class="blend-record-item"
            >
              <view class="record-main">
                <text class="record-batch">{{ record.batchIdStr }}</text>
                <text class="record-brand">{{ record.brandName }}</text>
              </view>
              <view class="record-details">
                <text class="record-amount">{{ record.bagsUsed }}袋 {{ record.weightUsed }}kg</text>
                <text class="record-shift">{{ record.shiftType }}</text>
                <text class="record-time">{{ record.operationTime }}</text>
              </view>
            </view>
            
            <view v-if="todayBlendRecords.length === 0" class="empty-records">
              <text class="empty-text">今日暂无掺兑记录</text>
            </view>
          </view>
        </view>
        
        <view class="form-actions">
          <view class="btn btn-confirm" @click="showBlendForm = false">关闭</view>
        </view>
      </view>
    </view>

    <!-- 新增掺兑表单 -->
    <view v-if="showAddBlendForm" class="modal-overlay">
      <view class="modal-content">
        <view class="modal-header">
          <text class="modal-title">新增掺兑记录</text>
          <text class="modal-close" @click="closeAddBlendForm">×</text>
        </view>
        
        <view class="form-group">
          <text class="form-label">牌号：</text>
          <view class="brand-selector">
            <view class="picker" @click="showBlendBrandPicker = true">
              {{ blendForm.brandName || '请选择牌号' }}
            </view>
          </view>
        </view>
        
        <view class="form-group">
          <text class="form-label">批次：</text>
          <view class="batch-selector">
            <view class="picker" @click="showBlendBatchPicker = true">
              {{ blendForm.batchId || '请选择批次' }}
            </view>
          </view>
        </view>
        
        <view class="form-group">
          <text class="form-label">掺兑数量：</text>
          <view class="input-group">
            <input v-model="blendForm.bags" type="number" class="form-input" placeholder="袋" />
            <text class="input-unit">袋</text>
            <input v-model="blendForm.weight" type="number" class="form-input" placeholder="公斤" />
            <text class="input-unit">公斤</text>
          </view>
        </view>
        
        <view class="form-group">
          <text class="form-label">班次：</text>
          <view class="radio-group">
            <view 
              :class="['radio-option', blendForm.shift === '白班' ? 'selected' : '']"
              @click="blendForm.shift = '白班'"
            >
              <text>白班</text>
            </view>
            <view 
              :class="['radio-option', blendForm.shift === '中班' ? 'selected' : '']"
              @click="blendForm.shift = '中班'"
            >
              <text>中班</text>
            </view>
          </view>
        </view>
        
        <view class="form-actions">
          <view class="btn btn-cancel" @click="closeAddBlendForm">取消</view>
          <view class="btn btn-confirm" @click="saveBlendRecord">确认保存</view>
        </view>
      </view>
    </view>

    <!-- 掺兑牌号选择器 -->
    <view v-if="showBlendBrandPicker" class="modal-overlay">
      <view class="modal-content brand-picker-modal">
        <view class="modal-header">
          <text class="modal-title">选择掺兑牌号</text>
          <text class="modal-close" @click="showBlendBrandPicker = false">×</text>
        </view>
        <view class="brand-picker-list">
          <view 
            v-for="brand in availableBrands" 
            :key="brand.batchNumber"
            :class="['brand-picker-item', blendForm.brandId === brand.batchNumber ? 'selected' : '']"
            @click="selectBlendBrand(brand)"
          >
            <text>{{ brand.gradeName }}</text>
            <text class="brand-stock">库存: {{ getBrandStock(brand.batchNumber) }}袋</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 掺兑批次选择器 -->
    <view v-if="showBlendBatchPicker" class="modal-overlay">
      <view class="modal-content">
        <view class="modal-header">
          <text class="modal-title">选择批次 - {{ getBrandName(blendForm.brandId) }}</text>
          <text class="modal-close" @click="showBlendBatchPicker = false">×</text>
        </view>
        <view class="batch-picker-list">
          <view 
            v-for="batch in getBatchesByBrand(blendForm.brandId)" 
            :key="batch.id"
            :class="['batch-picker-item', getStatusClass(batch.status)]"
            @click="selectBlendBatch(batch)"
          >
            <view class="batch-picker-info">
              <text class="batch-picker-id">{{ batch.batchId }}</text>
              <text class="batch-picker-date">{{ batch.receiveDate }}</text>
            </view>
            <view class="batch-picker-details">
              <text class="batch-picker-remaining">{{ batch.remainingBags }}袋 {{ batch.remainingWeight }}kg</text>
              <view :class="['batch-picker-status', getStatusClass(batch.status)]">
                <text>{{ getStatusText(batch.status, batch.daysRemaining) }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { getTobaccoAll } from '@/api/production'
import { saveDottleInventory, selectdottle, queryDayDottle } from '@/api/from'

// 牌号数据
const brands = ref([])

// 选中的牌号ID
const selectedBrandId = ref(0) // 0表示全部

// 批次列表
const batches = ref([])

// 今日掺兑记录
const todayBlendRecords = ref([])

// 根据选中的牌号筛选批次
const filteredBatches = computed(() => {
  if (selectedBrandId.value === 0) {
    return batches.value
  }
  return batches.value.filter(batch => batch.brandId === selectedBrandId.value)
})

// 有库存的牌号
const availableBrands = computed(() => {
  const brandIdsWithStock = [...new Set(batches.value.map(batch => batch.brandId))]
  return brands.value.filter(brand => brandIdsWithStock.includes(brand.batchNumber))
})

// 模态框显示状态
const showReceiveForm = ref(false)
const showBlendForm = ref(false)
const showAddBlendForm = ref(false)
const showReturnForm = ref(false)
const showBrandPicker = ref(false)
const showBlendBrandPicker = ref(false)
const showBlendBatchPicker = ref(false)

// 接收表单数据
const receiveForm = reactive({
  brandId: null,
  brandName: '',
  bags: '',
  weight: '',
  shift: '白班'
})

// 掺兑表单数据
const blendForm = reactive({
  brandId: null,
  brandName: '',
  batchId: null,
  batchInfo: null,
  bags: '',
  weight: '',
  shift: '白班'
})

// 查询残烟丝数据
const brandDottleId = ref('')

// 选择牌号
const selectBrand = (brandId) => {
  selectedBrandId.value = brandId
}

// 打开接收表单
const openReceiveForm = () => {
  showReceiveForm.value = true
  // 重置表单
  receiveForm.brandId = null
  receiveForm.brandName = ''
  receiveForm.bags = ''
  receiveForm.weight = ''
  receiveForm.shift = '白班'
}

// 打开掺兑表单 - 显示今日掺兑记录
const openBlendForm = () => {
  showBlendForm.value = true
  // 这里可以调用API获取今日掺兑记录
  loadTodayBlendRecords()
}

// 打开新增掺兑表单
const openAddBlendForm = () => {
  showBlendForm.value = false
  showAddBlendForm.value = true
  // 重置掺兑表单
  blendForm.brandId = null
  blendForm.brandName = ''
  blendForm.batchId = null
  blendForm.batchInfo = null
  blendForm.bags = ''
  blendForm.weight = ''
  blendForm.shift = '白班'
}

// 关闭新增掺兑表单
const closeAddBlendForm = () => {
  showAddBlendForm.value = false
  showBlendForm.value = true
}

// 选择接收牌号
const selectBrandForReceive = (brand) => {
  receiveForm.brandId = brand.batchNumber
  receiveForm.brandName = brand.gradeName
  showBrandPicker.value = false
}

// 选择掺兑牌号
const selectBlendBrand = (brand) => {
  blendForm.brandId = brand.batchNumber
  blendForm.brandName = brand.gradeName
  blendForm.batchId = null
  blendForm.batchInfo = null
  showBlendBrandPicker.value = false
}

// 选择掺兑批次
const selectBlendBatch = (batch) => {
  blendForm.batchId = batch.batchId
  blendForm.batchInfo = batch
  showBlendBatchPicker.value = false
}

// 获取牌号名称
const getBrandName = (brandId) => {
  const brand = brands.value.find(b => b.batchNumber === brandId)
  return brand ? brand.gradeName : ''
}

// 获取牌号库存
const getBrandStock = (brandId) => {
  const brandBatches = batches.value.filter(batch => batch.brandId === brandId)
  return brandBatches.reduce((total, batch) => total + batch.remainingBags, 0)
}

// 根据牌号获取批次
const getBatchesByBrand = (brandId) => {
  return batches.value
    .filter(batch => batch.brandId === brandId && batch.remainingBags > 0)
    .sort((a, b) => new Date(a.receiveDate) - new Date(b.receiveDate)) // 按日期排序，最早的在前
}

// 生成批次ID
const generateBatchId = () => {
  const brandId = receiveForm.brandId || ''
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${brandId}${year}${month}${day}`
}

// 获取当前日期
const getCurrentDate = () => {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${month}-${day}`
}

// 获取过期日期（30天后）
const getExpireDate = () => {
  const now = new Date()
  now.setDate(now.getDate() + 30)
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${month}-${day}`
}

// 根据状态获取CSS类名
const getStatusClass = (status) => {
  switch(status) {
    case 'normal': return 'status-normal'
    case 'warning': return 'status-warning'
    case 'expired': return 'status-expired'
    default: return ''
  }
}

// 获取状态文本
const getStatusText = (status, daysRemaining) => {
  switch(status) {
    case 'normal': return '✅正常'
    case 'warning': return `⚠️剩${daysRemaining}天`
    case 'expired': return '⚠️已过期'
    default: return ''
  }
}

// 保存接收表单
const saveReceiveForm = async () => {
  if (!receiveForm.brandId) {
    uni.showToast({
      title: '请选择牌号',
      icon: 'none'
    })
    return
  }
  
  if (!receiveForm.bags || !receiveForm.weight) {
    uni.showToast({
      title: '请填写数量',
      icon: 'none'
    })
    return
  }
  
  // 创建新批次
  const newBatch = {
    batchId: generateBatchId(),
    brandId: receiveForm.brandId,
    totalBags: parseInt(receiveForm.bags) || 0,
    totalWeight: parseFloat(receiveForm.weight) || 0,
    status: 'normal',
    daysRemaining: 30,
    operator: uni.getStorageSync('userInfo').name,
    shiftType: receiveForm.shift
  }
  
  const res = await saveDottleInventory(newBatch)
  
  uni.showToast({
    title: '接收成功',
    icon: 'success'
  })
  
  showReceiveForm.value = false
  
  // 刷新批次列表
  const dottleList = await selectdottle(brandDottleId.value)
  batches.value = dottleList
}

// 保存掺兑记录
const saveBlendRecord = async () => {
  if (!blendForm.brandId) {
    uni.showToast({
      title: '请选择牌号',
      icon: 'none'
    })
    return
  }
  
  if (!blendForm.batchId) {
    uni.showToast({
      title: '请选择批次',
      icon: 'none'
    })
    return
  }
  
  if (!blendForm.bags || !blendForm.weight) {
    uni.showToast({
      title: '请填写掺兑数量',
      icon: 'none'
    })
    return
  }
  
  // 验证数量不超过剩余量
  if (parseInt(blendForm.bags) > blendForm.batchInfo.remainingBags) {
    uni.showToast({
      title: '掺兑袋数不能超过剩余袋数',
      icon: 'none'
    })
    return
  }
  
  if (parseFloat(blendForm.weight) > blendForm.batchInfo.remainingWeight) {
    uni.showToast({
      title: '掺兑重量不能超过剩余重量',
      icon: 'none'
    })
    return
  }
  
  // 创建掺兑记录
  const blendRecord = {
    batchId: blendForm.batchId,
    brandName: blendForm.brandName,
    bagsUsed: parseInt(blendForm.bags),
    weightUsed: parseFloat(blendForm.weight),
    shiftType: blendForm.shift,
    operationTime: new Date().toLocaleTimeString()
  }
  
  // 这里应该调用API保存掺兑记录
  // await saveBlendRecordAPI(blendRecord)
  
  // 临时添加到今日掺兑记录
  todayBlendRecords.value.push({
    id: Date.now(),
    ...blendRecord
  })
  
  // 更新批次剩余量
  const batchIndex = batches.value.findIndex(b => b.batchId === blendForm.batchId)
  if (batchIndex !== -1) {
    batches.value[batchIndex].remainingBags -= blendRecord.bagsUsed
    batches.value[batchIndex].remainingWeight -= blendRecord.weightUsed
  }
  
  uni.showToast({
    title: '掺兑记录保存成功',
    icon: 'success'
  })
  
  closeAddBlendForm()
}

// 加载今日掺兑记录
const loadTodayBlendRecords = async () => {
  
  todayBlendRecords.value = await queryDayDottle()
}

// 初始化
onMounted(async () => {
  const res = await getTobaccoAll()
  brands.value = res
  const dottleList = await selectdottle(brandDottleId.value)
  batches.value = dottleList
})
</script>

<style scoped>
.container {
  padding: 20rpx;
  background-color: #f5f5f5;
  min-height: 100vh;
}

/* 头部样式 */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30rpx;
}

.title {
  font-size: 36rpx;
  font-weight: bold;
}

.month-selector {
  display: flex;
  align-items: center;
  font-size: 28rpx;
}

.dropdown {
  margin-left: 10rpx;
  font-size: 20rpx;
}

/* 操作按钮区域 */
.actions-section {
  background: white;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.05);
}

.actions-title {
  font-size: 30rpx;
  font-weight: bold;
  margin-bottom: 20rpx;
}

.action-buttons {
  display: flex;
  justify-content: space-between;
}

.action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20rpx;
  border-radius: 12rpx;
  background-color: #f8f9fa;
  width: 30%;
}

.action-icon {
  font-size: 40rpx;
  margin-bottom: 10rpx;
}

.action-label {
  font-size: 24rpx;
}

/* 牌号筛选区域 */
.filter-section {
  background: white;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.05);
}

.filter-title {
  font-size: 30rpx;
  font-weight: bold;
  margin-bottom: 20rpx;
}

.brand-scroll {
  white-space: nowrap;
  width: 100%;
}

.brand-tag {
  display: inline-block;
  padding: 15rpx 25rpx;
  margin-right: 20rpx;
  border-radius: 30rpx;
  background-color: #f5f5f5;
  font-size: 26rpx;
  color: #666;
}

.brand-tag.active {
  background-color: #1976d2;
  color: white;
}

.brand-tag:last-child {
  margin-right: 0;
}

/* 批次库存区域 */
.batch-section {
  background: white;
  border-radius: 16rpx;
  padding: 30rpx;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.05);
}

.batch-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.batch-title {
  font-size: 30rpx;
  font-weight: bold;
}

.batch-sort {
  font-size: 24rpx;
  color: #666;
}

.batch-list {
  display: flex;
  flex-direction: column;
}

.batch-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 25rpx 0;
  border-bottom: 1rpx solid #eee;
}

.batch-item:last-child {
  border-bottom: none;
}

.batch-info {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.batch-id {
  font-size: 28rpx;
  font-weight: bold;
  margin-bottom: 5rpx;
}

.batch-date {
  font-size: 22rpx;
  color: #666;
  margin-bottom: 5rpx;
}

.batch-brand {
  font-size: 22rpx;
  color: #1976d2;
  font-weight: bold;
}

.batch-details {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  flex: 1;
  margin: 0 20rpx;
}

.batch-remaining {
  font-size: 26rpx;
  margin-bottom: 5rpx;
}

.batch-status {
  font-size: 22rpx;
  padding: 4rpx 12rpx;
  border-radius: 20rpx;
}

.status-normal {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.status-warning {
  background-color: #ffff99;
  color: #ef6c00;
}

.status-expired {
  background-color: #ffebee;
  color: #c62828;
}

/* 模态框样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  width: 90%;
  max-width: 600rpx;
  border-radius: 16rpx;
  padding: 30rpx;
  box-shadow: 0 10rpx 30rpx rgba(0,0,0,0.2);
  max-height: 80vh;
  overflow-y: auto;
}

.brand-picker-modal {
  max-width: 500rpx;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30rpx;
  padding-bottom: 20rpx;
  border-bottom: 1rpx solid #eee;
}

.modal-title {
  font-size: 32rpx;
  font-weight: bold;
}

.modal-close {
  font-size: 40rpx;
  color: #999;
}

.form-group {
  margin-bottom: 30rpx;
}

.form-label {
  font-size: 28rpx;
  margin-bottom: 10rpx;
  display: block;
}

.form-value {
  font-size: 28rpx;
  font-weight: bold;
  color: #1976d2;
}

.brand-selector, .batch-selector {
  margin-top: 10rpx;
}

.picker {
  padding: 15rpx;
  border: 1rpx solid #ddd;
  border-radius: 8rpx;
  font-size: 28rpx;
}

.input-group {
  display: flex;
  align-items: center;
}

.form-input {
  border: 1rpx solid #ddd;
  border-radius: 8rpx;
  padding: 15rpx;
  font-size: 28rpx;
  flex: 1;
  margin-right: 10rpx;
}

.form-input.inline {
  width: 120rpx;
  margin-left: 20rpx;
  margin-right: 10rpx;
}

.input-unit {
  font-size: 28rpx;
  margin-right: 20rpx;
}

.radio-group {
  display: flex;
}

.radio-group.vertical {
  flex-direction: column;
}

.radio-option {
  display: flex;
  align-items: center;
  padding: 15rpx 20rpx;
  border: 1rpx solid #ddd;
  border-radius: 8rpx;
  margin-right: 20rpx;
  margin-bottom: 10rpx;
}

.radio-option.selected {
  background-color: #e3f2fd;
  border-color: #1976d2;
  color: #1976d2;
}

.radio-option:last-child {
  margin-right: 0;
}

.form-actions {
  display: flex;
  justify-content: space-between;
  margin-top: 40rpx;
}

.btn {
  padding: 20rpx 40rpx;
  border-radius: 8rpx;
  font-size: 28rpx;
  text-align: center;
  flex: 1;
  margin: 0 10rpx;
}

.btn-cancel {
  background-color: #f5f5f5;
  color: #666;
}

.btn-confirm {
  background-color: #1976d2;
  color: white;
}

/* 掺兑记录样式 */
.blend-records {
  margin-bottom: 30rpx;
}

.records-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.header-text {
  font-size: 28rpx;
  font-weight: bold;
}

.add-button {
  display: flex;
  align-items: center;
  padding: 10rpx 20rpx;
  background-color: #f0f7ff;
  border-radius: 20rpx;
  color: #1976d2;
}

.add-icon {
  margin-right: 8rpx;
  font-weight: bold;
}

.records-list {
  max-height: 300rpx;
  overflow-y: auto;
}

.blend-record-item {
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.record-main {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10rpx;
}

.record-batch {
  font-size: 26rpx;
  font-weight: bold;
}

.record-brand {
  font-size: 24rpx;
  color: #666;
}

.record-details {
  display: flex;
  justify-content: space-between;
  font-size: 22rpx;
  color: #888;
}

.record-amount {
  font-weight: bold;
  color: #1976d2;
}

.empty-records {
  text-align: center;
  padding: 40rpx 0;
}

.empty-text {
  font-size: 26rpx;
  color: #999;
}

/* 牌号选择器列表 */
.brand-picker-list {
  display: flex;
  flex-direction: column;
}

.brand-picker-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 25rpx 0;
  border-bottom: 1rpx solid #eee;
}

.brand-picker-item.selected {
  background-color: #e3f2fd;
  margin: 0 -30rpx;
  padding-left: 30rpx;
  padding-right: 30rpx;
}

.brand-picker-item:last-child {
  border-bottom: none;
}

.brand-stock {
  font-size: 24rpx;
  color: #666;
}

/* 批次选择器列表 */
.batch-picker-list {
  display: flex;
  flex-direction: column;
}

.batch-picker-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 25rpx 0;
  border-bottom: 1rpx solid #eee;
}

.batch-picker-item:last-child {
  border-bottom: none;
}

.batch-picker-info {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.batch-picker-id {
  font-size: 28rpx;
  font-weight: bold;
  margin-bottom: 5rpx;
}

.batch-picker-date {
  font-size: 22rpx;
  color: #666;
}

.batch-picker-details {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  flex: 1;
  margin: 0 20rpx;
}

.batch-picker-remaining {
  font-size: 26rpx;
  margin-bottom: 5rpx;
}

.batch-picker-status {
  font-size: 22rpx;
  padding: 4rpx 12rpx;
  border-radius: 20rpx;
}
</style>