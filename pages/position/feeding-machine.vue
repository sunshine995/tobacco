<template>
  <view class="container">
    <!-- 顶部卡片区域 -->
    <view class="header-card">
      <WorkOrderInfoCard :order-info="myOrder" />
    </view>

    <!-- 上传组件区域 -->
    <view class="upload-section">
      <!-- 开班检查 -->
      <view class="check-section">
        <view class="check-section-title">
          <text class="section-sub-title">开班检查</text>
        </view>
        <text class="upload-label">三压图片</text>
        <UploadImage
          ref="pressureUploadRef"
          title="添加三压图片"
          :max-count="3"
          class="upload-card-item"
        />
        <!-- 开班检查专属提交按钮 -->
        <up-button
          type="primary"
          @click="submitModule('startCheck')"
          :loading="submitting"
          class="submit-btn primary-btn"
          :disabled="submitting || hasSubmittedModules.startCheck"
        >
          {{ submitting ? '提交中...' : hasSubmittedModules.startCheck ? '已提交' : '提交验证' }}
        </up-button>
      </view>

      <!-- 开料前检查 -->
      <view class="check-section">
        <view class="check-section-title">
          <text class="section-sub-title">开料前检查</text>
        </view>
        <text class="upload-label">牌号+批次号照片</text>
        <UploadImage
          ref="brandBatchUploadRef"
          title="添加牌号+批次号照片"
          :max-count="1"
          class="upload-card-item"
        />
        <text class="upload-label">规定的预填充值照片</text>
        <UploadImage
          ref="preFillUploadRef"
          title="添加预填充值照片"
          :max-count="1"
          class="upload-card-item"
        />
        <!-- 开料前检查专属提交按钮 -->
        <up-button
          type="primary"
          @click="submitModule('preFeedCheck')"
          :loading="submitting"
          class="submit-btn primary-btn"
          :disabled="submitting || hasSubmittedModules.preFeedCheck"
        >
          {{ submitting ? '提交中...' : hasSubmittedModules.preFeedCheck ? '已提交' : '提交验证' }}
        </up-button>
      </view>

      <!-- 过完料检查 -->
      <view class="check-section">
        <view class="check-section-title">
          <text class="section-sub-title">过完料检查</text>
        </view>
        <text class="upload-label">筛网清吹照片</text>
        <UploadImage
          ref="screenCleanUploadRef"
          title="添加筛网清吹照片"
          :max-count="1"
          class="upload-card-item"
        />
        <!-- 过完料检查专属提交按钮 -->
        <up-button
          type="primary"
          @click="submitModule('postFeedCheck')"
          :loading="submitting"
          class="submit-btn primary-btn"
          :disabled="submitting || hasSubmittedModules.postFeedCheck"
        >
          {{ submitting ? '提交中...' : hasSubmittedModules.postFeedCheck ? '已提交' : '提交验证' }}
        </up-button>
      </view>

      <!-- 入口烟沫统计 -->
      <view class="check-section">
        <view class="check-section-title">
          <text class="section-sub-title">烟沫统计</text>
        </view>
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
          />
        </view>

        <!-- 烟沫统计提交按钮 -->
        <up-button
          type="primary"
          @click="submitDust"
          :loading="submitting"
          class="submit-btn primary-btn"
          :disabled="submitting || hasSubmittedModules.tobaccoDustStats"
        >
          {{ submitting ? '提交中...' : hasSubmittedModules.tobaccoDustStats ? '已提交' : '提交' }}
        </up-button>
      </view>
    </view>

    <!-- 操作按钮区域 -->
    <view class="action-buttons-section">
      <!-- 三级验证按钮 -->
      <VerifyButton
        buttonText="三级验证"
        :batchId="myOrder.batchNo"
        :brand="myOrder.brand"
        segment="加料机"
        :dataCount="4"
        @success="handleVerifySuccess"
        @fail="handleVerifyFail"
        @validate="handleValidate"
        :disabled="!hasAllModulesSubmitted || submitting"
      />
    </view>
    <!-- 折叠面板 -->
    <view class="collapse-panel">
      <view class="collapse-header" @click="toggleCalculator">
        <text class="collapse-title">加料反算精度计算工具</text>
        <text class="collapse-icon">{{ isCalculatorOpen ? '▼' : '▶' }}</text>
      </view>
      <view v-if="isCalculatorOpen" class="collapse-content">
        <AccuracyCalculatorNew />
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick, computed } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import WorkOrderInfoCard from '@/components/orderInfo.vue';
import UploadImage from '@/components/UploadImage.vue';

