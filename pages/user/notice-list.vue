<template>
  <view class="notice-list-container">
    <!-- 轮播图区域 -->
    <view v-if="banners.length > 0" class="banner-section">
      <u-swiper
        :list="banners"
        height="200"
        :autoplay="true"
        :interval="3000"
        :circular="true"
        key-name="imageUrl"
        @click="handleBannerClick"
      ></u-swiper>
    </view>

    <!-- 区域每日任务（普通用户固定显示） -->
    <view v-if="!isAdmin()" class="daily-task-section">
      <view class="daily-task-header">
        <text class="daily-task-title">区域每日任务</text>
        <text class="daily-task-sub">今日待完成（固定任务）</text>
      </view>
      <up-grid :border="false" column-num="4">
        <up-grid-item v-for="(t, idx) in dailyTasks" :key="idx" @click="handleDailyTaskClick(t)">
          <up-icon :name="t.icon" size="28" :color="t.color || '#4a4a4a'" />
          <text class="daily-task-item-title">{{ t.title }}</text>
          <text class="daily-task-item-desc">{{ t.desc }}</text>
        </up-grid-item>
      </up-grid>
    </view>

    <!-- 公告列表 -->
    <view class="notice-list">
      <view v-for="item in notices" :key="item.noticeId || item.id" class="notice-item" @click="viewDetail(item)">
        <h3>{{ item.title }}</h3>
        <text class="time">{{ formatDate(item.createdAt) }}</text>
        <text class="status" :class="{ read: isRead(item) }">
          {{ isRead(item) ? '已读' : '未读' }}
        </text>
      </view>

      <u-empty v-if="notices.length === 0 && !loading" text="暂无公告" mode="list" marginTop="50"></u-empty>
      <u-loading-page :loading="loading" loading-text="加载中..."></u-loading-page>
    </view>

    <!-- 右上角弹出菜单 -->
    <view v-if="showActionMenu" class="action-menu-overlay" @click="showActionMenu = false">
      <view class="action-menu" @click.stop>
        <view class="action-menu-item" @click="handleAddInfo">
          <text class="action-menu-icon">📝</text>
          <text class="action-menu-text">添加信息</text>
        </view>
        
        <!-- 如果是管理员，显示管理宣传信息选项 -->
        <view v-if="isAdmin()" class="action-menu-item" @click="handleManagePromotion">
          <text class="action-menu-icon">📊</text>
          <text class="action-menu-text">管理宣传信息</text>
        </view>
        
        <view class="action-menu-item" @click="handleProfile">
          <text class="action-menu-icon">👤</text>
          <text class="action-menu-text">个人资料</text>
        </view>
        
        <view class="action-menu-item" @click="handleLogout">
          <text class="action-menu-icon">🚪</text>
          <text class="action-menu-text">退出登录</text>
        </view>
      </view>
    </view>
    
  </view>
</template>

<script>
export default {
  onNavigationBarButtonTap() {
    console.log("导航栏按钮被点击");
    // 使用全局事件触发
    uni.$emit('showActionMenu');
  }
}
</script>

<script setup>
import { ref, onMounted, onUnmounted  } from 'vue';
import { listNotices, getArticleBanner } from '@/api/notice';
import { onShow, onPullDownRefresh } from '@dcloudio/uni-app';

const notices = ref([]);
const banners = ref([]); // 轮播图数据
const loading = ref(false);
const userId = uni.getStorageSync('userId') || 'default_user'; // 防止 undefined
const showActionMenu = ref(false);

// 获取用户角色（用于权限判断）
const getUserRole = () => {
  const userInfo = uni.getStorageSync('userInfo');
  return userInfo?.role || 'user';
};


// 检查是否为管理员
const isAdmin = () => {
  return getUserRole() === 'ADMIN';
};

// 区域每日任务（固定项，针对普通 user）
const dailyTasks = [
  //{ icon: 'calendar', title: '巡检设备', desc: '检查设备运行', route: '/pages/position/temperature-humidity' },
  { icon: 'warning', title: '6S任务', desc: '填写6s任务', route: '/pages/sixs/sixs' },
  //{ icon: 'file-text', title: '填写日报', desc: '提交今日产量', route: '/pages/produce/production-info' }
];

// 点击每日任务项
const handleDailyTaskClick = (task) => {
  if (!task || !task.route) {
    uni.showToast({ title: '功能暂不支持', icon: 'none' });
    return;
  }
  const tabPages = ['/pages/user/my', '/pages/user/notice-list', '/pages/tools/index'];
  if (tabPages.includes(task.route)) {
    uni.switchTab({ url: task.route });
  } else {
    uni.navigateTo({ url: task.route }).catch(() => {
      uni.showToast({ title: '打开页面失败', icon: 'none' });
    });
  }
};

// 格式化时间（用于列表显示）
const formatDate = (timestamp) => {
  return new Date(timestamp).toLocaleString('zh-CN');
};

// 判断是否已读
const isRead = (notice) => {
  return notice.isRead || false;
};

// 查看公告详情
const viewDetail = (notice) => {
  const id = notice.noticeId || notice.id;
  uni.navigateTo({
    url: `/pages/user/detail?id=${id}&userId=${userId}`
  });
};

// 处理添加信息
const handleAddInfo = () => {
  showActionMenu.value = false;
  uni.navigateTo({
    url: '/pages/user/publish-notice'
  });
};

// 处理管理宣传信息
const handleManagePromotion = () => {
  showActionMenu.value = false;
  if (isAdmin()) {
    uni.navigateTo({
      url: '/pages/admin/manage-promotion'
    });
  } else {
    uni.showToast({
      title: '权限不足',
      icon: 'none'
    });
  }
};

