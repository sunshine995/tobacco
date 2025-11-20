<template>
  <view class="container">
    <!-- 顶部卡片区域 -->
    <view class="header-card">
      <WorkOrderInfoCard :order-info="myOrder" />
    </view>
    
    <!-- 页面内容 -->
    <view class="content-section">
  
      <!-- 掺兑记录区域 -->
      <view v-if="isBlendCompleted" class="completed-section">
        <view class="completed-icon">✓</view>
        <view class="completed-title">已完成掺兑</view>
        <view class="completed-subtitle">当前工单的残烟掺兑操作已完成</view>
        <view class="action-buttons">
          <view class="btn btn-cancel" @click="goBack">
            <text>返回</text>
          </view>
        </view>
      </view>
      
      <!-- 新增掺兑记录表单区域 -->
      <view v-else>
        <!-- 表单区域 -->
        <view class="form-section">
          <!-- 牌号选择 -->
          <view class="form-group">
            <view class="form-label">
              <text class="label-text">选择牌号</text>
              <text class="required">*</text>
            </view>
            <view class="form-control" @click="showBrandPicker = true">
              <text :class="['placeholder', blendForm.brandName ? 'selected' : '']">
                {{ blendForm.brandName || '请选择牌号' }}
              </text>
              <text class="dropdown-icon">▼</text>
            </view>
            <text class="form-hint" v-if="selectedBrandStock > 0">
              当前库存: {{ selectedBrandStock }}袋
            </text>
          </view>

          <!-- 批次选择 -->
          <view class="form-group" v-if="blendForm.brandId">
            <view class="form-label">
              <text class="label-text">选择批次</text>
              <text class="required">*</text>
            </view>
            <view class="form-control" @click="showBatchPicker = true">
              <text :class="['placeholder', blendForm.batchId ? 'selected' : '']">
                {{ blendForm.batchId || '请选择批次' }}
              </text>
              <text class="dropdown-icon">▼</text>
            </view>
            
            <!-- 批次信息预览 -->
            <view v-if="selectedBatchInfo" class="batch-preview">
              <view class="batch-info-row">
                <text class="info-label">接收日期:</text>
                <text class="info-value">{{ selectedBatchInfo.receiveDate }}</text>
              </view>
              <view class="batch-info-row">
                <text class="info-label">剩余数量:</text>
                <text class="info-value">{{ selectedBatchInfo.remainingBags }}袋 / {{ selectedBatchInfo.remainingWeight }}kg</text>
              </view>
              <view class="batch-info-row">
                <text class="info-label">状态:</text>
                <text :class="['info-value', getStatusClass(selectedBatchInfo.status)]">
                  {{ getStatusText(selectedBatchInfo.status, selectedBatchInfo.daysRemaining) }}
                </text>
              </view>
            </view>
          </view>

          <!-- 掺兑数量 -->
          <view class="form-group">
            <view class="form-label">
              <text class="label-text">掺兑数量</text>
              <text class="required">*</text>
            </view>
            <view class="quantity-inputs">
              <view class="input-group">
                <input 
                  v-model="blendForm.bags" 
                  type="number" 
                  class="quantity-input" 
                  placeholder="0"
                  @blur="validateBags"
                />
                <text class="input-unit">袋</text>
              </view>
              <view class="input-group">
                <input 
                  v-model="blendForm.weight" 
                  type="number" 
                  class="quantity-input" 
                  placeholder="0.00"
                  @blur="validateWeight"
                />
                <text class="input-unit">公斤</text>
              </view>
            </view>
            
            <!-- 数量验证提示 -->
            <view v-if="quantityError" class="error-message">
              <text>{{ quantityError }}</text>
            </view>
            
            <!-- 剩余量提示 -->
            <view v-if="selectedBatchInfo" class="remaining-hint">
              <text>剩余: {{ selectedBatchInfo.remainingBags }}袋 / {{ selectedBatchInfo.remainingWeight }}kg</text>
            </view>
          </view>

          <!-- 班次选择 -->
          <view class="form-group">
            <view class="form-label">
              <text class="label-text">选择班次</text>
              <text class="required">*</text>
            </view>
            <view class="shift-options">
              <view 
                v-for="shift in shiftOptions" 
                :key="shift.value"
                :class="['shift-option', blendForm.shift === shift.value ? 'selected' : '']"
                @click="blendForm.shift = shift.value"
              >
                <text class="shift-icon">{{ shift.icon }}</text>
                <text class="shift-text">{{ shift.label }}</text>
                <text class="shift-time">{{ shift.time }}</text>
              </view>
            </view>
          </view>

          <!-- 备注信息 -->
          <view class="form-group">
            <view class="form-label">
              <text class="label-text">备注信息</text>
            </view>
            <textarea 
              v-model="blendForm.notes" 
              class="notes-textarea" 
              placeholder="可在此输入掺兑相关备注信息..."
              maxlength="200"
            />
            <view class="notes-counter">
              <text>{{ blendForm.notes.length }}/200</text>
            </view>
          </view>
        </view>

        <!-- 操作按钮 -->
        <view class="action-buttons">
          <view class="btn btn-cancel" @click="goBack">
            <text>取消</text>
          </view>
          <view 
            :class="['btn', 'btn-confirm', isFormValid ? '' : 'disabled']" 
            @click="submitForm"
          >
            <text>确认掺兑</text>
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
            <view class="search-box">
              <input 
                v-model="brandSearch" 
                class="search-input" 
                placeholder="搜索牌号..."
              />
            </view>
            <scroll-view class="brand-picker-list" scroll-y="true">
              <view 
                v-for="brand in filteredBrands" 
                :key="brand.batchNumber"
                :class="['brand-picker-item', blendForm.brandId === brand.batchNumber ? 'selected' : '']"
                @click="selectBrand(brand)"
              >
                <view class="brand-info">
                  <text class="brand-name">{{ brand.gradeName }}</text>
                  <text class="brand-stock">库存: {{ getBrandStock(brand.brandId) }}袋</text>
                </view>
                <view class="brand-status">
                  <text v-if="getBrandStock(brand.brandId) > 0" class="in-stock">有库存</text>
                  <text v-else class="out-of-stock">无库存</text>
                </view>
              </view>
              
              <view v-if="filteredBrands.length === 0" class="empty-state">
                <text class="empty-text">未找到相关牌号</text>
              </view>
            </scroll-view>
          </view>
        </view>

        <!-- 批次选择器 -->
        <view v-if="showBatchPicker" class="modal-overlay">
          <view class="modal-content batch-picker-modal">
            <view class="modal-header">
              <text class="modal-title">选择批次 - {{ blendForm.brandName }}</text>
              <text class="modal-close" @click="showBatchPicker = false">×</text>
            </view>
            <scroll-view class="batch-picker-list" scroll-y="true">
              <view 
                v-for="batch in availableBatches" 
                :key="batch.id"
                :class="['batch-picker-item', getStatusClass(batch.status)]"
                @click="selectBatch(batch)"
              >
                <view class="batch-main">
                  <text class="batch-id">{{ batch.batchId }}</text>
                  <text class="batch-date">{{ batch.receiveDate }}</text>
                </view>
                <view class="batch-details">
                  <text class="batch-remaining">{{ batch.remainingBags }}袋 {{ batch.remainingWeight }}kg</text>
                  <view :class="['batch-status', getStatusClass(batch.status)]">
                    <text>{{ getStatusText(batch.status, batch.daysRemaining) }}</text>
                  </view>
                </view>
              </view>
              
              <view v-if="availableBatches.length === 0" class="empty-state">
                <text class="empty-text">该牌号下暂无可用批次</text>
              </view>
            </scroll-view>
          </view>
        </view>
      </view>
    </view>

