<template>
  <view v-if="hasPermission" class="verify-button-container">
    <!-- 已验证状态显示 -->
    <view v-if="isVerified" class="verified-status-container">
      <view class="verified-icon">✓</view>
      <view class="verified-content">
        <view class="verified-title">验证通过</view>
        <view class="verified-details">
          <view v-if="foremanName" class="verified-item">段长: {{ foremanName }}</view>
          <view v-if="followerName" class="verified-item">跟班: {{ followerName }}</view>
          <view v-if="workshopName" class="verified-item">车间: {{ workshopName }}</view>
          <view v-if="verificationStatus?.verificationResult?.verified_time" class="verified-item">
            验证时间: {{ verificationStatus.verificationResult.verified_time }}
          </view>
        </view>
      </view>
    </view>
    
    <!-- 未验证状态显示 -->
    <view v-else>
      <!-- 主按钮：点击时切换 isContentVisible -->
      <view class="text-display" :style="buttonStyle" @click="toggleContentVisible">
        {{ buttonText }}
        <u-icon
          name="arrow-down"
          class="arrow-icon"
          :class="{ 'rotate-180': isContentVisible }"
          size="16"
        ></u-icon>
      </view>

      <!-- 折叠内容：调整显示条件，确保点击后必显示 -->
      <view v-if="isContentVisible" class="collapsible-content">
        <view class="validation-content">
          <!-- 段长验证 -->
          <view class="validation-step" :class="{ active: currentStep === 1, completed: currentStep > 1 }">
            <view class="step-indicator">
              <view class="step-number">{{ currentStep > 1 ? '✓' : '1' }}</view>
              <view class="step-line" v-if="currentStep > 1"></view>
            </view>
            <view class="step-content">
              <view class="step-title">段长验证</view>
              <view class="step-actions" v-if="currentStep === 1">
                <u-input
                  v-model="foremanPassword"
                  type="password"
                  placeholder="请输入段长密码"
                  @confirm="handleForemanValidate"
                ></u-input>
                <view class="action-buttons">
                  <u-button
                    type="primary"
                    :loading="isProcessing"
                    @click="handleForemanValidate"
                    class="step-button"
                  >
                    正常
                  </u-button>
                  <u-button
                    type="error"
                    @click="handleException(1)"
                    class="exception-button"
                  >
                    异常
                  </u-button>
                </view>
              </view>
              <view class="step-result" v-if="currentStep > 1">
                验证通过 ({{ foremanName }})
              </view>
            </view>
          </view>

          <!-- 跟班验证 -->
          <view class="validation-step" :class="{ active: currentStep === 2, completed: currentStep > 2 }">
            <view class="step-indicator">
              <view class="step-number">{{ currentStep > 2 ? '✓' : '2' }}</view>
              <view class="step-line" v-if="currentStep > 2"></view>
            </view>
            <view class="step-content">
              <view class="step-title">跟班验证</view>
              <view class="step-actions" v-if="currentStep === 2">
                <u-input
                  v-model="followerPassword"
                  type="password"
                  placeholder="请输入跟班密码"
                  @confirm="handleFollowerValidate"
                ></u-input>
                <view class="action-buttons">
                  <u-button
                    type="primary"
                    :loading="isProcessing"
                    @click="handleFollowerValidate"
                    class="step-button"
                  >
                    验证
                  </u-button>
                  <u-button
                    type="error"
                    @click="handleException(2)"
                    class="exception-button"
                  >
                    异常
                  </u-button>
                </view>
              </view>
              <view class="step-result" v-if="currentStep > 2">
                验证通过 ({{ followerName }})
              </view>
            </view>
          </view>

          <!-- 车间验证 -->
          <view class="validation-step" :class="{ active: currentStep === 3, completed: currentStep > 3 }">
            <view class="step-indicator">
              <view class="step-number">{{ currentStep > 3 ? '✓' : '3' }}</view>
            </view>
            <view class="step-content">
              <view class="step-title">车间验证</view>
              <view class="step-actions" v-if="currentStep === 3">
                <u-input
                  v-model="workshopPassword"
                  type="password"
                  placeholder="请输入车间密码"
                  @confirm="handleWorkshopValidate"
                ></u-input>
                <view class="action-buttons">
                  <u-button
                    type="primary"
                    :loading="isProcessing"
                    @click="handleWorkshopValidate"
                    class="step-button"
                  >
                    验证
                  </u-button>
                  <u-button
                    type="error"
                    @click="handleException(3)"
                    class="exception-button"
                  >
                    异常
                  </u-button>
                </view>
              </view>
              <view class="step-result" v-if="currentStep > 3">
                验证通过 ({{ workshopName }})
              </view>
            </view>
          </view>
        </view>

        <!-- 弹窗底部按钮 -->
        <view class="modal-footer">
          <u-button type="default" @click="toggleContentVisible">取消</u-button>
          <u-button
            type="primary"
            :loading="isProcessing"
            @click="submitFinalAction"
            v-if="currentStep > 3"
          >
            确认执行
          </u-button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { submitMaterialCheck, byBatchIdAndSegment } from '@/api/production';
