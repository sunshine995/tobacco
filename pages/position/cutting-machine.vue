<template>
  <view class="container">
    <!-- 顶部卡片区域 -->
    <view class="header-card">
      <WorkOrderInfoCard :order-info="myOrder" />
    </view>

    <!-- 上传组件区域 -->
    <view class="upload-section">
      <view class="section-title-wrapper">
        <text class="section-main-title">图片上传</text>
      </view>
      <text class="upload-label">牌号 批次号图</text>
      <UploadImage
        ref="brandUploadRef"
        title="添加批次号图"
        :max-count="1"
        @success="(e) => handleImageUploadSuccess(e, 'imagesBrand')"
        @remove="(e) => handleImageRemove(e, 'imagesBrand')"
        class="upload-card-item"
      />
      <text class="upload-label">切丝宽度图</text>    
      <UploadImage
        ref="widthUploadRef"
        title="添加切丝宽度图"
        :max-count="1"
        @success="(e) => handleImageUploadSuccess(e, 'imagesWidth')"
        @remove="(e) => handleImageRemove(e, 'imagesWidth')"
        class="upload-card-item"
      />
      <text class="upload-label">杂物图</text> 
      <UploadImage
        ref="junkUploadRef"
        title="添加杂物图"
        :max-count="1"
        @success="(e) => handleImageUploadSuccess(e, 'imagesJunk')"
        @remove="(e) => handleImageRemove(e, 'imagesJunk')"
        class="upload-card-item"
      />
      <up-textarea v-model="form.junkRemark" placeholder="请输入杂物备注" style="width: 94%; margin-top: 20rpx;"></up-textarea>
    </view>

    <!-- 操作按钮区域 -->
    <view class="action-buttons-section">
      <up-button 
        type="primary" 
        @click="publish"
        :loading="submitting"
        class="submit-btn primary-btn"
        v-if="!hasSubmitted"
      >
        {{ submitting ? '提交中...' : '提交验证' }}
      </up-button>
      
      <!-- 三级验证按钮 -->
      <VerifyButton 
        buttonText="三级验证" 
        :batchId="myOrder.batchNo" 
        :brand="myOrder.brand" 
        segment="切丝机" 
        :dataCount="2" 
        @success="handleVerifySuccess" 
        @fail="handleVerifyFail" 
        @validate="handleValidate" 
      />
      
      <text 
        class="section-main-title" 
        style="display: block; text-align: center; font-size: 40rpx; font-weight: 600; color: #333; margin-bottom: 8rpx;"
      >
        烟叶信息
      </text>
    </view>

    <!-- 本批料已加入烟叶区域 -->
    <view class="tobacco-section" v-if="showTobaccoSections">
      <view class="section-title-wrap">
        <text class="section-title">本批料已加入烟叶</text>
      </view>
      
      <view class="tobacco-list">
        <u-cell-group :border="false">
          <view 
            v-for="(item, index) in addedTobaccoList" 
            :key="item.id || index"
            class="tobacco-card"
          >
            <view class="tobacco-info">
              <view class="info-row">
                <text class="label">牌号：</text>
                <text class="value">{{ item.brand }}</text>
              </view>
              <view class="info-row">
                <text class="label">批次号：</text>
                <text class="value">{{ item.batchNumber }}</text>
              </view>
              <view class="info-row">
                <text class="label">加入重量：</text>
                <text class="value">{{ item.weight }}kg</text>
              </view>
              <view class="info-row">
                <text class="label">加入时间：</text>
                <text class="value">{{ formatTime(item.addTime) }}</text>
              </view>
            </view>
            <view class="tobacco-action">
              <u-button 
                type="error" 
                size="mini" 
                text="移除"
                shape="circle"
                @click="showRemoveConfirm(item, index)"
              ></u-button>
            </view>
          </view>
        </u-cell-group>
        
        <u-empty 
          v-if="addedTobaccoList.length === 0" 
          text="暂无已加入的烟叶" 
          mode="list"
        ></u-empty>
      </view>
    </view>

    <!-- 退出烟叶区域 -->
    <view class="tobacco-section" v-if="showTobaccoSections">
      <view class="section-title-wrap">
        <text class="section-title">退出烟叶</text>
        <view class="section-actions">
          <u-button 
            type="primary" 
            size="mini" 
            @click="openFormModal"
            class="add-btn"
          >
            加入
          </u-button>
          <u-badge :count="exitTobaccoList.length" type="error" size="mini"></u-badge>
        </view>
      </view>
      
      <view class="search-box">
        <u-search 
          placeholder="搜索牌号/批次..." 
          v-model="searchKeyword"
        ></u-search>
      </view>

      <view v-if="errorMsg && !loading" class="error-msg-container">
        <view class="error-msg">{{ errorMsg }}</view>
        <u-button 
          type="primary" 
          size="mini" 
          @click="fetchAllExitTobaccos"
          class="retry-btn"
        >
          重试
        </u-button>
      </view>
      
      <view v-else-if="exitTobaccoList.length > 0" class="tobacco-list">
        <u-cell-group :border="false">
          <view 
            v-for="(item, index) in exitTobaccoList" 
            :key="item.id || index"
            class="tobacco-card"
          >
            <!-- 核心逻辑：按退出天数显示对应提示 -->
            <view v-if="getDaysSinceExit(item.exitTime) <= 5" class="prompt-tag same-brand">
              同牌号掺兑
            </view>
            <view v-else-if="getDaysSinceExit(item.exitTime) > 5 && getDaysSinceExit(item.exitTime) <= 10" class="prompt-tag downgrade">
              降级掺兑
            </view>
            
            <view class="tobacco-info">
              <view class="info-row">
                <text class="label">牌号：</text>
                <view class="value-wrapper">
                  <text class="brand-text">{{ item.brand }}</text>
                  <u-tag 
                    v-if="item.isTimeout" 
                    text="超时烟叶" 
                    type="warning" 
                    size="mini"
                    class="timeout-tag"
                  ></u-tag>
                </view>
              </view>
              <view class="info-row">
                <text class="label">批次号：</text>
                <text class="value">{{ item.batchNumber }}</text>
              </view>
              <view class="info-row">
                <text class="label">余料重量：</text>
                <text class="value">{{ item.weight }}kg</text>
              </view>
              <view class="info-row">
                <text class="label">退出时间：</text>
                <text class="value">{{ formatTime(item.exitTime) }}</text>
              </view>
            </view>
            <view class="tobacco-action">
              <up-button 
                type="success" 
                text="加入本批料中"
                shape="circle"
                @click.stop="addToBatch(item, index)"
              ></up-button>
            </view>
          </view>
        </u-cell-group>
      </view>
      
      <view v-else-if="!errorMsg && !loading" class="empty-state">
        <u-empty 
          text="暂无退出的烟叶" 
          mode="list"
        ></u-empty>
        <text class="empty-hint">请尝试搜索或添加新的退出烟叶</text>
      </view>
    </view>
    

    <!-- 弹窗包裹表单 -->
    <u-modal 
      title="添加退出烟叶信息" 
      :show="showFormModal" 
      :show-confirm-button="true" 
      :show-cancel-button="true"
      confirm-text="确定"
      cancel-text="取消"
      @confirm="handleConfirm"
      @cancel="handleCancel"
    > 
      <!-- 表单内容 --> 
      <u-form 
        label-position="left" 
        :model="formData" 
        :rules="formRules" 
        ref="batchForm" 
        class="form-content"
      > 
        <!-- 牌号 --> 
        <u-form-item 
          label="牌号" 
          prop="brand" 
          :border-bottom="true" 
          :required="true"
        > 
          <u-input 
            v-model="formData.brand" 
            border="none" 
            placeholder="请输入牌号" 
          ></u-input> 
        </u-form-item> 

        <!-- 批次号 --> 
        <u-form-item 
          label="批次号" 
          prop="batchNo" 
          :border-bottom="true" 
          :required="true"
        > 
          <u-input 
            v-model="formData.batchNo" 
            border="none" 
            placeholder="请输入批次号" 
          ></u-input> 
        </u-form-item> 

        <!-- 重量 --> 
        <u-form-item 
          label="重量" 
          prop="weight" 
          :border-bottom="true" 
          :required="true"
        > 
          <u-input 
            v-model="formData.weight" 
            border="none" 
            type="number" 
            placeholder="请输入重量（kg）" 
          ></u-input> 
          <template #right> 
            <text style="color: #999;">kg</text> 
          </template> 
        </u-form-item> 

        <!-- 加入时间 --> 
        <u-form-item 
          label="加入时间" 
          prop="joinTime" 
          :border-bottom="true" 
          @click="showTimePicker = true; hideKeyboard()" 
          :required="true"
        > 
          <u-input 
            v-model="formData.joinTime" 
            disabled 
            disabled-color="#ffffff" 
            placeholder="请选择加入时间" 
            border="none" 
          ></u-input> 
          <template #right> 
            <u-icon name="arrow-right"></u-icon> 
          </template> 
        </u-form-item> 
      </u-form> 
    </u-modal> 

    <!-- 时间选择器 --> 
    <u-datetime-picker 
      :show="showTimePicker" 
      mode="datetime" 
      title="选择加入时间" 
      @confirm="handleTimeConfirm" 
      @cancel="showTimePicker = false" 
    ></u-datetime-picker>
  </view>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import WorkOrderInfoCard from '@/components/orderInfo.vue';
