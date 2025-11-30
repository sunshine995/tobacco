<template>
  <view class="policy-meeting-page">
    <!-- 1. 顶部轮播图（政策会议封面/重点图片） -->
    <!-- <up-swiper
      :list="swiperList"
      keyName="image"
      showTitle
      :autoplay="false"
      circular
      :height="220"  
      indicator-color="#fff"
      indicator-active-color="#25b579"
    ></up-swiper> -->

    <!-- 2. 会议基本信息（标题+发布时间+阅读量） -->
    <view class="meeting-header">
      <text class="meeting-title">2025年度烟草行业安全生产政策解读会议</text>
      <view class="meeting-meta">
        <text class="meta-item">
          <up-icon name="calendar" size="12" color="#909399" class="meta-icon" />
          2025-10-26
        </text>
        <text class="meta-item">
          <up-icon name="eye" size="12" color="#909399" class="meta-icon" />
          238次阅读
        </text>
        <text class="meta-item">
          <up-icon name="source" size="12" color="#909399" class="meta-icon" />
          行业政策部
        </text>
      </view>
    </view>

    <!-- 3. 政策核心内容（图文结合） -->
    <view class="meeting-content">
      <!-- 文字段落 -->
      <view class="content-paragraph">
        为深入贯彻落实国家安全生产相关法律法规，强化烟草行业生产安全管理，保障员工生命财产安全和企业稳定发展，特召开本次政策解读会议。会议重点围绕以下核心内容展开：
      </view>

      <!-- 图文结合模块 -->
      <view class="content-image-group">
        <view class="subtitle-bar">
          <text class="content-subtitle">一、本次政策核心目标</text>
          <view class="subtitle-line"></view>
        </view>
        <image 
          src="https://cdn.uviewui.com/uview/album/1.jpg" 
          class="content-image" 
          mode="widthFix"
          lazy-load 
        ></image>
        <view class="content-paragraph">
          1. 建立健全安全生产责任体系，明确各级岗位安全职责；<br>
          2. 强化设备安全管理，定期开展设备检修与保养；<br>
          3. 加强员工安全培训，提升安全操作技能和应急处置能力；<br>
          4. 完善安全隐患排查机制，实现闭环管理。
        </view>
      </view>

      <view class="content-image-group">
        <view class="subtitle-bar">
          <text class="content-subtitle">二、重点执行要求</text>
          <view class="subtitle-line"></view>
        </view>
        <image 
          src="https://cdn.uviewui.com/uview/album/2.jpg" 
          class="content-image" 
          mode="widthFix"
          lazy-load
        ></image>
        <view class="content-paragraph">
          1. 各部门需在11月30日前完成本部门安全责任清单修订；<br>
          2. 每月5日前上报上月设备安全检查报告；<br>
          3. 新员工入职必须参加不少于8小时的安全培训并考核合格；<br>
          4. 安全隐患需在24小时内响应，72小时内完成整改。
        </view>
      </view>
    </view>

    <!-- 4. 视频学习模块 -->
    <view class="video-module">
      <view class="module-header">
        <text class="module-title">会议视频学习</text>
        <text class="module-tag">必学</text>
      </view>
      <!-- 原生视频组件，添加阴影和圆角 -->
      <video
        :src="videoUrl"
        :controls="true"  
        :autoplay="false" 
        :loop="false" 
        class="meeting-video"
        poster="https://cdn.uviewui.com/uview/album/3.jpg" 
        controlsColor="#fff"
        controlsBackgroundColor="rgba(0,0,0,0.6)"
      ></video>
      <text class="video-desc">视频时长：01:23:45 | 内容：政策全文解读+案例分析</text>
    </view>

    <!-- 5. 附件下载模块 -->
    <view class="attachment-module">
      <view class="module-header">
        <text class="module-title">相关附件下载</text>
        <text class="module-count">{{ attachmentList.length }}个文件</text>
      </view>
      <up-grid
        :border="false"
        column-num="1"  
        class="attachment-grid"
      >
        <up-grid-item
          v-for="(item, index) in attachmentList"
          :key="index"
          @click="downloadAttachment(item)"
          class="attachment-item"
        >
          <up-icon
            name="file-text"
            size="22"
            color="#25b579"
            class="attachment-icon"
          ></up-icon>
          <view class="attachment-info">
            <text class="attachment-name">{{ item.name }}</text>
            <text class="attachment-size">{{ item.size }}</text>
          </view>
          <up-icon
            name="download"
            size="18"
            color="#25b579"
            class="download-icon"
          ></up-icon>
        </up-grid-item>
      </up-grid>
    </view>
  <!-- 提示组件 -->
    <up-toast ref="uToastRef" />
  </view>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const uToastRef = ref(null);

// 1. 轮播图数据（政策会议封面图）
const swiperList = reactive([
  {
    image: 'https://cdn.uviewui.com/uview/swiper/swiper2.png',
    title: '安全生产政策解读会议'
  },
  {
    image: 'https://cdn.uviewui.com/uview/swiper/swiper1.png',
    title: '安全责任体系建设'
  },
  {
    image: 'https://cdn.uviewui.com/uview/swiper/swiper3.png',
    title: '设备安全管理要求'
  }
]);

// 2. 视频地址（替换为实际视频链接，支持 mp4 格式）
const videoUrl = ref('https://cdn.uviewui.com/uview/video/test.mp4');