</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import WorkOrderInfoCard from '@/components/orderInfo.vue';
import { getTobaccoAll } from '@/api/production';
import { selectdottle, saveDottleInventory, updateDottleInventory } from '@/api/from'


// 订单信息响应式对象
const myOrder = ref({
  id: '',
  batchNo: '',
  brand: ''
});

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

// 初始化掺兑记录所需数据
const initBlendData = async () => {
  try {
    // 获取批次数据
    const dottleList = await selectdottle('');
    // 确保数据格式正确并转换字段命名
    if (Array.isArray(dottleList)) {
      // 将API返回的下划线命名字段转换为驼峰命名
      batches.value = dottleList.map(item => ({
        id: item.id,
        brandId: item.brand_id || item.brandId,
        batchId: item.batch_id || item.batchId,
        brandName: item.brand_name || item.brandName || item.brand,
        receiveDate: item.receive_date || item.receiveDate,
        remainingBags: item.remaining_bags || item.remainingBags,
        remainingWeight: item.remaining_weight || item.remainingWeight,
        status: item.status,
        daysRemaining: item.days_remaining || item.daysRemaining
      }));
      
      // 从批次数据中提取唯一的牌号信息
      const uniqueBrands = [];
      const brandMap = {};
      
      batches.value.forEach(batch => {
        // 使用brandName作为去重键，确保每个牌号只显示一次
        if (!brandMap[batch.brandName]) {
          brandMap[batch.brandName] = true;
          uniqueBrands.push({
            id: batch.brandName,
            batchNumber: batch.batchId,
            gradeName: batch.brandName,
            brandId: batch.brandId
          });
        }
      });
      
      brands.value = uniqueBrands;
    } else {
      batches.value = [];
      brands.value = [];
      console.error('API返回的批次数据格式错误:', dottleList);
    }
  } catch (error) {
    console.error('初始化掺兑数据失败:', error);
    uni.showToast({
      title: '数据加载失败',
      icon: 'none'
    });
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
  
  // 初始化掺兑记录数据
  initBlendData();
});

