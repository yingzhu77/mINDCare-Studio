<template>
  <div class="dashboard-container">
    <el-row :gutter="20">
      <el-col :span="6" v-for="item in stats" :key="item.title">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-header">
            <el-icon :class="item.color"><component :is="item.icon" /></el-icon>
            <span class="stat-title">{{ item.title }}</span>
          </div>
          <div class="stat-value">{{ item.value }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="second-row">
      <el-col :span="12">
        <el-card class="detail-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span>文章概览</span>
            </div>
          </template>
          <div class="detail-grid">
            <div class="detail-item">
              <span class="label">总文章数</span>
              <span class="num">{{ overviewData.articleCount ?? '-' }}</span>
            </div>
            <div class="detail-item">
              <span class="label">已发布</span>
              <span class="num">{{ overviewData.publishedArticleCount ?? '-' }}</span>
            </div>
            <div class="detail-item">
              <span class="label">已分析</span>
              <span class="num">{{ overviewData.analysisCount ?? '-' }}</span>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="detail-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span>情绪日记</span>
            </div>
          </template>
          <div class="detail-grid">
            <div class="detail-item">
              <span class="label">总日记数</span>
              <span class="num">{{ overviewData.diaryCount ?? '-' }}</span>
            </div>
            <div class="detail-item">
              <span class="label">今日新增</span>
              <span class="num">{{ overviewData.todayDiaryCount ?? '-' }}</span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import {
  User,
  Document,
  ChatLineSquare,
  PieChart,
} from '@element-plus/icons-vue'
import { dataAnalyticsOverview } from '@/api/admin'

const overviewData = reactive({
  userCount: 0,
  articleCount: 0,
  publishedArticleCount: 0,
  sessionCount: 0,
  activeSessionCount: 0,
  diaryCount: 0,
  todayDiaryCount: 0,
  analysisCount: 0,
})

const stats = ref([
  { title: '总用户数', value: '0', icon: 'User', color: 'blue' },
  { title: '文章总数', value: '0', icon: 'Document', color: 'green' },
  {
    title: '咨询记录',
    value: '0',
    icon: 'ChatLineSquare',
    color: 'orange',
  },
  { title: '活跃会话', value: '0', icon: 'PieChart', color: 'purple' },
])

const formatNumber = (num) => {
  if (num === undefined || num === null) return '0'
  return Number(num).toLocaleString()
}

const fetchOverview = async () => {
  try {
    const data = await dataAnalyticsOverview()
    Object.assign(overviewData, data)

    stats.value = [
      { title: '总用户数', value: formatNumber(data.userCount), icon: 'User', color: 'blue' },
      { title: '文章总数', value: formatNumber(data.articleCount), icon: 'Document', color: 'green' },
      { title: '咨询记录', value: formatNumber(data.sessionCount), icon: 'ChatLineSquare', color: 'orange' },
      { title: '活跃会话', value: formatNumber(data.activeSessionCount), icon: 'PieChart', color: 'purple' },
    ]
  } catch (error) {
    console.error('获取Dashboard数据失败:', error)
  }
}

onMounted(() => {
  fetchOverview()
})
</script>

<style lang="scss" scoped>
.dashboard-container {
  .stat-card {
    border: none;
    border-radius: 12px;
    background-color: var(--card-bg);

    .stat-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;

      .el-icon {
        font-size: 24px;
        &.blue {
          color: #409eff;
        }
        &.green {
          color: #67c23a;
        }
        &.orange {
          color: #e6a23c;
        }
        &.purple {
          color: #909399;
        }
      }

      .stat-title {
        font-size: 14px;
        color: #909399;
      }
    }

    .stat-value {
      font-size: 28px;
      font-weight: 700;
      color: var(--text-color);
    }
  }

  .chart-card {
    margin-top: 24px;
    border: none;
    border-radius: 12px;
    background-color: var(--card-bg);

    .mock-chart {
      height: 300px;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: rgba(0, 0, 0, 0.02);
      border-radius: 8px;
      color: #909399;
    }
  }

  .second-row {
    margin-top: 24px;
  }

  .detail-card {
    border: none;
    border-radius: 12px;
    background-color: var(--card-bg);

    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 15px;
      font-weight: 600;
      color: #303133;
    }

    .detail-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;

      .detail-item {
        display: flex;
        flex-direction: column;
        gap: 8px;

        .label {
          font-size: 13px;
          color: #909399;
        }

        .num {
          font-size: 24px;
          font-weight: 700;
          color: var(--text-color);
        }
      }
    }
  }
}
</style>
