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
          <!-- 多个掺兑表单 -->
          <view v-for="(form, index) in blendForms" :key="index" class="form-item">
            <!-- 表单标题 -->
            <view class="form-item-header">
              <text class="form-item-title">掺兑信息 {{ index + 1 }}</text>
              <!-- 删除按钮（保留最后一个） -->
              <view v-if="blendForms.length > 1" class="delete-btn" @click="removeBlendForm(index)">
                <text class="delete-btn-text">删除</text>
              </view>
            </view>
            
            <!-- 牌号选择（自动获取） -->
            <view class="form-group" style="display: none;">
              <view class="form-label">
                <text class="label-text">选择牌号</text>
                <text class="required">*</text>
              </view>
              <view class="form-control">
                <text :class="['placeholder', form.brandName ? 'selected' : '']">
                  {{ form.brandName || '自动获取中...' }}
                </text>
              </view>
            </view>

            <!-- 批次选择 -->
            <view class="form-group">
              <view class="form-label">
                <text class="label-text">选择批次</text>
                <text class="required">*</text>
              </view>
              <view class="form-control" @click="form.showBatchPicker = true">
                <text :class="['placeholder', form.batchId ? 'selected' : '']">
                  {{ form.batchId || '请选择批次' }}
                </text>
                <text class="dropdown-icon">▼</text>
              </view>
              
              <!-- 批次信息预览 -->
              <view v-if="form.batchInfo" class="batch-preview">
                <view class="batch-info-row">
                  <text class="info-label">接收日期:</text>
                  <text class="info-value">{{ form.batchInfo.receiveDate }}</text>
                </view>
                <view class="batch-info-row">
                  <text class="info-label">剩余数量:</text>
                  <text class="info-value">{{ form.batchInfo.remainingBags }}袋 / {{ form.batchInfo.remainingWeight }}kg</text>
                </view>
                <view class="batch-info-row">
                  <text class="info-label">状态:</text>
                  <text :class="['info-value', getStatusClass(form.batchInfo.status)]">
                    {{ getStatusText(form.batchInfo.status, form.batchInfo.daysRemaining) }}
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
                    v-model="form.bags" 
                    type="number" 
                    class="quantity-input" 
                    placeholder="0"
                    @blur="validateBags(index)"
                  />
                  <text class="input-unit">袋</text>
                </view>
                <view class="input-group">
                  <input 
                    v-model="form.weight" 
                    type="number" 
                    class="quantity-input" 
                    placeholder="0.00"
                    @blur="validateWeight(index)"
                  />
                  <text class="input-unit">公斤</text>
                </view>
              </view>
            
              <!-- 数量验证提示 -->
              <view v-if="quantityErrors[index]" class="error-message">
                <text>{{ quantityErrors[index] }}</text>
              </view>
            
              <!-- 剩余量提示 -->
              <view v-if="form.batchInfo" class="remaining-hint">
                <text>剩余: {{ form.batchInfo.remainingBags }}袋 / {{ form.batchInfo.remainingWeight }}kg</text>
              </view>
            </view>
          </view>
        </view>
