<template>
  <view class="page">
    <WorkOrderInfoCard :order-info="myOrder" />
    
    <!-- 任务列表模块 -->
    <view class="task-list-container">
      <!-- 开班检查项目 -->
      <view v-if="myOrder.number && (myOrder.number.includes('预混柜') || myOrder.number.replace(/\s+/g, '') === '1')" class="card-section">
        <h2 class="group-title">开班检查项目</h2>
        <view class="form-item">
          <view class="form-label">
            <text>三压检查</text>
          </view>
          <upload-image
            ref="threePressureRef"
            :max-count="1"
            title="点击上传图片"
          />
        </view>
        
        <!-- 开班检查提交验证按钮 -->
        <view class="form-actions">
          <view class="submit-btn" @click="submitModule('startCheck')" :class="{ disabled: submitting || hasSubmittedModules.startCheck }">
            <text>{{ submitting ? '提交中...' : hasSubmittedModules.startCheck ? '已提交' : '提交验证' }}</text>
          </view>
        </view>
      </view>
      
      <!-- 开料前检查项目 -->
      <view class="card-section">
        <h2 class="group-title">开料前检查项目</h2>
        <view class="form-item">
          <view class="form-label required">
            <text>牌号和批次号</text>
          </view>
          <upload-image
            ref="brandBatchRef"
            :max-count="1"
            title="点击上传图片"
          />
        </view>
        
        <view class="form-item">
          <view class="form-label required">
            <text>界面验证</text>
          </view>
          <upload-image
            ref="interfaceVerifyRef"
            :max-count="1"
            title="点击上传图片"
          />
        </view>
        
        <view class="form-item">
          <view class="form-label required">
            <text>水分仪通道</text>
          </view>
          <upload-image
            ref="moistureChannelRef"
            :max-count="1"
            title="点击上传图片"
          />
        </view>
        
        <view class="form-item">
          <view class="form-label required">
            <text>香料剩余量（公斤数）</text>
          </view>
          <up-input
            v-model="formData.flavorRemaining"
            type="number"
            placeholder="请输入香料剩余量"
            class="form-control"
            step="0.01"
            border="surround"
            clearable
          />
        </view>
        
        <!-- 开料前检查提交验证按钮 -->
        <view class="form-actions">
          <view class="submit-btn" @click="submitModule('preFeedCheck')" :class="{ disabled: submitting || hasSubmittedModules.preFeedCheck }">
            <text>{{ submitting ? '提交中...' : hasSubmittedModules.preFeedCheck ? '已提交' : '提交验证' }}</text>
          </view>
        </view>
      </view>
      
      <!-- 换牌检查项目 -->
      <view class="card-section">
        <h2 class="group-title">换牌检查项目</h2>
        <view class="form-item">
          <view class="form-label">
            <text>酒精清洗照片</text>
            <text class="form-hint">（换牌必须填）</text>
          </view>
          <upload-image
            ref="alcoholCleaningRef"
            :max-count="1"
            title="点击上传图片"
          />
        </view>
        
        <view class="form-item">
          <view class="form-label">
            <text>皮带清扫照片</text>
            <text class="form-hint">（换牌必须填）</text>
          </view>
          <upload-image
            ref="beltCleaningRef"
            :max-count="1"
            title="点击上传图片"
          />
        </view>
        
        <view class="form-item">
          <view class="form-label">
            <text>电子称清扫照片</text>
            <text class="form-hint">（换牌必须填）</text>
          </view>
          <upload-image
            ref="scaleCleaningRef"
            :max-count="1"
            title="点击上传图片"
          />
        </view>
        
        <!-- 换牌检查提交验证按钮 -->
        <view class="form-actions">
          <view class="submit-btn" @click="submitModule('changeBrandCheck')" :class="{ disabled: submitting || hasSubmittedModules.changeBrandCheck }">
            <text>{{ submitting ? '提交中...' : hasSubmittedModules.changeBrandCheck ? '已提交' : '提交验证' }}</text>
          </view>
        </view>
      </view>
      
      <!-- 入口烟沫统计模块 -->
      <view class="card-section">
        <h2 class="group-title">烟沫统计</h2>
        
        <view class="form-item">
          <view class="form-label required">
            <text>牌号</text>
          </view>
          <u-picker 
            :show="showBrandPicker" 
            :columns="brandColumns" 
            @confirm="handleBrandConfirm" 
            @cancel="showBrandPicker = false"
            z-index="9999"
          />
          <u-cell 
            :value="formData.brand.name || '请选择牌号'" 
            is-link 
            @click="showBrandPicker = true" 
            :arrow="true"
            class="form-control-picker"
            :title-style="{color: formData.brand.name ? '#333' : '#999'}"
          />
        </view>
        
        <view class="form-item form-item-row">
          <view class="form-label required">
            <text>生产日期时间</text>
          </view>
          <view class="form-row">
            <view class="form-col-50">
              <u-picker 
                :show="showDatePicker" 
                :columns="dateColumns" 
                @confirm="handleDateConfirm" 
                @cancel="showDatePicker = false"
                z-index="9999"
              />
              <u-cell 
                :value="formData.productionDate || '请选择日期'" 
                is-link 
                @click="showDatePicker = true" 
                :arrow="true"
                class="form-control-picker"
                :title-style="{color: formData.productionDate ? '#333' : '#999'}"
              />
            </view>
            <view class="form-col-50">
              <u-picker 
                :show="showTimePicker" 
                :columns="timeColumns" 
                @confirm="handleTimeConfirm" 
                @cancel="showTimePicker = false"
                z-index="9999"
              />
              <u-cell 
                :value="formData.productionTime || '请选择时间'" 
                is-link 
                @click="() => { showTimePicker = true; formData.productionTime = formatDate(new Date(), 'HH:mm'); }" 
                :arrow="true"
                class="form-control-picker"
                :title-style="{color: formData.productionTime ? '#333' : '#999'}"
              />
            </view>
          </view>
        </view>
        
        <view class="form-item">
          <view class="form-label required">
            <text>班别</text>
          </view>
          <u-picker 
            :show="showClassPicker" 
            :columns="classColumns" 
            @confirm="handleClassConfirm" 
            @cancel="showClassPicker = false"
            z-index="9999"
          />
          <u-cell 
            :value="formData.class || '请选择班别'" 
            is-link 
            @click="showClassPicker = true" 
            :arrow="true"
            class="form-control-picker"
            :title-style="{color: formData.class ? '#333' : '#999'}"
          />
        </view>
        
        <view class="form-item">
          <view class="form-label required">
            <text>班次</text>
          </view>
          <u-picker 
            :show="showShiftPicker" 
            :columns="shiftColumns" 
            @confirm="handleShiftConfirm" 
            @cancel="showShiftPicker = false"
            z-index="9999"
          />
          <u-cell 
            :value="formData.shift || '请选择班次'" 
            is-link 
            @click="showShiftPicker = true" 
            :arrow="true"
            class="form-control-picker"
            :title-style="{color: formData.shift ? '#333' : '#999'}"
          />
        </view>
        
        <view class="form-item">
          <view class="form-label required">
            <text>重量（KG）</text>
          </view>
          <u-input
            v-model="formData.weight"
            type="number"
            placeholder="请输入重量"
            class="form-control"
            step="0.01"
            border="surround"
            clearable
          />
        </view>
        
        <view class="form-item">
          <view class="form-label required">
            <text>移交日期</text>
          </view>
          <u-picker 
            :show="showTransferDatePicker" 
            :columns="transferDateColumns" 
            @confirm="handleTransferDateConfirm" 
            @cancel="showTransferDatePicker = false"
            z-index="9999"
          />
          <u-cell 
            :value="formData.transferDate || '请选择移交日期'" 
            is-link 
            @click="showTransferDatePicker = true" 
            :arrow="true"
            class="form-control-picker"
            :title-style="{color: formData.transferDate ? '#333' : '#999'}"
          />
        </view>

        <!-- 烟沫统计提交按钮 -->
        <view class="form-actions">
          <view class="submit-btn" @click="submitDust" :class="{ disabled: submitting || hasSubmittedModules.tobaccoDustStats }">
            <text>{{ submitting ? '提交中...' : hasSubmittedModules.tobaccoDustStats ? '已提交' : '提交' }}</text>
          </view>
        </view>
      </view>
      
      <!-- 三级验证按钮 -->
      <view class="form-actions main-submit">
        <VerifyButton 
          buttonText="三级验证" 
          :batchId="myOrder.batchNo" 
          :brand="myOrder.brand" 
          segment="加香机" 
          :dataCount="7" 
          @success="handleVerifySuccess" 
          @fail="handleVerifyFail" 
          @validate="handleValidate" 
          :disabled="!hasAllModulesSubmitted || submitting"
        />
      </view>
    </view>
  </view>
