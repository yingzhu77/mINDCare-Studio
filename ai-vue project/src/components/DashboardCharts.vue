<template>
  <div class="dashboard-charts">
    <el-row :gutter="20">
      <el-col :span="8">
        <el-card class="chart-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span>情绪趋势（月均评分）</span>
            </div>
          </template>
          <div ref="emotionChartRef" class="chart-box"></div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="chart-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span>咨询量趋势（每日会话数）</span>
            </div>
          </template>
          <div ref="sessionChartRef" class="chart-box"></div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="chart-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span>文章发布趋势（累计）</span>
            </div>
          </template>
          <div ref="articleChartRef" class="chart-box"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import * as echarts from 'echarts'
import { dataAnalyticsTrends } from '@/api/admin'

const emotionChartRef = ref(null)
const sessionChartRef = ref(null)
const articleChartRef = ref(null)

let emotionChart = null
let sessionChart = null
let articleChart = null

const CHART_COLORS = ['#409eff', '#67c23a', '#e6a23c']

function initChart(domRef) {
  if (!domRef) return null
  const chart = echarts.init(domRef)
  return chart
}

function renderEmotionChart(data) {
  if (!emotionChart) return
  const months = data.map((d) => d.month)
  const scores = data.map((d) => d.avgScore)
  const counts = data.map((d) => d.count)

  emotionChart.setOption({
    tooltip: {
      trigger: 'axis',
      formatter: (params) => {
        const item = params[0]
        const idx = item.dataIndex
        return `${months[idx]}<br/>均分: ${scores[idx]}<br/>记录数: ${counts[idx]}`
      },
    },
    grid: { top: 20, right: 20, bottom: 30, left: 40 },
    xAxis: {
      type: 'category',
      data: months,
      axisLabel: { fontSize: 11 },
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 10,
      axisLabel: { fontSize: 11 },
    },
    series: [
      {
        type: 'line',
        data: scores,
        smooth: true,
        lineStyle: { color: CHART_COLORS[0], width: 2 },
        itemStyle: { color: CHART_COLORS[0] },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(64,158,255,0.25)' },
            { offset: 1, color: 'rgba(64,158,255,0.04)' },
          ]),
        },
      },
    ],
  })
}

function renderSessionChart(data) {
  if (!sessionChart) return
  const dates = data.map((d) => d.date)
  const counts = data.map((d) => d.count)

  sessionChart.setOption({
    tooltip: { trigger: 'axis' },
    grid: { top: 20, right: 20, bottom: 30, left: 40 },
    xAxis: {
      type: 'category',
      data: dates,
      axisLabel: { fontSize: 11, rotate: 30 },
    },
    yAxis: {
      type: 'value',
      axisLabel: { fontSize: 11 },
    },
    series: [
      {
        type: 'bar',
        data: counts,
        itemStyle: {
          color: CHART_COLORS[1],
          borderRadius: [4, 4, 0, 0],
        },
      },
    ],
  })
}

function renderArticleChart(data) {
  if (!articleChart) return
  const dates = data.map((d) => d.date)
  const cumulative = data.map((d) => d.cumulativeCount)

  articleChart.setOption({
    tooltip: { trigger: 'axis' },
    grid: { top: 20, right: 20, bottom: 30, left: 40 },
    xAxis: {
      type: 'category',
      data: dates,
      axisLabel: { fontSize: 11, rotate: 30 },
    },
    yAxis: {
      type: 'value',
      axisLabel: { fontSize: 11 },
    },
    series: [
      {
        type: 'line',
        data: cumulative,
        smooth: true,
        lineStyle: { color: CHART_COLORS[2], width: 2 },
        itemStyle: { color: CHART_COLORS[2] },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(230,162,60,0.25)' },
            { offset: 1, color: 'rgba(230,162,60,0.04)' },
          ]),
        },
      },
    ],
  })
}

async function fetchAllTrends() {
  try {
    const [emotionData, sessionData, articleData] = await Promise.all([
      dataAnalyticsTrends('emotion'),
      dataAnalyticsTrends('session'),
      dataAnalyticsTrends('article'),
    ])
    renderEmotionChart(emotionData)
    renderSessionChart(sessionData)
    renderArticleChart(articleData)
  } catch (error) {
    // handled silently — charts stay empty if data fails
  }
}

function handleResize() {
  emotionChart?.resize()
  sessionChart?.resize()
  articleChart?.resize()
}

onMounted(async () => {
  await nextTick()
  emotionChart = initChart(emotionChartRef.value)
  sessionChart = initChart(sessionChartRef.value)
  articleChart = initChart(articleChartRef.value)
  fetchAllTrends()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  emotionChart?.dispose()
  sessionChart?.dispose()
  articleChart?.dispose()
})
</script>

<style scoped>
.dashboard-charts {
  margin-top: 24px;
}

.chart-card {
  border: none;
  border-radius: 12px;
  background-color: var(--card-bg);
}

.card-header {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.chart-box {
  height: 260px;
}
</style>
