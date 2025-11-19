<template>
  <view class="notice-detail">
    <view v-if="noticeDetail" class="content">
      <h2 class="title">{{ noticeDetail.title }}</h2>
      <view class="meta">
		  <text class="author">发布人: {{ noticeDetail.createdBy }}</text> <!-- 新增发布人 -->
        <text class="time">发布时间: {{ formatDate(noticeDetail.createdAt) }}</text>
        
      </view>
      <view class="body">
        <text class="content-text">{{ noticeDetail.content }}</text>
        <!-- 如果内容是富文本，可以使用 rich-text 组件 -->
        <!-- <rich-text :nodes="noticeDetail.content"></rich-text> -->
      </view>
	  
	  <!-- 图片展示区域 -->
	  <view v-if="noticeDetail.imagesUrl && noticeDetail.imagesUrl.length > 0" class="image-gallery">
	    <view class="gallery-title">附件图片</view>
	    <scroll-view scroll-x class="image-scroll-view">
	      <view class="image-list">
	        <image
	          v-for="(imgUrl, index) in noticeDetail.imagesUrl"
	          :key="index"
	          :src="imgUrl"
	          class="gallery-image"
	          mode="aspectFill"
	          @click="previewImage(index)"
	        />
	      </view>
	    </scroll-view>
	  </view>
	  
	  <!-- 管理员专属：未读用户列表（直接显示，无需按钮） -->
		<view v-if="isAdmin" class="admin-section">
		  <view class="section-header">
			<text class="section-title">未读用户 ({{ unreadCount }}人)</text>
		  </view>
		  <view class="user-list-container">
			<scroll-view scroll-y class="user-scroll-view">
			  <view v-if="unreadUsers.length > 0" class="user-list">
				<view
				  v-for="user in unreadUsers"
				  :key="user.userId"
				  class="user-item"
				>
				  {{ user.username }}
				</view>
			  </view>
			  <view v-else class="empty-tip">所有用户均已阅读</view>
			</scroll-view>
		  </view>
		</view>
		
    </view>
    <view v-else class="loading">
      <u-loading-icon> mode="circle"></u-loading-icon>
      <text>加载中...</text>
    </view>
	<view v-if="!hasRead" class="fixed-read-button-container">
	  <button class="fixed-read-button" @click="markAsRead">确认已阅</button>
	</view>
	
  </view>

</template>

<script setup>
import { ref, onMounted } from 'vue';
import { onLoad } from '@dcloudio/uni-app'
import { get, post } from '@/utils/request'; // 引入封装的请求方法

const noticeDetail = ref(null);
const noticeId = ref(null);
const currentUserId = ref(null)
const isAdmin = ref(false);

// 未读用户相关
const unreadUsers = ref([]);
const unreadCount = ref(0);

const hasRead = ref(false); // 新增：是否已点击“已阅”

onLoad((options) => {
  // options 对象包含了所有通过 url 传递的查询参数
  
  if (options && options.id && options.userId) {
    noticeId.value = options.id;
    currentUserId.value = options.userId; // 获取 userId

    const userRole = uni.getStorageSync('userInfo').role || '';
	console.log(uni.getStorageSync('userInfo'))
    isAdmin.value = userRole === 'ADMIN';
  } else {
    console.warn('缺少必要的参数 id 或 userId');
    uni.showToast({
      title: '参数不完整',
      icon: 'none'
    });
    // 可以选择返回上一页
    // uni.navigateBack();
  }
});

onMounted(async () => {

  if (!noticeId.value) {
    uni.showToast({ title: '参数错误', icon: 'none' });
    uni.navigateBack();
    return;
  }

  await loadNoticeDetail();
  //await markAsRead(); // 页面加载后立即标记为已读
  
  // 如果是管理员，自动加载未读用户列表
  if (isAdmin.value) {
	await loadUnreadUsers();
  }
});

const loadNoticeDetail = async () => {
  try {
    const response = await get(`/api/notice/detail`, {noticeId: noticeId.value});
    noticeDetail.value = response;
	console.log(noticeDetail)
  } catch (err) {
    console.error('获取公告详情失败:', err);
    uni.showToast({ title: '加载失败', icon: 'none' });
  }
};

// 加载未读用户列表
const loadUnreadUsers = async () => {
  try {
    const res = await get(`/api/notice/unreadUsers`, { noticeId: noticeId.value });
    const data = res.data || res; // 根据实际返回结构调整
	console.log(data)
    unreadUsers.value = data.users || [];
    unreadCount.value = data.unreadCount || unreadUsers.value.length;
  } catch (err) {
    console.error('获取未读用户失败:', err);
    unreadUsers.value = [];
    unreadCount.value = 0;
    // 可提示错误，或静默失败
  }
};

