<template>
  <view class="daily-record-container">
    <!-- 标题 -->
    <view class="title">制丝车间片烟箱皮数量管理</view>

    <!-- 昨日结余 -->
    <view class="yesterday-surplus">
      <text>昨日结余：</text>
      <text style="color: #4CAF50; font-weight: bold;">
        烟箱 {{ yesterdayBox }} | 纸板 {{ yesterdayBoard }}
      </text>
    </view>

    <!-- 日期 & 班组 -->
    <view class="date-class">
      <picker mode="date" :value="selectedDate" @change="onDateChange">
        <text>日期：{{ selectedDate }}</text>
      </picker>
      <text>班组：{{ classIndex }}</text>
    </view>

    <!-- ===== 纸箱生产记录 ===== -->
    <view class="production-section">
      <text class="section-title">📦 纸箱产生记录</text>
      <view class="production-list">
        <view v-for="(item, index) in boxProduction" :key="'box-prod-' + index" class="production-item">
          <picker :value="item.typeIndex" :range="productionTypes" @change="onBoxProdTypeChange(index, $event)">
            <text>{{ productionTypes[item.typeIndex] }}</text>
          </picker>
          <input v-model.number="item.quantity" type="number" placeholder="数量" />
          <input v-model="item.remark" placeholder="备注" />
          <button class="btn-remove" @click="removeBoxProduction(index)">×</button>
        </view>
      </view>
      <button class="btn-add-production" @click="addBoxProduction">+ 添加纸箱生产项</button>
    </view>

    <!-- 纸板生产数量 -->
    <view class="production-section">
      <text class="section-title">纸板生产数量</text>
      <view class="input-row">
        <text>纸板：</text>
        <input v-model.number="production.boardCount" type="number" placeholder="纸板数量" />
      </view>
    </view>

    <!-- ===== 纸箱使用记录 ===== -->
    <view class="usage-section">
      <text class="section-title">📦 纸箱使用记录</text>
      <view class="usage-list">
        <view v-for="(item, index) in boxUsage" :key="'box-' + index" class="usage-item">
          <picker :value="item.typeIndex" :range="usageTypes" @change="onBoxTypeChange(index, $event)">
            <text>{{ usageTypes[item.typeIndex] }}</text>
          </picker>
          <input v-model.number="item.quantity" type="number" placeholder="数量" />
          <input v-model="item.remark" placeholder="备注" />
          <button class="btn-remove" @click="removeBoxUsage(index)">×</button>
        </view>
      </view>
      <button class="btn-add-usage" @click="addBoxUsage">+ 添加纸箱使用项</button>
    </view>

    <!-- ===== 纸板使用记录 ===== -->
    <view class="usage-section">
      <text class="section-title">📄 纸板使用记录</text>
      <view class="usage-list">
        <view v-for="(item, index) in boardUsage" :key="'board-' + index" class="usage-item">
          <picker :value="item.typeIndex" :range="CardboardTypes" @change="onBoardTypeChange(index, $event)">
            <text>{{ CardboardTypes[item.typeIndex] }}</text>
          </picker>
          <input v-model.number="item.quantity" type="number" placeholder="数量" />
          <input v-model="item.remark" placeholder="备注" />
          <button class="btn-remove" @click="removeBoardUsage(index)">×</button>
        </view>
      </view>
      <button class="btn-add-usage" @click="addBoardUsage">+ 添加纸板使用项</button>
    </view>

    <!-- 结余结果 -->
    <view class="surplus-result">
      <text class="result-label">结余数量：</text>
      <text class="result-value" style="color: #4CAF50; font-weight: bold;">
        烟箱 {{ totalSurplusBox }} | 纸板 {{ totalSurplusBoard }}
      </text>
    </view>

    <!-- 提交按钮 -->
    <view class="action-buttons">
      <button class="btn-submit" @click="submitData">提交数据</button>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import{ selectByBoxDate, saveRecordBox } from '@/api/from.js'

// ===== 基础配置 =====
const yesterdayBox = ref()
const yesterdayBoard = ref()

// 固定为今天日期（不可选）
const today = new Date()
const selectedDate = ref(today.toISOString().split('T')[0])
const classIndex = uni.getStorageSync('userInfo').class || {}

const production = ref({
  boardCount: 0
})

// 纸箱生产类型
const productionTypes = [
  '正常生产',
  '其他'
]

const usageTypes = [
  '退回西库',
  '机械手垃',
  '卷包',
  '加料机',
  '除尘',
  '烟沫',
  '梗签',
  '湿垃圾',
  '其他'
]

const CardboardTypes = [
  '退回西库',
  '其他'
]

//加载数据
onMounted(async () => {
   const res =  await selectByBoxDate()
   yesterdayBoard.value = res.surplusBoard
   yesterdayBox.value=res.surplusBox
})

// ===== 分开存储 =====
// 纸箱生产记录
const boxProduction = ref([
  { typeIndex: 0, quantity: 0, remark: '' }
])

const boxUsage = ref([
  { typeIndex: 0, quantity: 0, remark: '' }
])

const boardUsage = ref([
  { typeIndex: 1, quantity: 0, remark: '' }
])

// ===== 计算总量 =====
// 纸箱生产总量
const totalProductionBox = computed(() =>
  boxProduction.value.reduce((sum, item) => sum + (item.quantity || 0), 0)
)

