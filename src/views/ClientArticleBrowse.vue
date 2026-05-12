<template>
  <div class="browse-view">
    <div class="page-header">
      <h2 class="page-title">知识文章</h2>
      <p class="page-desc">精选心理健康知识，助您更好地了解自己</p>
    </div>

    <!-- 分类筛选 -->
    <div class="filter-section">
      <div class="category-filters">
        <el-tag
          :type="activeCategory === null ? 'primary' : 'info'"
          effect="plain"
          class="filter-tag"
          @click="activeCategory = null; handleSearch()"
        >全部分类</el-tag>
        <el-tag
          v-for="cat in categories"
          :key="cat.id"
          :type="activeCategory === cat.id ? 'primary' : 'info'"
          effect="plain"
          class="filter-tag"
          @click="activeCategory = cat.id; handleSearch()"
        >{{ cat.categoryName }}</el-tag>
      </div>
      <el-input
        v-model="searchKeyword"
        placeholder="搜索文章标题..."
        clearable
        class="search-input"
        @keyup.enter="handleSearch"
        @clear="handleSearch"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
    </div>

    <!-- 文章卡片列表 -->
    <div v-loading="loading" class="article-list">
      <template v-if="articles.length > 0">
        <el-card
          v-for="article in articles"
          :key="article.id"
          shadow="hover"
          class="article-card"
          @click="$router.push(`/articles/${article.id}`)"
        >
          <div class="card-body">
            <div class="card-content">
              <div class="card-meta">
                <el-tag size="small" effect="plain" type="primary">
                  {{ article.category?.categoryName || '未分类' }}
                </el-tag>
                <span class="publish-date">{{ formatDate(article.publishedAt) }}</span>
              </div>
              <h3 class="card-title">{{ article.title }}</h3>
              <p class="card-summary">{{ article.summary || '' }}</p>
              <div class="card-footer">
                <span class="author">{{ article.author?.username || '匿名' }}</span>
                <span class="read-count">{{ article.readCount }} 次阅读</span>
              </div>
            </div>
            <div v-if="article.coverImage" class="card-cover">
              <img :src="article.coverImage" :alt="article.title">
            </div>
          </div>
        </el-card>
      </template>
      <el-empty v-else description="暂无已发布的文章" />
    </div>

    <!-- 分页 -->
    <div class="pagination-wrapper">
      <el-pagination
        v-model:current-page="pageNum"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 30]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="fetchArticles"
        @current-change="fetchArticles"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { formatDate } from '@/utils/date'
import { publishedArticlePage, publishedCategories } from '@/api/client'

const articles = ref([])
const categories = ref([])
const loading = ref(false)
const pageNum = ref(1)
const pageSize = ref(10)
const total = ref(0)
const activeCategory = ref(null)
const searchKeyword = ref('')

const fetchCategories = async () => {
  try {
    categories.value = await publishedCategories()
  } catch {
    // 匿名用户获取分类失败时不阻塞页面
  }
}

const fetchArticles = async () => {
  loading.value = true
  try {
    const res = await publishedArticlePage({
      currentPage: pageNum.value,
      size: pageSize.value,
      categoryId: activeCategory.value ?? undefined,
      title: searchKeyword.value || undefined,
    })
    articles.value = res?.records || []
    total.value = res?.total || 0
  } catch {
    articles.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pageNum.value = 1
  fetchArticles()
}

onMounted(() => {
  fetchCategories()
  fetchArticles()
})
</script>

<style lang="scss" scoped>
.browse-view {
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

  .filter-section {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 24px;
    flex-wrap: wrap;

    .category-filters {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;

      .filter-tag {
        cursor: pointer;
        padding: 0 14px;
        height: 32px;
        line-height: 32px;
        font-size: 14px;
        border-radius: 16px;
        transition: all 0.2s;

        &:hover {
          opacity: 0.8;
        }
      }
    }

    .search-input {
      width: 240px;
      flex-shrink: 0;
    }
  }

  .article-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
    min-height: 200px;

    .article-card {
      cursor: pointer;
      border: none;
      border-radius: 10px;
      transition: transform 0.15s, box-shadow 0.15s;

      &:hover {
        transform: translateY(-2px);
      }

      :deep(.el-card__body) {
        padding: 0;
      }

      .card-body {
        display: flex;
        padding: 20px 24px;
        gap: 20px;

        .card-content {
          flex: 1;
          min-width: 0;

          .card-meta {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 10px;

            .publish-date {
              font-size: 13px;
              color: #c0c4cc;
            }
          }

          .card-title {
            font-size: 18px;
            font-weight: 600;
            color: #303133;
            margin: 0 0 10px;
            line-height: 1.4;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }

          .card-summary {
            font-size: 14px;
            color: #909399;
            margin: 0 0 14px;
            line-height: 1.6;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }

          .card-footer {
            display: flex;
            align-items: center;
            gap: 16px;
            font-size: 13px;
            color: #c0c4cc;

            .author {
              font-weight: 500;
            }
          }
        }

        .card-cover {
          width: 160px;
          height: 110px;
          flex-shrink: 0;
          border-radius: 8px;
          overflow: hidden;

          img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
        }
      }
    }
  }

  .pagination-wrapper {
    margin-top: 32px;
    display: flex;
    justify-content: center;
  }
}

@media (max-width: 640px) {
  .browse-view {
    padding: 16px 0;

    .filter-section {
      flex-direction: column;
      align-items: stretch;

      .search-input {
        width: 100%;
      }
    }

    .article-list .article-card .card-body {
      flex-direction: column;

      .card-cover {
        width: 100%;
        height: 180px;
      }
    }
  }
}
</style>