</template>

<script setup>
import WorkOrderInfoCard from '@/components/orderInfo.vue';
import { ref, reactive, nextTick, computed } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import UploadImage from '@/components/UploadImage.vue';
import VerifyButton from '@/components/VerifyButton.vue';
import { submitMaterialCheck, byBatchIdAndSegment, insertTobaccoDustStats, queryTobaccoDustStatsByBatchNo } from '@/api/production.js';
import { formatDate } from '@/utils/date.js';
  
  // 实现烟沫统计提交方法
  const submitDust = async () => {
    try {
      // 设置提交状态
      submitting.value = true;
      
      // 数据验证
      if (!formData.brand.value) {
        uni.showToast({ title: '请选择牌号', icon: 'none' });
        submitting.value = false;
        return;
      }
      
      if (!formData.productionDate) {
        uni.showToast({ title: '请选择生产日期', icon: 'none' });
        submitting.value = false;
        return;
      }
      
      if (!formData.productionTime) {
        uni.showToast({ title: '请选择生产时间', icon: 'none' });
        submitting.value = false;
        return;
      }
      
      if (!formData.weight || isNaN(parseFloat(formData.weight)) || parseFloat(formData.weight) <= 0) {
        uni.showToast({ title: '请输入有效的重量', icon: 'none' });
        submitting.value = false;
        return;
      }
      
      if (!formData.transferDate) {
        uni.showToast({ title: '请选择移交日期', icon: 'none' });
        submitting.value = false;
        return;
      }
      
      // 构建提交数据
      const tobaccoDustData = {
        brand: formData.brand?.value || formData.brand || '',
        productionDate: formData.productionDate,
        productionTime: formData.productionTime,
        class: formData.class || '',
        shift: formData.shift || '',
        weight: parseFloat(formData.weight),
        transferDate: formData.transferDate,
        operatorId: (uni.getStorageSync('userId') || 'OP-001').toString(),
        batchNo: myOrder.value.batchNo,
        segment: '加香机'
      }
      
      console.log('烟沫统计提交数据:', tobaccoDustData);
      
      // 调用API提交数据
      const res = await insertTobaccoDustStats(tobaccoDustData);
      console.log('烟沫统计提交数据响应:', res);
      // 处理响应 - 由于request.js直接返回业务数据，我们假设成功返回任何非错误值
      // 这里简化处理，因为API成功时不会抛出错误
      uni.showToast({ title: '提交成功', icon: 'success' });
      // 更新已提交状态
      hasSubmittedModules.tobaccoDustStats = true;
    } finally {
      // 重置提交状态
      submitting.value = false;
    }
  };