// 加载轮播图（独立接口）
const loadBanners = async () => {
  try {
    const response = await getArticleBanner(); 
	// console.log(response)
    // 根据实际返回结构调整，假设返回的是数组，每项有 imageUrl 和 noticeId
    const data = response.data || response || [];
    banners.value = data.map(item => ({
      id: item.id,
      imageUrl: item.coverImage,
    })).filter(item => item.imageUrl); // 过滤掉无图的
  } catch (err) {
    console.error('加载轮播图失败:', err);
    uni.showToast({ title: '轮播图加载失败', icon: 'none' });
    banners.value = [];
  }
};

// 处理个人资料
const handleProfile = () => {
  showActionMenu.value = false;
  uni.navigateTo({
    url: '/pages/user/profile'
  });
};

// 处理退出登录
const handleLogout = () => {
  showActionMenu.value = false;
  uni.showModal({
    title: '确认退出',
    content: '确定要退出登录吗？',
    success: (res) => {
      if (res.confirm) {
        uni.clearStorageSync();
        uni.reLaunch({
          url: '/pages/index'
        });
      }
    }
  });
};

// 轮播图点击
const handleBannerClick = (index) => {
  const banner = banners.value[index];
  if (banner && banner.id) {
    uni.navigateTo({
      url: `/pages/admin/article-detail?id=${banner.id}`
    });
  }
};

// 加载公告（含轮播图提取）
const loadNotices = async () => {
  loading.value = true;
  try {
    const params = { userId };
    const response = await listNotices(params);
    const data = response.data || response || [];
    notices.value = data;
   
  } catch (err) {
    console.error('加载公告失败:', err);
    uni.showToast({ title: '加载失败', icon: 'none' });
    notices.value = [];
    banners.value = [];
  } finally {
    loading.value = false;
  }
};

// 新增：统一刷新函数
const refreshData = async () => {
  try {
    await Promise.all([
      loadNotices(),
      loadBanners()
    ]);
  } catch (err) {
    console.error('刷新失败:', err);
  } finally {
    uni.stopPullDownRefresh(); // 👈 必须调用！
  }
};

// 注册下拉刷新监听
onPullDownRefresh(refreshData);

// 页面显示时加载（支持 tabbar 页面刷新）
onShow(() => {
  loadNotices();
  loadBanners();
});

onMounted(() => {
  // 监听事件
    uni.$on('showActionMenu', showActionMenuFunc);
});

onUnmounted(() => {
  // 移除事件监听
  uni.$off('showActionMenu', showActionMenuFunc);
});

// 显示操作菜单
const showActionMenuFunc = () => {
  showActionMenu.value = true;
};

// 导出函数供页面方法使用
</script>


<style scoped>
.notice-list-container {
  padding: 10rpx 20rpx 20rpx 20rpx;
  background-color: #f5f5f5;
  min-height: 100vh;
  position: relative;
}

/* 轮播图区域样式 */
.banner-section {
  margin-bottom: 20rpx;
  border-radius: 12rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
}

.notice-list {
  /* 留空改为占位式样式，避免空规则提示 */
  padding-top: 10rpx;
}

/* 区域每日任务 */
.daily-task-section {
  background: #fff;
  padding: 20rpx;
  border-radius: 12rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04);
}
.daily-task-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10rpx;
}
.daily-task-title {
  font-size: 30rpx;
  color: #333;
}
.daily-task-sub {
  font-size: 24rpx;
  color: #999;
}
.daily-task-item-title {
  display: block;
  margin-top: 8rpx;
  font-size: 26rpx;
  color: #333;
  text-align: center;
}
.daily-task-item-desc {
  display: block;
  font-size: 20rpx;
  color: #8c8c8c;
  text-align: center;
}

.notice-item {
  padding: 30rpx;
  border-bottom: 1rpx solid #eee;
  background-color: #fff;
  border-radius: 10rpx;
  margin-bottom: 20rpx;
  position: relative;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
}

.notice-item h3 {
  margin-top: 0;
  margin-bottom: 15rpx;
  font-size: 32rpx;
  color: #333;
}

.time {
  color: #999;
  font-size: 24rpx;
}

.status {
  position: absolute;
  right: 30rpx;
  top: 30rpx;
  font-size: 24rpx;
  padding: 5rpx 15rpx;
  border-radius: 20rpx;
  background-color: #ff9900;
  color: white;
}

.status.read {
  background-color: #19be6b;
}

/* 右上角弹出菜单样式 */
.action-menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.4);
  z-index: 9998;
  display: flex;
  justify-content: flex-end;
  align-items: flex-start;
  padding-top: 120rpx; /* 调整顶部间距，避开导航栏 */
  padding-right: 20rpx;
}

.action-menu {
  background-color: #fff;
  border-radius: 12rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.15);
  min-width: 300rpx;
  max-width: 400rpx;
  overflow: hidden;
}

.action-menu-item {
  display: flex;
  align-items: center;
  padding: 25rpx 30rpx;
  border-bottom: 1rpx solid #f0f0f0;
  transition: background-color 0.2s;
}

.action-menu-item:last-child {
  border-bottom: none;
}

.action-menu-item:active {
  background-color: #f5f5f5;
}

.action-menu-icon {
  font-size: 36rpx;
  margin-right: 20rpx;
  width: 40rpx;
}

.action-menu-text {
  font-size: 28rpx;
  color: #333;
  flex: 1;
}
</style>
