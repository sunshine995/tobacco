<template>
  <view class="my-exam-page">
    <!-- 1. 顶部状态栏（考试统计+待考提醒） -->
    <view class="exam-header">
      <view class="exam-statistics">
        <text class="stat-title">我的考试</text>
        <view class="stat-group">
          <view class="stat-item">
            <text class="stat-number">{{ pendingCount }}</text>
            <text class="stat-desc">待考</text>
          </view>
          <view class="stat-item">
            <text class="stat-number">{{ completedCount }}</text>
            <text class="stat-desc">已考</text>
          </view>
          <view class="stat-item">
            <text class="stat-number">{{ passedCount }}</text>
            <text class="stat-desc">通过</text>
          </view>
        </view>
      </view>
      <view class="exam-reminder" v-if="pendingCount > 0">
        <up-icon name="warning" size="16" color="#e53e3e" class="reminder-icon" />
        <text class="reminder-text">有{{ pendingCount }}个考试即将截止，请及时完成！</text>
      </view>
    </view>

    <!-- 2. 待考考试列表 -->
    <view class="exam-section" v-if="pendingExams.length > 0">
      <view class="section-header">
        <text class="section-title">待考考试</text>
        <text class="section-tip">（点击进入考试）</text>
      </view>
      <view class="exam-list">
        <view 
          class="exam-item" 
          v-for="(exam, index) in pendingExams"
          :key="index"
          @click="gotoExam(exam)"
        >
          <view class="exam-info">
            <text class="exam-name">{{ exam.name }}</text>
            <text class="exam-tag">{{ exam.type }}</text>
          </view>
          <view class="exam-meta">
            <text class="meta-item">
              <up-icon name="calendar" size="12" color="#909399" class="meta-icon" />
              {{ exam.deadline }}截止
            </text>
            <text class="meta-item">
              <up-icon name="clock" size="12" color="#909399" class="meta-icon" />
              {{ exam.duration }}分钟
            </text>
          </view>
          <view class="exam-progress">
            <text class="progress-text">剩余时间：{{ exam.remainingTime }}</text>
            <progress 
              :percent="exam.progress" 
              :show-info="false" 
              stroke-width="4" 
              activeColor="#e53e3e" 
              backgroundColor="#f5f5f5"
              class="progress-bar"
            ></progress>
          </view>
        </view>
      </view>
    </view>

    <!-- 3. 已考考试列表 -->
    <view class="exam-section" v-if="completedExams.length > 0">
      <view class="section-header">
        <text class="section-title">已完成考试</text>
        <text class="section-tip">（点击查看详情）</text>
      </view>
      <view class="exam-list">
        <view 
          class="exam-item completed-item" 
          v-for="(exam, index) in completedExams"
          :key="index"
          @click="gotoExamDetail(exam)"
        >
          <view class="exam-info">
            <text class="exam-name">{{ exam.name }}</text>
            <text class="exam-tag passed" v-if="exam.score >= exam.passScore">已通过</text>
            <text class="exam-tag failed" v-else>未通过</text>
          </view>
          <view class="exam-meta">
            <text class="meta-item">
              <up-icon name="calendar" size="12" color="#909399" class="meta-icon" />
              {{ exam.completeTime }}
            </text>
            <text class="meta-item">
              <up-icon name="score" size="12" color="#909399" class="meta-icon" />
              得分：{{ exam.score }}/{{ exam.fullScore }}
            </text>
          </view>
          <view class="exam-result">
            <text class="result-text" v-if="exam.score >= exam.passScore">
              恭喜通过！合格线：{{ exam.passScore }}分
            </text>
            <text class="result-text failed-text" v-else>
              未通过，合格线：{{ exam.passScore }}分
            </text>
          </view>
        </view>
      </view>
    </view>

    <!-- 无考试提示 -->
    <view class="no-exam-tip" v-if="pendingExams.length === 0 && completedExams.length === 0">
      <up-icon name="empty" size="48" color="#c0c4cc" class="empty-icon" />
      <text class="tip-text">暂无相关考试</text>
      <text class="tip-desc">请关注系统通知，及时参与最新考试</text>
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

// 1. 考试统计数据
const pendingCount = ref(2); // 待考数量
const completedCount = ref(5); // 已考数量
const passedCount = ref(4); // 通过数量

// 2. 待考考试列表（烟草行业相关考试）
const pendingExams = reactive([
  {
    name: '2025烟草安全生产规范考试（必考）',
    type: '安全类',
    deadline: '2025-11-30',
    duration: 60,
    remainingTime: '7天2小时',
    progress: 75, // 剩余时间进度（模拟）
    id: 'exam-20251101'
  },
  {
    name: '卷烟机设备保养操作规范考试',
    type: '设备类',
    deadline: '2025-12-05',
    duration: 45,
    remainingTime: '12天8小时',
    progress: 40,
    id: 'exam-20251102'
  }
]);

