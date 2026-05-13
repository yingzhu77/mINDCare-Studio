<template>
  <div class="insights-view">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2 class="page-title">情绪洞察</h2>
      <p class="page-desc">基于你的情绪日记，分析情绪变化趋势和心理状态</p>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <el-skeleton :rows="6" animated />
    </div>

    <!-- 空状态 -->
    <div v-else-if="!data" class="empty-state">
      <div class="empty-illustration">
        <el-icon :size="64"><DataAnalysis /></el-icon>
      </div>
      <h3 class="empty-title">暂无数据</h3>
      <p class="empty-desc">记录情绪日记后，这里将展示你的情绪洞察分析</p>
      <el-button type="primary" @click="goToDiary">
        <el-icon><Plus /></el-icon>去记录情绪日记
      </el-button>
    </div>

    <template v-else>
      <!-- 统计卡片 -->
      <el-row :gutter="16">
        <el-col :xs="12" :sm="6" v-for="item in statCards" :key="item.label">
          <el-card shadow="never" class="stat-card">
            <div class="stat-label">{{ item.label }}</div>
            <div class="stat-value" :style="{ color: item.color }">{{ item.value }}</div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 图表区域 -->
      <el-row :gutter="16" class="chart-row">
        <!-- 情绪趋势折线图 -->
        <el-col :span="24" class="chart-col">
          <el-card shadow="never" class="chart-card">
            <template #header>
              <div class="card-header">情绪趋势（月均评分）</div>
            </template>
            <div class="chart-box-wrapper">
              <div ref="moodTrendRef" class="chart-box"></div>
              <div v-if="data.moodTrend.length === 0" class="chart-empty">暂无趋势数据</div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <el-row :gutter="16" class="chart-row">
        <!-- 情绪分布饼图 -->
        <el-col :xs="24" :sm="12" class="chart-col">
          <el-card shadow="never" class="chart-card">
            <template #header>
              <div class="card-header">情绪分布</div>
            </template>
            <div class="chart-box-wrapper">
              <div ref="emotionDistRef" class="chart-box"></div>
              <div v-if="data.emotionDistribution.length === 0" class="chart-empty">暂无数据</div>
            </div>
          </el-card>
        </el-col>

        <!-- 压力 vs 睡眠对比 -->
        <el-col :xs="24" :sm="12" class="chart-col">
          <el-card shadow="never" class="chart-card">
            <template #header>
              <div class="card-header">压力与睡眠对照</div>
            </template>
            <div class="chart-box-wrapper">
              <div ref="stressSleepRef" class="chart-box"></div>
              <div v-if="data.stressSleepData.length === 0" class="chart-empty">暂无对照数据</div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 触发因素分析 -->
      <el-row :gutter="16" class="chart-row">
        <el-col :span="24" class="chart-col">
          <el-card shadow="never" class="chart-card">
            <template #header>
              <div class="card-header">触发因素分析</div>
            </template>
            <div class="chart-box-wrapper">
              <div ref="triggerRef" class="chart-box"></div>
              <div v-if="data.triggerAnalysis.length === 0" class="chart-empty">暂无触发因素数据</div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { Plus, DataAnalysis } from '@element-plus/icons-vue'
import { myDiaryStatistics } from '@/api/client'

const router = useRouter()

const loading = ref(true)
const data = ref(null)

// echarts 动态导入
let echarts = null

const moodTrendRef = ref(null)
const emotionDistRef = ref(null)
const stressSleepRef = ref(null)
const triggerRef = ref(null)

let moodTrendChart = null
let emotionDistChart = null
let stressSleepChart = null
let triggerChart = null

const CHART_COLORS = ['#A78BFA', '#34D399', '#FBBF24', '#FB7185', '#60A5FA', '#F472B6', '#34D399', '#F97316', '#A78BFA', '#E879F9']

const EMOTION_COLORS = {
  '开心': '#34D399',
  '平静': '#60A5FA',
  '焦虑': '#FBBF24',
  '悲伤': '#818CF8',
  '愤怒': '#FB7185',
  '恐惧': '#A78BFA',
  '困惑': '#F97316',
  '疲惫': '#94A3B8',
  '孤单': '#C084FC',
  '感恩': '#F472B6',
}