<!-- 添加掺兑信息按钮 -->
        <view class="add-blend-section">
          <view class="btn btn-add" @click="addBlendForm">
            <text class="btn-icon">+</text>
            <text>添加掺兑信息</text>
          </view>
        </view>
        <!-- 班次选择（全局共用） -->
        <view class="form-group global-group">
          <view class="form-label">
            <text class="label-text">选择班次</text>
            <text class="required">*</text>
          </view>
          <view class="shift-options">
            <view 
              v-for="shift in shiftOptions" 
              :key="shift.value"
              :class="['shift-option', globalShift === shift.value ? 'selected' : '']"
              @click="globalShift = shift.value"
            >
              <text class="shift-icon">{{ shift.icon }}</text>
              <text class="shift-text">{{ shift.label }}</text>
              <text class="shift-time">{{ shift.time }}</text>
            </view>
          </view>
        </view>

        <!-- 备注信息（全局共用） -->
        <view class="form-group global-group">
          <view class="form-label">
            <text class="label-text">备注信息</text>
          </view>
          <textarea 
            v-model="globalNotes" 
            class="notes-textarea" 
            placeholder="可在此输入掺兑相关备注信息..."
            maxlength="200"
          ></textarea>
          <view class="notes-counter">
            <text>{{ globalNotes.length }}/200</text>
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

      <!-- 批次选择器 -->
      <view v-for="(form, index) in blendForms" :key="index">
        <view v-if="form.showBatchPicker" class="modal-overlay">
          <view class="modal-content batch-picker-modal">
            <view class="modal-header">
              <text class="modal-title">选择批次 - {{ form.brandName }}</text>
              <text class="modal-close" @click="form.showBatchPicker = false">×</text>
            </view>
            <scroll-view class="batch-picker-list" scroll-y="true">
              <view 
                v-for="batch in getAvailableBatches(form)" 
                :key="batch.id"
                :class="['batch-picker-item', getStatusClass(batch.status)]"
                @click="selectBatch(batch, index)"
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
              
              <view v-if="getAvailableBatches(form).length === 0" class="empty-state">
                <text class="empty-text">该牌号下暂无可用批次</text>
              </view>
            </scroll-view>
          </view>
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
import { selectdottle, saveDottleInventory, updateDottleInventory } from '@/api/from';

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
      return Promise.resolve();
    } else {
      batches.value = [];
      brands.value = [];
      console.error('API返回的批次数据格式错误:', dottleList);
      return Promise.resolve();
    }
  } catch (error) {
    console.error('初始化掺兑数据失败:', error);
    uni.showToast({
      title: '数据加载失败',
      icon: 'none'
    });
    return Promise.reject(error);
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
  initBlendData().then(() => {
    // 数据加载完成后自动选择当前工单的牌号
    if (myOrder.value.brand && brands.value.length > 0) {
      const defaultBrand = brands.value.find(brand => brand.gradeName === myOrder.value.brand);
      if (defaultBrand) {
        selectBrandForAllForms(defaultBrand);
        console.log('自动选择当前工单的牌号:', defaultBrand.gradeName);
      } else {
        console.log('未找到匹配的牌号:', myOrder.value.brand);
        uni.showToast({
          title: '未找到匹配的牌号信息',
          icon: 'none'
        });
      }
    }
  });
});

// 掺兑记录表单相关逻辑
// 完成状态
const isBlendCompleted = ref(false);

// 全局共用字段（班次和备注只需填写一次）
const globalShift = ref('白班'); // 全局班次，所有掺兑记录共用
const globalNotes = ref('');     // 全局备注，所有掺兑记录共用

// 表单数据 - 数组支持多个掺兑记录
const blendForms = ref([{
  brandId: null,
  brandName: '',
  batchId: null,
  batchInfo: null,
  bags: '',
  weight: '',
  showBatchPicker: false
}]);

// 数量错误信息 - 数组对应多个表单
const quantityErrors = ref(['']);

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
  { value: '白班', label: '白班', icon: '☀️', time: '08:00-16:20' },
  { value: '中班', label: '中班', icon: '🌙', time: '16:20-00:50' },
  { value: '夜班', label: '夜班', icon: '🌙', time: '00:50-08:00' }
];

// 计算属性：表单是否验证通过
const isFormValid = computed(() => {
  // 验证所有掺兑表单都填写完整
  for (let i = 0; i < blendForms.value.length; i++) {
    const form = blendForms.value[i];
    if (!form.brandId || 
        !form.batchId || 
        !form.bags || 
        !form.weight ||
        quantityErrors.value[i]) {
      return false;
    }
  }
  // 验证全局班次已选择（备注可选）
  return !!globalShift.value;
});

// 获取指定牌号的库存总量
const selectedBrandStock = computed(() => {
  if (blendForms.value.length === 0 || !blendForms.value[0].brandId) return 0;
  return getBrandStock(blendForms.value[0].brandId);
});