// 掺兑记录表单相关逻辑
// 完成状态
const isBlendCompleted = ref(false);

// 表单数据
const blendForm = reactive({
  brandId: null,
  brandName: '',
  batchId: null,
  batchInfo: null,
  bags: '',
  weight: '',
  shift: '白班',
  notes: ''
});

// 显示状态
const showBrandPicker = ref(false);
const showBatchPicker = ref(false);
const brandSearch = ref('');

// 获取完成状态的存储键
const getCompletedStorageKey = () => {
  return `blendCompleted_${myOrder.value.id}_${myOrder.value.batchNo}`;
};

// 检查是否已经完成掺兑操作
onMounted(() => {
  const completedKey = getCompletedStorageKey();
  console.log('检查掺兑完成状态，存储键:', completedKey);
  isBlendCompleted.value = uni.getStorageSync(completedKey);
  console.log('从本地存储获取的完成状态:', isBlendCompleted.value);
});

// 数据
const brands = ref([]);
const batches = ref([]);

// 班次选项
const shiftOptions = [
  { value: '白班', label: '白班', icon: '☀️', time: '08:00-16:00' },
  { value: '中班', label: '中班', icon: '🌙', time: '16:00-24:00' },
  { value: '夜班', label: '夜班', icon: '🌙', time: '00:00-08:00' }
];

// 验证错误
const quantityError = ref('');

// 计算属性
const isFormValid = computed(() => {
  return blendForm.brandId && 
         blendForm.batchId && 
         blendForm.bags && 
         blendForm.weight && 
         blendForm.shift &&
         !quantityError.value;
});

const selectedBrandStock = computed(() => {
  if (!blendForm.brandId) return 0;
  return getBrandStock(blendForm.brandId);
});

const selectedBatchInfo = computed(() => {
  return blendForm.batchInfo;
});

const filteredBrands = computed(() => {
  if (!brandSearch.value) {
    return brands.value;
  }
  return brands.value.filter(brand => 
    brand.gradeName.includes(brandSearch.value)
  );
});

const availableBatches = computed(() => {
  if (!blendForm.brandId) return [];
  return batches.value
    .filter(batch => 
      batch.brandId === blendForm.brandId && 
      batch.remainingBags > 0
    )
    .sort((a, b) => new Date(a.receiveDate) - new Date(b.receiveDate));
});

// 方法
const goBack = () => {
  uni.navigateBack();
};

const selectBrand = (brand) => {
  blendForm.brandId = brand.brandId;
  blendForm.brandName = brand.gradeName;
  blendForm.batchId = null;
  blendForm.batchInfo = null;
  showBrandPicker.value = false;
  brandSearch.value = '';
};

const selectBatch = (batch) => {
  blendForm.batchId = batch.batchId;
  blendForm.batchInfo = batch;
  showBatchPicker.value = false;
  
  // 自动填充建议数量
  if (!blendForm.bags && batch.remainingBags > 0) {
    blendForm.bags = Math.min(10, batch.remainingBags).toString();
  }
  if (!blendForm.weight && batch.remainingWeight > 0) {
    blendForm.weight = Math.min(50, batch.remainingWeight).toFixed(2);
  }
};

