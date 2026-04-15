<template>
  <div class="logs-container">
    <div class="header-section">
      <h2 class="section-title">情绪日志</h2>
    </div>

    <el-card class="search-card" shadow="never">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="用户ID">
          <el-input
            v-model="searchForm.userId"
            placeholder="请输入用户ID"
            clearable
            @keyup.enter="handleSearch"
          />
        </el-form-item>

        <el-form-item label="情绪评分">
          <el-select v-model="searchForm.scoreRange" placeholder="请选择评分范围" clearable>
            <el-option
              v-for="item in scoreOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <EmotionDiaryTable
      :loading="loading"
      :data="tableData"
      :current-page="pagination.current"
      :page-size="pagination.size"
      :total="pagination.total"
      @detail="handleOpenDetail"
      @delete="handleDelete"
      @size-change="handleSizeChange"
      @page-change="handlePageChange"
    />

    <EmotionDiaryDetailDialog
      v-model="detailVisible"
      :detail="currentDetail"
      :overview-analysis="currentOverviewAnalysis"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  dataAnalyticsOverview,
  emotionDiaryDelete,
  emotionDiaryPage,
} from '@/api/admin'
import EmotionDiaryDetailDialog from '@/components/EmotionDiaryDetailDialog.vue'
import EmotionDiaryTable from '@/components/EmotionDiaryTable.vue'

const searchForm = reactive({
  userId: '',
  scoreRange: '',
})

const scoreOptions = [
  { label: '1-2 分', value: '1-2' },
  { label: '3-4 分', value: '3-4' },
  { label: '5-6 分', value: '5-6' },
  { label: '7-8 分', value: '7-8' },
  { label: '9-10 分', value: '9-10' },
]

const pagination = reactive({
  current: 1,
  size: 10,
  total: 0,
})

const loading = ref(false)
const tableData = ref([])
const detailVisible = ref(false)
const currentDetail = ref({})

// 综合数据分析接口结果缓存：详情弹窗中优先按 diaryId/userId 映射。
const overviewRaw = ref(null)

const parseScoreRange = (value) => {
  if (!value) return { minMoodScore: '', maxMoodScore: '' }
  const parts = String(value).split('-')
  return {
    minMoodScore: parts[0] || '',
    maxMoodScore: parts[1] || '',
  }
}

const normalizeRecord = (item) => ({
  ...item,
  id: item.id ?? item.diaryId ?? item.recordId,
  userId: item.userId ?? item.uid ?? '-',
  userName: item.userName ?? item.username ?? item.userNickname ?? '',
  nickname: item.nickname ?? item.userName ?? '',
  sessionId: item.sessionId ?? item.chatSessionId ?? '',
  diaryDate: item.diaryDate ?? item.recordDate ?? item.createdAt ?? item.createTime,
  moodScore: Number(item.moodScore ?? item.score ?? 0),
  dominantEmotion: item.dominantEmotion ?? item.mainEmotion ?? '',
  emotionTriggers: item.emotionTriggers ?? item.triggerFactor ?? item.emotionCause ?? '',
  diaryContent: item.diaryContent ?? item.content ?? '',
  sleepQuality: item.sleepQuality ?? item.sleepScore,
  stressLevel: item.stressLevel ?? item.pressureLevel,
  updateTime: item.updateTime ?? item.updatedAt ?? item.modifyTime,
  createTime: item.createTime ?? item.createdAt,
})

const resolveRecords = (res) => {
  const list = res?.records || res?.list || res?.rows || []
  return Array.isArray(list) ? list : []
}

const resolveTotal = (res, records) => {
  const total = Number(res?.total ?? res?.count ?? records.length)
  return Number.isNaN(total) ? records.length : total
}

const fetchOverview = async () => {
  try {
    overviewRaw.value = await dataAnalyticsOverview()
  } catch (error) {
    // 综合分析不是核心列表数据，失败时只保留空对象，避免中断主流程。
    overviewRaw.value = null
    console.warn('获取综合数据分析失败:', error)
  }
}

