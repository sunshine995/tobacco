<template>
  <view class="accuracy-calculator">
    <h2 class="calculator-title">加料反算精度计算工具</h2>
    
    <view class="input-group">
      <label for="tobaccoTotal" class="input-label">烟丝总量 (kg)</label>
      <input 
        id="tobaccoTotal"
        v-model="formData.tobaccoTotal"
        type="number" 
        step="0.1"
        placeholder="例如：9237.8"
        class="input-field"
        required
      />
    </view>
    
    <view class="input-group">
      <label for="additionRatio" class="input-label">加料比例 (%)</label>
      <input 
        id="additionRatio"
        v-model="formData.additionRatio"
        type="number" 
        step="0.01"
        placeholder="例如：2.00"
        class="input-field"
        required
      />
    </view>
    
    <h3 class="section-title">加料前料液重量 (kg)</h3>
    <view class="input-row">
      <view class="input-group">
        <label for="tankBefore1" class="input-label">料液重量1</label>
        <input 
          id="tankBefore1"
          v-model="formData.tankBefore1"
          type="number" 
          step="0.1"
          placeholder="例如：442.2"
          class="input-field"
          required
        />
      </view>
      <view class="input-group">
        <label for="tankBefore2" class="input-label">料液重量2</label>
        <input 
          id="tankBefore2"
          v-model="formData.tankBefore2"
          type="number" 
          step="0.1"
          placeholder="例如：257.5"
          class="input-field"
          required
        />
      </view>
    </view>
    
    <h3 class="section-title">加料后料液重量 (kg)</h3>
    <view class="input-row">
      <view class="input-group">
        <label for="tankAfter1" class="input-label">料液重量1</label>
        <input 
          id="tankAfter1"
          v-model="formData.tankAfter1"
          type="number" 
          step="0.1"
          placeholder="例如：372.6"
          class="input-field"
          required
        />
      </view>
      <view class="input-group">
        <label for="tankAfter2" class="input-label">料液重量2</label>
        <input 
          id="tankAfter2"
          v-model="formData.tankAfter2"
          type="number" 
          step="0.1"
          placeholder="例如：141.5"
          class="input-field"
          required
        />
      </view>
    </view>
    
    <button @click="calculateAccuracy" class="calculate-button">
      计算反算精度
    </button>
    
    <view v-if="showResult" class="result-container">
      <h3 class="result-title">计算结果</h3>
      <view class="result-item">
        <span class="result-label">理论加料值：</span>
        <span class="result-value">{{ results.theoryAdd.toFixed(3) }} kg</span>
      </view>
      <view class="result-item">
        <span class="result-label">实际加料量：</span>
        <span class="result-value">{{ results.actualAdd.toFixed(1) }} kg</span>
      </view>
      <view class="result-item accuracy-item">
        <span class="result-label">实际加料精度：</span>
        <span class="result-value" :class="accuracyClass">
          {{ results.accuracy.toFixed(3) }} %
        </span>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';

// 表单数据
const formData = reactive({
  tobaccoTotal: '',
  additionRatio: '',
  tankBefore1: '',
  tankBefore2: '',
  tankAfter1: '',
  tankAfter2: ''
});

// 计算结果
const results = reactive({
  theoryAdd: 0,
  actualAdd: 0,
  accuracy: 0
});

const showResult = ref(false);

// 根据精度值动态设置样式类
const accuracyClass = computed(() => {
  const absAccuracy = Math.abs(results.accuracy);
  if (absAccuracy <= 1) {
    return 'accuracy-good';
  } else if (absAccuracy <= 3) {
    return 'accuracy-warning';
  } else {
    return 'accuracy-error';
  }
});