import VerifyButton from '@/components/VerifyButton.vue';
import { submitMaterialCheck, byBatchIdAndSegment, insertTobaccoDustStats, queryTobaccoDustStatsByBatchNo } from '@/api/production.js';
import { formatDate } from '@/utils/date.js';
import AccuracyCalculatorNew from '@/components/AccuracyCalculatorNew.vue';

// 控制计算工具折叠状态
const isCalculatorOpen = ref(false);

// 切换计算工具显示/隐藏
const toggleCalculator = () => {
  isCalculatorOpen.value = !isCalculatorOpen.value;
};

// 订单信息响应式对象
const myOrder = ref({
  id: '',
  batchNo: '',
  brand: ''
});

// 所有模块的已提交数据（全局存储，提交时自动合并）
const allData = ref({
  imagesPressure: [],          // 三压图片
  imagesBrandBatch: [],        // 牌号+批次号照片
  imagesPreFill: [],           // 预填充值照片
  imagesScreenClean: [],       // 筛网清吹照片
  tobaccoDustStats: {}         // 烟沫统计数据
});

// 各模块的提交状态（控制按钮显示/禁用）
const hasSubmittedModules = ref({
  startCheck: false,       // 开班检查
  preFeedCheck: false,     // 开料前检查
  postFeedCheck: false,    // 过完料检查
  tobaccoDustStats: false  // 烟沫统计
});

// 所有模块都提交后才启用三级验证
const hasAllModulesSubmitted = computed(() => {
  return hasSubmittedModules.value.startCheck &&
         hasSubmittedModules.value.preFeedCheck &&
         hasSubmittedModules.value.postFeedCheck &&
         hasSubmittedModules.value.tobaccoDustStats;
});

// 上传组件引用
const pressureUploadRef = ref(null);
const brandBatchUploadRef = ref(null);
const preFillUploadRef = ref(null);
const screenCleanUploadRef = ref(null);

// 提交状态（防止重复提交）
const submitting = ref(false);

// --- 入口烟沫统计相关变量 ---
const formData = reactive({
  brand: { name: '', value: '' },
  productionDate: formatDate(new Date(), 'yyyy-MM-dd'),
  productionTime: formatDate(new Date(), 'HH:mm'),
  class: '',
  shift: '',
  weight: '',
  transferDate: formatDate(new Date(), 'yyyy-MM-dd')
});

const brandOptions = [
  { name: '兰州（硬珍品）ZP-1', value: '兰州（硬珍品）ZP-1' },
  { name: '利群（新版）SR-1', value: '利群（新版）SR-1' },
  { name: '其他牌号QT-1', value: '其他牌号QT-1' }
];
const brandColumns = reactive([brandOptions.map(option => option.name)]);
const showBrandPicker = ref(false);

const classOptions = ['甲', '乙'];
const classColumns = reactive([classOptions]);
const showClassPicker = ref(false);

const shiftOptions = ['白', '中', '夜'];
const shiftColumns = reactive([shiftOptions]);
const showShiftPicker = ref(false);

const showDatePicker = ref(false);
const showTimePicker = ref(false);
const showTransferDatePicker = ref(false);

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

const dateColumns = reactive(initDateColumns());
const timeColumns = reactive(initTimeColumns());
const transferDateColumns = reactive(initDateColumns());

// --- 烟沫统计选择事件 ---
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