import UploadImage from '@/components/UploadImage.vue';
import VerifyButton from '@/components/VerifyButton.vue';
import { byBatchIdAndSegment, submitMaterialCheck } from '@/api/production.js';

// 订单信息响应式对象
const myOrder = ref({
  id: '',
  batchNo: '',
  brand: ''
});

// 表单数据（图片上传相关）
const form = ref({
  imagesBrand: [],    // 批次号图（存储{url}格式）
  imagesWidth: [],    // 切丝宽度图
  imagesJunk: [],     // 杂物图
  junkRemark: '',     // 杂物备注
  externalImagesBrand: [],
  externalImagesWidth: [],
  externalImagesJunk: []
});

// 上传组件引用
const brandUploadRef = ref(null);
const widthUploadRef = ref(null);
const junkUploadRef = ref(null);

// 提交状态（防止重复提交）
const submitting = ref(false);
// 是否已提交状态（用于控制按钮显示）
const hasSubmitted = ref(false);

// 烟叶相关响应式数据
const addedTobaccoList = ref([]);         // 已加入的烟叶列表
const exitTobaccoList = ref([]);          // 退出的烟叶列表
const searchKeyword = ref('');            // 搜索关键词
const showTobaccoSections = ref(true);    // 是否显示烟叶区域
const currentOperation = ref(null);       // 当前操作信息

