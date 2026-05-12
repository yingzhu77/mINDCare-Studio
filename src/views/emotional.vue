<template>
  <div class="emotional-container">
    <div class="header-section">
      <h2 class="section-title">咨询记录</h2>
    </div>

    <el-card class="search-card" shadow="never">
      <el-form :inline="true" class="search-form">
        <el-form-item label="用户名称">
          <el-input v-model="searchUser" placeholder="请输入用户名称" clearable @keyup.enter="handleSearch" />
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
        <el-table-column width="190">
          <template #header>
            <span class="custom-header">会话ID</span>
          </template>
          <template #default="{ row }">
            <div class="session-id-col">
              <el-avatar :size="42" class="user-avatar">{{ row.userName || '-' }}</el-avatar>
              <div class="session-id-text" :title="String(row.displaySessionId || '-')">
                {{ row.displaySessionId || '-' }}
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column min-width="560">
          <template #header>
            <span class="custom-header">情绪标签</span>
          </template>
          <template #default="{ row }">
            <div class="content-col">
              <div class="session-title">
                <span class="assistant-name">宁渡AI助手</span>
                <span class="title-sep">-</span>
                <span class="title-time">{{ formatDate(row.startTime || row.endTime, 'slash') }}</span>
              </div>

              <div v-if="row.emotionTags.length > 0" class="emotion-tag-wrap">
                <el-tag
                  v-for="(tag, idx) in row.emotionTags"
                  :key="`${row.displaySessionId || row.id}-tag-${idx}`"
                  size="small"
                  effect="light"
                  class="emotion-tag"
                >
                  {{ tag }}
                </el-tag>
              </div>

              <div v-if="row.previewText" class="session-preview text-ellipsis" :title="row.previewText">
                {{ row.previewText }}
              </div>
              <div v-else class="session-preview session-preview-empty">-</div>
            </div>
          </template>
        </el-table-column>

        <el-table-column width="92" align="center">
          <template #header>
            <span class="custom-header">消息数</span>
          </template>
          <template #default="{ row }">
            <span class="msg-count">{{ row.displayMessageCount }}</span>
          </template>
        </el-table-column>

        <el-table-column width="160" align="center">
          <template #header>
            <span class="custom-header">时间</span>
          </template>
          <template #default="{ row }">
            <div class="time-display">
              <div class="date">{{ formatDate(row.endTime, 'date') }}</div>
              <div class="time">{{ formatDate(row.endTime, 'time') }}</div>
            </div>
          </template>
        </el-table-column>

        <el-table-column width="82" align="center" fixed="right">
          <template #header>
            <span class="custom-header">操作</span>
          </template>
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
import { sessionPage } from '@/api/admin'
import SessionDetailDialog from '@/components/SessionDetailDialog.vue'
import { logger } from '@/utils/logger'

const pagination = reactive({
  pageNum: 1,
  pageSize: 10,
  total: 0,
})

const tableData = ref([])
const loading = ref(false)
const detailDialogRef = ref(null)
const searchUser = ref('')

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

const fetchTableData = async () => {
  loading.value = true

  try {
    const params = {
      currentPage: pagination.pageNum,
      size: pagination.pageSize,
      userName: searchUser.value || undefined,
    }

    const res = await sessionPage(params)
    const rows = (res?.records || []).map((item) => ({
      ...item,
      displaySessionId: item.sessionId || item.id,
      emotionTags: Array.isArray(item.emotionTags) ? item.emotionTags : [],
      displayMessageCount: item.messageCount ?? 0,
    }))

    tableData.value = rows
    pagination.total = res?.total || 0
  } catch (error) {
    logger.error('获取咨询记录失败:', error)
    tableData.value = []
    pagination.total = 0
  } finally {
    loading.value = false
  }
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

const handleSearch = () => {
  pagination.pageNum = 1
  fetchTableData()
}

const handleReset = () => {
  searchUser.value = ''
  pagination.pageNum = 1
  fetchTableData()
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
  if (detailDialogRef.value && row?.sessionId) {
    detailDialogRef.value.open(row.sessionId)
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
        margin-right: 24px;
        margin-bottom: 0;
      }
    }
  }

  .table-card {
    border: none;
    border-radius: 8px;
    background-color: var(--card-bg);
    flex: 1;
    overflow-x: auto;

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
        color: #909399;
        font-weight: 600;
        height: 50px;
        border-bottom: 1px solid #f0f0f0;
      }
    }

    .session-id-col {
      display: flex;
      align-items: center;
      gap: 10px;

      .user-avatar {
        background: #d7d9dd;
        color: #fff;
        font-size: 13px;
        text-transform: lowercase;
      }

      .session-id-text {
        max-width: 102px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        color: #909399;
        font-size: 13px;
      }
    }

    .content-col {
      min-width: 0;

      .session-title {
        display: flex;
        align-items: baseline;
        gap: 6px;
        margin-bottom: 6px;
        line-height: 1.35;

        .assistant-name {
          font-size: 14px;
          font-weight: 700;
          color: #2f3440;
        }

        .title-sep {
          color: #a0a6ad;
          font-size: 13px;
        }

        .title-time {
          font-size: 13px;
          color: #6f7782;
          font-weight: 500;
        }
      }

      .emotion-tag-wrap {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-bottom: 6px;
        flex-wrap: wrap;

        .emotion-tag {
          border-radius: 10px;
          font-size: 12px;
          background: #eef5ff;
          border-color: #d9e8ff;
          color: #3b6fb6;
        }
      }

      .session-preview {
        font-size: 13px;
        color: #6f7782;
        line-height: 1.6;
      }

      .session-preview-empty {
        color: #c0c4cc;
      }
    }

    .msg-count {
      color: #4d5561;
      font-size: 15px;
    }

    .time-display {
      text-align: center;
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

// 移动端适配
@media screen and (max-width: 768px) {
  .emotional-container .table-card .pagination-wrapper {
    flex-wrap: wrap;
    justify-content: center;
    gap: 8px;
  }
}

.text-ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: block;
  max-width: 100%;
}
</style>