// 上传组件的ref
const threePressureRef = ref(null);
const brandBatchRef = ref(null);
const interfaceVerifyRef = ref(null);
const moistureChannelRef = ref(null);
const alcoholCleaningRef = ref(null);
const beltCleaningRef = ref(null);
const scaleCleaningRef = ref(null);

// 提交状态和模块提交状态
const submitting = ref(false);
const hasSubmittedModules = ref({
  startCheck: false,
  preFeedCheck: false,
  changeBrandCheck: false,
  tobaccoDustStats: false
});

// 表单数据
const formData = reactive({
  flavorRemaining: '',
  brand: { name: '', value: '' },
  productionDate: formatDate(new Date(), 'yyyy-MM-dd'),
  productionTime: formatDate(new Date(), 'HH:mm'),
  class: '',
  shift: '',
  weight: '',
  transferDate: formatDate(new Date(), 'yyyy-MM-dd')
});

// 订单信息
const myOrder = ref({
  id: '',
  batchNo: '',
  brand: '',
  number: '',
  yield: ''
});

// 全局已提交数据（核心：存储所有模块已提交的内容）
const submittedGlobalData = ref({
  images: {}, // 所有已提交的图片
  flavorRemaining: '', // 香料剩余量
  tobaccoDustStats: {} // 烟沫统计数据
});

// ====================== 入口烟沫统计相关变量 ======================
// 牌号选择
const brandOptions = [
  { name: '兰州（硬珍品）ZP-2', value: '兰州（硬珍品）ZP-2' },
  { name: '利群（新版）SR-2', value: '利群（新版）SR-2' },
  { name: '其他牌号QT-2', value: '其他牌号QT-2' }
];
const brandColumns = reactive([brandOptions.map(option => option.name)]);
const showBrandPicker = ref(false);