const getBrandStock = (brandId) => {
  const brandBatches = batches.value.filter(batch => batch.brandId === brandId);
  return brandBatches.reduce((total, batch) => total + batch.remainingBags, 0);
};

const validateBags = () => {
  if (!blendForm.bags) return;
  
  const bags = parseInt(blendForm.bags);
  if (isNaN(bags) || bags <= 0) {
    quantityError.value = '袋数必须大于0';
    return;
  }
  
  if (blendForm.batchInfo && bags > blendForm.batchInfo.remainingBags) {
    quantityError.value = `袋数不能超过剩余${blendForm.batchInfo.remainingBags}袋`;
    return;
  }
  
  quantityError.value = '';
};

const validateWeight = () => {
  if (!blendForm.weight) return;
  
  const weight = parseFloat(blendForm.weight);
  if (isNaN(weight) || weight <= 0) {
    quantityError.value = '重量必须大于0';
    return;
  }
  
  if (blendForm.batchInfo && weight > blendForm.batchInfo.remainingWeight) {
    quantityError.value = `重量不能超过剩余${blendForm.batchInfo.remainingWeight}kg`;
    return;
  }
  
  quantityError.value = '';
};

const getStatusClass = (status) => {
  switch(status) {
    case 'normal': return 'status-normal';
    case 'warning': return 'status-warning';
    case 'expired': return 'status-expired';
    default: return '';
  }
};

const getStatusText = (status, daysRemaining) => {
  switch(status) {
    case 'normal': return '正常';
    case 'warning': return `剩${daysRemaining}天`;
    case 'expired': return '已过期';
    default: return '';
  }
};

const submitForm = async () => {
  if (!isFormValid.value) {
    uni.showToast({
      title: '请填写完整信息',
      icon: 'none'
    });
    return;
  }
  
  // 验证数量
  validateBags();
  validateWeight();
  if (quantityError.value) {
    return;
  }
  
  try {
    // 创建掺兑记录（关联当前工单信息）
    const blendRecord = {
      orderId: myOrder.value.id, // 关联工单ID
      orderBatchNo: myOrder.value.batchNo, // 关联工单批次号
      batchId: blendForm.batchId,
      brandName: blendForm.brandName,
      bagsUsed: parseInt(blendForm.bags),
      weightUsed: parseFloat(blendForm.weight),
      shiftType: blendForm.shift,
      notes: blendForm.notes,
      operationTime: new Date().toISOString(),
      operator: uni.getStorageSync('userInfo')?.name || '未知操作员'
    };
      
    // 调用API更新库存
    const inventoryUpdateResult = await updateDottleInventory({
      batchId: blendForm.batchId,
      usedBags: parseInt(blendForm.bags),
      usedWeight: parseFloat(blendForm.weight)
    });
    console.log('更新库存结果:', inventoryUpdateResult);
    
    // 设置完成状态并保存到本地存储
    console.log('设置完成状态');
    isBlendCompleted.value = true;
    const completedKey = getCompletedStorageKey();
    console.log('保存完成状态到本地存储，键:', completedKey);
    uni.setStorageSync(completedKey, true);
    console.log('本地存储保存成功，当前完成状态:', isBlendCompleted.value);
    
    uni.showToast({
      title: '掺兑记录保存成功，库存已更新',
      icon: 'success'
    });
    
    // 返回上一页
    setTimeout(() => {
      uni.navigateBack();
    }, 1500);
    
  } catch (error) {
    uni.showToast({
      title: '保存失败，请重试',
      icon: 'none'
    });
    console.error('保存掺兑记录失败:', error);
  }
};
</script>

<style scoped>
/* 原丝库页面样式 */
.container {
  padding: 20rpx;
  background-color: #f5f5f5;
  min-height: 100vh;
  overflow-x: hidden;
  box-sizing: border-box;
}

/* 已完成状态样式 */
.completed-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80rpx 20rpx;
  text-align: center;
}

.completed-icon {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  background-color: #07c160;
  color: white;
  font-size: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 30rpx;
}

