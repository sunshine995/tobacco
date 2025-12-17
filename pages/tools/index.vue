<!-- /pages/tool/index.vue -->
<template>
  <view class="tool-container">
    <u-grid :border="false" col="3" @click="handleGridClick">
      <u-grid-item
        v-for="(item, index) in toolList"
        :key="index"
      >
        <view class="grid-icon">{{ item.emoji || '⚠️' }}</view>
        <text class="grid-text">{{ item.title }}</text>
      </u-grid-item>
    </u-grid>

    <u-toast ref="toastRef" />
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

// 用户信息
const userInfo = ref({})
const isAdmin = computed(() => userInfo.value.role === 'ADMIN')

// 动态工具列表pages/admin/group
const toolList = computed(() => {
  const list = [
    { name: 'error-circle', title: '异常上报', emoji: '⚠️' },
    { name: 'star', title: '异常信息', emoji: '🔍' },
    { name: 'grid', title: '我的工单', emoji: '📋' },
    { name: 'level', title: '动态组', emoji: '🧑‍🤝‍🧑' },
    { name: 'level', title: '箱皮管理', emoji: '📦' },
    { name: 'level', title: '膨化烟丝管理', emoji: '🌾' },
    { name: 'level', title: '残烟丝管理', emoji: '🧹' },
    { name: 'bookmark', title: '我的学习', emoji: '📚' },
	{ name: '6s', title: '每日6s', emoji: '6⃣' }
  ]

  if (isAdmin.value) {
    list.unshift({ name: 'volume', title: '发布公告', emoji: '📢' })
    list.unshift({ name: 'coupon', title: '发布工单', emoji: '🛠️' })
  }

  return list
})

const toastRef = ref(null)

// 加载用户信息
onMounted(() => {
  const user = uni.getStorageSync('userInfo')
  userInfo.value = user || {}
})

// 点击处理
const handleGridClick = (index) => {
  const item = toolList.value[index]
  if (!item) return

  let url = ''
  switch (item.title) {
    case '发布公告':
      url = '/pages/admin/publish'
      break
    case '异常上报':
      url = '/pages/fault/fault-report'
      break
    case '异常信息':
      url = '/pages/fault/fault-list'
      break
	case '发布工单':
	  url = '/pages/produce/produce'
	  break
	case '我的工单':
	  url = '/pages/produce/production-info'
	  break
	case '动态组':
	  url = '/pages/admin/group'
	  break
	case '箱皮管理':
	  url = '/pages/produce/carton'
	  break
	case '膨化烟丝管理':
	  url = '/pages/produce/tobaccoInventory'
	  break
	case '残烟丝管理':
	  url = '/pages/produce/dottle'
	  break
	case '我的学习':
	  url = '/pages/study/learn'
	  break
	case '每日6s':
	  url = '/pages/sixs/sixs-check'
	  break
    default:
      toastRef.value?.show({
        type: 'info',
        title: `${item.title} 开发中`,
        position: 'center'
      })
      return
  }

  uni.navigateTo({ url })
}
</script>

<style lang="scss" scoped>
.tool-container {
  padding: 20rpx;
  background-color: #f8f8f8;
  min-height: 100vh;
}

.grid-text {
  font-size: 14px;
  color: #909399;
  padding: 10rpx 0 20rpx;
}

.grid-icon {
  font-size: 40rpx;
  width: 72rpx;
  height: 72rpx;
  line-height: 72rpx;
  text-align: center;
  margin: 0 auto;
  border-radius: 12rpx;
  background: linear-gradient(180deg, rgba(255,243,205,0.9) 0%, rgba(255,238,186,0.9) 100%);
  color: #d9822b;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.06);
}
</style>