<template>
  <div class="review-container">
    <div class="header-section">
      <h2 class="section-title">文章审核</h2>
    </div>

    <!-- 状态筛选标签页 -->
    <el-card class="filter-card" shadow="never" body-style="padding: 0">
      <el-tabs v-model="activeTab" @tab-change="handleTabChange" class="review-tabs">
        <el-tab-pane label="全部" name="" />
        <el-tab-pane label="待审核" name="pending_review" />
        <el-tab-pane label="已通过" name="published" />
        <el-tab-pane label="已驳回" name="rejected" />
      </el-tabs>
    </el-card>

    <!-- 文章列表 -->
    <el-card class="table-card" shadow="never">
      <el-table v-loading="loading" :data="tableData" style="width: 100%">
        <el-table-column label="标题" min-width="180">
          <template #default="{ row }">
            <div class="title-cell">
              <span class="article-title">{{ row.article?.title || row.title }}</span>
              <el-tag v-if="row.reviewType === 'revision'" size="small" type="warning" effect="light">修改</el-tag>
              <el-tag v-else size="small" type="info" effect="light">首次</el-tag>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="作者" width="100">
          <template #default="{ row }">
            {{ row.author?.username || '未知' }}
          </template>
        </el-table-column>

        <el-table-column label="分类" width="100">
          <template #default="{ row }">
            {{ row.category?.categoryName || '未分类' }}
          </template>
        </el-table-column>

        <el-table-column label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)" effect="light" size="small">
              {{ statusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="提交时间" width="170">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>

        <el-table-column v-if="activeTab === 'rejected'" label="驳回原因" min-width="160">
          <template #default="{ row }">
            <span class="reject-reason">{{ row.rejectReason || '-' }}</span>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="270" align="center" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleView(row)">查看</el-button>
            <template v-if="row.status === 'pending_review'">
              <el-button
                type="success" size="small"
                :loading="approvingId === row.reviewId"
                @click="handleApprove(row)"
              >通过</el-button>
              <el-button
                type="danger" size="small"
                :loading="rejectingId === row.reviewId"
                @click="handleRejectClick(row)"
              >驳回</el-button>
            </template>
            <el-tag v-else-if="row.status === 'published'" type="success" effect="plain" size="small">已通过</el-tag>
            <el-tag v-else-if="row.status === 'rejected'" type="danger" effect="plain" size="small">已驳回</el-tag>
            <span v-else>-</span>
            <el-button
              link type="danger" size="small"
              @click="handleDelete(row)"
            >删除</el-button>
          </template>
        </el-table-column>

        <template #empty>
          <el-empty :description="emptyText" />
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

    <!-- 驳回原因弹窗 -->
    <el-dialog v-model="rejectDialogVisible" title="驳回文章" width="480px" :close-on-click-modal="false">
      <el-form ref="rejectFormRef" :model="rejectForm" :rules="rejectRules">
        <el-form-item label="文章" label-width="70px">
          <span class="reject-article-title">{{ rejectTarget?.title }}</span>
        </el-form-item>
        <el-form-item label="原因" prop="reason" label-width="70px">
          <el-input
            v-model="rejectForm.reason"
            type="textarea"
            :rows="4"
            placeholder="请输入驳回原因，用户端将可见"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rejectDialogVisible = false">取消</el-button>
        <el-button type="danger" :loading="rejectingId > 0" @click="handleRejectConfirm">确认驳回</el-button>
      </template>
    </el-dialog>

    <!-- 文章内容预览弹窗 -->
    <el-dialog v-model="previewVisible" :title="previewArticle?.title || '文章预览'" width="900px" top="5vh" :close-on-click-modal="false">
      <template v-if="previewArticle">
        <div class="preview-header">
          <img v-if="previewArticle.coverImage" :src="previewArticle.coverImage" class="preview-cover" alt="封面" />
          <h2 class="preview-title">{{ previewArticle.title }}</h2>
          <div class="preview-meta">
            <span>作者：{{ previewArticle.author?.username || '未知' }}</span>
            <span>分类：{{ previewArticle.category?.categoryName || '未分类' }}</span>
            <el-tag v-if="previewArticle.reviewType === 'revision'" type="warning" effect="light" size="small">修改审核</el-tag>
            <span>状态：
              <el-tag :type="statusType(previewArticle.status)" effect="light" size="small">
                {{ statusLabel(previewArticle.status) }}
              </el-tag>
            </span>
          </div>
          <div class="preview-meta">
            <span>提交时间：{{ formatDate(previewArticle.createdAt) }}</span>
            <span v-if="previewArticle.publishedAt">发布时间：{{ formatDate(previewArticle.publishedAt) }}</span>
          </div>
          <el-divider />
        </div>
        <div class="article-content" v-html="previewContent"></div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { reviewPage, reviewDetail, reviewStatusUpdate, articleDelete, reviewRevisionDelete } from '@/api/admin'
import { formatDate } from '@/utils/date'
import { useReviewStore } from '@/store/useReviewStore'
import DOMPurify from 'dompurify'

const reviewStore = useReviewStore()
const activeTab = ref('')
const tableData = ref([])
const loading = ref(false)
const approvingId = ref(0)
const rejectingId = ref(0)

const pagination = reactive({
  pageNum: 1,
  pageSize: 10,
  total: 0,
})

// 文章预览弹窗
const previewVisible = ref(false)
const previewArticle = ref(null)
const previewContent = ref('')

const handleView = async (row) => {
  // 先设置基本数据
  previewArticle.value = { ...row }
  // 没有完整内容或内容太少时，从详情接口加载
  if (!row.content || row.content.length < 50) {
    try {
      const detail = await reviewDetail(row.reviewType, row.reviewId)
      // 合并保留 reviewType 等列表字段
      previewArticle.value = { ...row, ...detail }
      previewContent.value = DOMPurify.sanitize(detail.content || '（无内容）')
    } catch {
      previewContent.value = DOMPurify.sanitize(row.content || '（无内容）')
    }
  } else {
    previewContent.value = DOMPurify.sanitize(row.content)
  }
  previewVisible.value = true
}

// 驳回弹窗
const rejectDialogVisible = ref(false)
const rejectTarget = ref(null)
const rejectFormRef = ref(null)
const rejectForm = reactive({ reason: '' })
const rejectRules = {
  reason: [{ required: true, message: '请填写驳回原因', trigger: 'blur' }],
}

const statusLabel = (status) => {
  const map = { draft: '草稿', pending_review: '待审核', published: '已通过', rejected: '已驳回', offline: '已下线' }
  return map[status] || status
}

const statusType = (status) => {
  const map = { draft: 'info', pending_review: 'warning', published: 'success', rejected: 'danger', offline: 'info' }
  return map[status] || 'info'
}

const emptyText = computed(() => {
  if (!activeTab.value) return '暂无文章'
  const map = { pending_review: '暂无待审核文章', published: '暂无已通过文章', rejected: '暂无已驳回文章' }
  return map[activeTab.value] || '暂无数据'
})

const fetchData = async () => {
  loading.value = true
  try {
    const params = {
      currentPage: pagination.pageNum,
      size: pagination.pageSize,
    }
    if (activeTab.value) {
      params.status = activeTab.value
    }
    const res = await reviewPage(params)
    tableData.value = res?.records || []
    pagination.total = res?.total || 0
  } catch {
    tableData.value = []
    pagination.total = 0
  } finally {
    loading.value = false
  }
}

const handleTabChange = () => {
  pagination.pageNum = 1
  fetchData()
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

const handleApprove = async (row) => {
  approvingId.value = row.reviewId
  try {
    await reviewStatusUpdate(row.reviewType, row.reviewId, 'published')
    const title = row.article?.title || row.title
    ElMessage.success(`已通过《${title}》`)
    await Promise.all([fetchData(), reviewStore.refreshPendingCount()])
  } catch {
    // 错误由 request.js 统一处理
  } finally {
    approvingId.value = 0
  }
}

const handleRejectClick = (row) => {
  rejectTarget.value = row
  rejectForm.reason = ''
  rejectDialogVisible.value = true
}

const handleRejectConfirm = async () => {
  if (!rejectFormRef.value) return
  await rejectFormRef.value.validate(async (valid) => {
    if (!valid) return
    if (!rejectTarget.value) return
    const row = rejectTarget.value
    rejectingId.value = row.reviewId
    try {
      await reviewStatusUpdate(row.reviewType, row.reviewId, 'rejected', rejectForm.reason)
      const title = row.article?.title || row.title
      ElMessage.success(`已驳回《${title}》`)
      rejectDialogVisible.value = false
      rejectTarget.value = null
      await Promise.all([fetchData(), reviewStore.refreshPendingCount()])
    } catch {
      // 错误由 request.js 统一处理
    } finally {
      rejectingId.value = 0
    }
  })
}

const handleDelete = async (row) => {
  const label = row.reviewType === 'revision' ? '修订记录' : '投稿文章'
  const title = row.article?.title || row.title
  try {
    await ElMessageBox.confirm(
      `确认删除《${title}》的${label}吗？此操作不可恢复。`,
      '删除确认',
      { confirmButtonText: '确认删除', cancelButtonText: '取消', type: 'warning' },
    )
    if (row.reviewType === 'revision') {
      await reviewRevisionDelete(row.reviewId)
    } else {
      await articleDelete(row.reviewId)
    }
    ElMessage.success('删除成功')
    fetchData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

onMounted(() => {
  activeTab.value = 'pending_review'
  fetchData()
})
</script>

<style lang="scss" scoped>
.review-container {
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

  .filter-card {
    border: none;
    border-radius: 8px;

    .review-tabs {
      padding: 0 16px;

      :deep(.el-tabs__header) {
        margin: 0;
      }
    }
  }

  .table-card {
    border: none;
    border-radius: 8px;
    overflow-x: auto;

    .title-cell {
      display: flex;
      align-items: center;
      gap: 8px;

      .article-title {
        font-weight: 500;
        color: #303133;
      }
    }

    .reject-reason {
      color: #909399;
      font-size: 13px;
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
  }
}

.reject-article-title {
  font-weight: 500;
  color: #303133;
}

.preview-header {
  .preview-cover {
    width: 100%;
    max-height: 300px;
    object-fit: cover;
    border-radius: 8px;
    margin-bottom: 16px;
  }
  .preview-title {
    font-size: 20px;
    font-weight: 600;
    color: #303133;
    margin: 0 0 16px;
  }
  .preview-meta {
    display: flex;
    gap: 24px;
    font-size: 13px;
    color: #909399;
    margin-bottom: 4px;
  }
}
.article-content {
  line-height: 1.8;
  font-size: 15px;
  color: #303133;

  img { max-width: 100%; border-radius: 4px; }
  pre { background: #f5f7fa; padding: 16px; border-radius: 6px; overflow-x: auto; }
  blockquote { border-left: 4px solid #409eff; padding-left: 16px; color: #909399; margin: 16px 0; }
}

// 移动端适配
@media screen and (max-width: 768px) {
  .review-container .table-card .pagination-wrapper {
    flex-wrap: wrap;
    justify-content: center;
    gap: 8px;
  }

  .preview-header .preview-meta {
    flex-direction: column;
    gap: 4px;
  }
}
</style>
