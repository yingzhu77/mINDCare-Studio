<template>
  <div class="detail-view">
    <div class="back-bar">
      <el-button text @click="goBack">
        <el-icon><ArrowLeft /></el-icon>返回文章列表
      </el-button>
    </div>

    <div v-loading="loading" class="article-container">
      <template v-if="article">
        <div v-if="article.coverImage" class="cover-image">
          <img :src="article.coverImage" :alt="article.title">
        </div>

        <article class="article-body">
          <div class="article-meta">
            <el-tag v-if="article.category" size="small" effect="plain" type="primary">
              {{ article.category.categoryName }}
            </el-tag>
            <span class="meta-item">{{ article.author?.username || '匿名' }}</span>
            <span class="meta-divider">·</span>
            <span class="meta-item">{{ formatDate(article.publishedAt) }}</span>
            <span class="meta-divider">·</span>
            <span class="meta-item">{{ article.readCount }} 次阅读</span>
          </div>

          <h1 class="article-title">{{ article.title }}</h1>

          <div v-if="article.tags" class="article-tags">
            <el-tag
              v-for="tag in parsedTags"
              :key="tag"
              size="small"
              round
              effect="light"
            >{{ tag }}</el-tag>
          </div>

          <div v-if="article.summary" class="article-summary">
            <blockquote>{{ article.summary }}</blockquote>
          </div>

          <div class="article-content" v-html="renderedContent" />
        </article>
      </template>
      <el-empty v-else-if="!loading" description="文章不存在" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft } from '@element-plus/icons-vue'
import { formatDate } from '@/utils/date'
import { publishedArticleDetail } from '@/api/client'

const route = useRoute()
const router = useRouter()

const goBack = () => {
  if (route.path.startsWith('/client/knowledge')) {
    router.push('/client/knowledge')
  } else {
    router.push('/articles')
  }
}

const article = ref(null)
const loading = ref(true)

const parsedTags = computed(() => {
  if (!article.value?.tags) return []
  try {
    const parsed = JSON.parse(article.value.tags)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return typeof article.value.tags === 'string' ? [article.value.tags] : []
  }
})

const renderedContent = computed(() => {
  const content = article.value?.content || ''
  // 简单的换行转段落渲染
  return content
    .split('\n')
    .filter(Boolean)
    .map(p => `<p>${p}</p>`)
    .join('')
})

const fetchDetail = async () => {
  loading.value = true
  try {
    article.value = await publishedArticleDetail(Number(route.params.id))
  } catch {
    article.value = null
  } finally {
    loading.value = false
  }
}

onMounted(fetchDetail)
</script>

<style lang="scss" scoped>
.detail-view {
  max-width: 760px;
  margin: 0 auto;
  padding: 24px 0;

  .back-bar {
    margin-bottom: 20px;
  }

  .article-container {
    min-height: 300px;

    .cover-image {
      width: 100%;
      max-height: 360px;
      border-radius: 12px;
      overflow: hidden;
      margin-bottom: 32px;

      img {
        width: 100%;
        height: auto;
        max-height: 360px;
        object-fit: cover;
        display: block;
      }
    }

    .article-body {
      .article-meta {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 16px;
        font-size: 14px;
        color: #909399;
        flex-wrap: wrap;

        .meta-divider {
          color: #e4e7ed;
        }
      }

      .article-title {
        font-size: 28px;
        font-weight: 700;
        color: #303133;
        margin: 0 0 16px;
        line-height: 1.35;
      }

      .article-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-bottom: 20px;
      }

      .article-summary {
        margin-bottom: 28px;

        blockquote {
          margin: 0;
          padding: 14px 20px;
          background: #f0f9ff;
          border-left: 4px solid #a78bfa;
          border-radius: 4px;
          color: #606266;
          font-size: 15px;
          line-height: 1.7;
        }
      }

      .article-content {
        font-size: 16px;
        line-height: 1.8;
        color: #303133;

        :deep(p) {
          margin: 0 0 16px;
        }
      }
    }
  }
}

@media (max-width: 640px) {
  .detail-view {
    padding: 16px 0;

    .article-body {
      .article-title {
        font-size: 22px;
      }
    }
  }
}
</style>
