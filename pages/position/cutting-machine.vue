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
      
      <UploadCard
        v-model="form.imagesBrand"
        label-text="批次号 牌号图"
        :max-count="1"
        upload-text="点击上传批次号 牌号图"
        name="brand-image"
        @after-read="(e) => onAfterRead(e, 'imagesBrand')"
        @delete="(e) => onDeleteImage(e, 'imagesBrand')"
        class="upload-card-item"
      />

      <UploadCard
        v-model="form.imagesWidth"
        label-text="切丝宽度"
        :max-count="1"
        upload-text="点击上传丝宽"
        name="width-image"
        @after-read="(e) => onAfterRead(e, 'imagesWidth')"
        @delete="(e) => onDeleteImage(e, 'imagesWidth')"
        class="upload-card-item"
      />

      <UploadCard
        v-model="form.imagesJunk"
        label-text="杂物"
        :max-count="1"
        upload-text="点击上传杂物"
        name="junk-image"
        @after-read="(e) => onAfterRead(e, 'imagesJunk')"
        @delete="(e) => onDeleteImage(e, 'imagesJunk')"
        class="upload-card-item"
      />
    </view>

    <!-- 操作按钮区域 -->
    <view class="action-buttons-section">
      <u-button 
        type="primary" 
        @click="publish"
        :loading="submitting"
        :disabled="submitting || !isAllImagesUploaded"
        class="submit-btn primary-btn"
      >
        {{ submitting ? '提交中...' : '提交图片信息' }}
      </u-button>
      
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

      <!-- 加载状态 -->
  <!-- 已移除u-loading组件，使用uni.showLoading替代 -->
  
  <!-- 错误提示和内容区域 -->
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
            <view class="tobacco-info">
              <!-- 修复：将包含u-tag的text组件改为view容器，避免text嵌套组件 -->
              <view class="info-row">
                <text class="label">牌号：</text>
                <view class="value-wrapper">  <!-- 用view替代text作为容器 -->
                  <text class="brand-text">{{ item.brand }}</text>  <!-- 纯文本保留在text中 -->
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
              <u-button 
                type="success" 
                size="mini" 
                text="加入本批料中"
                shape="circle"
                @click.stop="addToBatch(item, index)"
              ></u-button>
            </view>
          </view>
        </u-cell-group>
      </view>
      
      <!-- 空状态显示（仅在没有错误且列表为空时显示） -->
      <view v-else-if="!errorMsg && !loading" class="empty-state">
        <u-empty 
          text="暂无退出的烟叶" 
          mode="list"
        ></u-empty>
        <text class="empty-hint">请尝试搜索或添加新的退出烟叶</text>
      </view>
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
  

  
</template>

<script setup>
import { ref, computed, onMounted ,watch} from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import WorkOrderInfoCard from '@/components/orderInfo.vue';
//import UploadCard from '@/components/uploadImageCard.vue';
import { uploadFilesWithForm } from '@/utils/upload';

// 订单信息响应式对象
const myOrder = ref({
  id: '',
  batchNo: '',
  brand: ''
});

// 表单数据（图片上传相关）
const form = ref({
  imagesBrand: [],    // 批次号图
  imagesWidth: [],    // 切丝宽度图
  imagesJunk: []      // 杂物图
});

// 提交状态（防止重复提交）
const submitting = ref(false);

// 烟叶相关响应式数据
const addedTobaccoList = ref([]);         // 已加入的烟叶列表
const exitTobaccoList = ref([]);          // 退出的烟叶列表
const searchKeyword = ref('');            // 搜索关键词
const showTobaccoSections = ref(true);    // 是否显示烟叶区域
const currentOperation = ref(null);       // 当前操作信息

// 在现有响应式变量后添加
const loading = ref(false); // 接口加载状态
const errorMsg = ref(''); // 错误提示信息

// 引入统一的请求工具
import { request } from '../../utils/request.js';