// 接口加载状态和错误提示
const loading = ref(false);
const errorMsg = ref('');

// 引入统一的请求工具
import { request } from '../../utils/request.js';

// 根据工单ID查询已加入的烟叶
const fetchAddedTobaccosByWorkOrderId = async (workOrderId) => {
  if (!workOrderId) {
    console.warn('工单ID为空，不发起请求');
    return;
  }
  loading.value = true;
  errorMsg.value = '';
  try {
    const data = await request({
      url: `/api/tobaccos/added/${workOrderId}`,
      method: 'GET'
    });
    addedTobaccoList.value = data || [];
    console.log('根据工单ID获取已加入烟叶成功：', data);
  } catch (err) {
    console.error('获取已加入烟叶失败：', err);
    errorMsg.value = err.message || '获取已加入的烟叶失败';
  } finally {
    loading.value = false;
  }
};

// 调用后端接口获取所有工单的退出烟叶
const fetchAllExitTobaccos = async () => {
  loading.value = true;
  errorMsg.value = '';
  try {
    console.log('开始获取退出烟叶列表，搜索关键词：', searchKeyword.value);
    const data = await request({
      url: '/api/tobaccos',
      method: 'GET',
      data: {
        status: 'exit',
        searchKeyword: searchKeyword.value
      }
    });
    exitTobaccoList.value = data || [];
    console.log('获取退出烟叶列表成功：', data);
  } catch (err) {
    console.error('获取退出烟叶列表异常：', err);
    errorMsg.value = err.message || '获取退出烟叶失败';
  } finally {
    loading.value = false;
    console.log('退出烟叶列表加载完成，当前列表长度：', exitTobaccoList.value.length);
  }
};

// 三级验证成功处理函数
const handleVerifySuccess = () => {
  uni.showToast({
    title: '三级验证成功',
    icon: 'success'
  });
};