const statCards = computed(() => {
  if (!data.value) return []
  const o = data.value.overview
  return [
    { label: '日记总数', value: o.totalCount, color: '#A78BFA' },
    { label: '本月记录', value: o.thisMonthCount, color: '#34D399' },
    { label: '平均心情', value: o.averageMoodScore != null ? o.averageMoodScore + '/10' : '-', color: '#FBBF24' },
    { label: '平均压力', value: o.averageStressLevel != null ? o.averageStressLevel + '/10' : '-', color: '#FB7185' },
  ]
})

function initChart(domRef) {
  if (!domRef) return null
  return echarts.init(domRef)
}

function renderMoodTrend(data) {
  if (!moodTrendChart || data.length === 0) return
  const months = data.map((d) => d.month)
  const scores = data.map((d) => d.avgScore)
  const counts = data.map((d) => d.count)

  moodTrendChart.setOption({
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
    series: [{
      type: 'line',
      data: scores,
      smooth: true,
      lineStyle: { color: CHART_COLORS[0], width: 2 },
      itemStyle: { color: CHART_COLORS[0] },
      areaStyle: {
        color: echarts && new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(167,139,250,0.25)' },
          { offset: 1, color: 'rgba(167,139,250,0.04)' },
        ]),
      },
    }],
  })
}

function renderEmotionDist(data) {
  if (!emotionDistChart || data.length === 0) return
  const pieData = data.map((d) => ({
    name: d.emotion,
    value: d.count,
    itemStyle: {
      color: EMOTION_COLORS[d.emotion] || CHART_COLORS[Math.floor(Math.random() * CHART_COLORS.length)],
    },
  }))

  emotionDistChart.setOption({
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} 次 ({d}%)',
    },
    series: [{
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
    }],
  })
}

function renderStressSleep(data) {
  if (!stressSleepChart || data.length === 0) return
  const dates = data.map((d) => d.date)
  const stress = data.map((d) => d.stressLevel)
  const sleep = data.map((d) => d.sleepQuality)

  stressSleepChart.setOption({
    tooltip: {
      trigger: 'axis',
      formatter: (params) => {
        const idx = params[0].dataIndex
        return `${dates[idx]}<br/>压力: ${stress[idx]}/10<br/>睡眠: ${sleep[idx]}/10`
      },
    },
    legend: {
      data: ['压力', '睡眠'],
      bottom: 0,
      icon: 'circle',
      itemWidth: 8,
      itemHeight: 8,
    },
    grid: { top: 20, right: 20, bottom: 40, left: 40 },
    xAxis: {
      type: 'category',
      data: dates,
      axisLabel: { fontSize: 10, rotate: 45 },
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 10,
      axisLabel: { fontSize: 11 },
    },
    series: [
      {
        name: '压力',
        type: 'bar',
        data: stress,
        itemStyle: { color: '#FB7185', borderRadius: [4, 4, 0, 0] },
        barMaxWidth: 16,
      },
      {
        name: '睡眠',
        type: 'bar',
        data: sleep,
        itemStyle: { color: '#60A5FA', borderRadius: [4, 4, 0, 0] },
        barMaxWidth: 16,
      },
    ],
  })
}

function renderTrigger(data) {
  if (!triggerChart || data.length === 0) return
  const triggers = data.map((d) => d.trigger)
  const counts = data.map((d) => d.count)

  triggerChart.setOption({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params) => {
        const item = params[0]
        return `${item.name}<br/>出现次数: ${item.value}`
      },
    },
    grid: { top: 10, right: 30, bottom: 10, left: 80 },
    xAxis: {
      type: 'value',
      axisLabel: { fontSize: 11 },
    },
    yAxis: {
      type: 'category',
      data: triggers,
      axisLabel: { fontSize: 11 },
    },
    series: [{
      type: 'bar',
      data: counts.map((v, i) => ({
        value: v,
        itemStyle: { color: CHART_COLORS[i % CHART_COLORS.length], borderRadius: [0, 4, 4, 0] },
      })),
      barMaxWidth: 24,
    }],
  })
}

