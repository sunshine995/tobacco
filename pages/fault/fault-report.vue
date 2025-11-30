<template>
  <view class="container">
    <scroll-view>
      <!-- 替换原来的线路和故障段选择 -->
      <u-cell-group title="报警位置" title-style="font-size: 16px; font-weight: 500;">
        <u-cell
          title="位置信息"
          :value="locationDesc"
          :border="false"
        />
      </u-cell-group>
      
      <!-- 报警类型选择（仅在故障报警模式下显示） -->
      <u-cell-group v-if="isFaultMode" title="维修类型" title-style="font-size: 16px; font-weight: 500;">
        <u-checkbox-group v-model="form.type" @change="onTypeChange">
          <u-checkbox
            v-for="item in typeOptions"
            :key="item.value"
            :name="item.value"
            :label="item.label"
            :icon-size="16"
            shape="circle"
          />
        </u-checkbox-group>
      </u-cell-group>

      <!-- 质量报警模式下固定为班长 -->
      <u-cell-group v-else title="异常类型" title-style="font-size: 16px; font-weight: 500;">
        <u-cell
          title="异常类型"
          value="质量异常"
          :border="false"
        />
      </u-cell-group>

      <!-- 故障/质量描述 -->
      <u-cell-group :title="isFaultMode ? '故障描述' : '质量问题描述'" title-style="font-size: 16px; font-weight: 500;">
        <u--textarea
          v-model="form.description"
          :placeholder="isFaultMode ? '请详细描述故障现象，如异响、冒烟、无法启动等' : '请简要描述批次质量问题'"
          count
          maxlength="500"
          border="none"
          style="margin: 12px;"
        />
      </u-cell-group>
      
      <u-cell-group :title="isFaultMode ? '故障照片' : '质量问题照片'" title-style="font-size: 16px; font-weight: 500;">
        <u-form-item label="" prop="form.images">
          <!-- 替换为自定义上传组件 -->
          <upload-image
            ref="uploadRef"
            :max-count="3"
            :title="isFaultMode ? '故障图片' : '质量问题图片'"
          />
        </u-form-item>
      </u-cell-group>
      
      <!-- 提交按钮 -->
      <view class="submit-box">
        <u-button
          type="primary"
          :text="isFaultMode ? '提交故障报警' : '提交质量报警'"
          :loading="submitting"
          @click="handleSubmit"
          shape="circle"
        />
      </view>

      <!-- 空白占位 -->
      <view style="height: 30px;"></view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { reportFault } from '@/api/fault';
import UploadImage from '@/components/UploadImage.vue';

const uploadRef = ref(null); // 上传组件的ref
const imageFiles = ref([]); // 存原始 file 对象 { url: '临时路径' }

// 页面模式：true为故障报警，false为质量报警
const isFaultMode = ref(true);

// 自动填充的位置信息（用于显示）
const locationDesc = ref('')

const userInfo = ref({
  line: '',
  section: '',
  position: ''
})

// 表单数据
const form = reactive({
  type: [],        // electrical / mechanical / admin (数组形式支持多选)
  description: '',
  images: []       // 上传的图片列表（对象数组）
})

// 提交状态
const submitting = ref(false)

// 维修类型选项
const typeOptions = [	
  { label: '电气维修', value: 'electrical' },
  { label: '机械维修', value: 'mechanical' }
]

// 页面加载时接收参数并确定模式
onLoad((options) => {
  // quality=true 表示质量报警，其他情况默认为故障报警
  isFaultMode.value = !(options.quality === 'true' || options.quality === true);
  
  console.log('页面模式:', isFaultMode.value ? '故障报警' : '质量报警');
})

// 页面加载时自动设置位置描述
onMounted(() => {
  const user = uni.getStorageSync('userInfo')
  userInfo.value = {
    line: user.line || '',
    section: user.section || '',
    position: user.position || ''
  }
  if (userInfo.value.line || userInfo.value.section || userInfo.value.position) {
    locationDesc.value = `${userInfo.value.line}线 - ${userInfo.value.position}岗位 发生问题`
  } else {
    // 可选：处理缺失信息的情况
    locationDesc.value = '未知位置 发生问题'
    console.warn('用户信息缺失: line, section 或 position')
  }
})

// 类型选择变化处理
function onTypeChange(selectedTypes) {
  form.type = selectedTypes;
  console.log('选择的类型:', form.type);
}

// 表单验证
function validateForm() {
  // 质量报警模式下不需要选择类型，因为固定发送给班长
  if (isFaultMode.value && (!form.type || form.type.length === 0)) {
    uni.$u.toast('请选择维修类型')
    return false
  }
  if (!form.description.trim()) {
    uni.$u.toast(isFaultMode.value ? '请填写故障描述' : '请填写质量问题描述')
    return false
  }
  return true
}

// 提交表单
async function handleSubmit() {
  if (!validateForm()) return;
  if (submitting.value) return;

  submitting.value = true;
  
  try {
    // 触发图片上传
    const uploadResults = await uploadRef.value.triggerUpload();
    console.log('上传结果:', uploadResults);
    
    // 获取所有上传成功的图片URL
    const imageUrls = uploadRef.value.getUploadedUrls();
    console.log('上传的图片URL:', imageUrls);
    
    // 构建报警数据
    let reportData = {
      line: userInfo.value.line,
      section: userInfo.value.position,
      description: form.description,
      reporterId: uni.getStorageSync('userId'),
      imageUrls: imageUrls
    };
    
    // 根据模式设置类型
    if (isFaultMode.value) {
      // 故障报警模式：使用用户选择的类型
      reportData.type = form.type.join(','); // 多选类型用逗号分隔
    } else {
      // 质量报警模式：固定为班长类型
      reportData.type = 'produce';
    }
    
    console.log('提交的报警数据:', reportData);
    
    const reportId = await reportFault(reportData);

    uni.$u.toast(isFaultMode.value ? '故障报警提交成功！' : '质量报警提交成功！');
    
    //跳转回上一页
    setTimeout(() => {
      uni.navigateBack();
    }, 800);

  } catch (err) {
    console.error('提交失败:', err);
    uni.$u.toast(err.message || (isFaultMode.value ? '故障报警提交失败，请重试' : '质量报警提交失败，请重试'));
  } finally {
    submitting.value = false;
  }
}
</script>

<style lang="scss" scoped>
.container {
  min-height: 100vh;
  background-color: #f8f8f8;
  //padding-top: calc(env(safe-area-inset-top) + 47px);
}

.scroll-view {
  height: calc(100vh - 44px);
}

.submit-box {
  padding: 20px 16px;
  background-color: #fff;
  margin-top: 10px;
}
</style>