// 图片预览
const previewImage = (index) => {
  uni.previewImage({
    current: index,
    urls: noticeDetail.value.images
  });
};

const markAsRead = async () => {
  if (!noticeId.value || hasRead.value) return;
  try {
    // 调用后端 API 标记为已读
    // 假设后端需要 userId，这里从 storage 获取
    // const userId = uni.getStorageSync('userId') || 1;
    await post(`/api/notice/markAsRead`, { noticeId: noticeId.value, userId: currentUserId.value });
    console.log('公告已标记为已读');
	
	hasRead.value = true; // 标记为已读状态
	
    // 通知列表页刷新数据
    uni.$emit('noticeRead', { noticeId: noticeId.value });
	// 可选：提示用户
	uni.showToast({ title: '已确认阅读', icon: 'success' });
  } catch (err) {
    console.error('标记已读失败:', err);
    // 可以选择是否提示用户
  }
};

// 格式化时间戳
const formatDate = (timestamp) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
};
</script>

<style scoped>

	
.notice-detail {
  padding: 30rpx;
    background-color: #f8f8f8;
    min-height: 100vh;
    /* 留出底部按钮空间（可选） */
    padding-bottom: calc(120rpx + env(safe-area-inset-bottom)); /* 120rpx ≈ 按钮高度 */
}

.content {
  background-color: #ffffff;
  border-radius: 15rpx;
  padding: 30rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
  margin-top: 0;
  margin-bottom: 20rpx;
}

/* .meta {
  margin-bottom: 30rpx;
  padding-bottom: 20rpx;
  border-bottom: 1rpx solid #eee;
}

.time {
  font-size: 26rpx;
  color: #999;
} */

.meta {
  display: flex;
  justify-content: space-between; /* 左右对齐 */
  flex-wrap: wrap; /* 如果内容过长自动换行 */
  margin-bottom: 30rpx;
  padding-bottom: 20rpx;
  border-bottom: 1rpx solid #eee;
}

.time, .author {
  font-size: 26rpx;
  color: #999;
  margin: 10rpx 0;
}

.body {
  font-size: 30rpx;
  color: #666;
  line-height: 1.6;
}

.content-text {
  display: block;
  white-space: pre-wrap; /* 保留换行符 */
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 60vh;
}

.loading text {
  margin-top: 20rpx;
  color: #999;
}

.admin-section {
  margin-top: 40rpx;
  border-top: 1rpx solid #eee;
  padding-top: 30rpx;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.user-list-container {
  border: 1rpx solid #eee;
  border-radius: 12rpx;
  overflow: hidden;
  background-color: #fff;
}

.user-scroll-view {
  max-height: 400rpx;
  height: auto;
}

.user-list {
  padding: 20rpx;
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.user-item {
  padding: 16rpx 20rpx;
  background-color: #f8f8f8;
  border-radius: 8rpx;
  font-size: 28rpx;
  color: #555;
  border: 1rpx solid #eee;
}

.empty-tip {
  text-align: center;
  color: #999;
  font-size: 28rpx;
  padding: 40rpx 0;
  line-height: 1.5;
}

/* 固定按钮容器 */
.fixed-read-button-container {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20rpx 30rpx  env(safe-area-inset-bottom); /* 适配底部安全区（如iPhone X） */
  background-color: #fff;
  box-shadow: 0 -2rpx 10rpx rgba(0, 0, 0, 0.1);
  z-index: 999;
  display: flex;
  justify-content: center;
}

/* 固定按钮样式 */
.fixed-read-button {
  width: 100%;
  background-color: #00c853; /* 绿色：Material Design 成功绿 */
  color: #ffffff;
  font-size: 32rpx;
  font-weight: 500;
  padding: 30rpx 0;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 去除按钮默认样式 */
.fixed-read-button::after {
  border: none;
}

/* 可选：点击态效果 */
.fixed-read-button:hover {
  background-color: #00a040;
}

/* 图片画廊 */
.image-gallery {
  margin-top: 40rpx;
  border-top: 1rpx solid #eee;
  padding-top: 30rpx;
}

.gallery-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 20rpx;
}

.image-scroll-view {
  white-space: nowrap;
  max-height: 300rpx;
}

.image-list {
  display: inline-flex;
  gap: 20rpx;
}

.gallery-image {
  width: 200rpx;
  height: 200rpx;
  border-radius: 12rpx;
  object-fit: cover;
  border: 2rpx solid #eee;
}

.gallery-image:hover {
  transform: scale(1.02);
  transition: transform 0.2s;
}

</style>