.completed-title {
  font-size: 40rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 15rpx;
}

.completed-subtitle {
  font-size: 28rpx;
  color: #666;
  margin-bottom: 60rpx;
  line-height: 1.5;
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
  padding: 40rpx;
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

/* 新增掺兑记录样式 */
.add-blend-container {
  padding: 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  border-radius: 20rpx;
  overflow: hidden;
  margin-top: 30rpx;
}

/* 头部样式 */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 60rpx 30rpx 30rpx;
  background: transparent;
}

.nav-back {
  display: flex;
  align-items: center;
  padding: 15rpx 25rpx;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 25rpx;
  backdrop-filter: blur(10px);
}

.back-icon {
  font-size: 32rpx;
  color: white;
  margin-right: 10rpx;
}

.back-text {
  font-size: 28rpx;
  color: white;
}

.title {
  font-size: 36rpx;
  font-weight: bold;
  color: white;
}

.header-placeholder {
  width: 120rpx;
}

/* 表单区域 */
.form-section {
  background: white;
  border-radius: 40rpx 40rpx 0 0;
  margin-top: 30rpx;
  padding: 50rpx 40rpx;
  min-height: calc(100vh - 200rpx);
  box-shadow: 0 -10rpx 30rpx rgba(0, 0, 0, 0.1);
}

.form-group {
  margin-bottom: 50rpx;
}

.form-label {
  display: flex;
  align-items: center;
  margin-bottom: 20rpx;
}

.label-text {
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
}

.required {
  color: #ff4757;
  margin-left: 8rpx;
}

.form-control {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 25rpx 30rpx;
  border: 2rpx solid #e1e5e9;
  border-radius: 15rpx;
  background: #f8f9fa;
  transition: all 0.3s ease;
}

.form-control:active {
  border-color: #667eea;
  background: #fff;
}

.placeholder {
  font-size: 28rpx;
  color: #999;
}

.placeholder.selected {
  color: #333;
  font-weight: 500;
}

.dropdown-icon {
  font-size: 24rpx;
  color: #666;
}

.form-hint {
  font-size: 24rpx;
  color: #667eea;
  margin-top: 15rpx;
}

/* 数量输入 */
.quantity-inputs {
  display: flex;
  gap: 30rpx;
}

.input-group {
  flex: 1;
  display: flex;
  align-items: center;
  border: 2rpx solid #e1e5e9;
  border-radius: 15rpx;
  background: #f8f9fa;
  overflow: hidden;
}

.quantity-input {
  flex: 1;
  padding: 25rpx 30rpx;
  font-size: 28rpx;
  border: none;
  background: transparent;
}

.input-unit {
  padding: 0 30rpx;
  font-size: 28rpx;
  color: #666;
  background: #e8ecef;
  height: 100%;
  display: flex;
  align-items: center;
}

.error-message {
  color: #ff4757;
  font-size: 24rpx;
  margin-top: 15rpx;
}

.remaining-hint {
  color: #666;
  font-size: 24rpx;
  margin-top: 15rpx;
}

/* 批次预览 */
.batch-preview {
  background: #f8f9fa;
  border-radius: 12rpx;
  padding: 25rpx;
  margin-top: 20rpx;
  border-left: 6rpx solid #667eea;
}

.batch-info-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12rpx;
}

.batch-info-row:last-child {
  margin-bottom: 0;
}

.info-label {
  font-size: 26rpx;
  color: #666;
}

.info-value {
  font-size: 26rpx;
  color: #333;
  font-weight: 500;
}

/* 班次选择 */
.shift-options {
  display: flex;
  gap: 20rpx;
}

.shift-option {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 30rpx 20rpx;
  border: 2rpx solid #e1e5e9;
  border-radius: 15rpx;
  background: #f8f9fa;
  transition: all 0.3s ease;
}

.shift-option.selected {
  border-color: #667eea;
  background: #f0f4ff;
  transform: translateY(-5rpx);
  box-shadow: 0 10rpx 20rpx rgba(102, 126, 234, 0.2);
}

.shift-icon {
  font-size: 40rpx;
  margin-bottom: 15rpx;
}

.shift-text {
  font-size: 28rpx;
  font-weight: 500;
  margin-bottom: 8rpx;
}

.shift-time {
  font-size: 22rpx;
  color: #666;
}