const fetchDiaryPage = async () => {
  loading.value = true

  try {
    const scoreRange = parseScoreRange(searchForm.scoreRange)
    const params = {
      current: pagination.current,
      size: pagination.size,
      userId: searchForm.userId || '',
      minMoodScore: scoreRange.minMoodScore,
      maxMoodScore: scoreRange.maxMoodScore,
    }

    const res = await emotionDiaryPage(params)
    const records = resolveRecords(res).map(normalizeRecord)

    tableData.value = records
    pagination.total = resolveTotal(res, records)
  } catch (error) {
    tableData.value = []
    pagination.total = 0
    console.error('查询情绪日志失败:', error)
  } finally {
    loading.value = false
  }
}

const currentOverviewAnalysis = computed(() => {
  const diary = currentDetail.value || {}
  const source = overviewRaw.value
  if (!source) return {}

  const candidates = [
    ...(Array.isArray(source?.diaryAnalytics) ? source.diaryAnalytics : []),
    ...(Array.isArray(source?.diaryAnalysisList) ? source.diaryAnalysisList : []),
    ...(Array.isArray(source?.emotionDiaryList) ? source.emotionDiaryList : []),
    ...(Array.isArray(source?.userAnalysisList) ? source.userAnalysisList : []),
    ...(Array.isArray(source?.records) ? source.records : []),
  ]

  if (candidates.length === 0) return source

  const matched = candidates.find((item) => {
    const itemDiaryId = item.diaryId ?? item.id ?? item.recordId
    const itemUserId = item.userId ?? item.uid
    return (
      String(itemDiaryId || '') === String(diary.id || '') ||
      String(itemUserId || '') === String(diary.userId || '')
    )
  })

  return matched || {}
})

const handleSearch = () => {
  pagination.current = 1
  fetchDiaryPage()
}

const handleReset = () => {
  searchForm.userId = ''
  searchForm.scoreRange = ''
  handleSearch()
}

const handleSizeChange = (size) => {
  pagination.size = size
  pagination.current = 1
  fetchDiaryPage()
}

const handlePageChange = (current) => {
  pagination.current = current
  fetchDiaryPage()
}

const handleOpenDetail = (row) => {
  currentDetail.value = { ...row }
  detailVisible.value = true
}

const handleDelete = async (row) => {
  if (!row?.id) {
    ElMessage.warning('当前记录缺少ID，无法删除')
    return
  }

  try {
    await ElMessageBox.confirm(
      '删除后无法恢复，是否继续删除该条情绪日志？',
      '删除确认',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    await emotionDiaryDelete(row.id)
    ElMessage.success('删除成功')

    // 删除后如果当前页无数据且不是第一页，自动回退一页再刷新。
    if (tableData.value.length === 1 && pagination.current > 1) {
      pagination.current -= 1
    }

    fetchDiaryPage()
  } catch (error) {
    // 用户取消时不提示错误。
    if (error !== 'cancel' && error !== 'close') {
      console.error('删除情绪日志失败:', error)
    }
  }
}

onMounted(async () => {
  await Promise.allSettled([fetchOverview(), fetchDiaryPage()])
})
</script>

<style lang="scss" scoped>
.logs-container {
  display: flex;
  flex-direction: column;
  gap: var(--layout-padding);

  .header-section {
    .section-title {
      font-size: 32px;
      transform: scale(0.5);
      transform-origin: left center;
      margin: -10px 0;
      font-weight: 700;
      color: #303133;
    }
  }

  .search-card {
    border: none;
    border-radius: 8px;

    .search-form {
      :deep(.el-form-item) {
        margin-right: 24px;
        margin-bottom: 0;
      }
    }
  }
}

@media (max-width: 768px) {
  .logs-container {
    .search-card {
      .search-form {
        display: flex;
        flex-direction: column;
        gap: 12px;

        :deep(.el-form-item) {
          margin-right: 0;
          width: 100%;

          .el-form-item__content,
          .el-select,
          .el-input {
            width: 100%;
          }
        }
      }
    }
  }
}
</style>