// 获取可用批次（按牌号筛选，且排除已在其他表单中选择的批次）
const getAvailableBatches = (form) => {
  if (!form.brandId) return [];
  
  // 获取当前表单在数组中的索引
  const currentIndex = blendForms.value.indexOf(form);
  
  return batches.value
    .filter(batch => 
      batch.brandId === form.brandId && 
      batch.remainingBags > 0 && 
      // 排除已在其他表单中选择的批次，但允许当前表单保持已选择的批次
      !blendForms.value.some((f, idx) => 
        idx !== currentIndex && f.batchId === batch.batchId
      )
    )
    .sort((a, b) => new Date(a.receiveDate) - new Date(b.receiveDate));
};

// 方法
const goBack = () => {
  uni.navigateBack();
};

// 自动选择牌号（应用到所有表单）
const selectBrandForAllForms = (brand) => {
  blendForms.value.forEach(form => {
    form.brandId = brand.brandId;
    form.brandName = brand.gradeName;
    form.batchId = null;
    form.batchInfo = null;
  });
};

// 选择批次（对应单个表单）
const selectBatch = (batch, index) => {
  blendForms.value[index].batchId = batch.batchId;
  blendForms.value[index].batchInfo = batch;
  blendForms.value[index].showBatchPicker = false;
  
  // 自动填充建议数量
  if (!blendForms.value[index].bags && batch.remainingBags > 0) {
    blendForms.value[index].bags = Math.min(10, batch.remainingBags).toString();
  }
  if (!blendForms.value[index].weight && batch.remainingWeight > 0) {
    blendForms.value[index].weight = Math.min(50, batch.remainingWeight).toFixed(2);
  }
};

// 添加掺兑表单
const addBlendForm = () => {
  blendForms.value.push({
    brandId: blendForms.value[0].brandId, // 继承第一个表单的牌号
    brandName: blendForms.value[0].brandName,
    batchId: null,
    batchInfo: null,
    bags: '',
    weight: '',
    showBatchPicker: false
  });
  
  // 为新表单添加错误信息字段
  quantityErrors.value.push('');
};

// 移除掺兑表单
const removeBlendForm = (index) => {
  if (blendForms.value.length > 1) {
    blendForms.value.splice(index, 1);
    quantityErrors.value.splice(index, 1);
  }
};

// 获取指定牌号的库存总量
const getBrandStock = (brandId) => {
  const brandBatches = batches.value.filter(batch => batch.brandId === brandId);
  return brandBatches.reduce((total, batch) => total + batch.remainingBags, 0);
};

// 验证袋数输入
const validateBags = (index) => {
  const form = blendForms.value[index];
  if (!form.bags) return;
  
  const bags = parseInt(form.bags);
  if (isNaN(bags) || bags <= 0) {
    quantityErrors.value[index] = '袋数必须大于0';
    return;
  }
  
  if (form.batchInfo && bags > form.batchInfo.remainingBags) {
    quantityErrors.value[index] = `袋数不能超过剩余${form.batchInfo.remainingBags}袋`;
    return;
  }
  
  quantityErrors.value[index] = '';
};

// 验证重量输入
const validateWeight = (index) => {
  const form = blendForms.value[index];
  if (!form.weight) return;
  
  const weight = parseFloat(form.weight);
  if (isNaN(weight) || weight <= 0) {
    quantityErrors.value[index] = '重量必须大于0';
    return;
  }
  
  if (form.batchInfo && weight > form.batchInfo.remainingWeight) {
    quantityErrors.value[index] = `重量不能超过剩余${form.batchInfo.remainingWeight}kg`;
    return;
  }
  
  quantityErrors.value[index] = '';
};

// 获取状态样式类
const getStatusClass = (status) => {
  switch(status) {
    case 'normal': return 'status-normal';
    case 'warning': return 'status-warning';
    case 'expired': return 'status-expired';
    default: return '';
  }
};

// 获取状态文本
const getStatusText = (status, daysRemaining) => {
  switch(status) {
    case 'normal': return '正常';
    case 'warning': return `剩${daysRemaining}天`;
    case 'expired': return '已过期';
    default: return '';
  }
};

