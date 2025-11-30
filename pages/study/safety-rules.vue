<template>
  <view class="tobacco-safety-page">
    <!-- 1. 顶部轮播图（安全准则封面/重点场景） -->
    <!-- <up-swiper
      :list="swiperList"
      keyName="image"
      showTitle
      :autoplay="false"
      circular
      :height="220"  
      indicator-color="#fff"
      indicator-active-color="#e53e3e"
    ></up-swiper> -->

    <!-- 2. 准则基本信息（标题+更新时间+适用范围） -->
    <view class="safety-header">
      <text class="safety-title">烟草行业生产安全管理准则（2025版）</text>
      <view class="safety-meta">
        <text class="meta-item">
          <up-icon name="calendar" size="12" color="#909399" class="meta-icon" />
          2025-09-15（最新修订）
        </text>
        <text class="meta-item">
          <up-icon name="users" size="12" color="#909399" class="meta-icon" />
          全行业适用
        </text>
        <text class="meta-item">
          <up-icon name="verify" size="12" color="#909399" class="meta-icon" />
          国家烟草专卖局发布
        </text>
      </view>
    </view>

    <!-- 3. 准则核心内容（图文结合） -->
    <view class="safety-content">
      <!-- 前言段落 -->
      <view class="content-paragraph">
        为规范烟草行业生产经营活动中的安全管理行为，防范化解各类安全风险，保障员工生命安全、企业财产安全和烟草产品质量安全，依据《中华人民共和国安全生产法》《烟草专卖法》等法律法规，制定本准则。本准则适用于烟草种植、加工、仓储、运输、销售全链条生产经营单位。
      </view>

      <!-- 核心章节：生产车间安全 -->
      <view class="content-image-group">
        <view class="subtitle-bar">
          <text class="content-subtitle">一、生产车间安全规范</text>
          <view class="subtitle-line"></view>
        </view>
        <image 
          src="https://cdn.uviewui.com/uview/album/4.jpg" 
          class="content-image" 
          mode="widthFix"
          lazy-load 
        ></image>
        <view class="content-paragraph">
          1. 烟草加工设备（切丝机、卷烟机、包装机等）每日开机前必须进行安全检查，重点排查电路、机械传动部件、防护装置完整性；<br>
          2. 操作人员必须穿戴防静电工作服、防滑鞋，严禁佩戴首饰、长发外露等可能卷入设备的物品；<br>
          3. 车间内严禁吸烟、动用明火，动火作业需办理专项审批手续，配备灭火器材和监护人员；<br>
          4. 粉尘浓度需控制在国家标准范围内，定期清理设备及地面烟草粉尘，防止粉尘爆炸风险。
        </view>
      </view>

      <!-- 核心章节：仓储物流安全 -->
      <view class="content-image-group">
        <view class="subtitle-bar">
          <text class="content-subtitle">二、仓储物流安全规范</text>
          <view class="subtitle-line"></view>
        </view>
        <image 
          src="https://cdn.uviewui.com/uview/album/5.jpg" 
          class="content-image" 
          mode="widthFix"
          lazy-load
        ></image>
        <view class="content-paragraph">
          1. 烟草原料、成品仓储需分类堆放，垛高不超过3.5米，垛间距不小于0.8米，通道宽度不小于1.5米；<br>
          2. 仓库需配备温湿度控制系统，温度保持在18-22℃，湿度55%-65%，防止烟草霉变和自燃；<br>
          3. 运输车辆需符合危险品运输标准（烟草属易燃品），配备防火、防潮设施，严禁与易燃易爆物品混装；<br>
          4. 仓储区域安装烟感报警器、自动灭火系统，每月开展1次消防演练，每季度检查消防设施有效性。
        </view>
      </view>

      <!-- 核心章节：电气与消防安全 -->
      <view class="content-image-group">
        <view class="subtitle-bar">
          <text class="content-subtitle">三、电气与消防安全规范</text>
          <view class="subtitle-line"></view>
        </view>
        <image 
          src="https://cdn.uviewui.com/uview/album/6.jpg" 
          class="content-image" 
          mode="widthFix"
          lazy-load
        ></image>
        <view class="content-paragraph">
          1. 车间、仓库电气设备需采用防爆、防潮设计，电线套管保护，严禁私拉乱接电线；<br>
          2. 消防器材需定点摆放、标识清晰，员工需熟练掌握灭火器、消防栓使用方法；<br>
          3. 建立24小时值班制度，重点区域安装监控设备，异常情况及时上报处置；<br>
          4. 每年开展不少于2次全员消防安全培训，新员工上岗前必须通过安全考核。
        </view>
      </view>

      <!-- 核心章节：职业健康安全 -->
      <view class="content-image-group">
        <view class="subtitle-bar">
          <text class="content-subtitle">四、职业健康安全规范</text>
          <view class="subtitle-line"></view>
        </view>
        <image 
          src="https://cdn.uviewui.com/uview/album/7.jpg" 
          class="content-image" 
          mode="widthFix"
          lazy-load
        ></image>
        <view class="content-paragraph">
          1. 长期接触烟草粉尘、化学添加剂的员工，每年进行1次职业健康体检，建立健康档案；<br>
          2. 车间配备通风除尘设备，操作人员佩戴防尘口罩、防护手套等个人防护用品；<br>
          3. 合理安排工作时长，避免长时间高强度作业，保障员工休息权益；<br>
          4. 设立职业健康咨询点，提供安全防护指导和心理健康疏导服务。
        </view>
      </view>
    </view>

    <!-- 4. 视频学习模块 -->
    <view class="video-module">
      <view class="module-header">
        <text class="module-title">安全准则视频培训</text>
        <text class="module-tag">必学</text>
      </view>
      <video
        :src="videoUrl"
        :controls="true"  
        :autoplay="false" 
        :loop="false" 
        class="safety-video"
        poster="https://cdn.uviewui.com/uview/album/8.jpg" 
        controlsColor="#fff"
        controlsBackgroundColor="rgba(0,0,0,0.6)"
      ></video>
      <text class="video-desc">视频时长：01:08:32 | 内容：准则全文解读+典型安全事故案例分析+实操规范演示</text>
    </view>

    <!-- 5. 附件下载模块 -->
    <view class="attachment-module">
      <view class="module-header">
        <text class="module-title">相关文件下载</text>
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
            color="#e53e3e"
            class="attachment-icon"
          ></up-icon>
          <view class="attachment-info">
            <text class="attachment-name">{{ item.name }}</text>
            <text class="attachment-size">{{ item.size }}</text>
          </view>
          <up-icon
            name="download"
            size="18"
            color="#e53e3e"
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