const totalUsedBox = computed(() =>
  boxUsage.value.reduce((sum, item) => sum + (item.quantity || 0), 0)
)

const totalUsedBoard = computed(() =>
  boardUsage.value.reduce((sum, item) => sum + (item.quantity || 0), 0)
)

const totalSurplusBox = computed(() =>
  yesterdayBox.value + totalProductionBox.value - totalUsedBox.value - production.value.boardCount
)

const totalSurplusBoard = computed(() =>
  yesterdayBoard.value + production.value.boardCount - totalUsedBoard.value
)

// ===== 事件处理 =====
const onDateChange = (e) => {
  selectedDate.value = e.detail.value
}

// 纸箱生产
const onBoxProdTypeChange = (index, e) => {
  boxProduction.value[index].typeIndex = e.detail.value
}
const addBoxProduction = () => {
  boxProduction.value.push({ typeIndex: 0, quantity: 0, remark: '' })
}
const removeBoxProduction = (index) => {
  if (boxProduction.value.length > 1) boxProduction.value.splice(index, 1)
}

// 纸箱使用
const onBoxTypeChange = (index, e) => {
  boxUsage.value[index].typeIndex = e.detail.value
}
const addBoxUsage = () => {
  boxUsage.value.push({ typeIndex: 0, quantity: 0, remark: '' })
}
const removeBoxUsage = (index) => {
  if (boxUsage.value.length > 1) boxUsage.value.splice(index, 1)
}

// 纸板
const onBoardTypeChange = (index, e) => {
  boardUsage.value[index].typeIndex = e.detail.value
}
const addBoardUsage = () => {
  boardUsage.value.push({ typeIndex: 0, quantity: 0, remark: '' })
}
const removeBoardUsage = (index) => {
  if (boardUsage.value.length > 1) boardUsage.value.splice(index, 1)
}

// 提交
const submitData = () => {
  const data = {
    date: selectedDate.value,
    classes: classIndex,
    createdId: uni.getStorageSync('userId'),
    // 纸箱生产记录
    productionBox: boxProduction.value.map(item => ({
      type: productionTypes[item.typeIndex],
      quantity: item.quantity,
      remark: item.remark
    })),
    productionBoard: production.value.boardCount,
    boxUsage: boxUsage.value.map(item => ({
      type: usageTypes[item.typeIndex],
      quantity: item.quantity,
      remark: item.remark
    })),
    boardUsage: boardUsage.value.map(item => ({
      type: CardboardTypes[item.typeIndex],
      quantity: item.quantity,
      remark: item.remark
    })),
    surplusBox: totalSurplusBox.value,
    surplusBoard: totalSurplusBoard.value
  }

  console.log('✅ 提交数据:', JSON.stringify(data, null,2))
  saveRecordBox(data)

}
</script>

<style scoped>
.daily-record-container {
  padding: 20rpx;
  background: #f9f9f9;
}

.title {
  text-align: center;
  font-size: 36rpx;
  font-weight: bold;
  margin-bottom: 20rpx;
}

.yesterday-surplus {
  background: #e8f5e8;
  padding: 20rpx;
  border-radius: 12rpx;
  margin-bottom: 20rpx;
  text-align: center;
  font-size: 30rpx;
}

.date-class {
  display: flex;
  justify-content: space-between;
  margin-bottom: 30rpx;
  font-size: 28rpx;
}

.production-section,
.usage-section {
  background: white;
  padding: 20rpx;
  border-radius: 12rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.1);
}

.section-title {
  font-weight: bold;
  margin-bottom: 10rpx;
  color: #333;
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.input-row {
  display: flex;
  align-items: center;
  gap: 20rpx;
  margin-bottom: 10rpx;
}

.input-row input {
  flex: 1;
  padding: 10rpx;
  border: 1rpx solid #ccc;
  border-radius: 8rpx;
  font-size: 28rpx;
}

.production-list,
.usage-list {
  margin-top: 10rpx;
}

.production-item,
.usage-item {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 10rpx;
  background: #f5f5f5;
  border-radius: 8rpx;
  margin-bottom: 10rpx;
  flex-wrap: wrap;
}

.production-item picker,
.production-item input,
.usage-item picker,
.usage-item input {
  flex: 1;
  min-width: 120rpx;
  padding: 10rpx;
  border: 1rpx solid #ddd;
  border-radius: 6rpx;
  font-size: 26rpx;
  text-align: center;
}

.btn-remove {
  width: 50rpx;
  height: 50rpx;
  background: #f44336;
  color: white;
  border: none;
  border-radius: 50%;
  font-size: 28rpx;
  line-height: 50rpx;
}

.btn-add-production,
.btn-add-usage {
  margin-top: 20rpx;
  padding: 15rpx;
  background: #1E6FBA;
  color: white;
  border: none;
  border-radius: 8rpx;
  font-size: 28rpx;
  width: 100%;
}

.surplus-result {
  margin: 30rpx 0;
  text-align: center;
  font-size: 32rpx;
  font-weight: bold;
  color: #4CAF50;
}

.action-buttons {
  text-align: center;
  margin-top: 40rpx;
}

.btn-submit {
  padding: 20rpx;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 12rpx;
  font-size: 32rpx;
  width: 200rpx;
}
</style>