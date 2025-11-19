<template>
  <view class="login-container">
    <!-- 背景 -->
    <u--image
      src="https://cdn.uviewui.com/uview/album/1.jpg"
      width="100vw"
      height="100vh"
      mode="aspectFill"
    >
    </u--image>
    
    <!-- 渐变遮罩 -->
    <view class="mask"></view>

    <!-- 登录表单 -->
    <view class="login-form">
      <view class="title">欢迎登录</view>

      <u-form :model="form" ref="uForm" labelPosition="left">
        <!-- 账号 -->
        <u-form-item borderBottom>
          <u--input
            v-model="form.userId"
            placeholder="请输入账号"
            prefixIcon="account"
            prefixIconStyle="font-size: 20px; color: #909399"
            clearable
          />
        </u-form-item>

        <!-- 密码 -->
        <u-form-item borderBottom>
          <u--input
            v-model="form.password"
            placeholder="请输入密码"
            type="password"
            password
            prefixIcon="lock"
            prefixIconStyle="font-size: 20px; color: #909399"
            clearable
          />
        </u-form-item>
      </u-form>

      <!-- 选项行 -->
      <view class="options">
        <u-checkbox-group v-model="form.rememberOptions">
          <u-checkbox
            name="week"
            size="14"
            label="记住我一周"
            labelSize="14"
            shape="circle"
          ></u-checkbox>
          <u-checkbox
            name="month"
            size="14"
            label="记住我一个月"
            labelSize="14"
            shape="circle"
            style="margin-left: 20rpx;"
          ></u-checkbox>
        </u-checkbox-group>
      </view>

      <!-- 登录按钮 -->
      <u-button
        :loading="loading"
        :customStyle="btnStyle"
        text="登录"
        type="primary"
        @click="login"
      ></u-button>

      <!-- 注册提示 -->
      <view class="register-tip">
        第一次使用？
        <text class="link" @tap="onRegister">立即注册</text>
      </view>
    </view>
  </view>
</template>

<script>
// 假设您有 login API
import { loginApi, registerApi } from '@/api/auth'

export default {
  data() {
    return {
      loading: false,
      form: {
        userId: '',
        password: '',
        rememberOptions: [] // 改为数组，支持多项选择
      },
      // 按钮样式（渐变）
      btnStyle: {
        margin: '40rpx 0',
        background: 'linear-gradient(45deg, #25b579, #1d9567)',
        border: 'none'
      }
    }
  },
  methods: {
    async login() {
      // 表单校验
      if (!this.form.password) {
        uni.showToast({ title: '请输入密码', icon: 'none' })
        return
      }

      this.loading = true

      try {
        const res = await loginApi(this.form)
        
        // 登录成功,存储用户信息
        uni.setStorageSync('token', res.token)
        uni.setStorageSync('userId', res.userId)
        uni.setStorageSync('userInfo', res.user)
        
        // 如果选择了记住密码，存储登录信息
        if (this.form.rememberOptions.length > 0) {
          this.saveLoginDataWithExpiration()
        } else {
          uni.removeStorageSync('loginData')
        }
        
        uni.showToast({ title: '登录成功', icon: 'success' })

        // 返回上一页或跳转首页
        uni.reLaunch({
          url: '/pages/user/notice-list',
          success: () => {
            console.log('🚀 成功跳转到首页（公告列表）');
          },
          fail: (err) => {
            console.error('💥 跳转失败，请检查：', err);
          }
        });
      } catch (error) {
        uni.showToast({
          title: error.message || '登录失败',
          icon: 'none'
        })
      } finally {
        this.loading = false
      }
    },

    // 保存登录数据并设置过期时间
    saveLoginDataWithExpiration() {
      const loginData = {
        userId: this.form.userId,
        password: this.form.password,
        // 计算过期时间
        expireTime: this.calculateExpireTime(),
        // 保存选择的记住选项
        rememberOptions: this.form.rememberOptions
      }
      
      // 存储到本地
      uni.setStorageSync('loginData', loginData)
    },

    // 计算过期时间
    calculateExpireTime() {
      const now = new Date()
      let expireTime = new Date(now)
      
      if (this.form.rememberOptions.includes('month')) {
        // 记住一个月
        expireTime.setDate(now.getDate() + 30)
      } else if (this.form.rememberOptions.includes('week')) {
        // 记住一周
        expireTime.setDate(now.getDate() + 7)
      }
      
      return expireTime.getTime() // 返回时间戳
    },

    // 检查登录数据是否过期
    checkLoginDataExpired() {
      const saved = uni.getStorageSync('loginData')
      if (saved && saved.expireTime) {
        const now = new Date().getTime()
        if (now > saved.expireTime) {
          // 已过期，删除存储的数据
          uni.removeStorageSync('loginData')
          return true
        }
        return false
      }
      return true // 没有数据或格式不正确，认为已过期
    },

    // 获取有效的登录数据
    getValidLoginData() {
      if (this.checkLoginDataExpired()) {
        return null
      }
      
      const saved = uni.getStorageSync('loginData')
      return saved
    },

    onForgetPassword() {
      uni.showToast({ title: '跳转忘记密码', icon: 'none' })
      // uni.navigateTo({ url: '/pages/auth/forget' })
    },

    onRegister() {
      uni.showToast({ title: '跳转注册页', icon: 'none' })
         uni.navigateTo({ url: '/pages/user/register' })
    }
  },

  // 页面加载时，读取记住的账号密码
  onLoad() {
    const saved = this.getValidLoginData()
    if (saved) {
      this.form.userId = saved.userId
      this.form.password = saved.password
      this.form.rememberOptions = saved.rememberOptions || []
    }
  }
}
</script>

<style scoped>
.login-container {
  position: relative;
  height: 100vh;
  overflow: hidden;
}

.mask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3); /* 黑色半透明遮罩 */
  z-index: 1;
}

.login-form {
  position: absolute;
  top: 30%;
  left: 50%;
  transform: translate(-50%, 0);
  width: 80%;
  padding: 40rpx;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 20rpx;
  z-index: 2;
  box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.1);
}

.title {
  font-size: 40rpx;
  font-weight: bold;
  color: #303133;
  text-align: center;
  margin-bottom: 60rpx;
}

.options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 20rpx 0 40rpx;
  font-size: 28rpx;
  color: #606266;
}

.forget {
  color: #25b579;
}

.register-tip {
  text-align: center;
  font-size: 28rpx;
  color: #606266;
}

.link {
  color: #25b579;
  font-weight: 500;
}
</style>



