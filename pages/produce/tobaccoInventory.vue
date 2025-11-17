<template>
  <view class="daily-record-container">
    <!-- 标题 -->
    <view class="title">制丝车间膨化烟丝管理</view>

    <!-- 昨日结余 -->
    <view class="yesterday-surplus">
      <view class="surplus-item">
        <text>库存烟丝：</text>
        <text class="surplus-value">
          大箱 {{ yesterdayStock.large }} | 小箱 {{ yesterdayStock.small }}
        </text>
      </view>
      <view class="surplus-item">
        <text>结余箱皮：</text>
        <text class="surplus-value">
          大箱 {{ yesterdayShell.large }} | 小箱 {{ yesterdayShell.small }}
        </text>
      </view>
    </view>

    <!-- 日期 & 班组 - 同一行，有间距 -->
    <view class="info-row">
      <view class="info-item">
        <text class="info-label">日期：</text>
        <picker mode="date" :value="selectedDate" @change="onDateChange">
          <text class="info-value">{{ selectedDate }}</text>
        </picker>
      </view>
      <view class="spacer"></view>
      <view class="info-item">
        <text class="info-label">班组：</text>
        <!-- <text class="info-value">{{ classIndex }}</text> 
		-->
		<picker mode="selector" :range="classes"  :value="selectedShiftIndex" @change="onClassChange">
		  <text class="info-value">{{ classIndex }}</text>
		</picker>
      </view>
    </view>

    <!-- 西库来料 -->
    <view class="production-section">
      <text class="section-title">📦 西库来料</text>
      <view class="input-row">
        <text class="input-label">大箱：</text>
        <input v-model.number="incoming.large" type="number" placeholder="大箱数量" class="number-input" />
      </view>
      <view class="input-row">
        <text class="input-label">小箱：</text>
        <input v-model.number="incoming.small" type="number" placeholder="小箱数量" class="number-input" />
      </view>
    </view>
    
    <!-- 加料箱数 -->
    <view class="production-section">
      <text class="section-title">⚡ 加料箱数</text>
      <view class="input-row">
        <text class="input-label">大箱：</text>
        <input v-model.number="dosing.large" type="number" placeholder="大箱数量" class="number-input" />
      </view>
      <view class="input-row">
        <text class="input-label">小箱：</text>
        <input v-model.number="dosing.small" type="number" placeholder="小箱数量" class="number-input" />
      </view>
    </view>
    
    <!-- 拉西库箱皮数 -->
    <view class="production-section">
      <text class="section-title">📄 拉西库箱皮数</text>
      <view class="input-row">
        <text class="input-label">大箱：</text>
        <input v-model.number="pullShell.large" type="number" placeholder="大箱数量" class="number-input" />
      </view>
      <view class="input-row">
        <text class="input-label">小箱：</text>
        <input v-model.number="pullShell.small" type="number" placeholder="小箱数量" class="number-input" />
      </view>
    </view>


    <!-- 结余结果 -->
    <view class="surplus-result">
      <text class="result-label">今日结余：</text>
      <view class="result-items">
        <view class="result-item">
          <text class="result-type">库存烟丝：</text>
          <text class="result-value">
            大箱 {{ totalStock.large }} | 小箱 {{ totalStock.small }}
          </text>
        </view>
        <view class="result-item">
          <text class="result-type">结余箱皮：</text>
          <text class="result-value">
            大箱 {{ totalShell.large }} | 小箱 {{ totalShell.small }}
          </text>
        </view>
      </view>
    </view>

    <!-- 提交按钮 -->
    <view class="action-buttons">
      <button class="btn-submit" @click="submitData">提交数据</button>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import{ selectByInventory, saveRecordInventory } from'@/api/from.js'

// 昨日结余数据
const yesterdayStock = reactive({
  large: 0, // 库存烟丝大箱
  small: 0     // 库存烟丝小箱
})

const yesterdayShell = reactive({
  large: 0,  // 结余箱皮大箱
  small: 0    // 结余箱皮小箱
})

const classes = ['白班', '中班', '晚班']
// 当前日期和班组
const today = new Date()
const selectedDate = ref(today.toISOString().split('T')[0])
const classIndex = ref('白班')

// 输入数据
const incoming = reactive({
  large: 0,  // 西库来料大箱
  small: 0   // 西库来料小箱
})

const dosing = reactive({
  large: 0,  // 加料箱数大箱
  small: 0   // 加料箱数小箱
})

const pullShell = reactive({
  large: 0,  // 拉西库箱皮数大箱
  small: 0   // 拉西库箱皮数小箱
})

// 计算今日结余
const totalStock = computed(() => {
  return {
    large: yesterdayStock.large + incoming.large - dosing.large,
    small: yesterdayStock.small + incoming.small - dosing.small
  }
})

const totalShell = computed(() => {
  return {
    large: yesterdayShell.large + dosing.large - pullShell.large,
    small: yesterdayShell.small + dosing.small - pullShell.small
  }
})

// 事件处理
const onDateChange = (e) => {
  selectedDate.value = e.detail.value
}