// 根据批次号查询并回显烟沫统计数据
const queryAndDisplayTobaccoDustStats = async (batchNo) => {
  if (!batchNo) {
    console.log('批次号为空，无法查询烟沫统计数据');
    return;
  }
  
  try {
    uni.showLoading({ title: '查询烟沫统计数据中...' });
    console.log('查询参数batchNo:', batchNo, 'segment:', '加料机');
    
    const result = await queryTobaccoDustStatsByBatchNo({ batchNo, segment: '加料机' });
    console.log('查询结果类型:', typeof result, '是否为数组:', Array.isArray(result));
    console.log('查询结果:', result);
    
    if (Array.isArray(result) && result.length > 0) {
      // 取第一条数据作为回显数据
      const statsData = result[0];
      console.log('使用第一条数据回显:', statsData);
      
      // 回显牌号 - 需要处理brandOptions匹配
      if (statsData.brand) {
        // 尝试通过value匹配
        let brandOption = brandOptions.find(option => option.value === statsData.brand);
        
        // 如果通过value匹配不到，尝试通过name匹配
        if (!brandOption) {
          brandOption = brandOptions.find(option => option.name === statsData.brand);
        }
        
        // 如果都匹配不到，创建一个临时选项
        if (brandOption) {
          formData.brand = { ...brandOption };
        } else {
          // 创建一个临时选项显示
          formData.brand = { name: statsData.brand, value: statsData.brand };
        }
      }
      
      // 回显其他字段
      formData.productionDate = statsData.productionDate || formData.productionDate;
      formData.productionTime = statsData.productionTime || formData.productionTime;
      formData.class = statsData.class || '';
      formData.shift = statsData.shift || '';
      formData.weight = statsData.weight || '';
      formData.transferDate = statsData.transferDate || formData.transferDate;
      
      // 更新已提交状态
      hasSubmittedModules.value.tobaccoDustStats = true;
      
      console.log('烟沫统计数据回显完成');
    } else {
      console.log('未找到该批次的烟沫统计数据');
      uni.showToast({
        title: `未找到批次号 ${batchNo} 的烟沫统计数据`,
        icon: 'none',
        duration: 3000
      });
    }
  } catch (error) {
    console.error('查询烟沫统计数据失败:', error);
    uni.showToast({
      title: `查询失败: ${error.message || '请重试'}`,
      icon: 'none',
      duration: 3000
    });
  } finally {
    uni.hideLoading();
  }
};

// 提交烟沫统计数据
const submitDust = async () => {
  if (submitting.value || hasSubmittedModules.value.tobaccoDustStats) return;
  
  try {
    submitting.value = true;
    
    // 验证重量
    if (!formData.weight || isNaN(parseFloat(formData.weight)) || parseFloat(formData.weight) <= 0) {
      uni.showToast({ title: '请输入有效的重量', icon: 'none' });
      submitting.value = false;
      return;
    }
    
    // 验证移交日期
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
      batchNo: myOrder.value.batchNo || '',
      segment: '加料机'
    }
    
    console.log('烟沫统计提交数据:', tobaccoDustData);
    
    // 调用API提交数据
    const res = await insertTobaccoDustStats(tobaccoDustData);
    console.log('烟沫统计提交数据响应:', res);
    // 处理响应 - 由于request.js直接返回业务数据，我们假设成功返回任何非错误值
    // 这里简化处理，因为API成功时不会抛出错误
    uni.showToast({ title: '提交成功', icon: 'success' });
    
    // 更新模块提交状态
    hasSubmittedModules.value.tobaccoDustStats = true;
    
    // 合并数据到全局
    mergeCurrentModuleData('tobaccoDustStats');
    
  } catch (error) {
    console.error('提交烟沫统计数据失败:', error);
    uni.showToast({ 
      title: `提交失败: ${error.message || '请重试'}`, 
      icon: 'none',
      duration: 3000
    });
  } finally {
    // 重置提交状态
    submitting.value = false;
  }
};

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

// 加载已有核对记录
const loadExistingCheckRecord = async (batchNo) => {
  if (!batchNo) return;
  try {
    const res = await byBatchIdAndSegment(batchNo, "加料机");
    if (res?.verificationResult) {
      let verificationResult = res.verificationResult;
      if (typeof verificationResult === 'string') {
        verificationResult = JSON.parse(verificationResult);
      }
      Object.assign(allData.value, verificationResult);

      await nextTick();
      // 回显图片
      pressureUploadRef.value?.setPreviewImages(allData.value.imagesPressure || []);
      brandBatchUploadRef.value?.setPreviewImages(allData.value.imagesBrandBatch || []);
      preFillUploadRef.value?.setPreviewImages(allData.value.imagesPreFill || []);
      screenCleanUploadRef.value?.setPreviewImages(allData.value.imagesScreenClean || []);

      // 回显烟沫统计数据
      const stats = allData.value.tobaccoDustStats || {};
      if (stats.brand) {
        const brandOption = brandOptions.find(option => option.value === stats.brand);
        if (brandOption) {
          formData.brand = { ...brandOption };
        }
      }
      formData.productionDate = stats.productionDate || formData.productionDate;
      formData.productionTime = stats.productionTime || formData.productionTime;
      formData.class = stats.class || '';
      formData.shift = stats.shift || '';
      formData.weight = stats.weight || '';
      formData.transferDate = stats.transferDate || formData.transferDate;

      // 更新提交状态
      hasSubmittedModules.value.startCheck = !!allData.value.imagesPressure?.length;
      hasSubmittedModules.value.preFeedCheck = !!allData.value.imagesBrandBatch?.length && !!allData.value.imagesPreFill?.length;
      hasSubmittedModules.value.postFeedCheck = !!allData.value.imagesScreenClean?.length;
      hasSubmittedModules.value.tobaccoDustStats = !!Object.keys(allData.value.tobaccoDustStats || {}).length;
    }
  } catch (error) {
    console.error('加载历史核对记录失败:', error);
  }
};

