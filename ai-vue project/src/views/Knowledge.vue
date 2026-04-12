<template>
  <div class="knowledge-container">
    <!-- 头部区域：页面标题与右侧新增按钮 -->
    <div class="header-section">
      <h2 class="section-title">知识文章</h2>
      <div class="header-buttons">
        <el-button type="primary" @click="handleAdd">新增</el-button>
        <el-button type="primary" plain>编辑</el-button>
      </div>
    </div>

    <!-- 搜索筛选区：使用封装好的 TableSearch 组件 -->
    <!-- :form="searchForm" 双向绑定输入的数据 -->
    <!-- :config="formItem" 定义显示哪些搜索项（标题、分类、状态） -->
    <TableSearch
      :form="searchForm"
      :config="formItem"
      @search="handleSearch"
      @reset="handleReset"
    />

    <!-- 数据表格区：渲染后端返回的知识文章列表 -->
    <el-card class="table-card" shadow="never">
      <!-- v-loading="loading" 用于在获取数据时显示加载动画 -->
      <el-table :data="tableData" v-loading="loading" style="width: 100%">
        <!-- 文章标题：匹配接口返回的 title 字段 -->
        <el-table-column prop="title" label="文章标题" min-width="200">
          <template #default="{ row }">
            <div class="title-cell">
              <el-icon><Document /></el-icon>
              <span>{{ row.title }}</span>
            </div>
          </template>
        </el-table-column>

        <!-- 分类名称：显示文章所属分类 -->
        <el-table-column prop="categoryName" label="分类" width="150">
          <template #default="{ row }">
            <div class="tag-cell">
              <el-icon><PriceTag /></el-icon>
              <span>{{ row.categoryName || '未分类' }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="authorName" label="作者" width="120" />

        <!-- 阅读量：匹配接口返回的 readCount 字段 -->
        <el-table-column
          prop="readCount"
          label="阅读量"
          width="100"
          align="center"
        />

        <!-- 发布时间：显示文章创建或更新的时间 -->
        <el-table-column prop="publishedAt" label="发布时间" width="180" />

        <!-- 操作区域：根据文章当前状态显示对应的业务按钮 -->
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary">编辑</el-button>
            <!-- 状态切换：1为已发布，显示下线；0为草稿，显示发布 -->
            <el-button link :type="row.status == '1' ? 'warning' : 'success'">
              {{ row.status == '1' ? '下线' : '发布' }}
            </el-button>
            <el-button link type="danger">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页区域：控制表格显示的页码和每页条数 -->
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
  </div>
</template>

<script setup>
/**
 * 知识文章管理页面
 * 这是一个为初学者设计的 Vue 3 组件，使用了 Script Setup 语法糖。
 * 它集成了 API 调用、动态表单组件和 Element Plus UI 框架。
 */
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Document, PriceTag } from '@element-plus/icons-vue'
import TableSearch from '@/components/TableSearch.vue'
import { categoryTree, articlePage } from '@/api/admin'

// 定义搜索栏的结构：这是一个数组，决定了搜索区域有哪些输入框
const formItem = [
  { comp: 'input', prop: 'title', label: '标题', placeholder: '请输入标题' },
  {
    comp: 'select',
    prop: 'categoryId',
    label: '分类',
    placeholder: '请选择分类',
    options: [], // 分类数据将在 onMounted 中动态加载
  },
  {
    comp: 'select',
    prop: 'status',
    label: '状态',
    placeholder: '请选择状态',
    options: [
      { label: '草稿', value: '0' },
      { label: '已发布', value: '1' },
      { label: '已下线', value: '2' },
    ],
  },
]

// 搜索表单的实时数据：用于存储用户在输入框里填的内容
const searchForm = reactive({
  title: '',
  categoryId: '',
  status: '',
})

// 分页控制器：记录当前在第几页，以及总共有多少条数据
const pagination = reactive({
  currentPage: 1, // 当前页
  size: 10, // 每页显示 10 条
  total: 0, // 后端返回的总数据量
})

/**
 * 核心功能：搜索与查询
 * 将用户填写的过滤条件发送给后端，并更新表格数据。
 */
const handleSearch = async () => {
  loading.value = true // 开启加载遮罩，提示用户数据正在获取中
  try {
    // 整理请求参数：合并分页参数和过滤参数
    const params = {
      currentPage: pagination.currentPage,
      size: pagination.size,
      ...searchForm,
    }
    // 发送网络请求，并等待返回结果
    const res = await articlePage(params)
    // 更新数据：tableData 会自动驱动 UI 更新，显示表格内容
    tableData.value = res.records || []
    pagination.total = res.total || 0
  } catch (error) {
    // 如果请求失败，由 request.js 统一处理，这里仅做控制台输出记录
    console.error('获取文章列表失败:', error)
  } finally {
    loading.value = false // 关闭加载遮罩
  }
}

/**
 * 重置搜索条件
 */
const handleReset = () => {
  searchForm.title = ''
  searchForm.categoryId = ''
  searchForm.status = ''
  pagination.currentPage = 1 // 回到第一页
  handleSearch() // 重新获取数据
}

// 模拟新增按钮点击
const handleAdd = () => {
  ElMessage.info('新增文章功能正在开发中...')
}

// 存储分类映射关系，方便将 ID 转换为名称
const categoryMap = reactive({})
// 存储下拉框需要的分类选项列表
const categories = ref([])
// 存储表格里的行数据
const tableData = ref([])
// 加载状态标志
const loading = ref(false)

/**
 * 生命周期钩子：页面组件挂载完成（进入页面）后立即执行
 */
onMounted(async () => {
  try {
    // 1. 先获取分类树数据，填充搜索框里的“分类”下拉列表
    const data = await categoryTree()
    categories.value = data.map((item) => {
      // 将原始数据转换为 Element Plus 下拉框需要的 {label, value} 格式
      categoryMap[item.id] = item.categoryName
      return {
        label: item.categoryName,
        value: item.id,
      }
    })
    // 将处理好的分类列表赋值给 formItem 中的第二个配置项
    formItem[1].options = categories.value

    // 2. 页面初始化完成，立即渲染首屏数据
    handleSearch()
  } catch (error) {
    console.error('初始化分类数据失败:', error)
  }
})
</script>

<style lang="scss" scoped>
.knowledge-container {
  /* 呼吸感：使用全局变量定义的边距 */
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

/* 移动端适配 */
@media screen and (max-width: 768px) {
  .header-section {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;

    .el-button {
      width: 100%;
    }
  }
}

/* 弹窗样式优化 */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
