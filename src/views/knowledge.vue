<template>
  <div class="knowledge-container">
    <div class="header-section">
      <h2 class="section-title">知识文章</h2>
      <div class="header-buttons">
        <el-button text type="info" @click="showGuideDialog = true">
          <el-icon><InfoFilled /></el-icon>
          使用须知
        </el-button>
        <el-button type="primary" @click="handleAdd">新增</el-button>
      </div>
    </div>

    <TableSearch
      :form="searchForm"
      :config="formItem"
      @search="handleSearch"
      @reset="handleReset"
    />

    <el-card class="table-card" shadow="never">
      <el-table :data="tableData" v-loading="loading" style="width: 100%">
        <el-table-column prop="title" label="文章标题" min-width="220">
          <template #default="{ row }">
            <div class="title-cell">
              <el-icon><Document /></el-icon>
              <span>{{ row.title }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="categoryName" label="分类" width="150">
          <template #default="{ row }">
            <div class="tag-cell">
              <el-icon><PriceTag /></el-icon>
              <span>{{ row.category?.categoryName || '未分类' }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="authorName" label="作者" width="140">
          <template #default="{ row }">
            <div class="author-cell">
              <span>{{ row.author?.username || '-' }}</span>
              <el-tag
                v-if="row.author?.role === 'admin'"
                size="small"
                type="warning"
                effect="plain"
              >自建</el-tag>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="status" label="状态" width="110" align="center">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)" effect="light" size="small">
              {{ statusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column
          prop="readCount"
          label="阅读量"
          width="100"
          align="center"
        />

        <el-table-column label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>

        <el-table-column label="操作" width="260" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleView(row)">查看</el-button>
            <el-button
              v-if="canEdit(row)"
              link
              type="primary"
              @click="handleEdit(row)"
            >
              编辑
            </el-button>
            <el-button
              v-if="canPublish(row)"
              link
              type="success"
              @click="handleStatusChange(row, 'published')"
            >
              发布
            </el-button>
            <el-button
              v-if="canOffline(row)"
              link
              type="warning"
              @click="handleStatusChange(row, 'offline')"
            >
              下线
            </el-button>
            <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty description="暂无文章">
            <el-button type="primary" @click="handleAdd">去创建第一篇知识文章</el-button>
          </el-empty>
        </template>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.currentPage"
          v-model:page-size="pagination.size"
          :total="pagination.total"
          :page-sizes="[10, 20, 30, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSearch"
          @current-change="handleSearch"
        />
      </div>
    </el-card>

    <ArticleDialog
      ref="articleDialogRef"
      :categories="categories"
      @refresh="handleSearch"
    />

    <el-dialog
      v-model="viewDialogVisible"
      :title="viewArticle?.title || '查看文章'"
      width="900px"
      top="5vh"
      :close-on-click-modal="false"
    >
      <template v-if="viewArticle">
        <div class="article-preview">
          <img
            v-if="viewArticle.coverImage"
            :src="viewArticle.coverImage"
            class="preview-cover"
            alt="封面"
          />
          <h2 class="preview-title">{{ viewArticle.title }}</h2>
          <div class="preview-meta">
            <span>作者：{{ viewArticle.author?.username || '-' }}</span>
            <span>分类：{{ viewArticle.category?.categoryName || '未分类' }}</span>
            <span>
              状态：
              <el-tag :type="statusType(viewArticle.status)" effect="light" size="small">
                {{ statusLabel(viewArticle.status) }}
              </el-tag>
            </span>
          </div>
          <div class="preview-meta">
            <span>创建时间：{{ formatDate(viewArticle.createdAt) }}</span>
            <span v-if="viewArticle.publishedAt">发布时间：{{ formatDate(viewArticle.publishedAt) }}</span>
          </div>
          <el-divider />
          <div class="article-content" v-html="viewContent"></div>
        </div>
      </template>
      <template #footer>
        <el-button @click="viewDialogVisible = false">关闭</el-button>
        <el-button
          v-if="viewArticle && isAdminArticle(viewArticle)"
          type="primary"
          @click="handleEditFromView"
        >
          编辑
        </el-button>
      </template>
    </el-dialog>

    <!-- 使用须知弹窗 -->
    <el-dialog v-model="showGuideDialog" title="使用须知" width="560px" :close-on-click-modal="false">
      <div class="guide-content">
        <el-alert type="info" :closable="false" style="margin-bottom: 20px">
          <template #title>本页面用于管理所有知识文章，请了解以下规则</template>
        </el-alert>

        <div class="guide-section">
          <h4><el-icon><Edit /></el-icon> 文章编辑</h4>
          <ul>
            <li><strong>管理员自建文章</strong>（作者列标注"自建"）：可随时编辑内容，无论文章处于何种状态</li>
            <li><strong>用户投稿</strong>：不可在此直接编辑，用户修改需提交修订后由审核流程处理</li>
          </ul>
        </div>

        <div class="guide-section">
          <h4><el-icon><Finished /></el-icon> 文章发布</h4>
          <ul>
            <li>草稿或已下线文章可直接点击<strong>「发布」</strong>按钮上线</li>
            <li>审核中的用户投稿需前往<strong>「文章审核」</strong>页面处理</li>
          </ul>
        </div>

        <div class="guide-section">
          <h4><el-icon><WarningFilled /></el-icon> 下线与删除</h4>
          <ul>
            <li><strong>管理员自建文章</strong>：下线或删除仅需二次确认，不要求填写原因</li>
            <li><strong>用户投稿</strong>：下线或删除需填写原因，系统将通知作者</li>
            <li>删除操作不可恢复，请谨慎操作</li>
          </ul>
        </div>

        <div class="guide-section">
          <h4><el-icon><CircleCheck /></el-icon> 审核流程</h4>
          <ul>
            <li>用户投稿和文章修订统一在<strong>「文章审核」</strong>页面集中处理</li>
            <li>审核页可对投稿进行<strong>通过</strong>、<strong>驳回</strong>或<strong>删除</strong>操作</li>
            <li>通过后文章立即发布上线；驳回需填写原因通知作者</li>
          </ul>
        </div>
      </div>
      <template #footer>
        <el-button type="primary" @click="showGuideDialog = false">我知道了</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Document, PriceTag, InfoFilled, Edit, Finished, WarningFilled, CircleCheck } from '@element-plus/icons-vue'
import DOMPurify from 'dompurify'
import TableSearch from '@/components/TableSearch.vue'
import ArticleDialog from '@/components/ArticleDialog.vue'
import { formatDate } from '@/utils/date'
import { logger } from '@/utils/logger'
import {
  categoryTree,
  articlePage,
  articleDetail,
  articleDelete,
  articleStatusUpdate,
} from '@/api/admin'

const articleDialogRef = ref(null)

const statusOptions = [
  { label: '草稿', value: 'draft' },
  { label: '待审核', value: 'pending_review' },
  { label: '已发布', value: 'published' },
  { label: '已驳回', value: 'rejected' },
  { label: '已下线', value: 'offline' },
]

const formItem = [
  { comp: 'input', prop: 'title', label: '标题', placeholder: '请输入标题' },
  {
    comp: 'select',
    prop: 'categoryId',
    label: '分类',
    placeholder: '请选择分类',
    options: [],
  },
  {
    comp: 'select',
    prop: 'status',
    label: '状态',
    placeholder: '请选择状态',
    options: statusOptions,
  },
]

const searchForm = reactive({
  title: '',
  categoryId: '',
  status: '',
})

const pagination = reactive({
  currentPage: 1,
  size: 10,
  total: 0,
})

const categories = ref([])
const tableData = ref([])
const loading = ref(false)
const viewDialogVisible = ref(false)
const viewArticle = ref(null)
const viewContent = ref('')
const showGuideDialog = ref(false)

const statusLabel = (status) => {
  const map = {
    draft: '草稿',
    pending_review: '待审核',
    published: '已发布',
    rejected: '已驳回',
    offline: '已下线',
  }
  return map[status] || status
}

const statusType = (status) => {
  const map = {
    draft: 'info',
    pending_review: 'warning',
    published: 'success',
    rejected: 'danger',
    offline: 'info',
  }
  return map[status] || 'info'
}

const isAdminArticle = (row) => row.author?.role === 'admin'
// 仅管理员自建文章可编辑，用户投稿一律不可编辑
const canEdit = (row) => isAdminArticle(row)
const canPublish = (row) => row.status === 'draft' || row.status === 'offline'
const canOffline = (row) => row.status === 'published'

const handleSearch = async () => {
  loading.value = true
  try {
    const params = {
      currentPage: pagination.currentPage,
      size: pagination.size,
      ...searchForm,
    }
    const res = await articlePage(params)
    tableData.value = res.records || []
    pagination.total = res.total || 0
  } catch (error) {
    logger.error('获取文章列表失败:', error)
  } finally {
    loading.value = false
  }
}

const handleReset = () => {
  searchForm.title = ''
  searchForm.categoryId = ''
  searchForm.status = ''
  pagination.currentPage = 1
  handleSearch()
}

const handleAdd = () => {
  articleDialogRef.value?.open()
}

const handleEdit = (row) => {
  articleDialogRef.value?.open(row.id)
}

const handleView = async (row) => {
  viewDialogVisible.value = true
  viewArticle.value = { ...row }
  viewContent.value = ''
  try {
    const detail = await articleDetail(row.id)
    viewArticle.value = detail
    viewContent.value = DOMPurify.sanitize(detail.content || '（无内容）')
  } catch (error) {
    logger.error('获取文章详情失败:', error)
    viewContent.value = DOMPurify.sanitize(row.content || '（无内容）')
  }
}

const handleEditFromView = () => {
  const article = viewArticle.value
  viewDialogVisible.value = false
  if (article) {
    handleEdit(article)
  }
}

const promptReason = async ({ title, message, placeholder, required = true }) => {
  const result = await ElMessageBox.prompt(message, title, {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    inputType: 'textarea',
    inputPlaceholder: placeholder,
    inputValidator: (value) => {
      if (!required) return true
      return value?.trim() ? true : '请填写原因'
    },
  })
  return result.value?.trim() || ''
}

const handleStatusChange = async (row, targetStatus) => {
  const actionText = targetStatus === 'published' ? '发布' : '下线'

  try {
    let reason = ''
    if (targetStatus === 'offline' && !isAdminArticle(row)) {
      // 用户投稿下线需要填写原因通知作者
      reason = await promptReason({
        title: '下线文章',
        message: `请输入下线《${row.title}》的原因，用户端将收到通知`,
        placeholder: '请输入下线原因',
      })
    } else {
      // 管理员自建文章或发布操作，仅二次确认
      await ElMessageBox.confirm(
        `确认${actionText}文章《${row.title}》吗？`,
        '确认操作',
        {
          confirmButtonText: `确认${actionText}`,
          cancelButtonText: '取消',
          type: targetStatus === 'offline' ? 'warning' : 'success',
        },
      )
    }

    await articleStatusUpdate(row.id, targetStatus, reason)
    ElMessage.success(`${actionText}成功`)
    handleSearch()
  } catch (error) {
    if (error !== 'cancel') {
      logger.error('更新状态失败:', error)
    }
  }
}

const handleDelete = async (row) => {
  try {
    let reason = ''
    if (isAdminArticle(row)) {
      // 管理员自建文章：仅二次确认，无需填写原因
      await ElMessageBox.confirm(
        `确认删除文章《${row.title}》吗？此操作不可恢复。`,
        '删除确认',
        {
          confirmButtonText: '确认删除',
          cancelButtonText: '取消',
          type: 'warning',
        },
      )
    } else {
      // 用户投稿：需要填写删除原因通知作者
      reason = await promptReason({
        title: '删除文章',
        message: `请输入删除《${row.title}》的原因，用户端将收到通知`,
        placeholder: '请输入删除原因',
      })
    }

    await articleDelete(row.id, reason)
    ElMessage.success('删除成功')
    handleSearch()
  } catch (error) {
    if (error !== 'cancel') {
      logger.error('删除文章失败:', error)
    }
  }
}

onMounted(async () => {
  try {
    const [data] = await Promise.all([categoryTree(), handleSearch()])
    categories.value = data.map((item) => ({
      label: item.categoryName,
      value: item.id,
    }))
    formItem[1].options = categories.value
  } catch (error) {
    logger.error('初始化文章页面失败:', error)
  }
})
</script>

<style lang="scss" scoped>
.knowledge-container {
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--layout-padding);

  .header-section {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .section-title {
      font-size: 20px;
      font-weight: 600;
      color: #303133;
    }
  }

  .search-card,
  .table-card {
    border: none;
    border-radius: 8px;
    background-color: var(--card-bg);
  }

  .table-card {
    flex: 1;
    overflow-x: auto;

    .author-cell {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .title-cell,
    .tag-cell {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #606266;

      .el-icon {
        color: #909399;
      }
    }

    :deep(.el-table) {
      --el-table-header-bg-color: #f8f9fb;
      --el-table-header-text-color: #303133;

      .el-table__header th {
        font-weight: 600;
      }

      .el-button--link {
        padding: 0 4px;
      }
    }

    .pagination-container {
      margin-top: 20px;
      display: flex;
      justify-content: flex-end;
    }
  }
}

.guide-content {
  .guide-section {
    margin-bottom: 18px;

    h4 {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 15px;
      font-weight: 600;
      color: #303133;
      margin: 0 0 8px 0;
    }

    ul {
      margin: 0;
      padding-left: 20px;

      li {
        font-size: 14px;
        color: #606266;
        line-height: 1.8;
      }
    }
  }
}

.article-preview {
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
    flex-wrap: wrap;
    gap: 12px 24px;
    font-size: 13px;
    color: #909399;
    margin-bottom: 6px;
  }

  .article-content {
    line-height: 1.8;
    font-size: 15px;
    color: #303133;

    :deep(img) {
      max-width: 100%;
      border-radius: 4px;
    }

    :deep(pre) {
      background: #f5f7fa;
      padding: 16px;
      border-radius: 6px;
      overflow-x: auto;
    }

    :deep(blockquote) {
      border-left: 4px solid var(--primary-color);
      padding-left: 16px;
      color: #909399;
      margin: 16px 0;
    }
  }
}

@media screen and (max-width: 768px) {
  .header-section {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;

    .el-button {
      width: 100%;
    }
  }

  .knowledge-container .table-card .pagination-container {
    flex-wrap: wrap;
    justify-content: center;
  }

  .article-preview .preview-meta {
    flex-direction: column;
    gap: 4px;
  }
}
</style>