// 班别选择
const classOptions = ['甲', '乙'];
const classColumns = reactive([classOptions]);
const showClassPicker = ref(false);

// 班次选择
const shiftOptions = ['白', '中', '夜'];
const shiftColumns = reactive([shiftOptions]);
const showShiftPicker = ref(false);

// 日期时间选择
const showDatePicker = ref(false);
const showTimePicker = ref(false);

// 移交日期选择
const showTransferDatePicker = ref(false);

// 初始化日期列（最近30天）
const initDateColumns = () => {
  const dates = [];
  const today = new Date();
  for (let i = 30; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    dates.push(formatDate(date, 'yyyy-MM-dd'));
  }
  return [dates];
};

// 初始化时间列（每15分钟一个选项）
const initTimeColumns = () => {
  const times = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 15) {
      const hour = h.toString().padStart(2, '0');
      const minute = m.toString().padStart(2, '0');
      times.push(`${hour}:${minute}`);
    }
  }
  return [times];
};

// 初始化日期和时间列数据
const dateColumns = reactive(initDateColumns());
const timeColumns = reactive(initTimeColumns());
const transferDateColumns = reactive(initDateColumns());

// 选择确认事件处理
const handleBrandConfirm = (e) => {
  const value = e.value[0];
  const selectedOption = brandOptions.find(option => option.name === value);
  if (selectedOption) {
    formData.brand.name = selectedOption.name;
    formData.brand.value = selectedOption.value;
  }
  showBrandPicker.value = false;
};

const handleClassConfirm = (e) => {
  formData.class = e.value[0];
  showClassPicker.value = false;
};

const handleShiftConfirm = (e) => {
  formData.shift = e.value[0];
  showShiftPicker.value = false;
};

const handleDateConfirm = (e) => {
  formData.productionDate = e.value[0];
  showDatePicker.value = false;
};

const handleTimeConfirm = (e) => {
  formData.productionTime = e.value[0];
  showTimePicker.value = false;
};

const handleTransferDateConfirm = (e) => {
  formData.transferDate = e.value[0];
  showTransferDatePicker.value = false;
};
// =====================================================================

// 页面加载时接收参数
onLoad(async (options) => {
  console.log('页面加载参数:', options);
  if (options) {
    myOrder.value = {
      id: options.id ? decodeURIComponent(options.id) : '',
      batchNo: options.batchNo ? decodeURIComponent(options.batchNo) : '',
      brand: options.brand ? decodeURIComponent(options.brand) : '',
      number: options.number ? decodeURIComponent(options.number) : '',
      yield: options.yield ? decodeURIComponent(options.yield) : ''
    };
  } else {
    getDataFromGlobal();
  }
  
  if (myOrder.value.batchNo) {
    // 确保传递正确的批次号参数
    await loadExistingCheckRecord(myOrder.value.batchNo);
    // 确保传递正确的批次号参数
    await queryAndDisplayTobaccoDustStats(myOrder.value.batchNo);
  }
});

// 从全局状态获取数据的函数
const getDataFromGlobal = () => {
  try {
    const app = getApp();
    if (app && app.globalData && app.globalData.currentOrder) {
      myOrder.value = {
        id: app.globalData.currentOrder.id || '',
        batchNo: app.globalData.currentOrder.batchNo || '',
        brand: app.globalData.currentOrder.brand || '',
        number: app.globalData.currentOrder.number || '',
        yield: app.globalData.currentOrder.yield || ''
      };
      return true;
    }
  } catch (e) {
    console.error('从全局状态获取数据失败:', e);
  }
  return false;
};