// 新增：根据工单ID查询已加入的烟叶
const fetchAddedTobaccosByWorkOrderId = async (workOrderId) => {
  if (!workOrderId) {
    console.warn('工单ID为空，不发起请求');
    return;
  }
  loading.value = true;
  errorMsg.value = '';
  try {
    // 调用后端接口：GET /api/tobaccos/added/{workOrderId}
    const data = await request({
      url: `/api/tobaccos/added/${workOrderId}`, // 路径参数拼接工单ID
      method: 'GET'
    });
    // 更新已加入烟叶列表（接口返回的data直接是烟叶数组）
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
    // 调用接口：GET /api/tobaccos?status=exit
    console.log('开始获取退出烟叶列表，搜索关键词：', searchKeyword.value);
    
    // 使用统一的请求工具
    const data = await request({
      url: '/api/tobaccos',
      method: 'GET',
      data: {
        status: 'exit', // 固定传参：只查退出状态
        searchKeyword: searchKeyword.value // 支持带搜索关键字请求
      }
    });

    // 接口成功：更新退出烟叶列表
    exitTobaccoList.value = data || [];
    console.log('获取退出烟叶列表成功：', data);
    
  } catch (err) {
    // 错误处理（request工具已处理状态码和提示）
    console.error('获取退出烟叶列表异常：', err);
    errorMsg.value = err.message || '获取退出烟叶失败';
  } finally {
    loading.value = false;
    console.log('退出烟叶列表加载完成，当前列表长度：', exitTobaccoList.value.length);
  }
};

