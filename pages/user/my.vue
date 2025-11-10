<!-- /pages/user/my/my.vue -->
<template>
  <view class="my-container">
   
    <!-- 用户信息区 -->
    <view class="user-profile-card">
      <view class="profile-text">
        <view class="name-row">
          <text class="username">{{ userInfo.name || '未登录用户' }}</text>
          <text class="role-tag" :class="userInfo.role">
            {{ roleText.value }}
          </text>
        </view>
        <view class="info-item">
          <text class="label">手机</text>
          <text class="value">{{ userInfo.phone || '未绑定' }}</text>
        </view>
		<view class="info-item">
		  <text class="label">车间：</text>
		  <text class="value">{{ userInfo.department || '暂无' }}</text>
		</view>
        <view class="info-item">
          <text class="label">职位</text>
          <text class="value">{{ userInfo.position || '暂无' }}</text>
        </view>
      </view>
    </view>

    <!-- 功能列表 -->
    <view class="menu-list">
      <u-cell-group>
        <u-cell title="修改密码" is-link />
        <u-cell
          v-if="isAdmin"
          title="后台管理"
          is-link
          @click="goToAdminPage"
        />
        <u-cell
          title="退出登录"
          :border="false"
          @click="logout"
          style="color: red;"
        />
      </u-cell-group>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

// 数据
const avatar = ref('/static/avatar.png')

const userInfo = ref({
  name: '未登录',
  phone: '',
  role: '',
  department: '',
  position: ''
})


// 计算属性（使用可选链）
const isAdmin = computed(() => userInfo.value?.role === 'ADMIN')
const roleText = computed(() => (isAdmin.value ? '管理员' : '普通用户'))

// 生命周期
onMounted(() => {
  loadUserInfo()
})

// 方法
const loadUserInfo = () => {
  const user = uni.getStorageSync('userInfo') || {}
  console.log(user)
    userInfo.value = {
      name: user.name || '',
      phone: user.phone || '',
      role: user.role || '',
	  department: user.department || '',
      position: user.position || '',
	  line: user.line || ''
    }
}

const goToAdminPage = () => {
  uni.navigateTo({
    url: '/pages/admin/publish'
  })
}

const logout = () => {
  uni.removeStorageSync('userInfo')
  uni.reLaunch({
    url: '/pages/user/login'
  })
}
</script>

<style scoped>
.my-container {
  background-color: #f8f8f8;
  min-height: 100vh;
}

.user-card {
  background-color: #fff;
  padding: 20px;
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.user-card u-avatar {
  margin-right: 15px;
}

.user-info {
  line-height: 1.5;
}

.username {
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

.role {
  font-size: 14px;
  color: #999;
}

.menu-list {
  background-color: #fff;
  margin-bottom: 20px;
}

.user-profile-card {
  background-color: #fff;
  margin: 20rpx;
  padding: 30rpx;
  border-radius: 16rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.08);
  border: 1px solid #f0f0f0;
}

.profile-text {
  line-height: 1.7;
}

.name-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 24rpx;
}

.username {
  font-size: 34rpx;
  font-weight: bold;
  color: #1a1a1a;
}

.role-tag {
  font-size: 24rpx;
  padding: 4rpx 16rpx;
  border-radius: 20rpx;
  color: #fff;
}

.role-tag.admin {
  background-color: #2d8cf0;
}

.role-tag.user {
  background-color: #999;
}

.info-item {
  display: flex;
  margin-bottom: 16rpx;
  font-size: 28rpx;
  color: #555;
}

.label {
  width: 100rpx;
  color: #888;
  font-weight: 500;
}

.value {
  flex: 1;
  color: #333;
}
</style>