function renderAllCharts() {
  if (!data.value) return
  renderMoodTrend(data.value.moodTrend)
  renderEmotionDist(data.value.emotionDistribution)
  renderStressSleep(data.value.stressSleepData)
  renderTrigger(data.value.triggerAnalysis)
}

function handleResize() {
  moodTrendChart?.resize()
  emotionDistChart?.resize()
  stressSleepChart?.resize()
  triggerChart?.resize()
}

function goToDiary() {
  router.push('/client/diary')
}

onMounted(async () => {
  try {
    const res = await myDiaryStatistics()
    data.value = res
  } catch {
    data.value = null
  } finally {
    loading.value = false
  }

  await nextTick()
  const echartsModule = await import('echarts')
  echarts = echartsModule
  moodTrendChart = initChart(moodTrendRef.value)
  emotionDistChart = initChart(emotionDistRef.value)
  stressSleepChart = initChart(stressSleepRef.value)
  triggerChart = initChart(triggerRef.value)
  renderAllCharts()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  moodTrendChart?.dispose()
  emotionDistChart?.dispose()
  stressSleepChart?.dispose()
  triggerChart?.dispose()
})
</script>

<style lang="scss" scoped>
.insights-view {
  max-width: 1000px;
  margin: 0 auto;
  padding: 24px 0;

  .page-header {
    margin-bottom: 28px;

    .page-title {
      font-size: 28px;
      font-weight: 700;
      color: #303133;
      margin: 0 0 8px;
    }

    .page-desc {
      margin: 0;
      color: #909399;
      font-size: 15px;
    }
  }

  .loading-state {
    padding: 40px;
  }

  .loading-state, .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 80px 20px;
    text-align: center;

    .empty-illustration {
      margin-bottom: 20px;
      color: #c0c4cc;
    }

    .empty-title {
      font-size: 18px;
      font-weight: 600;
      color: #606266;
      margin: 0 0 8px;
    }

    .empty-desc {
      font-size: 14px;
      color: #c0c4cc;
      margin: 0 0 24px;
    }
  }

  .stat-card {
    border: none;
    border-radius: 12px;
    background-color: var(--card-bg);
    margin-bottom: 16px;
    text-align: center;
    padding: 8px 0;

    .stat-label {
      font-size: 13px;
      color: #909399;
      margin-bottom: 8px;
    }

    .stat-value {
      font-size: 26px;
      font-weight: 700;
    }
  }

  .chart-row {
    margin-bottom: 16px;
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
      height: 280px;
    }

    .chart-box-wrapper {
      position: relative;
      height: 280px;
    }

    .chart-empty {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #c0c4cc;
      font-size: 14px;
      background: var(--card-bg);
    }
  }

  .chart-col {
    margin-bottom: 16px;
  }
}

// 移动端适配
@media screen and (max-width: 768px) {
  .insights-view {
    padding: 12px 0;

    .page-header {
      .page-title {
        font-size: 22px;
      }
    }

    .stat-card {
      padding: 4px 0;

      .stat-value {
        font-size: 22px;
      }
    }

    .chart-card .chart-box {
      height: 220px;
    }

    .chart-card .chart-box-wrapper {
      height: 220px;
    }
  }
}

// 深色模式
html.dark .insights-view {
  .page-header {
    .page-title { color: var(--text-color); }
    .page-desc { color: var(--text-secondary); }
  }

  .stat-card {
    background: var(--card-bg);
    .stat-label { color: var(--text-secondary); }
  }

  .chart-card {
    background: var(--card-bg);
    .card-header { color: var(--text-color); }
    .chart-empty { color: var(--text-muted); background: var(--card-bg); }
  }

  .loading-state, .empty-state {
    .empty-title { color: var(--text-secondary); }
    .empty-desc { color: var(--text-muted); }
  }
}
</style>