// 加载已有核对记录（合并历史数据到全局已提交数据）
const loadExistingCheckRecord = async (targetBatchNo) => {
  try {
    const record = await byBatchIdAndSegment(targetBatchNo, "加香机");
    console.log('加载历史记录结果:', record);
    
    if (record && record.verificationResult) {
      // 解析验证结果
      let verificationResult = record.verificationResult;
      if (typeof verificationResult === 'string') {
        verificationResult = JSON.parse(verificationResult);
      }
      
      // 合并历史数据到全局已提交数据
      submittedGlobalData.value = {
        images: verificationResult.images || {},
        flavorRemaining: verificationResult.flavorRemaining || '',
        tobaccoDustStats: verificationResult.tobaccoDustStats || {}
      };
      
      // 回显图片数据（直接调用组件的setPreviewImages方法）
      const images = submittedGlobalData.value.images;
      if (images.threePressure && threePressureRef.value) {
        threePressureRef.value.setPreviewImages([images.threePressure]);
      }
      if (images.brandBatch && brandBatchRef.value) {
        brandBatchRef.value.setPreviewImages([images.brandBatch]);
      }
      if (images.interfaceVerify && interfaceVerifyRef.value) {
        interfaceVerifyRef.value.setPreviewImages([images.interfaceVerify]);
      }
      if (images.moistureChannel && moistureChannelRef.value) {
        moistureChannelRef.value.setPreviewImages([images.moistureChannel]);
      }
      if (images.alcoholCleaning && alcoholCleaningRef.value) {
        alcoholCleaningRef.value.setPreviewImages([images.alcoholCleaning]);
      }
      if (images.beltCleaning && beltCleaningRef.value) {
        beltCleaningRef.value.setPreviewImages([images.beltCleaning]);
      }
      if (images.scaleCleaning && scaleCleaningRef.value) {
        scaleCleaningRef.value.setPreviewImages([images.scaleCleaning]);
      }
      
      // 回显表单数据
      if (submittedGlobalData.value.flavorRemaining) {
        formData.flavorRemaining = submittedGlobalData.value.flavorRemaining;
      }
      
      // 回显烟沫统计数据
      const tobaccoDustStats = submittedGlobalData.value.tobaccoDustStats;
      if (tobaccoDustStats.brand) {
        const brandOption = brandOptions.find(option => option.value === tobaccoDustStats.brand);
        if (brandOption) {
          formData.brand = { ...brandOption };
        }
      }
      if (tobaccoDustStats.productionDate) formData.productionDate = tobaccoDustStats.productionDate;
      if (tobaccoDustStats.productionTime) formData.productionTime = tobaccoDustStats.productionTime;
      if (tobaccoDustStats.class) formData.class = tobaccoDustStats.class;
      if (tobaccoDustStats.shift) formData.shift = tobaccoDustStats.shift;
      if (tobaccoDustStats.weight !== undefined) formData.weight = tobaccoDustStats.weight;
      if (tobaccoDustStats.transferDate) formData.transferDate = tobaccoDustStats.transferDate;
      
      // 标记已提交的模块
      await nextTick();
      hasSubmittedModules.value.startCheck = !!images.threePressure;
      hasSubmittedModules.value.preFeedCheck = !!images.brandBatch && !!images.interfaceVerify && !!images.moistureChannel && !!submittedGlobalData.value.flavorRemaining;
      hasSubmittedModules.value.changeBrandCheck = !!images.alcoholCleaning && !!images.beltCleaning && !!images.scaleCleaning;
      hasSubmittedModules.value.tobaccoDustStats = !!tobaccoDustStats.brand && !!tobaccoDustStats.productionDate && !!tobaccoDustStats.weight;
    }
  } catch (error) {
    console.warn('加载历史记录失败:', error);
  }
};

// 所有模块都提交后才启用三级验证
const hasAllModulesSubmitted = computed(() => {
  const startCheckCompleted = !threePressureRef.value || hasSubmittedModules.value.startCheck;
  return startCheckCompleted && 
         hasSubmittedModules.value.preFeedCheck && 
         hasSubmittedModules.value.changeBrandCheck && 
         hasSubmittedModules.value.tobaccoDustStats;
});

