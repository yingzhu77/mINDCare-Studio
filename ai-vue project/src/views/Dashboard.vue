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

    <el-card class="chart-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span>系统活跃度</span>
        </div>
      </template>
      <div class="mock-chart">
        <!-- 此处通常放置 ECharts 图表，现在用模拟内容代替 -->
        <p>数据加载中...</p>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import {
  User,
  Document,
  ChatLineSquare,
  PieChart,
} from '@element-plus/icons-vue'

const stats = ref([
  { title: '总用户数', value: '1,284', icon: 'User', color: 'blue' },
  { title: '文章总数', value: '156', icon: 'Document', color: 'green' },
  {
    title: '咨询记录',
    value: '3,429',
    icon: 'ChatLineSquare',
    color: 'orange',
  },
  { title: '活跃度', value: '89%', icon: 'PieChart', color: 'purple' },
])
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
}
</style>