// 计算精度
const calculateAccuracy = () => {
  // 验证所有输入是否为有效数字并进行类型转换
  const tobaccoTotal = parseFloat(formData.tobaccoTotal);
  const additionRatio = parseFloat(formData.additionRatio);
  const tankBefore1 = parseFloat(formData.tankBefore1);
  const tankBefore2 = parseFloat(formData.tankBefore2);
  const tankAfter1 = parseFloat(formData.tankAfter1);
  const tankAfter2 = parseFloat(formData.tankAfter2);
  
  // 验证所有字段都有值且为有效数字
  if (isNaN(tobaccoTotal) || tobaccoTotal <= 0 ||
      isNaN(additionRatio) || additionRatio <= 0 ||
      isNaN(tankBefore1) || tankBefore1 < 0 ||
      isNaN(tankBefore2) || tankBefore2 < 0 ||
      isNaN(tankAfter1) || tankAfter1 < 0 ||
      isNaN(tankAfter2) || tankAfter2 < 0) {
    
    // 使用uni-app的提示框
    uni.showToast({
      title: '请输入所有必填的有效数值',
      icon: 'none',
      duration: 2000
    });
    return;
  }

  // 计算
  const theoryAdd = tobaccoTotal * (additionRatio / 100); // 理论加料值
  const beforeTotal = tankBefore1 + tankBefore2; // 加料前总重量
  const afterTotal = tankAfter1 + tankAfter2; // 加料后总重量
  
  // 验证加料后重量应小于加料前重量
  if (afterTotal >= beforeTotal) {
    uni.showToast({
      title: '加料后重量应小于加料前重量',
      icon: 'none',
      duration: 2000
    });
    return;
  }
  
  const actualAdd = beforeTotal - afterTotal; // 实际加料量
  const accuracy = ((actualAdd - theoryAdd) / theoryAdd) * 100; // 精度

  // 更新结果
  results.theoryAdd = theoryAdd;
  results.actualAdd = actualAdd;
  results.accuracy = accuracy;
  
  showResult.value = true;
  
  // 滚动到结果区域
  setTimeout(() => {
    uni.createSelectorQuery().select('.result-container').boundingClientRect(rect => {
      if (rect) {
        uni.pageScrollTo({
          scrollTop: rect.top - 50,
          duration: 300
        });
      }
    }).exec();
  }, 100);
};
</script>

<style scoped>
.accuracy-calculator {
  padding: 20px;
  background-color: #ffffff;
  border-radius: 12px;
  max-width: 800px;
  margin: 0 auto;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.calculator-title {
  font-size: 20px;
  font-weight: bold;
  color: #333;
  margin-bottom: 25px;
  text-align: center;
}

.section-title {
  font-size: 16px;
  font-weight: 500;
  color: #666;
  margin: 20px 0 15px 0;
}

.input-row {
  display: flex;
  gap: 15px;
  margin-bottom: 15px;
}

.input-group {
  flex: 1;
  margin-bottom: 15px;
}

.input-label {
  display: block;
  font-size: 14px;
  color: #666;
  margin-bottom: 5px;
}

.input-field {
  width: 100%;
  height: 40px;
  padding: 0 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 14px;
  background-color: #fff;
  box-sizing: border-box;
  transition: border-color 0.3s;
}

.input-field:focus {
  outline: none;
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
}

.calculate-button {
  width: 100%;
  height: 44px;
  background-color: #409eff;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.3s;
  margin: 25px 0;
}

.calculate-button:hover {
  background-color: #66b1ff;
}

.calculate-button:active {
  background-color: #3a8ee6;
}

.result-container {
  margin-top: 25px;
  padding: 20px;
  background-color: #f5f7fa;
  border-radius: 8px;
  border: 1px solid #ebeef5;
}

.result-title {
  font-size: 18px;
  font-weight: 500;
  color: #333;
  margin-bottom: 15px;
}

.result-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #ebeef5;
}

.result-item:last-child {
  border-bottom: none;
}

.result-label {
  font-size: 14px;
  color: #666;
}

.result-value {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.accuracy-item .result-label {
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

.accuracy-item .result-value {
  font-size: 18px;
  font-weight: bold;
}

.accuracy-good {
  color: #67c23a;
}

.accuracy-warning {
  color: #e6a23c;
}

.accuracy-error {
  color: #f56c6c;
}
</style>