// 三级验证失败处理函数
const handleVerifyFail = (error) => {
  uni.showToast({
    title: `验证失败: ${error.message || '未知错误'}`,
    icon: 'none'
  });
};

// 三级验证过程中的验证处理函数
const handleValidate = (data) => {
  console.log('验证过程数据:', data);
};

// 监听搜索关键词变化，触发接口请求
watch(searchKeyword, (newVal) => {
  if (window.searchTimer) {
    clearTimeout(window.searchTimer);
  }
  window.searchTimer = setTimeout(() => {
    errorMsg.value = '';
    fetchAllExitTobaccos();
  }, 300);
});

// 表单弹窗相关数据
const showFormModal = ref(false);         // 表单弹窗显示状态
const showTimePicker = ref(false);        // 时间选择器显示状态
const batchForm = ref(null);              // 表单引用
const formData = ref({
  brand: '',
  batchNo: '',
  weight: '',
  joinTime: ''
});
const formRules = ref({
  brand: [
    { required: true, message: '请输入牌号', trigger: ['blur', 'change'] }
  ],
  batchNo: [
    { required: true, message: '请输入批次号', trigger: ['blur', 'change'] }
  ],
  weight: [
    { required: true, message: '请输入重量', trigger: ['blur', 'change'] },
    { 
      pattern: /^\d+(\.\d{1,2})?$/, 
      message: '请输入有效的重量数值，最多两位小数', 
      trigger: ['blur', 'change'] 
    }
  ],
  joinTime: [
    { required: true, message: '请选择加入时间', trigger: ['change'] }
  ]
});

// 格式化时间显示
const formatTime = (timeString) => {
  if (!timeString) return '';
  const date = new Date(timeString);
  return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
};

// 计算退出烟叶的天数
const getDaysSinceExit = (exitTime) => {
  if (!exitTime) return 0;
  const exitDate = new Date(exitTime);
  const now = new Date();
  const diffTime = Math.abs(now - exitDate);
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
};

// 隐藏键盘
const hideKeyboard = () => {
  uni.hideKeyboard();
};

// 处理时间选择确认
const handleTimeConfirm = (e) => {
  try {
    let date;
    if (typeof e === 'object') {
      date = new Date(
        e.year, 
        e.month - 1,
        e.day, 
        e.hour, 
        e.minute, 
        e.second || 0
      );
    } else {
      date = new Date(e);
    }
    
    if (isNaN(date.getTime())) {
      throw new Error('无效的时间格式');
    }
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    const second = String(date.getSeconds()).padStart(2, '0');
    
    formData.value.joinTime = `${year}-${month}-${day} ${hour}:${minute}:${second}`;
    showTimePicker.value = false;
  } catch (error) {
    console.error('时间处理失败:', error);
    uni.$u.toast('请选择有效的时间');
    showTimePicker.value = false;
  }
};

// 重置表单
const resetForm = () => {
  formData.value = {
    brand: '',
    batchNo: '',
    weight: '',
    joinTime: ''
  };
  
  if (batchForm.value) {
    try {
      if (batchForm.value.$reset) {
        batchForm.value.$reset();
      } else if (batchForm.value.resetValidation) {
        batchForm.value.resetValidation();
      } else {
        console.log('表单重置方法不匹配，已重置数据');
      }
    } catch (error) {
      console.error('表单重置失败:', error);
    }
  }
};

// 取消按钮事件
const handleCancel = () => {
  showFormModal.value = false;
  console.log('取消按钮点击，关闭弹窗');
};

