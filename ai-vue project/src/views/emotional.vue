﻿<template>
  <div class="emotional-container">
    <div class="header-section">
      <h2 class="section-title">咨询记录</h2>
    </div>

    <el-card class="search-card" shadow="never">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="关键词">
          <el-input v-model="searchForm.searchKey" placeholder="搜索关键词" clearable @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="searchForm.timeRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            @change="handleSearch"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="table-card" shadow="never">
      <el-table
        v-loading="loading"
        :data="tableData"
        style="width: 100%"
        class="custom-table"
        @row-click="handleShowDetail"
      >
        <el-table-column min-width="500">
          <template #header>
            <span class="custom-header">咨询记录</span>
          </template>
          <template #default="{ row }">
            <div class="session-item">
              <div class="avatar-col">
                <el-avatar :size="44" class="user-avatar">{{ row.userName || '-' }}</el-avatar>
              </div>
              <div class="content-col">
                <div class="session-title">
                  <strong>小暖助手 - {{ formatDate(row.startTime, 'slash') }}</strong>
                </div>
                <div v-if="row.aiSummary" class="session-summary text-ellipsis">
                  {{ row.aiSummary }}
                </div>
                <div v-else class="session-summary session-summary-empty">-</div>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column width="130" align="center">
          <template #header>
            <span class="custom-header">消息数</span>
          </template>
          <template #default="{ row }">
            <span class="msg-count">消息数：{{ row.displayMessageCount }}</span>
          </template>
        </el-table-column>

        <el-table-column width="180" align="right">
          <template #default="{ row }">
            <div class="time-display">
              <div class="date">{{ formatDate(row.endTime, 'date') }}</div>
              <div class="time">{{ formatDate(row.endTime, 'time') }}</div>
            </div>
          </template>
        </el-table-column>

        <el-table-column width="80" align="right" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" class="detail-link" @click.stop="handleShowDetail(row)">详情</el-button>
          </template>
        </el-table-column>

        <template #empty>
          <el-empty description="暂无咨询记录" />
        </template>
      </el-table>

      <div class="pagination-wrapper">
        <div class="total-info">共 {{ pagination.total }} 条</div>
        <el-pagination
          v-model:current-page="pagination.pageNum"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 30, 50]"
          layout="sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <SessionDetailDialog ref="detailDialogRef" />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue'
import { sessionPage, sessionMessages } from '@/api/admin'
import SessionDetailDialog from '@/components/SessionDetailDialog.vue'
import {
  getFirstUserMessageTime,
  getFirstAssistantSummary,
  getLastMessageTime,
  normalizeMessages,
  resolveMessagesTotal,
} from '@/utils/sessionMessage'

const searchForm = reactive({
  searchKey: '',
  timeRange: []
})

const pagination = reactive({
  pageNum: 1,
  pageSize: 10,
  total: 0
})

const tableData = ref([])
const loading = ref(false)
const detailDialogRef = ref(null)
const summaryTaskVersion = ref(0)

// 统一会话起始时间兜底，首屏先用列表接口字段，随后再用消息接口精确覆盖
const resolveStartTime = (row) => (
  row?.startTime ||
  row?.sessionStartTime ||
  row?.beginTime ||
  row?.createdAt ||
  row?.createTime ||
  ''
)

// 统一会话结束时间兜底，优先使用最后一条消息时间相关字段
const resolveEndTime = (row) => (
  row?.endTime ||
  row?.sessionEndTime ||
  row?.lastMessageTime ||
  row?.updateTime ||
  row?.updatedAt ||
  ''
)

const resolveRowMessageCount = (row) => {
  const value = [
    row?.messageCount,
    row?.messagesCount,
    row?.msgCount,
    row?.count,
    row?.total,
  ].find((item) => item !== undefined && item !== null && item !== '')

  const count = Number(value)
  return Number.isNaN(count) || count < 0 ? 0 : count
}

const formatDate = (dateStr, type) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return String(dateStr)

  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const hh = String(date.getHours()).padStart(2, '0')
  const mm = String(date.getMinutes()).padStart(2, '0')
  const ss = String(date.getSeconds()).padStart(2, '0')

  if (type === 'date') return `${y}-${m}-${d}`
  if (type === 'time') return `${hh}:${mm}:${ss}`
  if (type === 'slash') return `${y}/${Number(m)}/${Number(d)} ${hh}:${mm}:${ss}`
  return `${y}-${m}-${d} ${hh}:${mm}:${ss}`
}

const fillAssistantSummaries = async (rows, version) => {
  await Promise.allSettled(
    rows.map(async (row) => {
      if (!row?.id) return

      try {
        const res = await sessionMessages(row.id)
        if (summaryTaskVersion.value !== version) return

        const normalized = normalizeMessages(res)
        // 列表展示严格按消息顺序计算，保证时间和摘要都来自真实对话内容
        row.startTime = getFirstUserMessageTime(normalized) || row.startTime
        row.aiSummary = getFirstAssistantSummary(normalized)
        row.endTime = getLastMessageTime(normalized) || row.endTime
        row.displayMessageCount = resolveMessagesTotal(res) || normalized.length || row.displayMessageCount
      } catch {
        if (summaryTaskVersion.value !== version) return
        row.aiSummary = ''
      }
    })
  )
}

