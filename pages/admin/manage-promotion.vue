<template>
  <view class="manage-promotion-container">
    <!-- 顶部操作栏 -->
    <view class="action-bar">
      <u-search
        v-model="searchKeyword"
        placeholder="搜索宣传信息"
        :show-action="false"
        @search="handleSearch"
        @clear="handleSearchClear"
      ></u-search>
      <button class="add-btn" @click="handleAddPromotion">添加宣传</button>
    </view>

    <!-- 宣传信息列表 -->
    <view class="promotion-list">
      <view 
        v-for="item in promotionList" 
        :key="item.id" 
        class="promotion-item"
      >
        <!-- 信息内容 -->
        <view class="promotion-content" @click="viewDetail(item)">
          <image 
            v-if="item.coverImage" 
            :src="item.coverImage" 
            class="cover-image"
            mode="aspectFill"
          ></image>
          <view class="content-info">
            <text class="title">{{ item.title }}</text>
            <text class="description">{{ item.content || '暂无描述' }}</text>
            <text class="time">{{ formatDate(item.createdAt) }}</text>
          </view>
        </view>

        <!-- 操作区域 -->
        <view class="action-area">
          <!-- 轮播图开关 -->
          <view class="switch-group">
            <text class="switch-label">首页轮播</text>
            <switch 
              :checked="item.isBanner === 1" 
              @change="handleToggleCarousel(item, $event)"
              color="#2979ff"
            />
          </view>

          <!-- 操作按钮 -->
          <view class="action-buttons">
            <button class="edit-btn" @click="handleEdit(item)">编辑</button>
            <button class="delete-btn" @click="handleDelete(item)">删除</button>
          </view>
        </view>
      </view>

      <!-- 空状态 -->
      <u-empty 
        v-if="promotionList.length === 0 && !loading" 
        text="暂无宣传信息" 
        mode="list"
        marginTop="100"
      ></u-empty>

      <!-- 加载状态 -->
      <u-loading-page :loading="loading" loading-text="加载中..."></u-loading-page>
    </view>

    <!-- 删除确认对话框 -->
    <u-modal
      v-model="showDeleteModal"
      :content="`确定要删除【${currentItem?.title}】吗？`"
      show-cancel-button
      @confirm="confirmDelete"
    ></u-modal>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { getPromotionList, toggleCarousel } from '@/api/notice';

// 响应式数据
const promotionList = ref([]);
const loading = ref(false);
const searchKeyword = ref('');
const showDeleteModal = ref(false);
const currentItem = ref(null);

// API函数（需要根据你的后端接口实现）
const api = {
  
  // 删除宣传信息
  deletePromotion: async (id) => {
    return await uni.request({
      url: `/api/promotion/${id}`,
      method: 'DELETE'
    });
  }
};

// 检查管理员权限
const checkAdminPermission = () => {
  const userInfo = uni.getStorageSync('userInfo');
  if (userInfo?.role !== 'ADMIN') {
    uni.showToast({
      title: '权限不足',
      icon: 'none'
    });
    uni.navigateBack();
    return false;
  }
  return true;
};

// 加载宣传信息列表
const loadPromotionList = async () => {
  if (!checkAdminPermission()) return;
  
  loading.value = true;
  try {
    const params = {};
    if (searchKeyword.value) {
      params.keyword = searchKeyword.value;
    }
    
    const response = await getPromotionList(params);
	console.log(response)
    promotionList.value = response || [];
  } catch (error) {
    console.error('加载宣传信息失败:', error);
    uni.showToast({
      title: '加载失败',
      icon: 'none'
    });
  } finally {
    loading.value = false;
  }
};

// 格式化时间
const formatDate = (timestamp) => {
  if (!timestamp) return '';
  return new Date(timestamp).toLocaleString('zh-CN');
};

// 搜索处理
const handleSearch = () => {
  loadPromotionList();
};

const handleSearchClear = () => {
  searchKeyword.value = '';
  loadPromotionList();
};

