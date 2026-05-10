<template>
  <div class="articles-view">
    <div class="header-section">
      <h2 class="section-title">我的投稿</h2>
      <el-button type="primary" @click="$router.push('/client/articles/create')">
        <el-icon><Plus /></el-icon>写文章
      </el-button>
    </div>

    <!-- 审核结果通知：仅当有文章状态变更时显示 -->
    <el-alert
      v-if="showNewReviewBanner"
      title="您有新的审核结果"
      type="success"
      show-icon
      closable
      @close="showNewReviewBanner = false"
      class="review-notice"
    />

    <el-card class="table-card" shadow="never">
      <el-table v-loading="loading" :data="tableData" style="width: 100%">
        <el-table-column label="标题" min-width="200">
          <template #default="{ row }">
            <span class="article-title">{{ row.title }}</span>
          </template>
        </el-table-column>

        <el-table-column label="分类" width="120">
          <template #default="{ row }">
            {{ row.category?.categoryName || '未分类' }}
          </template>
        </el-table-column>

        <el-table-column label="状态" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)" effect="light" size="small">
              {{ statusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="创建时间" width="170">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>

        <el-table-column label="操作" width="240" align="center" fixed="right">
          <template #default="{ row }">
            <div class="action-cell">
              <el-button
                v-if="row.status === 'draft' || row.status === 'rejected'"
                link type="primary"
                @click="$router.push(`/client/articles/${row.id}/edit`)"
              >编辑</el-button>
              <el-button
                v-if="row.status === 'draft'"
                link type="success"
                @click="handleSubmit(row)"
              >提交审核</el-button>
              <el-button
                v-if="row.status === 'rejected'"
                link type="warning"
                @click="handleSubmit(row)"
              >重新提交</el-button>
              <el-tag v-if="row.status === 'pending_review'" size="small" effect="plain">审核中</el-tag>
              <el-tag v-if="row.status === 'published'" size="small" type="success" effect="plain">已发布</el-tag>
              <el-tag v-if="row.status === 'rejected'" size="small" type="danger" effect="plain">
                已驳回{{ row.rejectReason ? ': ' + row.rejectReason : '' }}
              </el-tag>
            </div>
          </template>
        </el-table-column>

        <template #empty>
          <el-empty description="暂无投稿" />
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
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { formatDate } from '@/utils/date'
import { myArticlePage, myArticleSubmit } from '@/api/client'

const LAST_CHECK_KEY = 'client_articles_last_check'

const pagination = reactive({
  pageNum: 1,
  pageSize: 10,
  total: 0,
})

const tableData = ref([])
const loading = ref(false)
const showNewReviewBanner = ref(false)

const statusLabel = (status) => {
  const map = { draft: '草稿', pending_review: '审核中', published: '已发布', rejected: '已驳回', offline: '已下线' }
  return map[status] || status
}

const statusType = (status) => {
  const map = { draft: 'info', pending_review: 'warning', published: 'success', rejected: 'danger', offline: 'info' }
  return map[status] || 'info'
}

const fetchData = async () => {
  loading.value = true
  try {
    const res = await myArticlePage({
      currentPage: pagination.pageNum,
      size: pagination.pageSize,
    })
    tableData.value = res?.records || []
    pagination.total = res?.total || 0
  } catch {
    tableData.value = []
    pagination.total = 0
  } finally {
    loading.value = false
  }
}

const handleSizeChange = (val) => {
  pagination.pageSize = val
  pagination.pageNum = 1
  fetchData()
}

const handleCurrentChange = (val) => {
  pagination.pageNum = val
  fetchData()
}

const handleSubmit = async (row) => {
  const isRejected = row.status === 'rejected'
  const msg = isRejected
    ? `确认将《${row.title}》重新提交审核？`
    : `确认将《${row.title}》提交审核？提交后不可编辑。`
  try {
    await ElMessageBox.confirm(msg, '提交审核', {
      type: 'info',
      confirmButtonText: '确认提交',
      cancelButtonText: '取消',
    })
    await myArticleSubmit(row.id)
    ElMessage.success(isRejected ? '已重新提交审核' : '已提交审核')
    fetchData()
  } catch {
    // 取消
  }
}

const checkNewResults = () => {
  const lastCheck = localStorage.getItem(LAST_CHECK_KEY)
  if (!lastCheck) {
    localStorage.setItem(LAST_CHECK_KEY, new Date().toISOString())
    return
  }
  const lastCheckTime = new Date(lastCheck).getTime()
  const hasNew = tableData.value.some((row) => {
    if (row.status !== 'published' && row.status !== 'rejected') return false
    if (!row.updatedAt) return false
    return new Date(row.updatedAt).getTime() > lastCheckTime
  })
  if (hasNew) {
    showNewReviewBanner.value = true
  }
  localStorage.setItem(LAST_CHECK_KEY, new Date().toISOString())
}

onMounted(async () => {
  await fetchData()
  checkNewResults()
})
</script>

<style lang="scss" scoped>
.articles-view {
  display: flex;
  flex-direction: column;
  gap: 16px;

  .header-section {
    display: flex;
    align-items: center;
    justify-content: space-between;

    .section-title {
      font-size: 20px;
      font-weight: 600;
      color: #303133;
      margin: 0;
    }
  }

  .table-card {
    border: none;
    border-radius: 8px;

    .article-title {
      font-weight: 500;
      color: #303133;
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
    }

    .action-cell {
      display: flex;
      align-items: center;
      gap: 4px;
      flex-wrap: wrap;
      justify-content: center;
    }
  }
}
</style>