// 确认按钮事件
const handleConfirm = async () => {
  if (!batchForm.value) {
    uni.$u.toast('表单初始化失败');
    return;
  }
  
  if (!myOrder.value.id) {
    uni.$u.toast('未获取到当前工单信息，无法提交');
    return;
  }
  
  try {
    let valid = false;
    if (batchForm.value.validate) {
      valid = await batchForm.value.validate();
    } else {
      valid = formData.value.brand && formData.value.batchNo && formData.value.weight && formData.value.joinTime;
      if (!valid) {
        uni.$u.toast('请填写所有必填项');
        return;
      }
    }
    if (!valid) return;
    
    const submitData = {
      brand: formData.value.brand.trim(),
      batchNumber: formData.value.batchNo.trim(),
      weight: Number(formData.value.weight),
      operateTime: formData.value.joinTime,
      exitWorkOrderId: myOrder.value.id
    };
    
    const result = await request({
      url: '/api/tobaccos/addExit',
      method: 'POST',
      data: submitData
    });
    
    exitTobaccoList.value.unshift(result.data);
    resetForm();
    showFormModal.value = false;
    uni.$u.toast('添加退出烟叶成功');
    setTimeout(() => {
      fetchAllExitTobaccos();
    }, 500);
    
  } catch (error) {
    uni.$u.toast('是否重复添加');
  }
};

// 打开表单弹窗
const openFormModal = () => {
  resetForm();
  
  if (myOrder.value.brand) {
    formData.value.brand = myOrder.value.brand;
  }
  if (myOrder.value.batchNo) {
    formData.value.batchNo = myOrder.value.batchNo;
  }
  
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hour = String(now.getHours()).padStart(2, '0');
  const minute = String(now.getMinutes()).padStart(2, '0');
  const second = String(now.getSeconds()).padStart(2, '0');
  formData.value.joinTime = `${year}-${month}-${day} ${hour}:${minute}:${second}`;
  
  showFormModal.value = true;
};

// 计算属性：判断是否所有必要图片都已选择
const isAllImagesUploaded = computed(() => {
  return form.value.imagesBrand.length > 0 && form.value.imagesWidth.length > 0;
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
  
  loadExistingCheckRecord();
});

// 加载历史检查记录
const loadExistingCheckRecord = async () => {
  if (!myOrder.value || !myOrder.value.batchNo) return;
  
  try {
    console.log('加载历史检查记录，参数:', myOrder.value.batchNo, "切丝机");
    const res = await byBatchIdAndSegment(myOrder.value.batchNo, "切丝机");
    console.log('历史检查记录返回数据:', res);
    
    // 清空旧数据
    form.value.imagesBrand = [];
    form.value.imagesWidth = [];
    form.value.imagesJunk = [];
    form.value.junkRemark = '';

    if (res && res.verificationResult) {
        const verificationResult = typeof res.verificationResult === 'string'
          ? JSON.parse(res.verificationResult)
          : res.verificationResult;
        
        console.log('解析后的verificationResult:', verificationResult);
        
        const images = verificationResult.images || {};
        console.log('需要回显的图片数据:', images);

        const processImageUrls = (urls) => {
          if (!urls || !Array.isArray(urls)) return [];
          return urls.map(item => typeof item === 'string' ? item : (item.url || ''))
                    .filter(url => url);
        };
        
        if (brandUploadRef.value && brandUploadRef.value.setPreviewImages) {
          brandUploadRef.value.setPreviewImages(processImageUrls(images.imagesBrand));
        }
        if (widthUploadRef.value && widthUploadRef.value.setPreviewImages) {
          widthUploadRef.value.setPreviewImages(processImageUrls(images.imagesWidth));
        }
        if (junkUploadRef.value && junkUploadRef.value.setPreviewImages) {
          junkUploadRef.value.setPreviewImages(processImageUrls(images.imagesJunk));
        }
      
      if (verificationResult.junkRemark) {
        form.value.junkRemark = verificationResult.junkRemark;
      }
      
      hasSubmitted.value = true;
      console.log('历史记录加载成功，图片和备注已回显');
    } else {
      console.log('无历史检查记录或数据格式不正确');
      hasSubmitted.value = false;
    }
  } catch (error) {
    console.error('加载历史检查记录失败:', error);
    hasSubmitted.value = false;
  }
};

// 页面挂载后初始化数据
onMounted(async () => {
  if (!myOrder.value.batchNo && !myOrder.value.brand) {
    console.log('挂载后尝试获取全局数据...');
    getDataFromGlobal();
  }
  await initData();
});

// 图片上传成功处理
const handleImageUploadSuccess = (e, imageType = 'images') => {
  const { file } = e;
  form.value[imageType] = [{
    url: file.previewUrl || file.localPreviewUrl,
    name: file.fileName || file.selectedFileName || 'image.jpg'
  }];
};