/* 备注信息 */
.notes-textarea {
  width: 91%;
  height: 200rpx;
  padding: 25rpx 30rpx;
  border: 2rpx solid #e1e5e9;
  border-radius: 15rpx;
  background: #f8f9fa;
  font-size: 28rpx;
  line-height: 1.5;
}

.notes-counter {
  text-align: right;
  font-size: 24rpx;
  color: #999;
  margin-top: 15rpx;
}

/* 操作按钮 */
.action-buttons {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  padding: 30rpx 40rpx;
  background: white;
  border-top: 1rpx solid #e1e5e9;
  gap: 20rpx;
}

.btn {
  flex: 1;
  padding: 30rpx;
  border-radius: 15rpx;
  text-align: center;
  font-size: 32rpx;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-cancel {
  background: #f8f9fa;
  color: #666;
  border: 2rpx solid #e1e5e9;
}

.btn-cancel:active {
  background: #e9ecef;
}

.btn-confirm {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  box-shadow: 0 10rpx 20rpx rgba(102, 126, 234, 0.3);
}

.btn-confirm.disabled {
  background: #ccc;
  box-shadow: none;
  opacity: 0.6;
}

.btn-confirm:active:not(.disabled) {
  transform: translateY(2rpx);
  box-shadow: 0 5rpx 15rpx rgba(102, 126, 234, 0.3);
}

/* 模态框样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  width: 85%;
  max-height: 70vh;
  border-radius: 20rpx;
  overflow: hidden;
  box-shadow: 0 20rpx 60rpx rgba(0, 0, 0, 0.2);
}

.brand-picker-modal, .batch-picker-modal {
  width: 80%;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 40rpx 30rpx 30rpx;
  border-bottom: 1rpx solid #e1e5e9;
}

.modal-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
}

.modal-close {
  font-size: 40rpx;
  color: #999;
  padding: 10rpx;
}

/* 搜索框 */
.search-box {
  padding: 30rpx;
  border-bottom: 1rpx solid #e1e5e9;
}

.search-input {
  width: 100%;
  padding: 20rpx 25rpx;
  border: 2rpx solid #e1e5e9;
  border-radius: 25rpx;
  background: #f8f9fa;
  font-size: 28rpx;
}

/* 选择器列表 */
.brand-picker-list, .batch-picker-list {
  max-height: 500rpx;
  padding: 20rpx 0;
}

.brand-picker-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx;
  border-bottom: 1rpx solid #f0f0f0;
  transition: all 0.3s ease;
}

.brand-picker-item.selected {
  background: #f0f4ff;
  border-left: 6rpx solid #667eea;
}

.brand-picker-item:active {
  background: #f8f9fa;
}

.brand-info {
  display: flex;
  flex-direction: column;
}

.brand-name {
  font-size: 28rpx;
  font-weight: 500;
  margin-bottom: 8rpx;
}

.brand-stock {
  font-size: 24rpx;
  color: #666;
}

.brand-status .in-stock {
  color: #2ecc71;
  font-size: 24rpx;
}

.brand-status .out-of-stock {
  color: #e74c3c;
  font-size: 24rpx;
}

/* 批次选择器项目 */
.batch-picker-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx;
  border-bottom: 1rpx solid #f0f0f0;
  transition: all 0.3s ease;
}

.batch-picker-item:active {
  background: #f8f9fa;
}

.batch-main {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.batch-id {
  font-size: 28rpx;
  font-weight: 600;
  margin-bottom: 8rpx;
}

.batch-date {
  font-size: 24rpx;
  color: #666;
}

.batch-details {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.batch-remaining {
  font-size: 26rpx;
  font-weight: 500;
  margin-bottom: 8rpx;
}

.batch-status {
  padding: 8rpx 16rpx;
  border-radius: 20rpx;
  font-size: 22rpx;
}

.status-normal {
  background: #e8f5e9;
  color: #2e7d32;
}

.status-warning {
  background: #fff3e0;
  color: #ef6c00;
}

.status-expired {
  background: #ffebee;
  color: #c62828;
}

/* 空状态 */
.empty-state {
  padding: 60rpx 30rpx;
  text-align: center;
}

.empty-text {
  font-size: 28rpx;
  color: #999;
}
</style>