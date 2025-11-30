<template>
  <view class="equipment-repair-page">
    <!-- 1. 顶部轮播图（设备维修场景/重点设备） -->
    <!-- <up-swiper
      :list="swiperList"
      keyName="image"
      showTitle
      :autoplay="false"
      circular
      :height="220"  
      indicator-color="#fff"
      indicator-active-color="#1890ff"
    ></up-swiper> -->

    <!-- 2. 维修页面基本信息（标题+更新时间+适用设备） -->
    <view class="repair-header">
      <text class="repair-title">烟草行业专用设备维修保养规范（2025版）</text>
      <view class="repair-meta">
        <text class="meta-item">
          <up-icon name="calendar" size="12" color="#909399" class="meta-icon" />
          2025-08-20（最新修订）
        </text>
        <text class="meta-item">
          <up-icon name="equipment" size="12" color="#909399" class="meta-icon" />
          卷烟机/切丝机/包装机等
        </text>
        <text class="meta-item">
          <up-icon name="author" size="12" color="#909399" class="meta-icon" />
          设备技术部编制
        </text>
      </view>
    </view>

    <!-- 3. 维修核心内容（图文结合） -->
    <view class="repair-content">
      <!-- 前言段落 -->
      <view class="content-paragraph">
        为保障烟草生产设备稳定运行，延长设备使用寿命，降低故障停机率，依据烟草行业设备管理相关标准，制定本维修保养规范。本规范适用于烟草加工企业各类专用生产设备（卷烟机、切丝机、烘丝机、包装机等）的日常维修、定期保养、故障排查及应急处理。
      </view>

      <!-- 核心章节：日常维修流程 -->
      <view class="content-image-group">
        <view class="subtitle-bar">
          <text class="content-subtitle">一、设备日常维修流程</text>
          <view class="subtitle-line"></view>
        </view>
        <image 
          src="https://cdn.uviewui.com/uview/album/9.jpg" 
          class="content-image" 
          mode="widthFix"
          lazy-load 
        ></image>
        <view class="content-paragraph">
          1. 故障上报：操作人员发现设备异常后，通过系统提交故障报修单，注明设备编号、故障现象、影响范围；<br>
          2. 故障诊断：维修人员接到报修后，30分钟内到达现场，通过观察、检测工具排查故障原因，形成诊断报告；<br>
          3. 维修实施：根据诊断结果，制定维修方案，更换损坏部件（需使用原厂配件），规范执行维修操作；<br>
          4. 验收测试：维修完成后，开机试运行不少于30分钟，检查设备运行参数是否正常，由操作人员签字确认；<br>
          5. 记录归档：将维修过程、更换部件、测试数据等信息录入设备维修档案，形成闭环管理。
        </view>
      </view>

      <!-- 核心章节：重点设备维修规范 -->
      <view class="content-image-group">
        <view class="subtitle-bar">
          <text class="content-subtitle">二、重点设备维修规范</text>
          <view class="subtitle-line"></view>
        </view>
        <image 
          src="https://cdn.uviewui.com/uview/album/10.jpg" 
          class="content-image" 
          mode="widthFix"
          lazy-load
        ></image>
        <view class="content-paragraph">
          <strong>1. 卷烟机维修：</strong>定期检查烟支成型器、切刀、胶水喷头，清理设备内部烟丝残留；切刀磨损量超过0.5mm需及时更换，胶水喷头需每日清洗防止堵塞；<br>
          <strong>2. 切丝机维修：</strong>重点维护切丝刀辊、送料机构，保证刀辊转速稳定（误差≤±5r/min）；每周检查刀辊轴承温度，超过60℃需停机检修；<br>
          <strong>3. 包装机维修：</strong>检查包装膜牵引机构、热封装置，调整包装膜张力，确保包装密封性；每月校准传感器灵敏度，防止计数误差；<br>
          <strong>4. 烘丝机维修：</strong>清理热风管道积尘，检查温度控制系统，保证烘丝温度波动范围≤±2℃；定期更换过滤网，防止粉尘堵塞。
        </view>
      </view>

      <!-- 核心章节：维修安全规范 -->
      <view class="content-image-group">
        <view class="subtitle-bar">
          <text class="content-subtitle">三、维修安全操作规范</text>
          <view class="subtitle-line"></view>
        </view>
        <image 
          src="https://cdn.uviewui.com/uview/album/11.jpg" 
          class="content-image" 
          mode="widthFix"
          lazy-load
        ></image>
        <view class="content-paragraph">
          1. 维修前必须切断设备电源、气源，悬挂“正在维修”警示牌，严禁带电作业；<br>
          2. 穿戴防静电工作服、防护手套、护目镜等个人防护用品，高空作业需系安全带；<br>
          3. 使用专用维修工具，定期校验工具精度（如扭矩扳手、万用表等）；<br>
          4. 更换易燃、易爆部件（如液压油、润滑油）时，严禁吸烟、动用明火，配备灭火器材；<br>
          5. 维修过程中产生的废油、废件需分类回收，不得随意丢弃，符合环保要求。
        </view>
      </view>

      <!-- 核心章节：常见故障排查 -->
      <view class="content-image-group">
        <view class="subtitle-bar">
          <text class="content-subtitle">四、常见故障快速排查</text>
          <view class="subtitle-line"></view>
        </view>
        <image 
          src="https://cdn.uviewui.com/uview/album/12.jpg" 
          class="content-image" 
          mode="widthFix"
          lazy-load
        ></image>
        <view class="content-paragraph">
          <strong>1. 设备无法启动：</strong>检查电源开关、保险丝→排查控制电路→检测电机是否故障；<br>
          <strong>2. 运行噪音异常：</strong>检查轴承磨损→紧固松动部件→调整传动机构间隙；<br>
          <strong>3. 产品质量偏差：</strong>校准设备参数→检查加工部件精度→清理设备残留杂质；<br>
          <strong>4. 设备突然停机：</strong>查看过载保护装置→检查传感器信号→排查液压/气压系统泄漏。
        </view>
      </view>
    </view>

    <!-- 4. 视频教程模块 -->
    <view class="video-module">
      <view class="module-header">
        <text class="module-title">设备维修视频教程</text>
        <text class="module-tag">必修</text>
      </view>
      <video
        :src="videoUrl"
        :controls="true"  
        :autoplay="false" 
        :loop="false" 
        class="repair-video"
        poster="https://cdn.uviewui.com/uview/album/13.jpg" 
        controlsColor="#fff"
        controlsBackgroundColor="rgba(0,0,0,0.6)"
      ></video>
      <text class="video-desc">视频时长：01:35:18 | 内容：重点设备维修实操+常见故障排查+保养流程演示</text>
    </view>

    <!-- 5. 附件下载模块 -->
    <view class="attachment-module">
      <view class="module-header">
        <text class="module-title">维修相关文件下载</text>
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
            color="#1890ff"
            class="attachment-icon"
          ></up-icon>
          <view class="attachment-info">
            <text class="attachment-name">{{ item.name }}</text>
            <text class="attachment-size">{{ item.size }}</text>
          </view>
          <up-icon
            name="download"
            size="18"
            color="#1890ff"
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