const fetchTableData = async () => {
  loading.value = true
  const currentVersion = ++summaryTaskVersion.value

  try {
    const params = {
      currentPage: pagination.pageNum,
      size: pagination.pageSize,
      searchKey: searchForm.searchKey,
      startTime: searchForm.timeRange?.[0] || '',
      endTime: searchForm.timeRange?.[1] || ''
    }

    const res = await sessionPage(params)
    const rows = (res?.records || res?.list || []).map((item) => ({
      ...item,
      startTime: resolveStartTime(item),
      endTime: resolveEndTime(item),
      aiSummary: '',
      displayMessageCount: resolveRowMessageCount(item),
    }))

    tableData.value = rows
    pagination.total = res?.total || 0

    fillAssistantSummaries(rows, currentVersion)
  } catch (error) {
    console.error('获取咨询记录失败:', error)
    tableData.value = []
    pagination.total = 0
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.pageNum = 1
  fetchTableData()
}

const handleReset = () => {
  searchForm.searchKey = ''
  searchForm.timeRange = []
  handleSearch()
}

const handleSizeChange = (val) => {
  pagination.pageSize = val
  pagination.pageNum = 1
  fetchTableData().then(scrollToTop)
}

const handleCurrentChange = (val) => {
  pagination.pageNum = val
  fetchTableData().then(scrollToTop)
}

const scrollToTop = () => {
  nextTick(() => {
    const mainContent = document.querySelector('.main-content')
    if (mainContent) {
      mainContent.scrollTo({ top: 0, behavior: 'smooth' })
    }
  })
}

const handleShowDetail = (row) => {
  if (detailDialogRef.value && row?.id) {
    detailDialogRef.value.open(row.id)
  }
}

onMounted(() => {
  fetchTableData()
})
</script>

<style lang="scss" scoped>
.emotional-container {
  display: flex;
  flex-direction: column;
  gap: var(--layout-padding);

  .header-section {
    .section-title {
      font-size: 20px;
      font-weight: 600;
      color: #303133;
    }
  }

  .search-card {
    border: none;
    border-radius: 8px;
    background-color: var(--card-bg);

    .search-form {
      :deep(.el-form-item) {
        margin-bottom: 0;
        margin-right: 24px;
      }
    }
  }

  .table-card {
    border: none;
    border-radius: 8px;
    background-color: var(--card-bg);
    flex: 1;

    .custom-table {
      border: none;

      :deep(.el-table__inner-wrapper::before) {
        display: none;
      }

      :deep(.el-table__row) {
        cursor: pointer;
        transition: background-color 0.2s;

        td.el-table__cell {
          border-bottom: 1px solid #f0f0f0;
          padding: 14px 0;
          vertical-align: middle;
        }

        &:hover {
          background-color: #fafafa !important;
        }
      }

      :deep(.el-table__header) th {
        background-color: #fff;
        color: #303133;
        font-weight: 600;
        height: 50px;
        border-bottom: 1px solid #f0f0f0;
      }
    }

    .session-item {
      display: flex;
      align-items: center;
      gap: 14px;

      .avatar-col {
        flex-shrink: 0;

        .user-avatar {
          background: #d7d9dd;
          color: #fff;
          font-size: 13px;
          text-transform: lowercase;
        }
      }

      .content-col {
        flex: 1;
        overflow: hidden;
        min-width: 0;

        .session-title {
          font-size: 16px;
          color: #2f3440;
          margin-bottom: 6px;
          line-height: 1.3;

          strong {
            font-weight: 700;
          }
        }

        .session-summary {
          font-size: 13px;
          color: #7b8088;
          line-height: 1.5;
        }

        .session-summary-empty {
          color: #c0c4cc;
        }
      }
    }

    .msg-count {
      color: #4d5561;
      font-size: 15px;
    }

    .time-display {
      text-align: right;
      color: #7f8793;
      font-size: 13px;
      line-height: 1.55;
    }

    .detail-link {
      font-size: 14px;
      font-weight: 500;
      color: #409eff;
    }

    .pagination-wrapper {
      margin-top: 24px;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 16px;

      .total-info {
        color: #909399;
        font-size: 14px;
      }

      :deep(.el-pagination) {
        .el-select .el-input {
          width: 100px;
        }

        .btn-prev,
        .btn-next,
        .el-pager li {
          background-color: transparent;
          border: 1px solid #dcdfe6;
          border-radius: 4px;
          margin: 0 4px;

          &.is-active {
            background-color: var(--primary-color);
            color: #fff;
            border-color: var(--primary-color);
          }

          &:disabled {
            background-color: #f5f7fa;
            border-color: #e4e7ed;
            color: #c0c4cc;
          }
        }
      }
    }
  }
}

.text-ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: block;
  max-width: 100%;
}

@media screen and (max-width: 768px) {
  .search-form {
    display: flex;
    flex-direction: column;
    gap: 12px;

    :deep(.el-form-item) {
      margin-right: 0 !important;
      width: 100%;

      .el-form-item__content {
        width: 100%;
      }

      .el-input,
      .el-date-editor {
        width: 100% !important;
      }
    }
  }
}
</style>
