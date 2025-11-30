<template>
  <view class="my-container">
    <!-- 排名核心卡片（简约高级风格） -->
    <view class="rank-card">
      <!-- 年度区域 -->
      <view class="stat-column">
        <text class="column-title">年度</text>
        <view class="rank-group">
          <text class="rank-label">排名</text>
          <view class="hexagon-box">
            <text class="wheat-icon">🌾</text>
            <text class="hexagon-text">51</text>
            <text class="wheat-icon">🌾</text>
          </view>
        </view>
        <view class="score-group">
          <text class="score-label">积分</text>
          <text class="score-text">800</text>
        </view>
      </view>

      <!-- 月度区域 -->
      <view class="stat-column">
        <text class="column-title">月度</text>
        <view class="rank-group">
          <text class="rank-label">排名</text>
          <view class="hexagon-box">
            <text class="wheat-icon">🌾</text>
            <text class="hexagon-text">51</text>
            <text class="wheat-icon">🌾</text>
          </view>
        </view>
        <view class="score-group">
          <text class="score-label">积分</text>
          <text class="score-text">76</text>
        </view>
      </view>

      <!-- 分项积分区域 -->
      <view class="sub-column">
        <text class="sub-title">分项积分</text>
        <view class="sub-item">
          <text class="sub-name">6S现场</text>
          <text class="sub-value">10</text>
        </view>
        <view class="sub-item">
          <text class="sub-name">考勤</text>
          <text class="sub-value">12</text>
        </view>
        <view class="sub-item">
          <text class="sub-name">考核</text>
          <text class="sub-value">6</text>
        </view>
        <view class="sub-item">
          <text class="sub-name">质量</text>
          <text class="sub-value">40</text>
        </view>
        <view class="sub-item">
          <text class="sub-name">奖励</text>
          <text class="sub-value">100</text>
        </view>
      </view>
    </view>

    <!-- 用户信息区 -->
    <view class="user-card">
      <view class="user-info">
        <view class="name-row">
          <text class="username">{{ userInfo.name || '未登录用户' }}</text>
          <text class="role-tag" :class="userInfo.role">
            {{ roleText.value }}
          </text>
        </view>
        <view class="info-item">
          <text class="info-label">手机</text>
          <text class="info-value">{{ userInfo.phone || '未绑定' }}</text>
        </view>
        <view class="info-item">
          <text class="info-label">车间</text>
          <text class="info-value">{{ userInfo.department || '暂无' }}</text>
        </view>
        <view class="info-item">
          <text class="info-label">职位</text>
          <text class="info-value">{{ userInfo.position || '暂无' }}</text>
        </view>
      </view>
    </view>

    <!-- 功能列表 -->
    <view class="menu-list">
      <u-cell-group border="false">
        <u-cell title="修改密码" is-link class="menu-item" />
        <u-cell
          v-if="isAdmin"
          title="后台管理"
          is-link
          @click="goToAdminPage"
          class="menu-item"
        />
        <u-cell
          title="退出登录"
          :border="false"
          @click="logout"
          class="menu-item logout-item"
        />
      </u-cell-group>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

// 数据逻辑
const userInfo = ref({
  name: '未登录',
  phone: '',
  role: '',
  department: '',
  position: '',
  support_position: ''
})

const isAdmin = computed(() => userInfo.value?.role === 'ADMIN')
const roleText = computed(() => (isAdmin.value ? '管理员' : '普通用户'))

onMounted(() => {
  loadUserInfo()
})

const loadUserInfo = () => {
  const user = uni.getStorageSync('userInfo') || {}
  userInfo.value = {
    name: user.name || '',
    phone: user.phone || '',
    role: user.role || '',
    department: user.department || '',
    position: user.position || '',
    line: user.line || '',
    support_position: user.support_position || ''
  }
}

const goToAdminPage = () => {
  uni.navigateTo({ url: '/pages/admin/publish' })
}

const logout = () => {
  uni.removeStorageSync('userInfo')
  uni.reLaunch({ url: '/pages/user/login' })
}
</script>

<style scoped>
/* 全局容器 */
.my-container {
  background-color: #f9fafb;
  min-height: 100vh;
  padding: 24rpx;
}

/* 核心排名卡片（参考企业软件风格） */
.rank-card {
  display: flex;
  background-color: #ffffff;
  border-radius: 16rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
  overflow: hidden;
  margin-bottom: 24rpx;
}

/* 年度/月度统计列 */
.stat-column {
  flex: 1;
  padding: 32rpx 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: #fff5f6; /* 浅红底色区分区域 */
  border-right: 1px solid #f3f4f6;
}

.column-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #ef4444; /* 主题红 */
  margin-bottom: 24rpx;
}

/* 排名组 */
.rank-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 20rpx;
}

.rank-label {
  font-size: 26rpx;
  color: #6b7280;
  margin-bottom: 8rpx;
}

/* 六边形排名（简约化） */
.hexagon-box {
  position: relative;
}

.hexagon-text {
  width: 96rpx;
  height: 110rpx;
  background-color: #ef4444;
  color: #ffffff;
  font-size: 44rpx;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
}

.wheat-icon {
  position: absolute;
  right: -16rpx;
  top: 50%;
  transform: translateY(-50%);
  font-size: 32rpx;
  color: #f59e0b; /* 金色 */
}

/* 积分组 */
.score-group {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.score-label {
  font-size: 26rpx;
  color: #6b7280;
  margin-bottom: 8rpx;
}

.score-text {
  font-size: 40rpx;
  font-weight: 700;
  color: #ef4444;
}

/* 分项积分列（参考数据卡片） */
.sub-column {
  flex: 1.2;
  padding: 32rpx 24rpx;
}

.sub-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #374151;
  margin-bottom: 20rpx;
  padding-left: 8rpx;
  border-left: 4rpx solid #ef4444;
}

.sub-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16rpx 12rpx;
  font-size: 28rpx;
  border-bottom: 1px solid #f3f4f6;
}

.sub-item:last-child {
  border-bottom: none;
}

.sub-name {
  color: #4b5563;
}

.sub-value {
  font-weight: 600;
  color: #ef4444;
}

/* 用户信息卡片 */
.user-card {
  background-color: #ffffff;
  border-radius: 16rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
  padding: 32rpx 24rpx;
  margin-bottom: 24rpx;
}

.name-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 24rpx;
}

.username {
  font-size: 34rpx;
  font-weight: 700;
  color: #111827;
}

.role-tag {
  font-size: 24rpx;
  padding: 4rpx 16rpx;
  border-radius: 16rpx;
  color: #ffffff;
  background-color: #3b82f6;
}

.role-tag.user {
  background-color: #9ca3af;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 16rpx;
  font-size: 28rpx;
}

.info-label {
  width: 100rpx;
  color: #6b7280;
  font-weight: 500;
}

.info-value {
  color: #374151;
}

/* 功能菜单（简约列表） */
.menu-list {
  background-color: #ffffff;
  border-radius: 16rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
}

.menu-item {
  font-size: 28rpx;
  color: #374151;
  padding: 20rpx 24rpx;
  border-bottom: 1px solid #f3f4f6;
}

.logout-item {
  color: #ef4444;
}
</style>