// 根据批次号查询烟沫统计数据并回显
const queryAndDisplayTobaccoDustStats = async (batchNo) => {
  try {
    console.log('开始查询批次号为', batchNo, '的烟沫统计数据');
    if (!batchNo) {
      uni.showToast({ title: '请输入有效的批次号', icon: 'none' });
      return;
    }
    
    // 显示加载提示
    uni.showLoading({ title: '查询中...' });
    
    // 调用API查询数据
    console.log('准备调用API，批次号参数:', { batchNo: batchNo, segment: '加香机' });
    const result = await queryTobaccoDustStatsByBatchNo({ batchNo, segment: '加香机' });
    console.log('查询结果类型:', typeof result);
    console.log('查询结果是否为数组:', Array.isArray(result));
    console.log('查询结果:', result);
    console.log('查询结果长度:', Array.isArray(result) ? result.length : 'N/A');
    
    // 检查结果格式
    if (Array.isArray(result) && result.length > 0) {
      // 取第一条数据进行回显
      const tobaccoDustStats = result[0];
      
      // 回显牌号
      if (tobaccoDustStats.brand) {
        // 尝试根据value查找匹配的牌号
        let brandOption = brandOptions.find(option => option.value === tobaccoDustStats.brand);
        // 如果没找到，尝试根据name查找
        if (!brandOption) {
          brandOption = brandOptions.find(option => option.name === tobaccoDustStats.brand);
        }
        // 如果还是没找到但有brand值，创建一个临时选项
        if (!brandOption && tobaccoDustStats.brand) {
          brandOption = { name: tobaccoDustStats.brand, value: tobaccoDustStats.brand };
        }
        
        if (brandOption) {
          formData.brand = { ...brandOption };
        }
      }
      
      // 回显其他字段
      if (tobaccoDustStats.productionDate) formData.productionDate = tobaccoDustStats.productionDate;
      if (tobaccoDustStats.productionTime) formData.productionTime = tobaccoDustStats.productionTime;
      if (tobaccoDustStats.class) formData.class = tobaccoDustStats.class;
      if (tobaccoDustStats.shift) formData.shift = tobaccoDustStats.shift;
      if (tobaccoDustStats.weight !== undefined) formData.weight = tobaccoDustStats.weight;
      if (tobaccoDustStats.transferDate) formData.transferDate = tobaccoDustStats.transferDate;
      
      // 更新已提交状态
      hasSubmittedModules.value.tobaccoDustStats = true;
      
      // 更新全局数据
      submittedGlobalData.value.tobaccoDustStats = tobaccoDustStats;
      
      uni.showToast({ title: '数据回显成功', icon: 'success' });
    } else {
        // 提供更详细的无数据提示
        const message = `未找到批次号 ${batchNo} 的烟沫统计数据`;
        console.log(message);
        uni.showToast({ title: message, icon: 'none', duration: 3000 });
      }
    } catch (error) {
      console.error('查询烟沫统计数据失败:', error);
      // 提供更详细的错误信息
      const errorMessage = error.message || '查询失败，请重试';
      uni.showToast({ title: `查询错误: ${errorMessage}`, icon: 'none', duration: 3000 });
    } finally {
      uni.hideLoading();
    }
};

// 合并当前模块数据到全局已提交数据
const mergeCurrentModuleData = (moduleType) => {
  // 实时获取各组件的图片状态（已上传的服务器URL）
  const threePressureImages = threePressureRef.value?.getUploadedUrls() || [];
  const brandBatchImages = brandBatchRef.value?.getUploadedUrls() || [];
  const interfaceVerifyImages = interfaceVerifyRef.value?.getUploadedUrls() || [];
  const moistureChannelImages = moistureChannelRef.value?.getUploadedUrls() || [];
  const alcoholCleaningImages = alcoholCleaningRef.value?.getUploadedUrls() || [];
  const beltCleaningImages = beltCleaningRef.value?.getUploadedUrls() || [];
  const scaleCleaningImages = scaleCleaningRef.value?.getUploadedUrls() || [];
  
  // 根据当前提交的模块，合并对应数据
  switch (moduleType) {
    case 'startCheck':
      // 合并开班检查数据
      if (threePressureImages.length > 0) {
        submittedGlobalData.value.images.threePressure = threePressureImages[0];
      }
      break;
    case 'preFeedCheck':
      // 合并开料前检查数据
      if (brandBatchImages.length > 0) {
        submittedGlobalData.value.images.brandBatch = brandBatchImages[0];
      }
      if (interfaceVerifyImages.length > 0) {
        submittedGlobalData.value.images.interfaceVerify = interfaceVerifyImages[0];
      }
      if (moistureChannelImages.length > 0) {
        submittedGlobalData.value.images.moistureChannel = moistureChannelImages[0];
      }
      submittedGlobalData.value.flavorRemaining = formData.flavorRemaining;
      break;
    case 'changeBrandCheck':
      // 合并换牌检查数据
      if (alcoholCleaningImages.length > 0) {
        submittedGlobalData.value.images.alcoholCleaning = alcoholCleaningImages[0];
      }
      if (beltCleaningImages.length > 0) {
        submittedGlobalData.value.images.beltCleaning = beltCleaningImages[0];
      }
      if (scaleCleaningImages.length > 0) {
        submittedGlobalData.value.images.scaleCleaning = scaleCleaningImages[0];
      }
      break;
    case 'tobaccoDustStats':
      // 合并烟沫统计数据
      submittedGlobalData.value.tobaccoDustStats = {
        brand: formData.brand.value,
        productionDate: formData.productionDate,
        productionTime: formData.productionTime,
        class: formData.class,
        shift: formData.shift,
        weight: formData.weight,
        transferDate: formData.transferDate
      };
      break;
  }
};