import { formatDate } from '@/utils/date.js';

// 响应式状态
const isContentVisible = ref(false); // 控制折叠内容显示/隐藏
const isProcessing = ref(false);
const currentStep = ref(1); // 初始为1（未验证）
const foremanPassword = ref('');
const followerPassword = ref('');
const workshopPassword = ref('');
const foremanName = ref('');
const followerName = ref('');
const workshopName = ref('');
const isVerified = ref(false);
const verificationStatus = ref(null);
const hasPermission = ref(false);

// Props
const props = defineProps({
  buttonText: { type: String, default: "三级验证" },
  buttonStyle: { type: Object, default: () => ({}) },
  batchId: { type: String, required: true },
  brand: { type: String, required: true },
  segment: { type: String, required: true },
  dataCount: { type: Number, required: true },
});

const emit = defineEmits(["success", "fail", "validate"]);

// 提示框
const showToast = (title) => {
  uni.showToast({ title, icon: 'none', duration: 2000 });
};

// 切换折叠内容显示状态
const toggleContentVisible = () => {
  isContentVisible.value = !isContentVisible.value;
};

// 合并验证数据（新增：检查并转换 images 数组为对象）
const getMergedVerificationResult = async (newData) => {
  try {
    const latestRecord = await byBatchIdAndSegment(props.batchId, props.segment);
    let existingVR = latestRecord?.verificationResult || {};

    
    // 合并新数据到现有数据中
    return { ...existingVR, ...newData };
  } catch (error) {
    console.error('合并验证数据失败:', error);
    showToast("获取历史数据失败，请重试");
    throw error;
  }
};

// 段长验证
const handleForemanValidate = async () => {
  if (!foremanPassword.value) return showToast("请输入段长密码");
  isProcessing.value = true;
  try {
    const mockUsers = { foreman: { password: "123", userName: "段长" } };
    if (mockUsers.foreman.password !== foremanPassword.value) {
      showToast("段长密码错误");
      emit("validate", { step: 1, success: false });
      return;
    }
    foremanName.value = mockUsers.foreman.userName;
    const newData = {
      status: 'foreman_validated',
      foreman: foremanName.value,
      current_step: 2,
      verified_time: formatDate(new Date(), 'yyyy-MM-dd HH:mm:ss')
    };
    const mergedVR = await getMergedVerificationResult(newData);
    await submitMaterialCheck({
      batchId: props.batchId,
      brand: props.brand,
      segment: props.segment,
      verificationResult: mergedVR,
      dataCount: props.dataCount,
      operatorId: uni.getStorageSync('userId') || 1
    });
    currentStep.value = 2;
    foremanPassword.value = "";
    showToast("段长验证成功");
    emit("validate", { step: 1, success: true, user: foremanName.value });
  } catch (error) {
    console.error('段长验证失败:', error);
    showToast("段长验证失败，请重试");
  } finally {
    isProcessing.value = false;
  }
};

