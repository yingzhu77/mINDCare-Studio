<template>
  <div class="analytics-container">
    <!-- 统计卡片 -->
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

    <!-- 图表区域 -->
    <el-row :gutter="20" class="chart-row">
      <el-col :span="12">
        <el-card class="chart-card" shadow="never">
          <template #header>
            <div class="card-header">文章阅读排行（Top 10）</div>
          </template>
          <div v-if="articleRankings.length === 0" class="empty-state">暂无阅读数据</div>
          <div v-else ref="rankChartRef" class="chart-box"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="chart-card" shadow="never">
          <template #header>
            <div class="card-header">风险分布</div>
          </template>
          <div v-if="riskData.length === 0" class="empty-state">暂无风险数据</div>
          <div v-else ref="riskChartRef" class="chart-box"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount, nextTick } from 'vue'
import {
  User,
  Document,
  ChatLineSquare,
  Notebook,
} from '@element-plus/icons-vue'
import { dataAnalyticsOverview, articlePage } from '@/api/admin'
import { logger } from '@/utils/logger'

// echarts 动态导入，避免全量打包
let echarts = null

const rankChartRef = ref(null)
const riskChartRef = ref(null)
let rankChart = null
let riskChart = null

const CHART_COLORS = ['#A78BFA', '#34D399', '#FBBF24', '#FB7185', '#C084FC']
const RISK_LABELS = {
  low: '低风险',
  medium: '中风险',
  high: '高风险',
  critical: '危急',
}

const stats = ref([
  { title: '总用户数', value: '0', icon: 'User', color: 'blue' },
  { title: '文章总数', value: '0', icon: 'Document', color: 'green' },
  { title: '咨询记录', value: '0', icon: 'ChatLineSquare', color: 'orange' },
  { title: '日记总数', value: '0', icon: 'Notebook', color: 'purple' },
])

const articleRankings = ref([])
const riskData = ref([])

function formatNumber(num) {
  if (num === undefined || num === null) return '0'
  return Number(num).toLocaleString()
}

function initChart(domRef) {
  if (!domRef) return null
  return echarts.init(domRef)
}

function renderRankChart(data) {
  if (!rankChart || data.length === 0) return
  // 取 top 10，按 readCount 降序
  const sorted = [...data].sort((a, b) => b.readCount - a.readCount).slice(0, 10)
  const titles = sorted.map((d) => d.title)
  const counts = sorted.map((d) => d.readCount)

  rankChart.setOption({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params) => {
        const item = params[0]
        return `${item.name}<br/>阅读量: ${item.value}`
      },
    },
    grid: { top: 10, right: 30, bottom: 10, left: 120 },
    xAxis: {
      type: 'value',
      axisLabel: { fontSize: 11 },
    },
    yAxis: {
      type: 'category',
      data: titles,
      axisLabel: {
        fontSize: 11,
        overflow: 'truncate',
        width: 100,
      },
    },
    series: [
      {
        type: 'bar',
        data: counts,
        itemStyle: {
          color: CHART_COLORS[2],
          borderRadius: [0, 4, 4, 0],
        },
        barMaxWidth: 24,
      },
    ],
  })
}

function renderRiskChart(data) {
  if (!riskChart || data.length === 0) return
  const pieData = data.map((d, i) => ({
    name: RISK_LABELS[d.riskLevel] || d.riskLevel,
    value: d._count,
    itemStyle: { color: CHART_COLORS[i % CHART_COLORS.length] },
  }))

  riskChart.setOption({
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)',
    },
    series: [
      {
        type: 'pie',
        radius: ['40%', '65%'],
        center: ['50%', '50%'],
        data: pieData,
        label: {
          fontSize: 12,
          formatter: '{b}\n{d}%',
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.15)',
          },
        },
      },
    ],
  })
}

async function fetchData() {
  try {
    const overview = await dataAnalyticsOverview()
    stats.value = [
      { title: '总用户数', value: formatNumber(overview.userCount), icon: 'User', color: 'blue' },
      { title: '文章总数', value: formatNumber(overview.articleCount), icon: 'Document', color: 'green' },
      { title: '咨询记录', value: formatNumber(overview.sessionCount), icon: 'ChatLineSquare', color: 'orange' },
      { title: '日记总数', value: formatNumber(overview.diaryCount), icon: 'Notebook', color: 'purple' },
    ]

    if (overview.riskDistribution && overview.riskDistribution.length > 0) {
      riskData.value = overview.riskDistribution
    }
  } catch (error) {
    logger.error('获取概览数据失败:', error)
  }

  try {
    const pageResult = await articlePage({ currentPage: 1, size: 100 })
    const articles = pageResult.records || []
    articleRankings.value = articles.filter((a) => a.readCount > 0)
  } catch (error) {
    logger.error('获取文章数据失败:', error)
  }
}

function renderAllCharts() {
  renderRankChart(articleRankings.value)
  renderRiskChart(riskData.value)
}

function handleResize() {
  rankChart?.resize()
  riskChart?.resize()
}

onMounted(async () => {
  await fetchData()
  await nextTick()
  const echartsModule = await import('echarts')
  echarts = echartsModule
  rankChart = initChart(rankChartRef.value)
  riskChart = initChart(riskChartRef.value)
  renderAllCharts()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  rankChart?.dispose()
  riskChart?.dispose()
})
</script>

<style scoped>
.analytics-container {
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
        &.blue { color: #A78BFA; }
        &.green { color: #34D399; }
        &.orange { color: #FBBF24; }
        &.purple { color: #C084FC; }
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

  .chart-row {
    margin-top: 24px;
  }

  .chart-card {
    border: none;
    border-radius: 12px;
    background-color: var(--card-bg);

    .card-header {
      font-size: 14px;
      font-weight: 600;
      color: #303133;
    }

    .chart-box {
      height: 320px;
    }

    .empty-state {
      height: 320px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #909399;
      font-size: 14px;
      background-color: rgba(0, 0, 0, 0.02);
      border-radius: 8px;
    }
  }
}
</style>