// 3. 附件下载列表
const attachmentList = reactive([
  {
    name: '2025安全生产政策全文.pdf',
    size: '2.3MB',
    url: 'https://cdn.uviewui.com/uview/file/test.pdf'  // 实际下载链接
  },
  {
    name: '安全责任清单模板.xlsx',
    size: '1.1MB',
    url: 'https://cdn.uviewui.com/uview/file/test.xlsx'
  },
  {
    name: '设备安全检查记录表.docx',
    size: '896KB',
    url: 'https://cdn.uviewui.com/uview/file/test.docx'
  }
]);

// 4. 互动状态（点赞/收藏）
const isLiked = ref(false);
const likeCount = ref(126);
const isCollected = ref(false);

// 5. 附件下载方法
const downloadAttachment = (item) => {
  uToastRef.value.success(`开始下载：${item.name}`);
  console.log('下载链接：', item.url);
};

// 6. 互动方法（点赞/收藏/分享）
const handleLike = () => {
  isLiked.value = !isLiked.value;
  likeCount.value = isLiked.value ? likeCount.value + 1 : likeCount.value - 1;
  uToastRef.value.success(isLiked.value ? '点赞成功' : '取消点赞');
};

const handleCollect = () => {
  isCollected.value = !isCollected.value;
  uToastRef.value.success(isCollected.value ? '收藏成功' : '取消收藏');
};

const handleShare = () => {
  uToastRef.value.success('分享功能已触发');
};
</script>

<style lang="scss">
/* 全局样式重置与基础配置 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

page {
  background-color: #f5f7fa;
}

.policy-meeting-page {
  padding-bottom: 90rpx;  // 给底部操作栏留足空间
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

  // 1. 轮播图样式优化
  .up-swiper {
    border-radius: 0 0 20rpx 20rpx;
    overflow: hidden;
    box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);  // 添加轻微阴影，提升层次感

    .up-swiper-item {
      position: relative;

      &::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 60rpx;
        background: linear-gradient(to top, rgba(0,0,0,0.6), transparent);  // 底部渐变遮罩，提升文字可读性
      }
    }

    .up-swiper-title {
      font-size: 16px;
      font-weight: 500;
      z-index: 1;  // 确保标题在遮罩上方
    }
  }

  // 2. 会议头部信息样式
  .meeting-header {
    padding: 24rpx 20rpx;
    background-color: #fff;
    margin: 16rpx 16rpx 0;
    border-radius: 16rpx;
    box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);

    .meeting-title {
      font-size: 22px;
      font-weight: 600;
      color: #2d3748;
      line-height: 1.6;
      margin-bottom: 16rpx;
      display: block;
    }

    .meeting-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 20rpx;
      font-size: 13px;
      color: #718096;

      .meta-item {
        display: flex;
        align-items: center;
        gap: 6rpx;
      }

      .meta-icon {
        margin-top: 2rpx;
      }
    }
  }

  // 3. 会议内容样式
  .meeting-content {
    padding: 24rpx 20rpx;
    background-color: #fff;
    margin: 16rpx;
    border-radius: 16rpx;
    box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);

    .content-paragraph {
      font-size: 15px;
      color: #4a5568;
      line-height: 2.0;
      margin-bottom: 28rpx;
      text-indent: 2em;
    }

    // 小标题样式优化（带分割线）
    .subtitle-bar {
      display: flex;
      align-items: center;
      margin: 40rpx 0 20rpx;

      .content-subtitle {
        font-size: 18px;
        font-weight: 600;
        color: #25b579;
        display: block;
        flex-shrink: 0;
      }

      .subtitle-line {
        flex: 1;
        height: 1px;
        background-color: #e8f4f0;
        margin-left: 16rpx;
      }
    }

    .content-image-group {
      margin-bottom: 36rpx;

      .content-image {
        width: 100%;
        border-radius: 12rpx;
        margin-bottom: 20rpx;
        box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
      }
    }
  }

  // 4. 视频模块样式
  .video-module {
    padding: 24rpx 20rpx;
    background-color: #fff;
    margin: 0 16rpx 16rpx;
    border-radius: 16rpx;
    box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);

    // 模块标题栏（带标签）
    .module-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20rpx;
    }

    .module-title {
      font-size: 18px;
      font-weight: 600;
      color: #2d3748;
      display: block;
    }

    .module-tag {
      font-size: 11px;
      color: #fff;
      background-color: #25b579;
      padding: 2rpx 12rpx;
      border-radius: 20rpx;
    }

    .meeting-video {
      width: 100%;
      height: 240px;
      border-radius: 12rpx;
      background-color: #000;
      overflow: hidden;
    }

    .video-desc {
      font-size: 13px;
      color: #718096;
      margin-top: 16rpx;
      display: block;
      line-height: 1.6;
    }
  }

  // 5. 附件模块样式
  .attachment-module {
    padding: 24rpx 20rpx;
    background-color: #fff;
    margin: 0 16rpx 16rpx;
    border-radius: 16rpx;
    box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);

    .module-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20rpx;
    }

    .module-count {
      font-size: 13px;
      color: #718096;
    }

    .attachment-grid {
      --up-grid-item-padding: 0;

      .attachment-item {
        display: flex;
        align-items: center;
        padding: 16rpx 0;
        border-bottom: 1px solid #f5f5f5;

        &:last-child {
          border-bottom: none;
        }

        &:active {
          background-color: #fafafa;
        }
      }

      .attachment-icon {
        margin-right: 16rpx;
      }

      .attachment-info {
        flex: 1;
      }

      .attachment-name {
        font-size: 15px;
        color: #2d3748;
        display: block;
        line-height: 1.4;
      }

      .attachment-size {
        font-size: 12px;
        color: #a0aec0;
        margin-top: 4rpx;
        display: block;
      }

      .download-icon {
        align-self: center;
        margin-left: 12rpx;
      }
    }
  }
}
</style>