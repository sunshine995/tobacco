<template>
  <view class="equipment-maintenance-page">
    <!-- 1. 顶部轮播图（设备保养场景/重点设备） -->
    <!-- <up-swiper
      :list="swiperList"
      keyName="image"
      showTitle
      :autoplay="false"
      circular
      :height="220"  
      indicator-color="#fff"
      indicator-active-color="#38a169"
    ></up-swiper> -->

    <!-- 2. 保养页面基本信息（标题+更新时间+适用设备） -->
    <view class="maintenance-header">
      <text class="maintenance-title">烟草行业专用设备保养维护规程（2025版）</text>
      <view class="maintenance-meta">
        <text class="meta-item">
          <up-icon name="calendar" size="12" color="#909399" class="meta-icon" />
          2025-09-05（最新修订）
        </text>
        <text class="meta-item">
          <up-icon name="equipment" size="12" color="#909399" class="meta-icon" />
          全系列烟草生产专用设备
        </text>
        <text class="meta-item">
          <up-icon name="author" size="12" color="#909399" class="meta-icon" />
          设备管理部+技术保障部联合编制
        </text>
      </view>
    </view>

    <!-- 3. 保养核心内容（图文结合） -->
    <view class="maintenance-content">
      <!-- 前言段落 -->
      <view class="content-paragraph">
        设备保养是保障烟草生产连续性、稳定性和产品质量的关键环节，通过预防性维护减少故障发生率，延长设备使用寿命，降低运维成本。本规程基于烟草设备特性（高精度、高负荷、多粉尘环境）制定，明确日常保养、定期保养、专项保养的标准流程、操作要求和质量验收规范，适用于烟草加工企业所有生产设备的保养工作。
      </view>

      <!-- 核心章节：保养分类与周期 -->
      <view class="content-image-group">
        <view class="subtitle-bar">
          <text class="content-subtitle">一、保养分类与执行周期</text>
          <view class="subtitle-line"></view>
        </view>
        <image 
          src="https://cdn.uviewui.com/uview/album/14.jpg" 
          class="content-image" 
          mode="widthFix"
          lazy-load 
        ></image>
        <view class="content-paragraph">
          <strong>1. 日常保养（日保）：</strong>每日生产前/后各1次，由操作人员负责，重点清洁、检查、润滑基础部位；<br>
          <strong>2. 定期保养（周保/月保/季保）：</strong>周保每周1次（停机2小时），月保每月1次（停机4小时），季保每3个月1次（停机8小时），由维修人员+操作人员联合执行；<br>
          <strong>3. 专项保养（年保/大修保养）：</strong>每年1次，结合设备运行数据和故障记录，进行全面拆解、检测、校准、更换老化部件，由技术团队主导执行；<br>
          <strong>4. 特殊保养：</strong>设备长期停机（超过7天）前后、恶劣环境（高温/高湿/多尘）下、重大生产任务前的专项检查保养。
        </view>
      </view>

      <!-- 核心章节：日常保养操作规范 -->
      <view class="content-image-group">
        <view class="subtitle-bar">
          <text class="content-subtitle">二、日常保养核心操作规范</text>
          <view class="subtitle-line"></view>
        </view>
        <image 
          src="https://cdn.uviewui.com/uview/album/15.jpg" 
          class="content-image" 
          mode="widthFix"
          lazy-load
        ></image>
        <view class="content-paragraph">
          <strong>1. 清洁保养：</strong>用专用除尘工具（防静电毛刷、高压吹风机）清理设备表面、传动机构、传感器、散热口的烟草粉尘和杂物；严禁用水直接冲洗电气部件，可用酒精擦拭油污；<br>
          <strong>2. 检查确认：</strong>查看设备运行参数（温度、压力、转速）是否正常，紧固松动的螺丝、连接件，检查安全防护装置（防护罩、急停按钮）完整性；<br>
          <strong>3. 润滑保养：</strong>按设备说明书要求，对传动轴承、齿轮、导轨等部位加注指定型号润滑油/脂，油量符合标准（以油窗刻度为准），避免过量或错加；<br>
          <strong>4. 记录填写：</strong>如实填写《设备日常保养记录表》，注明清洁部位、检查结果、润滑情况、发现的异常问题及处理措施。
        </view>
      </view>

      <!-- 核心章节：重点设备保养标准 -->
      <view class="content-image-group">
        <view class="subtitle-bar">
          <text class="content-subtitle">三、重点设备专项保养标准</text>
          <view class="subtitle-line"></view>
        </view>
        <image 
          src="https://cdn.uviewui.com/uview/album/16.jpg" 
          class="content-image" 
          mode="widthFix"
          lazy-load
        ></image>
        <view class="content-paragraph">
          <strong>1. 卷烟机保养：</strong>日保清洁烟支成型通道、切刀组；周保校准烟支长度传感器、调整胶水喷涂量；月保检查传动皮带张力、清理烟丝残留死角；季保拆解保养吸丝嘴、校准刀辊精度；<br>
          <strong>2. 切丝机保养：</strong>日保清洁刀辊、清理送料机构；周保检查刀片锋利度、调整间隙；月保润滑齿轮箱、校准送料速度；季保更换刀片、检测电机运行电流；<br>
          <strong>3. 包装机保养：</strong>日保清洁包装膜牵引机构、热封装置；周保检查包装膜张力传感器、清理静电消除器；月保校准计数装置、润滑链条；季保拆解保养成型模具、检测热封温度均匀性；<br>
          <strong>4. 烘丝机保养：</strong>日保清洁热风管道过滤网；周保检查温度控制系统、清理料筒内壁；月保校准湿度传感器、检查加热管；季保拆解清理换热装置、检测风机平衡。
        </view>
      </view>

      <!-- 核心章节：保养安全与质量要求 -->
      <view class="content-image-group">
        <view class="subtitle-bar">
          <text class="content-subtitle">四、保养安全与质量验收</text>
          <view class="subtitle-line"></view>
        </view>
        <image 
          src="https://cdn.uviewui.com/uview/album/17.jpg" 
          class="content-image" 
          mode="widthFix"
          lazy-load
        ></image>
        <view class="content-paragraph">
          <strong>1. 保养安全要求：</strong>保养前切断电源/气源，悬挂“保养中”警示牌；穿戴防静电工作服、防护手套、护目镜；使用符合安全标准的工具和耗材（如食品级润滑油）；高空作业系安全带，狭小空间保证通风；<br>
          <strong>2. 质量验收标准：</strong>清洁度（无可见粉尘、油污）、紧固度（连接件无松动）、润滑度（运行无异常噪音）、参数精度（符合设备出厂标准±5%）、安全装置（100%有效）；<br>
          <strong>3. 异常处理：</strong>保养中发现重大故障（如部件裂纹、参数严重偏差），立即停止保养，上报设备管理部门，启动故障维修流程，严禁带故障继续运行；<br>
          <strong>4. 档案管理：</strong>所有保养记录（含过程照片、检测数据）归档至设备电子档案，保存期不少于3年，作为设备大修、报废评估的依据。
        </view>
      </view>
    </view>

    <!-- 4. 视频教程模块 -->
    <view class="video-module">
      <view class="module-header">
        <text class="module-title">设备保养视频教程</text>
        <text class="module-tag">必修</text>
      </view>
      <video
        :src="videoUrl"
        :controls="true"  
        :autoplay="false" 
        :loop="false" 
        class="maintenance-video"
        poster="https://cdn.uviewui.com/uview/album/18.jpg" 
        controlsColor="#fff"
        controlsBackgroundColor="rgba(0,0,0,0.6)"
      ></video>
      <text class="video-desc">视频时长：01:12:56 | 内容：日常保养实操演示+重点设备保养标准+安全操作规范+常见问题处理</text>
    </view>

    <!-- 5. 附件下载模块 -->
    <view class="attachment-module">
      <view class="module-header">
        <text class="module-title">保养相关文件下载</text>
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
            color="#38a169"
            class="attachment-icon"
          ></up-icon>
          <view class="attachment-info">
            <text class="attachment-name">{{ item.name }}</text>
            <text class="attachment-size">{{ item.size }}</text>
          </view>
          <up-icon
            name="download"
            size="18"
            color="#38a169"
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