// 1. 轮播图数据（设备维修场景图）
const swiperList = reactive([
  {
    image: 'https://cdn.uviewui.com/uview/swiper/swiper7.png',
    title: '卷烟机维修规范'
  },
  {
    image: 'https://cdn.uviewui.com/uview/swiper/swiper8.png',
    title: '设备故障排查流程'
  },
  {
    image: 'https://cdn.uviewui.com/uview/swiper/swiper9.png',
    title: '维修安全操作'
  }
]);

// 2. 视频地址（维修教程视频）
const videoUrl = ref('https://cdn.uviewui.com/uview/video/equipment-repair.mp4');

// 3. 附件下载列表（维修相关文件）
const attachmentList = reactive([
  {
    name: '烟草设备维修保养规范（2025版）.pdf',
    size: '4.8MB',
    url: 'https://cdn.uviewui.com/uview/file/equipment-repair-2025.pdf'
  },
  {
    name: '重点设备维修流程图.xlsx',
    size: '1.7MB',
    url: 'https://cdn.uviewui.com/uview/file/repair-flow-chart.xlsx'
  },
  {
    name: '设备常见故障排查手册.docx',
    size: '1.2MB',
    url: 'https://cdn.uviewui.com/uview/file/fault-troubleshooting.docx'
  },
  {
    name: '维修工具校准记录表模板.xlsx',
    size: '850KB',
    url: 'https://cdn.uviewui.com/uview/file/tool-calibration-template.xlsx'
  },
  {
    name: '设备维修档案记录表.docx',
    size: '920KB',
    url: 'https://cdn.uviewui.com/uview/file/repair-record.docx'
  }
]);

// 4. 互动状态（点赞/收藏）
const isLiked = ref(false);
const likeCount = ref(156);
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

.equipment-repair-page {
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

  // 2. 维修页面头部信息样式
  .repair-header {
    padding: 24rpx 20rpx;
    background-color: #fff;
    margin: 16rpx 16rpx 0;
    border-radius: 16rpx;
    box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);

    .repair-title {
      font-size: 22px;
      font-weight: 600;
      color: #2d3748;
      line-height: 1.6;
      margin-bottom: 16rpx;
      display: block;
    }

    .repair-meta {
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

  // 3. 维修内容样式
  .repair-content {
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
        color: #1890ff;  // 设备维修主色（科技蓝）
        display: block;
        flex-shrink: 0;
      }

      .subtitle-line {
        flex: 1;
        height: 1px;
        background-color: #e8f4f8;
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
      background-color: #1890ff;
      padding: 2rpx 12rpx;
      border-radius: 20rpx;
    }

    .repair-video {
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