// 3. 已完成考试列表
const completedExams = reactive([
  {
    name: '烟草行业消防知识达标考试',
    completeTime: '2025-10-15',
    score: 85,
    fullScore: 100,
    passScore: 60,
    id: 'exam-20251001'
  },
  {
    name: '切丝机维修技术理论考试',
    completeTime: '2025-09-28',
    score: 58,
    fullScore: 100,
    passScore: 60,
    id: 'exam-20250901'
  },
  {
    name: '2025年度烟草专卖法新规解读考试',
    completeTime: '2025-09-10',
    score: 92,
    fullScore: 100,
    passScore: 60,
    id: 'exam-20250902'
  },
  {
    name: '包装机日常操作安全考试',
    completeTime: '2025-08-25',
    score: 78,
    fullScore: 100,
    passScore: 60,
    id: 'exam-20250801'
  },
  {
    name: '烟草仓储物流安全管理考试',
    completeTime: '2025-08-12',
    score: 88,
    fullScore: 100,
    passScore: 60,
    id: 'exam-20250802'
  }
]);

// 4. 进入考试页面
const gotoExam = (exam) => {
  uToastRef.value.success(`进入考试：${exam.name}`);
  // 实际项目中跳转至考试答题页面
  router.push({
    path: '/pages/exam/answer',
    query: { examId: exam.id, examName: exam.name }
  });
};

// 5. 查看考试详情
const gotoExamDetail = (exam) => {
  uToastRef.value.success(`查看详情：${exam.name}`);
  // 实际项目中跳转至考试详情页面（成绩分析、错题回顾等）
  router.push({
    path: '/pages/exam/detail',
    query: { examId: exam.id, examName: exam.name }
  });
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

.my-exam-page {
  padding: 24rpx 16rpx 90rpx;  // 给底部留足空间
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

  // 1. 顶部考试统计栏
  .exam-header {
    margin-bottom: 24rpx;

    .exam-statistics {
      background-color: #fff;
      border-radius: 16rpx;
      padding: 24rpx;
      box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
      margin-bottom: 16rpx;

      .stat-title {
        font-size: 24rpx;
        font-weight: 600;
        color: #2d3748;
        margin-bottom: 20rpx;
        display: block;
      }

      .stat-group {
        display: flex;
        justify-content: space-around;
        align-items: center;
      }

      .stat-item {
        display: flex;
        flex-direction: column;
        align-items: center;
      }

      .stat-number {
        font-size: 36rpx;
        font-weight: 700;
        color: #e53e3e;
        margin-bottom: 4rpx;
      }

      .stat-desc {
        font-size: 20rpx;
        color: #718096;
      }
    }

    .exam-reminder {
      background-color: #fff5f5;
      border-radius: 12rpx;
      padding: 16rpx 20rpx;
      display: flex;
      align-items: center;
      gap: 12rpx;
      border-left: 4rpx solid #e53e3e;

      .reminder-text {
        font-size: 22rpx;
        color: #c53030;
        flex: 1;
        line-height: 1.5;
      }
    }
  }

  // 2. 考试列表section样式
  .exam-section {
    margin-bottom: 24rpx;

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16rpx;

      .section-title {
        font-size: 24rpx;
        font-weight: 600;
        color: #2d3748;
      }

      .section-tip {
        font-size: 20rpx;
        color: #718096;
      }
    }

    .exam-list {
      display: flex;
      flex-direction: column;
      gap: 16rpx;
    }

    .exam-item {
      background-color: #fff;
      border-radius: 16rpx;
      padding: 20rpx;
      box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
      transition: all 0.2s ease;

      &:active {
        background-color: #fafafa;
        transform: scale(0.99);
      }

      .exam-info {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 16rpx;

        .exam-name {
          font-size: 24rpx;
          font-weight: 600;
          color: #2d3748;
          flex: 1;
          line-height: 1.4;
          margin-right: 12rpx;
        }

        .exam-tag {
          font-size: 18rpx;
          color: #fff;
          background-color: #e53e3e;
          padding: 4rpx 12rpx;
          border-radius: 12rpx;
          white-space: nowrap;
        }
      }

      .exam-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 16rpx;
        margin-bottom: 16rpx;

        .meta-item {
          font-size: 20rpx;
          color: #718096;
          display: flex;
          align-items: center;
          gap: 6rpx;
        }

        .meta-icon {
          margin-top: 2rpx;
        }
      }

      .exam-progress {
        .progress-text {
          font-size: 20rpx;
          color: #e53e3e;
          margin-bottom: 8rpx;
          display: block;
        }

        .progress-bar {
          width: 100%;
          height: 8rpx;
          border-radius: 4rpx;
        }
      }
    }

    // 已完成考试item样式
    .completed-item {
      .exam-tag.passed {
        background-color: #38a169;
      }

      .exam-tag.failed {
        background-color: #ed8936;
      }

      .exam-result {
        .result-text {
          font-size: 20rpx;
          color: #38a169;
          font-weight: 500;
        }

        .failed-text {
          color: #ed8936;
        }
      }
    }
  }

  // 3. 无考试提示
  .no-exam-tip {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 80rpx 0;
    color: #c0c4cc;

    .empty-icon {
      margin-bottom: 24rpx;
    }

    .tip-text {
      font-size: 24rpx;
      margin-bottom: 8rpx;
    }

    .tip-desc {
      font-size: 20rpx;
    }
  }
  }
</style>