// 1. 轮播图数据（设备保养场景图）
const swiperList = reactive([
  {
    image: 'https://cdn.uviewui.com/uview/swiper/swiper10.png',
    title: '设备日常保养规范'
  },
  {
    image: 'https://cdn.uviewui.com/uview/swiper/swiper11.png',
    title: '重点设备保养流程'
  },
  {
    image: 'https://cdn.uviewui.com/uview/swiper/swiper12.png',
    title: '保养安全操作标准'
  }
]);

// 2. 视频地址（保养教程视频）
const videoUrl = ref('https://cdn.uviewui.com/uview/video/equipment-maintenance.mp4');

// 3. 附件下载列表（保养相关文件）
const attachmentList = reactive([
  {
    name: '烟草设备保养维护规程（2025版）.pdf',
    size: '5.2MB',
    url: 'https://cdn.uviewui.com/uview/file/equipment-maintenance-2025.pdf'
  },
  {
    name: '设备保养周期与责任分工表.xlsx',
    size: '1.3MB',
    url: 'https://cdn.uviewui.com/uview/file/maintenance-cycle.xlsx'
  },
  {
    name: '日常保养记录表模板.docx',
    size: '860KB',
    url: 'https://cdn.uviewui.com/uview/file/daily-maintenance-record.docx'
  },
  {
    name: '重点设备保养操作手册（图文版）.pdf',
    size: '6.8MB',
    url: 'https://cdn.uviewui.com/uview/file/key-equipment-maintenance.pdf'
  },
  {
    name: '设备润滑油脂选型与使用规范.xlsx',
    size: '980KB',
    url: 'https://cdn.uviewui.com/uview/file/lubrication-standard.xlsx'
  },
  {
    name: '保养质量验收 checklist.docx',
    size: '720KB',
    url: 'https://cdn.uviewui.com/uview/file/maintenance-acceptance.docx'
  }
]);

// 4. 互动状态（点赞/收藏）
const isLiked = ref(false);
const likeCount = ref(132);
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

.equipment-maintenance-page {
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

  // 2. 保养页面头部信息样式
  .maintenance-header {
    padding: 24rpx 20rpx;
    background-color: #fff;
    margin: 16rpx 16rpx 0;
    border-radius: 16rpx;
    box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);

    .maintenance-title {
      font-size: 22px;
      font-weight: 600;
      color: #2d3748;
      line-height: 1.6;
      margin-bottom: 16rpx;
      display: block;
    }

    .maintenance-meta {
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

  // 3. 保养内容样式
  .maintenance-content {
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
        color: #38a169;  // 设备保养主色（健康绿）
        display: block;
        flex-shrink: 0;
      }

      .subtitle-line {
        flex: 1;
        height: 1px;
        background-color: #eaf6fa;
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
      background-color: #38a169;
      padding: 2rpx 12rpx;
      border-radius: 20rpx;
    }

    .maintenance-video {
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