// 跟班验证
const handleFollowerValidate = async () => {
  if (!followerPassword.value) return showToast("请输入跟班密码");
  isProcessing.value = true;
  try {
    const mockUsers = { follower: { password: "123", userName: "跟班" } };
    if (mockUsers.follower.password !== followerPassword.value) {
      showToast("跟班密码错误");
      emit("validate", { step: 2, success: false });
      return;
    }
    followerName.value = mockUsers.follower.userName;
    const newData = {
      status: 'follower_validated',
      follower: followerName.value,
      current_step: 3,
      verified_time: formatDate(new Date(), 'yyyy-MM-dd HH:mm:ss')
    };
    const mergedVR = await getMergedVerificationResult(newData);
    await submitMaterialCheck({
      batchId: props.batchId,
      brand: props.brand,
      segment: props.segment,
      verificationResult: mergedVR,
      dataCount: props.dataCount,
      operatorId: uni.getStorageSync('userId') || 1
    });
    currentStep.value = 3;
    followerPassword.value = "";
    showToast("跟班验证成功");
    emit("validate", { step: 2, success: true, user: followerName.value });
  } catch (error) {
    console.error('跟班验证失败:', error);
    showToast("跟班验证失败，请重试");
  } finally {
    isProcessing.value = false;
  }
};

// 车间验证
const handleWorkshopValidate = async () => {
  if (!workshopPassword.value) return showToast("请输入车间密码");
  isProcessing.value = true;
  try {
    const mockUsers = { workshop: { password: "123", userName: "车间" } };
    if (mockUsers.workshop.password !== workshopPassword.value) {
      showToast("车间密码错误");
      emit("validate", { step: 3, success: false });
      return;
    }
    workshopName.value = mockUsers.workshop.userName;
    const newData = {
      status: 'workshop_validated',
      workshop: workshopName.value,
      current_step: 4,
      verified_time: formatDate(new Date(), 'yyyy-MM-dd HH:mm:ss')
    };
    const mergedVR = await getMergedVerificationResult(newData);
    await submitMaterialCheck({
      batchId: props.batchId,
      brand: props.brand,
      segment: props.segment,
      verificationResult: mergedVR,
      dataCount: props.dataCount,
      operatorId: uni.getStorageSync('userId') || 1
    });
    currentStep.value = 4;
    workshopPassword.value = "";
    showToast("车间验证成功");
    emit("validate", { step: 3, success: true, user: workshopName.value });
  } catch (error) {
    console.error('车间验证失败:', error);
    showToast("车间验证失败，请重试");
  } finally {
    isProcessing.value = false;
  }
};

// 提交最终操作
const submitFinalAction = async () => {
  isProcessing.value = true;
  try {
    const newData = {
      status: 'normal',
      verified_time: formatDate(new Date(), 'yyyy-MM-dd HH:mm:ss')
    };
    const mergedVR = await getMergedVerificationResult(newData);
    const result = await submitMaterialCheck({
      batchId: props.batchId,
      brand: props.brand,
      segment: props.segment,
      verificationResult: mergedVR,
      dataCount: props.dataCount,
      operatorId: uni.getStorageSync('userId') || 1
    });
    isContentVisible.value = false;
    isVerified.value = true;
    verificationStatus.value = { ...verificationStatus.value, verificationResult: mergedVR };
    showToast("验证完成，操作成功");
    emit("success", result);
  } catch (error) {
    console.error('最终提交失败:', error);
    showToast("提交失败，请重试");
  } finally {
    isProcessing.value = false;
  }
};

// 重置验证状态
const resetValidation = () => {
  currentStep.value = 1;
  foremanPassword.value = "";
  followerPassword.value = "";
  workshopPassword.value = "";
  isContentVisible.value = false;
};

