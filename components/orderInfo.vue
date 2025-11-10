<!-- /components/WorkOrderInfoCard.vue -->
<template>
  <view class="work-order-info-card">
    <view class="order-info-content">
      <view class="info-row">
        <view class="info-label">批次号</view>
        <view class="info-value">{{ orderInfo.batchNo }}</view>
      </view>
      <view class="info-row">
        <view class="info-label">产品名称</view>
        <view class="info-value">{{ orderInfo.brand }}</view>
      </view>
    </view>
  </view>
</template>

<script setup>
// 接收外部传入的 orderInfo 对象
const props = defineProps({
  orderInfo: {
    type: Object,
    required: true,
    default: () => ({})
  }
});
</script>

<style scoped>
.work-order-info-card {
  background-color: #f9f9f9; /* 修改为稍灰的背景 */
  border-radius: 12rpx;
  padding: 30rpx;
  margin: 20rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
}

.order-info-content {
  display: flex;
  flex-direction: column;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  font-size: 28rpx;
  color: #666666;
  font-weight: 500;
  flex: 1;
}

.info-value {
  font-size: 28rpx;
  color: #333333;
  font-weight: 400;
  text-align: right;
  flex: 2;
  word-break: break-all;
}
</style>