// 模块提交函数（核心：合并所有已提交数据后提交）
const submitModule = async (moduleType) => {
  if (submitting.value || hasSubmittedModules.value[moduleType]) return;
  
  try {
    submitting.value = true;
    
    // 1. 验证当前模块的必填项
    let validatePass = true;
    let errorMsg = '';
    
    // 实时获取当前模块的图片状态
    const threePressureImages = threePressureRef.value?.getAllImageUrls() || [];
    const brandBatchImages = brandBatchRef.value?.getAllImageUrls() || [];
    const interfaceVerifyImages = interfaceVerifyRef.value?.getAllImageUrls() || [];
    const moistureChannelImages = moistureChannelRef.value?.getAllImageUrls() || [];
    const alcoholCleaningImages = alcoholCleaningRef.value?.getAllImageUrls() || [];
    const beltCleaningImages = beltCleaningRef.value?.getAllImageUrls() || [];
    const scaleCleaningImages = scaleCleaningRef.value?.getAllImageUrls() || [];
    
    // 模块专属验证
    switch (moduleType) {
      case 'startCheck':
        if (threePressureImages.length === 0) {
          validatePass = false;
          errorMsg = '请上传三压检查图片';
        }
        break;
      case 'preFeedCheck':
        if (brandBatchImages.length === 0) {
          validatePass = false;
          errorMsg = '请上传牌号和批次号图片';
        } else if (interfaceVerifyImages.length === 0) {
          validatePass = false;
          errorMsg = '请上传界面验证图片';
        } else if (moistureChannelImages.length === 0) {
          validatePass = false;
          errorMsg = '请上传水分仪通道图片';
        } else if (!formData.flavorRemaining) {
          validatePass = false;
          errorMsg = '请输入香料剩余量';
        }
        break;
      case 'changeBrandCheck':
        if (alcoholCleaningImages.length === 0) {
          validatePass = false;
          errorMsg = '请上传酒精清洗照片';
        } else if (beltCleaningImages.length === 0) {
          validatePass = false;
          errorMsg = '请上传皮带清扫照片';
        } else if (scaleCleaningImages.length === 0) {
          validatePass = false;
          errorMsg = '请上传电子称清扫照片';
        }
        break;
      case 'tobaccoDustStats':
        if (!formData.brand.name) {
          validatePass = false;
          errorMsg = '请选择牌号';
        } else if (!formData.productionDate) {
          validatePass = false;
          errorMsg = '请选择生产日期';
        } else if (!formData.productionTime) {
          validatePass = false;
          errorMsg = '请选择生产时间';
        } else if (!formData.class) {
          validatePass = false;
          errorMsg = '请选择班别';
        } else if (!formData.shift) {
          validatePass = false;
          errorMsg = '请选择班次';
        } else if (!formData.weight) {
          validatePass = false;
          errorMsg = '请输入重量';
        } else if (!formData.transferDate) {
          validatePass = false;
          errorMsg = '请选择移交日期';
        }
        break;
    }
    
    if (!validatePass) {
      uni.showToast({ title: errorMsg, icon: 'none' });
      return;
    }
    
    // 2. 触发当前模块的图片上传
    const uploadPromises = [];
    if (moduleType === 'startCheck' && threePressureRef.value) {
      uploadPromises.push(threePressureRef.value.triggerUpload());
    }
    if (moduleType === 'preFeedCheck') {
      if (brandBatchRef.value) uploadPromises.push(brandBatchRef.value.triggerUpload());
      if (interfaceVerifyRef.value) uploadPromises.push(interfaceVerifyRef.value.triggerUpload());
      if (moistureChannelRef.value) uploadPromises.push(moistureChannelRef.value.triggerUpload());
    }
    if (moduleType === 'changeBrandCheck') {
      if (alcoholCleaningRef.value) uploadPromises.push(alcoholCleaningRef.value.triggerUpload());
      if (beltCleaningRef.value) uploadPromises.push(beltCleaningRef.value.triggerUpload());
      if (scaleCleaningRef.value) uploadPromises.push(scaleCleaningRef.value.triggerUpload());
    }
    
    // 等待上传完成
    if (uploadPromises.length > 0) {
      await Promise.all(uploadPromises);
    }
    
    // 3. 合并当前模块数据到全局已提交数据
    mergeCurrentModuleData(moduleType);
    
    // 4. 构建最终提交数据（包含所有已提交模块的内容）
    const submitData = {
      segment: '加香机',
      batchId: myOrder.value.batchNo || '',
      brand: myOrder.value.brand || '',
      verificationResult: {
        images: submittedGlobalData.value.images, // 所有已提交的图片
        flavorRemaining: submittedGlobalData.value.flavorRemaining, // 香料剩余量
        tobaccoDustStats: submittedGlobalData.value.tobaccoDustStats, // 烟沫统计数据
      },
      dataCount: 7,
      operatorId: uni.getStorageSync('userId') || '',
      verified_time: formatDate(new Date(), 'yyyy-MM-dd HH:mm:ss')
    };
    
    console.log('最终提交数据（包含所有已提交模块）:', submitData);
    
    // 5. 调用API提交数据
    await submitMaterialCheck(submitData);
    
    uni.showToast({ title: '提交成功', icon: 'success' });
    
    // 6. 标记当前模块为已提交
    hasSubmittedModules.value[moduleType] = true;
    
    // 7. 重新加载数据，确保页面显示最新内容
    setTimeout(() => {
      if (myOrder.value.batchNo) {
        loadExistingCheckRecord(myOrder.value.batchNo);
      }
    }, 1500);
    
  } catch (error) {
    console.error('提交失败:', error);
    uni.showToast({ title: error.message || '提交失败，请重试', icon: 'none' });
  } finally {
    submitting.value = false;
  }
};