// 图片移除处理
const handleImageRemove = (e, imageType = 'images') => {
  form.value[imageType] = [];
};

// 提交图片信息
const publish = async () => {
  if (submitting.value) return;
  submitting.value = true;

  try {
    const uploadPromises = [];
    if (brandUploadRef.value) uploadPromises.push(brandUploadRef.value.triggerUpload());
    if (widthUploadRef.value) uploadPromises.push(widthUploadRef.value.triggerUpload());
    if (junkUploadRef.value) uploadPromises.push(junkUploadRef.value.triggerUpload());

    const allResults = await Promise.all(uploadPromises);
    
    const failedUploads = allResults.flat().filter(r => !r.success);
    if (failedUploads.length > 0) {
      uni.showToast({
        title: `${failedUploads.length}张图片上传失败`,
        icon: 'none'
      });
      return;
    }

    const imagesBrand = brandUploadRef.value.getAllImageUrls();
    const imagesWidth = widthUploadRef.value.getAllImageUrls();
    const imagesJunk = junkUploadRef.value.getAllImageUrls();

    const verificationResult = {
      images: {
        imagesBrand,
        imagesWidth,
        imagesJunk
      },
      junkRemark: form.value.junkRemark,
      state: "normal"
    };
    
    const submitData = {
      batchId: myOrder.value.batchNo,
      brand: myOrder.value.brand,
      segment: "切丝机",
      verificationResult: verificationResult,
      dataCount: 2,
      operatorId: uni.getStorageSync('userId') || ''
    };
    
    console.log('准备提交的数据:', submitData);
    
    const res = await submitMaterialCheck(submitData);
    console.log('API调用成功，返回数据:', res);
    
    uni.showModal({
      title: '提交成功',
      content: '您的表单已成功提交！',
      showCancel: false,
      success: () => {
        hasSubmitted.value = true;
      }
    });
  } catch (error) {
    console.error('提交失败:', error);
    uni.showToast({
      title: error.message || '提交失败，请重试',
      icon: 'none'
    });
  } finally {
    submitting.value = false;
  }
};

// 显示移除确认对话框
const showRemoveConfirm = (item, index) => {
  try {
    console.log('触发移除确认函数：', item, index);
    const brandName = item.brand || '未知品牌';
    
    uni.showModal({
      title: '确认操作',
      content: `确定要从本批料中移除烟叶「${brandName}」吗？`,
      success: (res) => {
        if (res.confirm) {
          removeTobacco(item, index); 
        }
      },
      fail: (err) => {
        console.error('显示确认对话框失败：', err);
        uni.$u.toast('操作失败，请重试');
      }
    });
  } catch (error) {
    console.error('移除确认函数执行出错：', error);
    uni.$u.toast('操作失败，请重试');
  }
};

// 调用后端移除接口并更新列表
const removeTobacco = async (item, index) => {
  if (!myOrder.value.id) {
    uni.$u.toast('未获取到当前工单信息，无法移除');
    return;
  }
  if (!item.brand || !item.batchNumber) {
    uni.$u.toast('烟叶信息不完整，无法移除');
    return;
  }

  uni.showLoading({ title: '移除中...', mask: true });

  try {
    const params = {
      brand: item.brand,
      batchNumber: item.batchNumber,
      addWorkOrderId: myOrder.value.id
    };
    await request({
      url: '/api/tobaccos/remove',
      method: 'PUT',
      data: params
    });

    await fetchAddedTobaccosByWorkOrderId(myOrder.value.id);
    await fetchAllExitTobaccos();
    uni.$u.toast('移除成功');
  } catch (error) {
    console.error('移除接口调用失败：', error);
    uni.$u.toast(error.message || '移除失败，请重试');
  } finally {
    uni.hideLoading();
  }
};

// 将烟叶加入批次
const addToBatch = (item, index) => {
  try {
    const brandName = item.brand || '未知品牌';
    
    uni.showModal({
      title: '确认操作',
      content: `确定要将烟叶「${brandName}」加入本批料吗？`,
      success: (res) => {
        if (res.confirm) {
          addTobaccoToBatch(item, index);
        }
      },
      fail: (err) => {
        console.error('显示确认对话框失败：', err);
        uni.$u.toast('操作失败，请重试');
      }
    });
    
  } catch (error) {
    console.error('加入批次函数执行出错：', error);
    uni.$u.toast('操作失败，请重试');
  }
};