// 监听搜索关键词变化，触发接口请求
  watch(searchKeyword, (newVal) => {
    // 清除上一次的定时器（避免输入过快时多次请求）
    if (window.searchTimer) {
      clearTimeout(window.searchTimer);
    }
    // 延迟 300ms 执行，等待用户输入完成
    window.searchTimer = setTimeout(() => {
      // 搜索时清除错误信息，提供更好的用户体验
      errorMsg.value = '';
      // 调用接口，传入最新的搜索关键词
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

// 移除未使用的newTobaccoForm变量



// 格式化时间显示
const formatTime = (timeString) => {
  if (!timeString) return '';
  const date = new Date(timeString);
  return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
};

// 隐藏键盘
const hideKeyboard = () => {
  uni.hideKeyboard();
};

// 处理时间选择确认
const handleTimeConfirm = (e) => {
  try {
    let date;
    // 处理uView时间选择器返回的格式（可能是对象或字符串）
    if (typeof e === 'object') {
      // 从对象构造日期（年、月、日、时、分、秒）
      date = new Date(
        e.year, 
        e.month - 1, // 月份从0开始，需减1
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
    
    // 格式化为 "yyyy-MM-dd HH:mm:ss"（后端可直接解析）
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
  // 重置数据
  formData.value = {
    brand: '',
    batchNo: '',
    weight: '',
    joinTime: ''
  };
  
  // 使用uView的表单重置方法
  if (batchForm.value) {
    try {
      // uView的表单重置方法可能是$reset或其他名称
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

// 取消按钮事件（明确关闭弹窗）
const handleCancel = () => {
  showFormModal.value = false;
  console.log('取消按钮点击，关闭弹窗');
};

// 确认按钮事件（提交数据）
const handleConfirm = async () => {
  if (!batchForm.value) {
    uni.$u.toast('表单初始化失败');
    return;
  }
  
  // 1. 校验当前工单ID是否存在（必传参数）
  if (!myOrder.value.id) {
    uni.$u.toast('未获取到当前工单信息，无法提交');
    return;
  }
  
  try {
    // 2. 表单验证（使用uView表单验证）
    let valid = false;
    if (batchForm.value.validate) {
      valid = await batchForm.value.validate(); // 全表单验证
    } else {
      // 降级手动验证
      valid = formData.value.brand && formData.value.batchNo && formData.value.weight && formData.value.joinTime;
      if (!valid) {
        uni.$u.toast('请填写所有必填项');
        return;
      }
    }
    if (!valid) return;
    
    // 3. 构造提交数据（与后端字段对应）
    const submitData = {
      brand: formData.value.brand.trim(), // 牌号
      batchNumber: formData.value.batchNo.trim(), // 批次号（对应后端batch_number）
      weight: Number(formData.value.weight), // 重量（转为数字）
      operateTime: formData.value.joinTime, // 操作时间（对应后端operate_time）
      exitWorkOrderId: myOrder.value.id // 核心：当前工单ID（对应后端exit_work_order_id）
    };
    
    // 4. 调用后端添加退出烟叶接口
    const result = await request({
      url: '/api/tobaccos/addExit', // 与后端Controller接口路径一致
      method: 'POST',
      data: submitData
    });
    
    // 5. 接口成功：更新前端列表 + 关闭弹窗
    exitTobaccoList.value.unshift(result.data); // 后端返回的新增记录
    resetForm();
    showFormModal.value = false;
    uni.$u.toast('添加退出烟叶成功');
    setTimeout(() => {
  fetchAllExitTobaccos();
}, 500);
    
  } catch (error) {
    // 6. 错误处理（后端返回的业务异常或网络错误）
    uni.$u.toast('是否重复添加');
  }
};

// 打开表单弹窗（用于加入按钮）
const openFormModal = () => {
  resetForm();
  
  // 1. 填充当前工单的牌号和批次号（如果存在）
  if (myOrder.value.brand) {
    formData.value.brand = myOrder.value.brand;
  }
  if (myOrder.value.batchNo) {
    formData.value.batchNo = myOrder.value.batchNo;
  }
  
  // 2. 默认当前时间为操作时间（格式与后端匹配）
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

// 计算属性：判断是否所有图片都已上传
const isAllImagesUploaded = computed(() => {
  return form.value.imagesBrand.length >= 1 &&
         form.value.imagesWidth.length >= 1 &&
         form.value.imagesJunk.length >= 1;
});

// 注意：此计算属性在模板中用于控制提交按钮的禁用状态，请勿删除

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
    // 优先使用URL参数设置工单信息
    myOrder.value = {
      id: options.id ? decodeURIComponent(options.id) : '',
      batchNo: options.batchNo ? decodeURIComponent(options.batchNo) : '',
      brand: options.brand ? decodeURIComponent(options.brand) : ''
    };
    console.log('通过URL参数设置的工单信息:', myOrder.value);
    
    // 如果URL参数中没有完整信息，尝试从全局状态补充
    if (!myOrder.value.id || !myOrder.value.batchNo || !myOrder.value.brand) {
      const globalDataSuccess = getDataFromGlobal();
      console.log('从全局状态补充工单信息结果:', globalDataSuccess);
    }
  } else {
    // 如果没有URL参数，尝试从全局状态获取
    getDataFromGlobal();
  }
});

// 页面挂载后初始化数据
onMounted(async () => {
  if (!myOrder.value.batchNo && !myOrder.value.brand) {
    console.log('挂载后尝试获取全局数据...');
    getDataFromGlobal();
  }
  await initData(); // 异步初始化数据，从后端获取烟叶列表（已包含退出烟叶列表的获取）
});

// 图片上传处理
const onAfterRead = (e, imageType = 'images') => {
  const { file } = e
  const uploadFiles = Array.isArray(file) ? file : [file]
  
  if (!form.value[imageType]) {
    form.value[imageType] = []
  }
  
  uploadFiles.forEach(f => {
    const tempPath = f.path || f.url || f.tempFilePath

    if (!tempPath) {
      uni.$u.toast('获取图片失败')
      return
    }

    form.value[imageType].push({
      url: tempPath,
      name: f.name || 'image.jpg',
      status: 'ready'
    })
  })
};

// 删除图片
const onDeleteImage = (e, imageType = 'images') => {
  const { index } = e
  if (form.value[imageType] && form.value[imageType].length > index) {
    form.value[imageType].splice(index, 1);
  }
};

// 提交图片信息
const publish = async () => {
  if (!isAllImagesUploaded.value) {
    uni.$u.toast('请上传所有必要的图片');
    return;
  }

  if (submitting.value) return;
  submitting.value = true;

  try {
    const submitData = {
      ...form.value,
      orderId: myOrder.value.id,
      batchNo: myOrder.value.batchNo
    };

    const result = await uploadFilesWithForm('/api/cutting-machine/submit', submitData);
    
    if (result && result.code === 0) {
      uni.$u.toast('图片信息提交成功');
    } else {
      uni.$u.toast('提交失败：' + (result?.message || '未知错误'));
    }
  } catch (error) {
    console.error('提交失败:', error);
    uni.$u.toast('提交失败，请重试');
  } finally {
    submitting.value = false;
  }
};
// 显示移除确认对话框（保持原有触发逻辑，修改确认后的处理）
const showRemoveConfirm = (item, index) => {
  try {
    console.log('触发移除确认函数：', item, index);
    const brandName = item.brand || '未知品牌';
    
    uni.showModal({
      title: '确认操作',
      content: `确定要从本批料中移除烟叶「${brandName}」吗？`,
      success: (res) => {
        if (res.confirm) {
          // 用户确认后，直接调用移除接口（替换原confirmOperation）
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

// 新增：调用后端移除接口并更新列表
const removeTobacco = async (item, index) => {
  // 1. 校验必要参数
  if (!myOrder.value.id) {
    uni.$u.toast('未获取到当前工单信息，无法移除');
    return;
  }
  if (!item.brand || !item.batchNumber) {
    uni.$u.toast('烟叶信息不完整，无法移除');
    return;
  }

  // 2. 显示加载状态
  uni.showLoading({ title: '移除中...', mask: true });

  try {
    // 3. 调用后端移除接口
    const params = {
      brand: item.brand,
      batchNumber: item.batchNumber,
      addWorkOrderId: myOrder.value.id // 当前工单ID（关联的加入工单ID）
    };
    const result = await request({
      url: '/api/tobaccos/remove',
      method: 'PUT',
      data: params
    });

    // 4. 接口成功：刷新已加入列表（确保与后端同步）
    await fetchAddedTobaccosByWorkOrderId(myOrder.value.id);
    // 可选：如果需要将移除的烟叶加入"退出列表"，可调用fetchAllExitTobaccos刷新
    await fetchAllExitTobaccos();
    uni.$u.toast('移除成功');
  } catch (error) {
    // 5. 错误处理
    console.error('移除接口调用失败：', error);
    uni.$u.toast(error.message || '移除失败，请重试');
  } finally {
    // 6. 关闭加载状态
    uni.hideLoading();
  }
};
// 将烟叶加入批次（替换原逻辑，直接调用接口）
const addToBatch = (item, index) => {
  try {
    const brandName = item.brand || '未知品牌';
    
    uni.showModal({
      title: '确认操作',
      content: `确定要将烟叶「${brandName}」加入本批料吗？`,
      success: (res) => {
        if (res.confirm) {
          addTobaccoToBatch(item, index); // 调用新增的接口方法
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

// 调用后端“加入批次”接口并更新列表
const addTobaccoToBatch = async (item, index) => {
  // 1. 校验必要参数
  if (!myOrder.value.id) {
    uni.$u.toast('未获取到当前工单信息，无法加入');
    return;
  }
  if (!item.brand || !item.batchNumber) {
    uni.$u.toast('烟叶信息不完整，无法加入');
    return;
  }

  // 2. 显示加载状态
  uni.showLoading({ title: '加入中...', mask: true });

  try {
    // 3. 调用后端接口（传递牌号、批次号、当前工单ID）
    const params = {
      brand: item.brand,
      batchNumber: item.batchNumber,
      addWorkOrderId: myOrder.value.id // 当前工单ID（加入的目标工单）
    };
    const result = await request({
      url: '/api/tobaccos/add',
      method: 'PUT',
      data: params
    });

    // 4. 接口成功：刷新列表（确保与后端同步）
    await fetchAddedTobaccosByWorkOrderId(myOrder.value.id); // 刷新已加入列表
    await fetchAllExitTobaccos(); // 刷新退出列表
    uni.$u.toast('加入成功');
  } catch (error) {
    // 5. 错误处理
    console.error('加入接口调用失败：', error);
    uni.$u.toast(error.message || '加入失败，请重试');
  } finally {
    // 6. 关闭加载状态
    uni.hideLoading();
  }
};

// 初始化数据 - 从后端获取数据
const initData = async () => {
  // 设置加载状态并清除错误信息
  loading.value = true;
  errorMsg.value = '';
  
  try {
      const app = getApp();
    // 1. 先获取当前工单ID（从myOrder中取）
    console.log('myOrder.value:', myOrder.value);
    const currentWorkOrderId = myOrder.value.id || app.globalData.currentOrder?.id;
    if (currentWorkOrderId) {
      // 2. 调用新增的接口，根据工单ID查询已加入的烟叶
      await fetchAddedTobaccosByWorkOrderId(currentWorkOrderId);
    } else {
      console.warn('当前工单ID不存在，不查询已加入烟叶');
      addedTobaccoList.value = []; // 清空列表
    }
    
    
    // 同时获取退出烟叶列表
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
  align-items: center; /* 新增：确保标签和内容垂直居中 */
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

/* 新增：替换原.value的样式，用于包裹文本和标签的容器 */
/* 优化牌号和标签的容器样式 */
.value-wrapper {
  font-size: 26rpx;
  color: #333;
  flex: 1;
  overflow: hidden;
  display: flex;
  align-items: center;
  gap: 8rpx;
  min-width: 0; /* 允许容器在必要时收缩 */
}

/* 牌号文本样式 */
.brand-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex-shrink: 1; /* 文本可以被压缩 */
}

/* 超时标签样式优化 */
.timeout-tag {
  white-space: nowrap; /* 确保标签文本不换行 */
  flex-shrink: 0; /* 标签不被压缩 */
  padding: 2rpx 8rpx; /* 减小内边距，适应小空间 */
  line-height: 1.2; /* 调整行高，避免垂直溢出 */
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
    font-size: 20rpx; /* 小屏幕上进一步减小标签字体 */
    padding: 1rpx 6rpx;
  }
  
  .tobacco-card {
    padding: 16rpx;
  }
}

/* 表单弹窗按钮样式优化 */
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
  white-space: nowrap; /* 禁止文字换行 */
  overflow: visible; /* 允许文字完整显示 */
  z-index: 999; /* 确保按钮在最上层，不被遮挡 */
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

/* 弹窗底部容器样式 */
:deep(.up-modal__footer) {
  border-top: 1px solid #f5f5f5;
  padding: 15rpx 20rpx;
  display: flex;
  justify-content: center; /* 按钮居中分布 */
  align-items: center;
  box-sizing: border-box;
  width: 100%;
  overflow: visible; /* 避免容器遮挡按钮 */
}

/* 弹窗内容区域样式 */
:deep(.up-modal__body) {
  padding: 30rpx 20rpx;
  overflow: visible;
}

/* 修复表单验证提示位置 */
:deep(.u-form-item__error-message) {
  margin-left: 140rpx; /* 与标签对齐 */
  font-size: 24rpx;
  color: #ff4d4f;
}

/* 加载状态样式 */
.loading {
  padding: 60rpx 0;
  text-align: center;
}

/* 错误提示样式 */
.error-msg {
  padding: 60rpx 0;
  text-align: center;
  color: #ff4d4f;
  font-size: 28rpx;
}
</style>