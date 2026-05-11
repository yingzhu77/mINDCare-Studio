<template>
  <div class="article-create-view">
    <div class="header-section">
      <el-button text @click="goBack">
        <el-icon><ArrowLeft /></el-icon>返回
      </el-button>
      <h2 class="section-title">{{ isEdit ? '编辑文章' : '写文章' }}</h2>
    </div>

    <el-card class="form-card" shadow="never">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入文章标题" maxlength="200" show-word-limit />
        </el-form-item>

        <el-form-item label="分类" prop="categoryId">
          <el-select v-model="form.categoryId" placeholder="请选择分类" style="width: 100%">
            <el-option
              v-for="cat in categories"
              :key="cat.id"
              :label="cat.categoryName"
              :value="cat.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="摘要" prop="summary">
          <el-input
            v-model="form.summary"
            type="textarea"
            :rows="3"
            placeholder="请输入文章摘要"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="封面">
          <el-upload
            ref="uploadRef"
            action="/api/file/upload"
            :headers="uploadHeaders"
            :on-success="handleUploadSuccess"
            :on-error="handleUploadError"
            :show-file-list="false"
            accept="image/*"
          >
            <el-button type="default">选择图片</el-button>
            <template #tip>
              <span class="upload-tip">支持 JPG/PNG，建议尺寸 16:9</span>
            </template>
          </el-upload>
          <img v-if="form.coverImage" :src="coverUrl" class="cover-preview" alt="封面预览" />
        </el-form-item>

        <el-form-item label="内容" prop="content">
          <el-input
            v-model="form.content"
            type="textarea"
            :rows="15"
            placeholder="请输入文章内容，支持 Markdown 格式"
            maxlength="50000"
            show-word-limit
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :loading="saving" @click="handleSave">保存草稿</el-button>
          <el-button @click="goBack">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import { myArticleAdd, myArticleUpdate, myArticleDetail } from '@/api/client'
import { categoryTree } from '@/api/admin'

const route = useRoute()
const router = useRouter()
const formRef = ref(null)
const uploadRef = ref(null)
const saving = ref(false)

const isEdit = computed(() => !!route.params.id)
const editId = computed(() => route.params.id)

const form = reactive({
  title: '',
  categoryId: null,
  summary: '',
  coverImage: '',
  content: '',
})

const rules = {
  title: [{ required: true, message: '请输入文章标题', trigger: 'blur' }],
  content: [{ required: true, message: '请输入文章内容', trigger: 'blur' }],
}

const uploadHeaders = computed(() => ({
  token: localStorage.getItem('token') || '',
}))

const coverUrl = computed(() => {
  if (!form.coverImage) return ''
  // 后端返回的 url 已是 /uploads/xxx 格式
  if (form.coverImage.startsWith('http')) return form.coverImage
  return form.coverImage
})

const categories = ref([])

const loadCategories = async () => {
  try {
    categories.value = await categoryTree()
  } catch {
    categories.value = []
  }
}

const loadArticle = async () => {
  if (!editId.value) return
  try {
    const data = await myArticleDetail(editId.value)
    form.title = data.title || ''
    form.categoryId = data.categoryId ?? null
    form.summary = data.summary || ''
    form.coverImage = data.coverImage || ''
    form.content = data.content || ''
  } catch {
    ElMessage.error('加载文章失败')
    goBack()
  }
}

const handleUploadSuccess = (res) => {
  // 后端统一响应 { code, message, data: { url } }
  const url = res?.data?.url || res?.url || res?.path || ''
  if (url) form.coverImage = url
  ElMessage.success('上传成功')
}

const handleUploadError = () => {
  ElMessage.error('上传失败')
}

const handleSave = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    saving.value = true
    try {
      const payload = {
        title: form.title,
        categoryId: form.categoryId || undefined,
        summary: form.summary || undefined,
        coverImage: form.coverImage || undefined,
        content: form.content,
      }

      if (isEdit.value) {
        await myArticleUpdate(editId.value, payload)
        ElMessage.success('已更新')
      } else {
        await myArticleAdd(payload)
        ElMessage.success('已保存草稿')
      }
      router.push('/client/articles')
    } catch {
      // 错误由 request.js 统一处理
    } finally {
      saving.value = false
    }
  })
}

const goBack = () => {
  router.push('/client/articles')
}

onMounted(async () => {
  await loadCategories()
  if (isEdit.value) {
    await loadArticle()
  }
})
</script>

<style lang="scss" scoped>
.article-create-view {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 800px;

  .header-section {
    display: flex;
    align-items: center;
    gap: 12px;

    .section-title {
      font-size: 20px;
      font-weight: 600;
      color: #303133;
      margin: 0;
    }
  }

  .form-card {
    border: none;
    border-radius: 8px;

    .cover-preview {
      margin-top: 12px;
      max-width: 320px;
      max-height: 180px;
      border-radius: 6px;
      object-fit: cover;
      border: 1px solid #e4e7ed;
    }

    .upload-tip {
      font-size: 12px;
      color: #909399;
    }
  }
}
</style>