// 提交表单（所有掺兑记录共用同一个班次和备注）
const submitForm = async () => {
  if (!isFormValid.value) {
    uni.showToast({
      title: '请填写完整信息',
      icon: 'none'
    });
    return;
  }
  
  try {
    // 遍历所有掺兑表单，批量提交
    for (const form of blendForms.value) {
      // 创建掺兑记录（关联工单信息，共用全局班次和备注）
      const blendRecord = {
        orderId: myOrder.value.id,         // 关联工单ID
        orderBatchNo: myOrder.value.batchNo, // 关联工单批次号
        batchId: form.batchId,
        brandName: form.brandName,
        bagsUsed: parseInt(form.bags),
        weightUsed: parseFloat(form.weight),
        shiftType: globalShift.value,      // 全局共用班次
        notes: globalNotes.value,          // 全局共用备注
        operationTime: new Date().toISOString(),
        operator: uni.getStorageSync('userInfo')?.name || '未知操作员'
      };
       
      // 更新库存
      const inventoryUpdateResult = await updateDottleInventory({
        batchId: form.batchId,
        usedBags: parseInt(form.bags),
        usedWeight: parseFloat(form.weight)
      });
      console.log('更新库存结果:', inventoryUpdateResult);
    }
    
    // 设置完成状态并保存到本地存储
    isBlendCompleted.value = true;
    const completedKey = getCompletedStorageKey();
    uni.setStorageSync(completedKey, true);
    
    uni.showToast({
      title: '掺兑记录保存成功，库存已更新',
      icon: 'success'
    });
    
    // 延迟返回上一页
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
/* 基础样式 */
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

/* 顶部卡片 */
.header-card {
  background-color: #fff;
  border-radius: 16rpx;
  padding: 20rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
}

/* 内容区域 */
.content-section {
  background-color: #fff;
  border-radius: 16rpx;
  padding: 40rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
}

/* 表单区域 */
.form-section {
  margin-bottom: 40rpx;
}

.form-item {
  background-color: #f9f9f9;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
}

.form-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30rpx;
}

.form-item-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
}

.delete-btn {
  color: #ff4757;
  font-size: 28rpx;
  padding: 8rpx 16rpx;
  background-color: #ffebee;
  border-radius: 8rpx;
}

/* 全局共用表单组样式 */
.global-group {
  background-color: #f0f8fb;
  padding: 30rpx;
  border-radius: 16rpx;
  margin-bottom: 40rpx;
  border: 2rpx solid #e3f2fd;
}

.global-group .form-label {
  margin-bottom: 25rpx;
}

/* 表单组基础样式 */
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

/* 数量输入样式 */
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

/* 错误提示 */
.error-message {
  color: #ff4757;
  font-size: 24rpx;
  margin-top: 15rpx;
}

/* 剩余量提示 */
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

/* 班次选择样式 */
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

/* 备注信息样式 */
.notes-textarea {
  width: 100%;
  height: 200rpx;
  padding: 25rpx 30rpx;
  border: 2rpx solid #e1e5e9;
  border-radius: 15rpx;
  background: #f8f9fa;
  font-size: 28rpx;
  line-height: 1.5;
  box-sizing: border-box;
}

.notes-counter {
  text-align: right;
  font-size: 24rpx;
  color: #999;
  margin-top: 15rpx;
}

/* 添加掺兑信息按钮 */
.add-blend-section {
  display: flex;
  justify-content: center;
  margin: 40rpx 0;
}

.btn-add {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #e8f4f8;
  color: #4299e1;
  padding: 20rpx 40rpx;
  border-radius: 15rpx;
  font-size: 30rpx;
  font-weight: 600;
}

.btn-icon {
  font-size: 36rpx;
  margin-right: 10rpx;
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  padding: 30rpx 0;
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
  pointer-events: none;
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

.batch-picker-modal {
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

/* 批次选择器列表 */
.batch-picker-list {
  max-height: 500rpx;
  padding: 20rpx 0;
}

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

/* 状态样式 */
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