<template>
  <div class="logs-container">
    <div class="header-section">
      <h2 class="section-title">情绪日志</h2>
    </div>

    <TableSearch :form="searchForm" :config="searchConfig" @search="handleSearch" @reset="handleReset" />

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
    />
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  emotionDiaryDelete,
  emotionDiaryPage,
} from '@/api/admin'
import EmotionDiaryDetailDialog from '@/components/EmotionDiaryDetailDialog.vue'
import EmotionDiaryTable from '@/components/EmotionDiaryTable.vue'
import { logger } from '@/utils/logger'

const searchForm = reactive({
  userName: '',
  scoreRange: '',
})

const scoreOptions = [
  { label: '1-2 分', value: '1-2' },
  { label: '3-4 分', value: '3-4' },
  { label: '5-6 分', value: '5-6' },
  { label: '7-8 分', value: '7-8' },
  { label: '9-10 分', value: '9-10' },
]

const searchConfig = [
  { prop: 'userName', label: '用户名称', comp: 'input', placeholder: '请输入用户名称' },
  { prop: 'scoreRange', label: '情绪评分', comp: 'select', options: scoreOptions, placeholder: '请选择评分范围' },
]

const pagination = reactive({
  currentPage: 1,
  size: 10,
  total: 0,
})

const loading = ref(false)
const tableData = ref([])
const detailVisible = ref(false)
const currentDetail = ref({})

const parseScoreRange = (value) => {
  if (!value) return { minMoodScore: undefined, maxMoodScore: undefined }
  const parts = String(value).split('-')
  return {
    minMoodScore: parts[0] ? Number(parts[0]) : undefined,
    maxMoodScore: parts[1] ? Number(parts[1]) : undefined,
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

const fetchDiaryPage = async () => {
  loading.value = true

  try {
    const scoreRange = parseScoreRange(searchForm.scoreRange)
    const params = {
      currentPage: pagination.currentPage,
      size: pagination.size,
      userName: searchForm.userName || undefined,
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
    logger.error('查询情绪日志失败:', error)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.currentPage = 1
  fetchDiaryPage()
}

const handleReset = () => {
  searchForm.userName = ''
  searchForm.scoreRange = ''
  handleSearch()
}

const handleSizeChange = (size) => {
  pagination.size = size
  pagination.currentPage = 1
  fetchDiaryPage()
}

const handlePageChange = (current) => {
  pagination.currentPage = current
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
    if (tableData.value.length === 1 && pagination.currentPage > 1) {
      pagination.currentPage -= 1
    }

    fetchDiaryPage()
  } catch (error) {
    // 用户取消时不提示错误。
    if (error !== 'cancel' && error !== 'close') {
      logger.error('删除情绪日志失败:', error)
    }
  }
}

onMounted(() => {
  fetchDiaryPage()
})
</script>

<style lang="scss" scoped>
.logs-container {
  display: flex;
  flex-direction: column;
  gap: var(--layout-padding);

  .header-section {
    .section-title {
      font-size: 20px;
      font-weight: 700;
      color: #303133;
    }
  }

}
</style>