// 事件处理
const onClassChange = (e) => {
  classIndex.value = classes[parseInt(e.detail.value)]
  
}
const selectedShiftIndex = computed(() => {
  return classes.indexOf(classIndex.value)
})


// 提交数据
const submitData = async () => {
  const data = {
	createdBy: uni.getStorageSync('userInfo').name,
    date: selectedDate.value,
    shift: classIndex.value,
    incomingLarge: incoming.large,
	incomingSmall: incoming.small,
    dosingLarge: dosing.large,
	dosingSmall: dosing.small,
    shellLargePulled: pullShell.large,
	shellSmallPulled: pullShell.small,
	leftoverLarge: totalStock.value.large,
	leftoverSmall: totalStock.value.small,
	shellBalanceLarge: totalShell.value.large,
	shellBalanceSmall: totalShell.value.small
  }

  console.log('提交数据:', data)
  console.log(totalStock.value.large)
  // 这里调用API保存数据
   //await saveRecordInventory(data)
  
  uni.showToast({
    title: '数据提交成功',
    icon: 'success'
  })
}

// 初始化
onMounted(async () => {
  // 这里可以添加获取昨日结余数据的API调用
  // fetchYesterdayData()
  const res = await selectByInventory()
  console.log(res)
  yesterdayStock.large = res.leftoverLarge
  yesterdayStock.small = res.leftoverSmall
  yesterdayShell.large = res.shellBalanceLarge
  yesterdayShell.small = res.shellBalanceSmall
  try {
    const userInfo = uni.getStorageSync('userInfo')
    if (userInfo && userInfo.class) {
      classIndex.value = userInfo.class
    }
  } catch (e) {
    console.log('获取用户信息失败')
  }
})
</script>

<style scoped>
.daily-record-container {
  padding: 30rpx;
  background: #f5f7fa;
  min-height: 100vh;
}

/* 标题 */
.title {
  text-align: center;
  font-size: 36rpx;
  font-weight: bold;
  margin-bottom: 30rpx;
  color: #333;
}

/* 昨日结余 */
.yesterday-surplus {
  background: #e8f5e8;
  padding: 30rpx;
  border-radius: 16rpx;
  margin-bottom: 30rpx;
}

.surplus-item {
  margin-bottom: 16rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.surplus-item:last-child {
  margin-bottom: 0;
}

.surplus-value {
  color: #4CAF50;
  font-weight: bold;
  font-size: 28rpx;
}

/* 日期和班组 - 同一行，有间距 */
.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  padding: 24rpx 30rpx;
  border-radius: 16rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.1);
}

.info-item {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.spacer {
  flex: 1;
}

.info-label {
  font-size: 28rpx;
  color: #606266;
  margin-right: 12rpx;
}

.info-value {
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
}

/* 生产部分 */
.production-section {
  background: white;
  padding: 30rpx;
  border-radius: 16rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.1);
}

/*  background: white;
  padding: 20rpx;
  border-radius: 12rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.1); */

.section-title {
  font-weight: bold;
  margin-bottom: 20rpx;
  color: #333;
  display: flex;
  align-items: center;
  gap: 12rpx;
  font-size: 30rpx;
}

.input-row input {
  flex: 1;
  padding: 10rpx;
  border: 1rpx solid #ccc;
  border-radius: 8rpx;
  font-size: 28rpx;
}
.input-row {
  display: flex;
  align-items: center;
  gap: 20rpx;
  margin-bottom: 10rpx;
}

/* .input-row:last-child {
  margin-bottom: 0;
} */

.input-label {
  font-size: 28rpx;
  color: #606266;
  min-width: 120rpx;
}

.number-input {
  flex: 1;
  padding: 20rpx;
  border: 1rpx solid #dcdfe6;
  border-radius: 8rpx;
  font-size: 28rpx;
  text-align: center;
  background: white;
}

/* 结余结果 */
.surplus-result {
  background: white;
  padding: 30rpx;
  border-radius: 16rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.1);
}

.result-label {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 20rpx;
  display: block;
}

.result-items {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.result-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.result-type {
  font-size: 28rpx;
  color: #606266;
}

.result-value {
  font-size: 28rpx;
  color: #4CAF50;
  font-weight: bold;
}

/* 提交按钮 */
.action-buttons {
  text-align: center;
}

.btn-submit {
  width: 100%;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 16rpx;
  padding: 28rpx;
  font-size: 32rpx;
  font-weight: bold;
  box-shadow: 0 6rpx 20rpx rgba(76, 175, 80, 0.3);
}

/* 响应式调整 */
/* @media (max-width: 480px) {
  .info-row {
    flex-direction: column;
    gap: 20rpx;
    align-items: stretch;
  }
  
  .spacer {
    display: none;
  }
  
  .info-item {
    justify-content: space-between;
  }
  
  .input-row {
    flex-direction: column;
    gap: 16rpx;
    align-items: stretch;
  }
  
  .input-label {
    text-align: center;
    margin-bottom: 8rpx;
  }
} */
</style>