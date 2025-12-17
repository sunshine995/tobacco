<template>
  <el-dialog
    v-model="dialogVisible"
    :title="`抽检任务 - ${task?.template_name}`"
    width="600px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div v-if="task" class="spot-check-dialog">
      <!-- 任务基本信息 -->
      <div class="task-info-summary">
        <div class="info-item">
          <span class="label">执行人员：</span>
          <span class="value">{{ task.employee_name }}</span>
        </div>
        <div class="info-item">
          <span class="label">计划时间：</span>
          <span class="value">{{ formatDateTime(task.planned_completion_time) }}</span>
        </div>
        <div class="info-item">
          <span class="label">完成时间：</span>
          <span class="value">{{ formatDateTime(task.submitted_at) }}</span>
        </div>
      </div>
      
      <!-- 原提交图片预览 -->
      <div v-if="task.submitted_images && task.submitted_images.length > 0" class="original-images">
        <h4>提交的图片</h4>
        <div class="images-preview">
          <div
            v-for="(img, index) in task.submitted_images"
            :key="index"
            class="preview-item"
            @click="previewImage(img)"
          >
            <el-image
              :src="img"
              :preview-src-list="[img]"
              fit="cover"
            />
            <div class="image-number">{{ index + 1 }}</div>
          </div>
        </div>
      </div>
      
      <!-- 抽检结果 -->
      <div class="check-result">
        <h4>抽检结果</h4>
        <el-radio-group v-model="formData.spot_check_result" class="result-options">
          <el-radio label="pass" border size="large">
            <el-icon><Check /></el-icon>
            <span>合格</span>
          </el-radio>
          <el-radio label="fail" border size="large">
            <el-icon><Close /></el-icon>
            <span>不合格</span>
          </el-radio>
        </el-radio-group>
      </div>
      
      <!-- 抽检备注 -->
      <div class="check-notes">
        <h4>抽检备注</h4>
        <el-input
          v-model="formData.spot_check_notes"
          type="textarea"
          :rows="3"
          placeholder="请输入抽检备注..."
          :maxlength="500"
          show-word-limit
        />
      </div>
      
      <!-- 抽检图片上传 -->
      <div class="image-upload">
        <h4>抽检图片 (可选)</h4>
        <p class="upload-tips">可上传抽检现场拍摄的图片，最多5张</p>
        <el-upload
          v-model:file-list="imageFiles"
          action="#"
          list-type="picture-card"
          :auto-upload="false"
          :multiple="true"
          :limit="5"
          :on-exceed="handleExceed"
          :on-change="handleImageChange"
          :on-remove="handleImageRemove"
          accept="image/*"
        >
          <el-icon><Plus /></el-icon>
        </el-upload>
      </div>
    </div>
    
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button 
          type="primary" 
          @click="handleSubmit"
          :loading="submitting"
          :disabled="!formData.spot_check_result"
        >
          提交抽检结果
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { ElDialog, ElRadioGroup, ElRadio, ElInput, ElUpload, ElButton, ElIcon, ElMessage } from 'element-plus'
import { Check, Close, Plus } from '@element-plus/icons-vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  task: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:visible', 'submit'])

// 对话框显示状态
const dialogVisible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val)
})

// 表单数据
const formData = ref({
  instance_id: null,
  spot_check_result: '',
  spot_check_notes: '',
  spot_check_images: []
})

// 上传的文件列表
const imageFiles = ref([])

// 提交状态
const submitting = ref(false)

// 格式化日期时间
const formatDateTime = (datetime) => {
  if (!datetime) return ''
  const date = new Date(datetime)
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 预览图片
const previewImage = (url) => {
  // 实际项目中可能需要使用图片预览组件
  console.log('预览图片:', url)
}

// 处理文件超出限制
const handleExceed = () => {
  ElMessage.warning('最多只能上传5张图片')
}

// 处理文件变化
const handleImageChange = (file, fileList) => {
  imageFiles.value = fileList
}

// 处理文件移除
const handleImageRemove = (file, fileList) => {
  imageFiles.value = fileList
}

// 初始化表单数据
const initFormData = () => {
  if (props.task) {
    formData.value = {
      instance_id: props.task.instance_id,
      spot_check_result: '',
      spot_check_notes: '',
      spot_check_images: []
    }
    imageFiles.value = []
  }
}

// 处理关闭
const handleClose = () => {
  initFormData()
}

// 处理提交
const handleSubmit = async () => {
  if (!formData.value.spot_check_result) {
    ElMessage.warning('请选择抽检结果')
    return
  }

  submitting.value = true
  
  try {
    // 这里可以处理图片上传逻辑
    // 实际项目中需要将图片上传到服务器，获取URL
    const uploadedImages = imageFiles.value.map(file => {
      // 模拟上传后的URL
      return `https://example.com/upload/${file.name}`
    })
    
    const submitData = {
      ...formData.value,
      spot_check_images: uploadedImages
    }
    
    emit('submit', submitData)
    dialogVisible.value = false
  } catch (error) {
    ElMessage.error('提交失败: ' + error.message)
  } finally {
    submitting.value = false
  }
}

// 监听任务变化，重置表单
watch(() => props.task, () => {
  initFormData()
})
</script>

<style scoped>
.spot-check-dialog {
  max-height: 70vh;
  overflow-y: auto;
}

.task-info-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
  margin-bottom: 20px;
  padding: 16px;
  background: #fafafa;
  border-radius: 6px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.info-item .label {
  color: #666;
  font-size: 14px;
}

.info-item .value {
  color: #333;
  font-weight: 500;
}

.original-images,
.check-result,
.check-notes,
.image-upload {
  margin-bottom: 24px;
}

.original-images h4,
.check-result h4,
.check-notes h4,
.image-upload h4 {
  margin: 0 0 12px 0;
  color: #333;
  font-size: 14px;
  font-weight: 500;
}

.images-preview {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 12px;
}

.preview-item {
  position: relative;
  height: 100px;
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.3s;
}

.preview-item:hover {
  transform: scale(1.03);
}

.preview-item :deep(.el-image) {
  width: 100%;
  height: 100%;
}

.image-number {
  position: absolute;
  top: 4px;
  left: 4px;
  width: 20px;
  height: 20px;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
}

.result-options {
  display: flex;
  gap: 16px;
}

.result-options :deep(.el-radio) {
  flex: 1;
  margin: 0;
}

.result-options :deep(.el-radio__inner) {
  display: none;
}

.result-options :deep(.el-radio__label) {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
}

.result-options :deep(.el-radio.is-checked) {
  border-color: var(--el-color-primary);
}

.result-options :deep(.el-radio.is-checked[data-variant="border"]) {
  background-color: var(--el-color-primary-light-9);
}

.upload-tips {
  margin: 0 0 12px 0;
  color: #666;
  font-size: 13px;
}

.image-upload :deep(.el-upload--picture-card) {
  width: 100px;
  height: 100px;
  line-height: 100px;
}

.image-upload :deep(.el-upload-list--picture-card) .el-upload-list__item {
  width: 100px;
  height: 100px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>