// 调用后端"加入批次"接口并更新列表
const addTobaccoToBatch = async (item, index) => {
  if (!myOrder.value.id) {
    uni.$u.toast('未获取到当前工单信息，无法加入');
    return;
  }
  if (!item.brand || !item.batchNumber) {
    uni.$u.toast('烟叶信息不完整，无法加入');
    return;
  }

  uni.showLoading({ title: '加入中...', mask: true });

  try {
    const params = {
      brand: item.brand,
      batchNumber: item.batchNumber,
      addWorkOrderId: myOrder.value.id
    };
    await request({
      url: '/api/tobaccos/add',
      method: 'PUT',
      data: params
    });

    await fetchAddedTobaccosByWorkOrderId(myOrder.value.id);
    await fetchAllExitTobaccos();
    uni.$u.toast('加入成功');
  } catch (error) {
    console.error('加入接口调用失败：', error);
    uni.$u.toast(error.message || '加入失败，请重试');
  } finally {
    uni.hideLoading();
  }
};

// 初始化数据
const initData = async () => {
  loading.value = true;
  errorMsg.value = '';
  
  try {
    const app = getApp();
    const currentWorkOrderId = myOrder.value.id || app.globalData.currentOrder?.id;
    if (currentWorkOrderId) {
      await fetchAddedTobaccosByWorkOrderId(currentWorkOrderId);
    } else {
      console.warn('当前工单ID不存在，不查询已加入烟叶');
      addedTobaccoList.value = [];
    }
    
    await fetchAllExitTobaccos();
    
  } catch (err) {
    console.error('初始化数据失败：', err);
    errorMsg.value = '数据加载失败，请刷新重试';
    uni.$u.toast(errorMsg.value);
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
/* 样式保持不变 + 新增提示标签样式 */
.container {
  padding: 20rpx;
  background-color: #f5f5f5;
  min-height: 100vh;
  overflow-x: hidden;
  box-sizing: border-box;
}

.header-card {
  background-color: #fff;
  border-radius: 16rpx;
  padding: 20rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
}

.upload-section {
  background-color: #fff;
  border-radius: 16rpx;
  padding: 30rpx 20rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
}

.section-title-wrapper {
  text-align: center;
  margin-bottom: 30rpx;
  padding-bottom: 20rpx;
  border-bottom: 2rpx solid #e8f4ff;
}

.section-main-title {
  font-size: 34rpx;
  font-weight: 600;
  color: #333;
  display: block;
  margin-bottom: 8rpx;
}

.section-subtitle {
  font-size: 26rpx;
  color: #666;
}

.upload-card-item {
  margin-bottom: 20rpx;
  transition: all 0.3s ease;
}

.action-buttons-section {
  padding: 20rpx;
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  margin-bottom: 30rpx;
}

.submit-btn {
  width: 100%;
  height: 90rpx;
  font-size: 32rpx;
  border-radius: 16rpx;
  font-weight: 500;
}

.primary-btn {
  background-color: #007aff;
}

.secondary-btn {
  background-color: #34c759;
}

.tobacco-section {
  background-color: #fff;
  border-radius: 16rpx;
  padding: 30rpx 20rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
}

.section-title-wrap {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20rpx;
      padding-bottom: 20rpx;
      border-bottom: 2rpx solid #f0f0f0;
    }

    .section-title {
      font-size: 32rpx;
      font-weight: 600;
      color: #333;
    }

    .section-actions {
      display: flex;
      align-items: center;
      gap: 10rpx;
    }

    .add-btn {
      background-color: #007aff;
      color: white;
      border-radius: 20rpx;
    }

    .search-box {
      margin-bottom: 20rpx;
      padding: 0 10rpx;
    }

    .error-msg-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40rpx 0;
      gap: 20rpx;
    }

    .error-msg {
      color: #ff4d4f;
      text-align: center;
      font-size: 28rpx;
      padding: 10rpx 20rpx;
      background-color: #fff1f0;
      border-radius: 8rpx;
      border: 1rpx solid #ffccc7;
    }

    .retry-btn {
      margin-top: 10rpx;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40rpx 0;
      gap: 20rpx;
    }

    .empty-hint {
      font-size: 26rpx;
      color: #999;
      margin-top: 10rpx;
      text-align: center;
    }

.tobacco-list {
  margin-top: 20rpx;
}

.tobacco-card {
  display: flex;
  align-items: center;
  padding: 20rpx;
  background-color: #f8f8f8;
  border-radius: 12rpx;
  margin-bottom: 16rpx;
  width: 100%;
  box-sizing: border-box;
  position: relative; /* 为提示标签添加定位 */
}

/* 新增：提示标签样式 */
.prompt-tag {
  position: absolute;
  top: 10rpx;
  right: 10rpx;
  padding: 4rpx 12rpx;
  border-radius: 16rpx;
  font-size: 22rpx;
  font-weight: 500;
  color: #fff;
}
.same-brand {
  background-color: #4096ff; /* 蓝色 - 同牌号掺兑 */
}
.downgrade {
  background-color: #fa8c16; /* 橙色 - 降级掺兑 */
}

.tobacco-info {
  flex: 1;
  min-width: 0;
}

.info-row {
  display: flex;
  margin-bottom: 10rpx;
  line-height: 1.5;
  white-space: nowrap;
  align-items: center;
}

.info-row:last-child {
  margin-bottom: 0;
}

.label {
  font-size: 26rpx;
  color: #666;
  width: 140rpx;
  flex-shrink: 0;
}

.value-wrapper {
  font-size: 26rpx;
  color: #333;
  flex: 1;
  overflow: hidden;
  display: flex;
  align-items: center;
  gap: 8rpx;
  min-width: 0;
}

.brand-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex-shrink: 1;
}

