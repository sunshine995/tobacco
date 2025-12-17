<template>
  <view class="login-container">
    <!-- 顶部标题区域 -->
    <view class="header">
      <!-- <view class="logo">
        <u-icon name="account-circle" color="#25b579" size="100"></u-icon>
      </view> -->
      <view class="title">欢迎登录</view>
      <view class="subtitle">制丝车间管理系统</view>
    </view>

    <!-- 登录表单 -->
    <view class="login-form">
      <u-form :model="form" ref="uFormRef">
        <!-- 账号输入框 -->
        <view class="input-group">
          <u-icon name="account" color="#25b579" size="24"></u-icon>
          <u-input
            v-model="form.userId"
            placeholder="请输入账号"
            :border="false"
            placeholderClass="placeholder"
            :customStyle="{flex: 1, marginLeft: '10rpx'}"
            clearable
          />
        </view>

        <!-- 密码输入框 -->
        <view class="input-group">
          <u-icon name="lock" color="#25b579" size="24"></u-icon>
          <u-input
            v-model="form.password"
            placeholder="请输入密码"
            type="password"
            password
            placeholderClass="placeholder"
            :customStyle="{flex: 1, marginLeft: '10rpx'}"
            clearable
          />
        </view>

        <!-- 登录按钮 -->
        <u-button
          :loading="loading"
          :customStyle="btnStyle"
          shape="circle"
          text="登录"
          type="primary"
          @click="login"
          class="login-btn"
        ></u-button>
      </u-form>

      <!-- 底部链接 -->
      <view class="footer-links">
        <text class="link-text" @click="toForgotPassword">忘记密码</text>
        <text class="divider">|</text>
        <text class="link-text" @click="toRegister">注册账号</text>
      </view>
    </view>

    <!-- 底部版权 -->
    <view class="copyright">
      <text>© 2024 车间管理系统</text>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { loginApi } from '@/api/auth'
import { mqttClient } from '@/utils/MqttService.js'

const loading = ref(false)
const form = reactive({
  userId: '',
  password: ''
})

// 按钮样式
const btnStyle = reactive({
  marginTop: '80rpx',
  background: 'linear-gradient(90deg, #25b579, #1d9567)',
  border: 'none',
  height: '90rpx',
  fontSize: '32rpx'
})

// 忘记密码
const toForgotPassword = () => {
  uni.navigateTo({
    url: '/pages/auth/forgot-password'
  })
}

// 注册
const toRegister = () => {
  uni.navigateTo({
    url: '/pages/user/register'
  })
}

// 登录
const login = async () => {
  if (!form.userId.trim()) {
    uni.showToast({ title: '请输入账号', icon: 'none' })
    return
  }
  if (!form.password.trim()) {
    uni.showToast({ title: '请输入密码', icon: 'none' })
    return
  }
  
  loading.value = true
  
  try {
    const res = await loginApi(form)
    const userId = res.userId
    
    // 保存用户信息
    uni.setStorageSync('token', res.token)
    uni.setStorageSync('userId', userId)
    uni.setStorageSync('userInfo', res.user)
    
    // 连接MQTT
    await mqttClient.connect()
    
    // 订阅个人通知主题
    await mqttClient.subscribe(`workshop/${userId}/notice`, (message, topic) => {
      console.log('收到个人通知:', message)
      uni.showToast({
        title: '收到新消息',
        icon: 'none'
      })
      
      uni.$emit('new-message', { message, topic })
    })
    
    // 登录成功提示
    uni.showToast({
      title: '登录成功',
      icon: 'success',
      complete: () => {
        uni.reLaunch({ url: '/pages/user/notice-list' })
      }
    })
    
  } catch (error) {
    uni.showToast({ title: error.message || '登录失败', icon: 'none' })
    console.error('登录失败:', error)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  padding: 80rpx 60rpx 40rpx;
  display: flex;
  flex-direction: column;
}

/* 头部样式 */
.header {
  text-align: center;
  margin-bottom: 80rpx;
}

.logo {
  display: flex;
  justify-content: center;
  margin-bottom: 30rpx;
}

.title {
  font-size: 48rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 10rpx;
}

.subtitle {
  font-size: 28rpx;
  color: #666;
}

/* 表单样式 */
.login-form {
  flex: 1;
}

.input-group {
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 40rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
  border: 1rpx solid #eee;
}

.input-group:focus-within {
  border-color: #25b579;
  box-shadow: 0 4rpx 12rpx rgba(37, 181, 121, 0.1);
}

.placeholder {
  color: #999;
  font-size: 28rpx;
}

.login-btn {
  box-shadow: 0 8rpx 20rpx rgba(37, 181, 121, 0.3);
  transition: all 0.3s;
}

.login-btn:active {
  transform: scale(0.98);
}

/* 底部链接 */
.footer-links {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 50rpx;
}

.link-text {
  font-size: 26rpx;
  color: #25b579;
  padding: 0 20rpx;
}

.divider {
  color: #ddd;
  font-size: 26rpx;
}

/* 版权信息 */
.copyright {
  text-align: center;
  margin-top: 40rpx;
  padding-top: 40rpx;
  border-top: 1rpx solid #eee;
  color: #999;
  font-size: 24rpx;
}
</style>