// 页面加载时初始化
onLoad(async (options) => {
  if (options && (options.id || options.batchNo || options.brand)) {
    myOrder.value = {
      id: options.id ? decodeURIComponent(options.id) : '',
      batchNo: options.batchNo ? decodeURIComponent(options.batchNo) : '',
      brand: options.brand ? decodeURIComponent(options.brand) : ''
    };
  } else {
    getDataFromGlobal();
  }
  if (myOrder.value.batchNo) {
    await loadExistingCheckRecord(myOrder.value.batchNo);
    // 查询并回显烟沫统计数据
    await queryAndDisplayTobaccoDustStats(myOrder.value.batchNo);
  }
});

onMounted(async () => {
  if (!myOrder.value.batchNo && !myOrder.value.brand) {
    getDataFromGlobal();
  }
  if (myOrder.value.batchNo) {
    await loadExistingCheckRecord(myOrder.value.batchNo);
    // 查询并回显烟沫统计数据
    await queryAndDisplayTobaccoDustStats(myOrder.value.batchNo);
  }
});

// 合并当前模块数据到全局已提交数据
const mergeCurrentModuleData = (moduleType) => {
  // 实时获取各组件的图片状态（已上传的服务器URL）
  const pressureImages = pressureUploadRef.value?.getUploadedUrls() || [];
  const brandBatchImages = brandBatchUploadRef.value?.getUploadedUrls() || [];
  const preFillImages = preFillUploadRef.value?.getUploadedUrls() || [];
  const screenCleanImages = screenCleanUploadRef.value?.getUploadedUrls() || [];
  
  // 根据当前提交的模块，合并对应数据，保留已提交模块的数据
  switch (moduleType) {
    case 'startCheck':
      // 只更新当前模块的数据，保留其他模块的数据
      if (pressureImages.length > 0) {
        allData.value.imagesPressure = pressureImages;
      }
      break;
    case 'preFeedCheck':
      // 只更新当前模块的数据，保留其他模块的数据
      if (brandBatchImages.length > 0) {
        allData.value.imagesBrandBatch = brandBatchImages;
      }
      if (preFillImages.length > 0) {
        allData.value.imagesPreFill = preFillImages;
      }
      break;
    case 'postFeedCheck':
      // 只更新当前模块的数据，保留其他模块的数据
      if (screenCleanImages.length > 0) {
        allData.value.imagesScreenClean = screenCleanImages;
      }
      break;
    case 'tobaccoDustStats':
      // 只更新当前模块的数据，保留其他模块的数据
      allData.value.tobaccoDustStats = { ...formData };
      break;
  }
  
  console.log('合并后的数据:', allData.value);
};