// 切换轮播图状态
const handleToggleCarousel = async (item, event) => {
  const isInCarousel = event.detail.value;
  try {
    await toggleCarousel(item.id, isInCarousel);
    
    // 更新本地状态
    item.isInCarousel = isInCarousel;
    
    uni.showToast({
      title: isInCarousel ? '已添加到轮播图' : '已从轮播图移除',
      icon: 'success'
    });
  } catch (error) {
    console.error('切换轮播图状态失败:', error);
    uni.showToast({
      title: '操作失败',
      icon: 'none'
    });
    
    // 恢复原状态
    item.isInCarousel = !isInCarousel;
  }
};

// 查看详情
const viewDetail = (item) => {
  uni.navigateTo({
    url: `/pages/user/detail?id=${item.id}&type=promotion`
  });
};

// 添加宣传信息
const handleAddPromotion = () => {
  uni.navigateTo({
    url: '/pages/admin/article'
  });
};

// 编辑宣传信息
const handleEdit = (item) => {
  uni.navigateTo({
    url: `/pages/user/edit-promotion?id=${item.id}`
  });
};

// 删除宣传信息
const handleDelete = (item) => {
  currentItem.value = item;
  showDeleteModal.value = true;
};

const confirmDelete = async () => {
  if (!currentItem.value) return;
  
  try {
    await api.deletePromotion(currentItem.value.id);
    
    uni.showToast({
      title: '删除成功',
      icon: 'success'
    });
    
    // 重新加载列表
    loadPromotionList();
  } catch (error) {
    console.error('删除失败:', error);
    uni.showToast({
      title: '删除失败',
      icon: 'none'
    });
  } finally {
    showDeleteModal.value = false;
    currentItem.value = null;
  }
};

// 页面显示时加载数据
onShow(() => {
  loadPromotionList();
});

onMounted(() => {
  checkAdminPermission();
});
</script>

<style scoped>
.manage-promotion-container {
  padding: 20rpx;
  background-color: #f5f5f5;
  min-height: 100vh;
}

/* 顶部操作栏 */
.action-bar {
  display: flex;
  align-items: center;
  gap: 20rpx;
  margin-bottom: 20rpx;
}

.action-bar .u-search {
  flex: 1;
}

.add-btn {
  background-color: #2979ff;
  color: white;
  border: none;
  border-radius: 8rpx;
  padding: 20rpx 30rpx;
  font-size: 28rpx;
  white-space: nowrap;
}

.add-btn:active {
  background-color: #2b85e4;
}

/* 宣传信息列表 */
.promotion-list {
  border-radius: 12rpx;
  overflow: hidden;
}

.promotion-item {
  background-color: #fff;
  margin-bottom: 20rpx;
  border-radius: 12rpx;
  overflow: hidden;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
}

/* 信息内容区域 */
.promotion-content {
  display: flex;
  padding: 30rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.cover-image {
  width: 120rpx;
  height: 120rpx;
  border-radius: 8rpx;
  margin-right: 20rpx;
  flex-shrink: 0;
}

.content-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 10rpx;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.description {
  font-size: 28rpx;
  color: #666;
  margin-bottom: 10rpx;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.time {
  font-size: 24rpx;
  color: #999;
}

/* 操作区域 */
.action-area {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 30rpx;
}

.switch-group {
  display: flex;
  align-items: center;
  gap: 15rpx;
}

.switch-label {
  font-size: 28rpx;
  color: #666;
}

.action-buttons {
  display: flex;
  gap: 15rpx;
}

.edit-btn, .delete-btn {
  border: none;
  border-radius: 6rpx;
  padding: 12rpx 24rpx;
  font-size: 24rpx;
}

.edit-btn {
  background-color: #19be6b;
  color: white;
}

.delete-btn {
  background-color: #fa3534;
  color: white;
}

.edit-btn:active, .delete-btn:active {
  opacity: 0.8;
}
</style>