// 组件挂载初始化
onMounted(async () => {
  const userInfo = uni.getStorageSync('userInfo') || {};
  const position = userInfo.position || '';
  const role = userInfo.role || '';

  // 权限判断
  if (
    position.includes('段长') ||
    position.includes('丝库工') ||
    position.includes('跟班验证员') ||
    role === 'ADMIN'
  ) {
    hasPermission.value = true;
    try {
      // 查询验证状态
      const result = await byBatchIdAndSegment(props.batchId, props.segment);
      if (result && result.verificationResult) {
        verificationStatus.value = result;
        let vr = result.verificationResult;
        
        // 处理整个 verificationResult 为数组的情况
        if (Array.isArray(vr)) {
          vr = vr.length > 0 ? vr[0] : {};
        }

        // 保持 images 数组格式，不转换为字符串
        // 如果 images 是对象，转换为数组
        if (vr.images && typeof vr.images === 'object' && !Array.isArray(vr.images)) {
          vr.images = Object.values(vr.images);
        }

        // 根据处理后的状态初始化步骤
        if (vr.status === 'foreman_validated') {
          currentStep.value = 2;
          foremanName.value = vr.foreman;
        } else if (vr.status === 'follower_validated') {
          currentStep.value = 3;
          foremanName.value = vr.foreman;
          followerName.value = vr.follower;
        } else if (vr.status === 'workshop_validated' || vr.status === 'normal') {
          currentStep.value = 4;
          foremanName.value = vr.foreman;
          followerName.value = vr.follower;
          workshopName.value = vr.workshop;
          isVerified.value = true;
        } else if (vr.status === 'exception') {
          currentStep.value = vr.current_step || 1;
          foremanName.value = vr.foreman;
          followerName.value = vr.follower;
          workshopName.value = vr.workshop;
        }
      }
    } catch (error) {
      console.error('查询验证状态失败:', error);
    }
  }
});
</script>

<style scoped>
/* 样式保持不变 */
.verify-button-container { margin-top: 20px; }
.text-display {
  padding: 10px 20px; border-radius: 4px; text-align: center; color: #fff;
  background-color: #1890ff; cursor: pointer; display: flex; align-items: center;
  justify-content: center; gap: 8px; transition: background-color 0.3s;
}
.text-display:hover { background-color: #096dd9; }
.arrow-icon { transition: transform 0.3s ease; }
.rotate-180 { transform: rotate(180deg); }
.collapsible-content {
  margin-top: 10px; padding: 15px; border: 1px solid #ebeef5;
  border-radius: 4px; background-color: #fff; animation: fadeIn 0.3s ease;
}
@keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
.validation-content { padding: 10px 0; }
.validation-step {
  display: flex; align-items: flex-start; margin-bottom: 25px; position: relative;
}
.step-indicator { display: flex; flex-direction: column; align-items: center; margin-right: 15px; }
.step-number {
  width: 36px; height: 36px; border-radius: 50%; background-color: #e5e6eb;
  color: #666; display: flex; align-items: center; justify-content: center;
  font-weight: bold; font-size: 16px; z-index: 2;
}
.step-line { width: 2px; height: 50px; background-color: #52c41a; margin-top: -1px; }
.step-content { flex: 1; padding-top: 5px; }
.step-title { font-weight: 500; margin-bottom: 10px; color: #333; }
.action-buttons { display: flex; gap: 10px; margin-top: 10px; }
.step-button { flex: 1; }
.exception-button { flex: 1; }
.step-result { color: #52c41a; font-size: 14px; padding: 5px 0; }
.validation-step.active .step-number { background-color: #1890ff; color: #fff; }
.validation-step.completed .step-number { background-color: #52c41a; color: #fff; }
.modal-footer { display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; }
.verified-status-container {
  display: flex; align-items: center; padding: 12px 16px;
  background-color: #f0f9eb; border: 1px solid #c2e7b0; border-radius: 8px;
}
.verified-icon {
  width: 36px; height: 36px; border-radius: 50%; background-color: #52c41a;
  color: white; display: flex; align-items: center; justify-content: center;
  font-size: 20px; font-weight: bold; margin-right: 12px;
}
.verified-content { flex: 1; }
.verified-title { font-size: 14px; font-weight: bold; color: #52c41a; margin-bottom: 4px; }
.verified-details { font-size: 12px; color: #606266; }
.verified-item { margin-bottom: 2px; }
</style>