.timeout-tag {
  white-space: nowrap;
  flex-shrink: 0;
  padding: 2rpx 8rpx;
  line-height: 1.2;
  margin-left: 8rpx;
  vertical-align: middle;
}

.value {
  font-size: 26rpx;
  color: #333;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tobacco-action {
  margin-left: 16rpx;
  flex-shrink: 0;
}

.timeout-tag {
  margin-left: 8rpx;
  vertical-align: middle;
}

:deep(.u-search) {
  background-color: white;
  border-radius: 10rpx;
}

:deep(.u-button--mini) {
  border-radius: 20rpx;
  padding: 0 20rpx;
  height: 50rpx;
  font-size: 24rpx;
}

:deep(.u-empty) {
  padding: 60rpx 0;
}

:deep(.u-form-item) {
  margin-bottom: 30rpx;
}

:deep(.u-form-item__label) {
  width: 140rpx;
}

@media screen and (max-width: 375px) {
  .label {
    width: 120rpx;
    font-size: 24rpx;
  }
  
  .value, .value-wrapper {
    font-size: 24rpx;
  }
  
  .timeout-tag {
    font-size: 20rpx;
    padding: 1rpx 6rpx;
  }
  
  .tobacco-card {
    padding: 16rpx;
  }
}

.modal-btn {
  min-width: 140rpx;
  padding: 0 25rpx;
  height: 80rpx;
  line-height: 80rpx;
  border-radius: 40rpx;
  font-size: 28rpx;
  margin: 0 10rpx;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  white-space: nowrap;
  overflow: visible;
  z-index: 999;
}

.cancel {
  background-color: #f5f5f5;
  color: #666;
  border: none;
}

.confirm {
  background-color: #1989fa;
  color: #fff;
  border: none;
}

:deep(.up-modal__footer) {
  border-top: 1px solid #f5f5f5;
  padding: 15rpx 20rpx;
  display: flex;
  justify-content: center;
  align-items: center;
  box-sizing: border-box;
  width: 100%;
  overflow: visible;
}

:deep(.up-modal__body) {
  padding: 30rpx 20rpx;
  overflow: visible;
}

:deep(.u-form-item__error-message) {
  margin-left: 140rpx;
  font-size: 24rpx;
  color: #ff4d4f;
}

.loading {
  padding: 60rpx 0;
  text-align: center;
}

.error-msg {
  padding: 60rpx 0;
  text-align: center;
  color: #ff4d4f;
  font-size: 28rpx;
}
</style>