// 验证回调
const handleVerifySuccess = (data) => {
  uni.showToast({ title: '验证成功', icon: 'success' });
};
const handleVerifyFail = (error) => {
  uni.showToast({ title: error.message || '验证失败', icon: 'none' });
};
const handleValidate = (data) => {
  console.log('验证过程中:', data);
};
</script>

<style scoped>
/* 基础页面样式 */
.page {
  padding: 20rpx;
  background-color: #f7f8fa;
  min-height: 100vh;
  box-sizing: border-box;
}

/* 卡片式容器 */
.task-list-container {
  margin-top: 20rpx;
}

.card-section {
  background-color: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
}

/* 分组标题 */
.group-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 28rpx;
  padding-left: 8rpx;
  border-left: 6rpx solid #007AFF;
}

/* 表单项样式 */
.form-item {
  margin-bottom: 30rpx;
  display: flex;
  flex-direction: column;
}

.form-item-row {
  flex-direction: row;
  align-items: flex-start;
}

.form-row {
  display: flex;
  width: 100%;
  gap: 16rpx;
}

.form-col-50 {
  flex: 1;
}

/* 表单标签 */
.form-label {
  font-size: 28rpx;
  color: #333;
  margin-bottom: 12rpx;
  font-weight: 500;
  display: flex;
  align-items: center;
}

.form-label.required::before {
  content: '*';
  color: #F53F3F;
  margin-right: 6rpx;
  font-size: 32rpx;
}

.form-hint {
  font-size: 24rpx;
  color: #999;
  margin-left: 8rpx;
}

/* 输入控件样式 */
.form-control {
  width: 100%;
  font-size: 28rpx;
}

.form-control-picker {
  --u-cell-height: 88rpx;
  border-radius: 8rpx;
  background-color: #fafafa;
}

/* 操作按钮区域 */
.form-actions {
  display: flex;
  justify-content: center;
  margin-top: 16rpx;
}

.main-submit {
  margin-top: 40rpx;
  margin-bottom: 40rpx;
}

/* 提交按钮 */
.submit-btn {
  width: 100%;
  padding: 26rpx;
  background: linear-gradient(90deg, #007AFF 0%, #5AC8FA 100%);
  color: white;
  text-align: center;
  font-size: 30rpx;
  font-weight: 500;
  border-radius: 12rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 122, 255, 0.3);
  transition: all 0.2s ease-in-out;
}

.submit-btn:active {
  transform: scale(0.98);
  box-shadow: 0 2rpx 10rpx rgba(0, 122, 255, 0.4);
}

.submit-btn.disabled {
  background: #c8c9cc;
  box-shadow: none;
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

/* 修改所有选择框（u-cell）的内容左对齐 */
::v-deep .form-control-picker .u-cell__value {
  text-align: left !important;
}

/* 确保所有u-cell类型的选择框都左对齐 */
::v-deep .u-cell__value {
  text-align: left !important;
  justify-content: flex-start !important;
  padding-left: 0 !important;
}
</style>