// 模块提交函数
const submitModule = async (moduleType) => {
  if (submitting.value || hasSubmittedModules.value[moduleType]) return;
  try {
    submitting.value = true;

    // 1. 验证当前模块
    let validatePass = true;
    let errorMsg = '';
    const uploadPromises = [];

    switch (moduleType) {
      case 'startCheck':
        if (pressureUploadRef.value.getAllImageUrls().length === 0) {
          validatePass = false; errorMsg = '请上传三压图片';
        } else uploadPromises.push(pressureUploadRef.value.triggerUpload());
        break;
      case 'preFeedCheck':
        if (brandBatchUploadRef.value.getAllImageUrls().length === 0 || preFillUploadRef.value.getAllImageUrls().length === 0) {
          validatePass = false; errorMsg = '请上传所有开料前检查照片';
        } else {
          uploadPromises.push(brandBatchUploadRef.value.triggerUpload());
          uploadPromises.push(preFillUploadRef.value.triggerUpload());
        }
        break;
      case 'postFeedCheck':
        if (screenCleanUploadRef.value.getAllImageUrls().length === 0) {
          validatePass = false; errorMsg = '请上传筛网清吹照片';
        } else uploadPromises.push(screenCleanUploadRef.value.triggerUpload());
        break;
      case 'tobaccoDustStats':
        if (!formData.brand.value || !formData.productionDate || !formData.weight) {
          validatePass = false; errorMsg = '请填写烟沫统计的必填项';
        }
        break;
    }
    if (!validatePass) {
      uni.showToast({ title: errorMsg, icon: 'none' });
      return;
    }

    // 2. 上传当前模块图片
    if (uploadPromises.length > 0) await Promise.all(uploadPromises);

    // 3. 合并当前模块数据到全局已提交数据（核心改进：只更新当前模块数据，保留其他模块数据）
    mergeCurrentModuleData(moduleType);

    // 4. 构建并提交（包含所有已提交模块的内容）
    const submitData = {
      batchId: myOrder.value.batchNo || '',
      brand: myOrder.value.brand,
      segment: "加料机",
      verificationResult: allData.value,
      dataCount: Object.keys(allData.value).filter(key => {
        const val = allData.value[key];
        return (Array.isArray(val) && val.length > 0) || (typeof val === 'object' && val !== null && Object.keys(val).length > 0);
      }).length,
      operatorId: uni.getStorageSync('userId') || '',
      workOrderId: myOrder.value.id
    };
    
    console.log('最终提交数据（包含所有已提交模块）:', submitData);
    await submitMaterialCheck(submitData);

    // 5. 标记当前模块为已提交
    hasSubmittedModules.value[moduleType] = true;
    uni.showToast({ title: '提交成功', icon: 'success' });
    
    // 6. 重新加载数据，确保页面显示最新内容
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

// 三级验证回调
const handleVerifySuccess = () => uni.showToast({ title: '三级验证成功', icon: 'success' });
const handleVerifyFail = (error) => uni.showToast({ title: `验证失败: ${error.message}`, icon: 'none' });
const handleValidate = (data) => {
  const stepMap = { 1: '段长', 2: '跟班', 3: '车间' };
  uni.showToast({ title: `${stepMap[data.step]}${data.success ? '验证通过' : '验证失败'}`, icon: data.success ? 'success' : 'none' });
};
</script>

<style scoped>
/* 折叠面板样式 */
.collapse-panel {
  margin: 20rpx 0;
  border-radius: 12rpx;
  background-color: #ffffff;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.collapse-header {
  padding: 28rpx 30rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #f5f7fa;
  cursor: pointer;
  transition: background-color 0.3s;
}

.collapse-header:hover {
  background-color: #ecf5ff;
}

.collapse-title {
  font-size: 28rpx;
  font-weight: 500;
  color: #333;
}

.collapse-icon {
  font-size: 24rpx;
  color: #666;
  transition: transform 0.3s;
}

.collapse-content {
  padding: 20rpx;
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 样式保持不变 */
.container {
  padding: 20rpx;
  background-color: #f5f5f5;
  min-height: 100vh;
  overflow-x: hidden;
  box-sizing: border-box;
}

.header-card, .upload-section, .action-buttons-section {
  background-color: #fff;
  border-radius: 16rpx;
  padding: 20rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
}

.check-section {
  margin-bottom: 30rpx;
  padding-bottom: 20rpx;
  border-bottom: 1rpx dashed #e8e8e8;
}
.check-section:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }

.check-section-title {
  background-color: #f5f5f5;
  padding: 10rpx 15rpx;
  border-radius: 8rpx;
  margin-bottom: 15rpx;
}
.section-sub-title { font-size: 28rpx; font-weight: 500; color: #666; }

.upload-label { display: block; font-size: 26rpx; color: #666; margin: 15rpx 0; }
.upload-card-item { margin-bottom: 20rpx; }

.submit-btn { margin-bottom: 20rpx; }
.primary-btn { background-color: #007aff; border-radius: 8rpx; }
.primary-btn:disabled { background-color: #95a5a6; color: #fff; cursor: not-allowed; }

/* 烟沫统计表单样式 */
.form-item { margin-bottom: 25rpx; display: flex; flex-direction: column; }
.form-label { font-size: 26rpx; color: #333; margin-bottom: 10rpx; font-weight: 500; }
.form-label.required::before { content: '*'; color: #F53F3F; margin-right: 6rpx; }
.form-control, .form-control-picker { width: 100%; font-size: 28rpx; border-radius: 8rpx; }
.form-item-row { flex-direction: row; align-items: center; gap: 10rpx; }
.form-row { display: flex; width: 100%; gap: 16rpx; }
.form-col-50 { flex: 1; }
</style>