// 1. 轮播图数据（安全准则封面图）
const swiperList = reactive([
  {
    image: 'https://cdn.uviewui.com/uview/swiper/swiper4.png',
    title: '烟草生产安全准则'
  },
  {
    image: 'https://cdn.uviewui.com/uview/swiper/swiper5.png',
    title: '车间安全操作规范'
  },
  {
    image: 'https://cdn.uviewui.com/uview/swiper/swiper6.png',
    title: '仓储消防安全管理'
  }
]);

// 2. 视频地址（安全培训视频）
const videoUrl = ref('https://cdn.uviewui.com/uview/video/safety-training.mp4');

// 3. 附件下载列表（烟草安全相关文件）
const attachmentList = reactive([
  {
    name: '烟草行业生产安全管理准则（2025版）.pdf',
    size: '3.7MB',
    url: 'https://cdn.uviewui.com/uview/file/tobacco-safety-2025.pdf'
  },
  {
    name: '烟草车间安全检查记录表模板.xlsx',
    size: '1.5MB',
    url: 'https://cdn.uviewui.com/uview/file/safety-check-template.xlsx'
  },
  {
    name: '烟草仓储消防安全操作规程.docx',
    size: '980KB',
    url: 'https://cdn.uviewui.com/uview/file/storage-safety-doc.docx'
  },
  {
    name: '烟草行业安全事故案例汇编.pdf',
    size: '4.2MB',
    url: 'https://cdn.uviewui.com/uview/file/safety-accident-case.pdf'
  }
]);

// 4. 互动状态（点赞/收藏）
const isLiked = ref(false);
const likeCount = ref(98);
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

.tobacco-safety-page {
  padding-bottom: 90rpx;  // 给底部操作栏留足空间
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

  // 1. 轮播图样式优化
  .up-swiper {
    border-radius: 0 0 20rpx 20rpx;
    overflow: hidden;
    box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);

    .up-swiper-item {
      position: relative;

      &::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 60rpx;
        background: linear-gradient(to top, rgba(0,0,0,0.6), transparent);
      }
    }

    .up-swiper-title {
      font-size: 16px;
      font-weight: 500;
      z-index: 1;
    }
  }

  // 2. 准则头部信息样式
  .safety-header {
    padding: 24rpx 20rpx;
    background-color: #fff;
    margin: 16rpx 16rpx 0;
    border-radius: 16rpx;
    box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);

    .safety-title {
      font-size: 22px;
      font-weight: 600;
      color: #2d3748;
      line-height: 1.6;
      margin-bottom: 16rpx;
      display: block;
    }

    .safety-meta {
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

  // 3. 准则内容样式
  .safety-content {
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
        color: #e53e3e;  // 烟草行业安全主色（红色警示）
        display: block;
        flex-shrink: 0;
      }

      .subtitle-line {
        flex: 1;
        height: 1px;
        background-color: #fce4e4;
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
      background-color: #e53e3e;
      padding: 2rpx 12rpx;
      border-radius: 20rpx;
    }

    .safety-video {
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