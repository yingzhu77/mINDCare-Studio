<template>
  <!-- 知识文章新增/编辑弹窗 -->
  <el-dialog
    v-model="visible"
    :title="dialogTitle"
    width="800px"
    @close="handleClose"
    :close-on-click-modal="false"
    destroy-on-close
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="100px"
      class="article-form"
    >
      <!-- 文章标题 -->
      <el-form-item label="文章标题" prop="title">
        <el-input
          v-model="form.title"
          placeholder="请输入文章标题"
          maxlength="100"
          show-word-limit
        />
      </el-form-item>

      <!-- 所属分类 -->
      <el-form-item label="所属分类" prop="categoryId">
        <el-select v-model="form.categoryId" placeholder="请选择分类" style="width: 100%">
          <el-option
            v-for="item in categories"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>

      <!-- 文章摘要 -->
      <el-form-item label="文章摘要" prop="summary">
        <el-input
          v-model="form.summary"
          type="textarea"
          :rows="3"
          placeholder="请输入文章摘要（可选）"
          maxlength="1000"
          show-word-limit
        />
      </el-form-item>

      <!-- 标签 -->
      <el-form-item label="标签" prop="tags">
        <el-select
          v-model="form.tags"
          multiple
          filterable
          allow-create
          default-first-option
          placeholder="请输入或选择标签"
          style="width: 100%"
        >
          <el-option
            v-for="tag in commonTags"
            :key="tag"
            :label="tag"
            :value="tag"
          />
        </el-select>
      </el-form-item>

      <!-- 封面图片 -->
      <el-form-item label="封面图片" prop="coverImage">
        <div class="upload-wrapper">
          <el-upload
            v-if="!form.coverImage"
            class="cover-uploader"
            drag
            action=""
            :auto-upload="false"
            :show-file-list="false"
            :on-change="handleUpload"
            v-loading="uploading"
            element-loading-text="正在上传..."
          >
            <el-icon class="el-icon--upload"><plus /></el-icon>
            <div class="el-upload__text">点击或拖拽上传封面</div>
          </el-upload>
          
          <div v-else class="cover-preview">
            <img :src="form.coverImage" class="preview-img" />
            <div class="cover-actions">
              <el-button type="danger" size="small" @click="confirmRemoveCover">
                移除封面
              </el-button>
            </div>
          </div>
        </div>
      </el-form-item>

      <!-- 文章内容 - 富文本编辑器（异步加载，不影响首屏） -->
      <el-form-item label="文章内容" prop="content">
        <ArticleEditor v-model="form.content" />
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">
          {{ form.id ? '保存' : '发布' }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
/**
 * 知识文章新增/编辑弹窗组件
 * 本组件实现了文章的创建、编辑、封面上传及富文本编辑功能。
 * 严格遵循 Element Plus 和 wangEditor v5 的官方最佳实践。
 */
import { ref, reactive, defineAsyncComponent } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import {
  articleAdd,
  articleUpdate,
  articleDetail,
  fileUpload
} from '@/api/admin'
import { logger } from '@/utils/logger'

// wangEditor 通过异步组件加载，Vite 自动拆分为独立 chunk（~500kB）
const ArticleEditor = defineAsyncComponent(() => import('@/components/ArticleEditor.vue'))

// 定义组件接收的属性：目前主要是分类列表，用于填充下拉选择框
const props = defineProps({
  categories: {
    type: Array,
    default: () => []
  }
})

// 定义组件向外发送的事件：发布或保存成功后通知父组件刷新列表
const emit = defineEmits(['refresh'])

// 响应式状态管理
const visible = ref(false)         // 控制弹窗显示隐藏
const dialogTitle = ref('新增文章')  // 弹窗动态标题
const submitting = ref(false)     // 提交按钮的加载状态
const uploading = ref(false)      // 封面上传时的加载状态
const formRef = ref(null)         // 获取表单 DOM 实例，用于校验

// 常用标签库：提供预定义的建议标签
const commonTags = ['焦虑', '抑郁', '情绪管理', '压力', '睡眠', '人际关系', '心理健康']

// 表单初始默认值：用于重置表单
const initialForm = {
  id: undefined,
  title: '',
  categoryId: '',
  summary: '',
  tags: [],
  coverImage: '',
  content: ''
}

// 表单核心数据对象
const form = reactive({ ...initialForm })

/**
 * 表单校验规则：
 * 1. 标题：必填，2-100 字符
 * 2. 分类：必选
 * 3. 标签：必填，至少 1 个（通过 multiple 选择器实现）
 * 4. 内容：必填，至少 10 字符（通过富文本编辑器内容长度判断）
 */
const rules = {
  title: [
    { required: true, message: '请输入文章标题', trigger: 'blur' },
    { min: 2, max: 100, message: '标题长度在 2 到 100 个字符', trigger: 'blur' }
  ],
  categoryId: [
    { required: true, message: '请选择所属分类', trigger: 'change' }
  ],
  tags: [
    { required: true, message: '请至少选择或输入一个标签', trigger: 'change', type: 'array' }
  ],
  content: [
    { required: true, message: '请输入文章内容', trigger: 'blur' },
    { min: 10, message: '内容不能少于 10 个字符', trigger: 'blur' }
  ]
}

/**
 * 公开方法：由父组件通过 ref 调用来打开弹窗
 * @param {String} id 文章 ID，存在则为编辑模式，否则为新增模式
 */
const open = async (id) => {
  resetForm() // 先清空一次数据，确保无污染
  visible.value = true
  if (id) {
    dialogTitle.value = '编辑文章'
    await fetchDetail(id)
  } else {
    dialogTitle.value = '新增文章'
    form.id = '' // 新增模式下确保 id 为空
  }
}

/**
 * 拉取文章详情数据：编辑模式下回显各字段
 */
const fetchDetail = async (id) => {
  try {
    const data = await articleDetail(id)
    // 使用接口数据填充表单，特别处理标签（由逗号分隔字符串转回数组）
    Object.assign(form, {
      ...data,
      tags: data.tags ? data.tags.split(',') : []
    })
  } catch (error) {
    ElMessage.error('拉取文章详情失败')
  }
}

/**
 * 数据清空：重置表单校验状态、编辑器内容及封面预览
 */
const resetForm = () => {
  if (formRef.value) formRef.value.resetFields()
  Object.assign(form, initialForm)
}

/**
 * 监听弹窗关闭事件：触发数据清空
 */
const handleClose = () => {
  resetForm()
}

/**
 * 封面图上传：支持点击和拖拽
 * 包含格式校验（jpg/png/webp）和大小校验（2MB）
 */
const handleUpload = async (uploadFile) => {
  const file = uploadFile.raw
  
  // 1. 格式校验
  const isImage = ['image/jpeg', 'image/png', 'image/webp'].includes(file.type)
  if (!isImage) {
    ElMessage.error('封面图只能是 JPG/PNG/WEBP 格式!')
    return false
  }
  
  // 2. 大小校验
  const isLt2M = file.size / 1024 / 1024 < 2
  if (!isLt2M) {
    ElMessage.error('封面图大小不能超过 2MB!')
    return false
  }

  uploading.value = true // 显示加载遮罩
  try {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('businessType', 'ARTICLE')
    formData.append('businessId', form.id || 'new')
    formData.append('businessField', 'cover')
    
    const uploadResult = await fileUpload(formData)
    form.coverImage = uploadResult.url // 回显缩略图并保存 URL
    ElMessage.success('封面上传成功')
  } catch (error) {
    logger.error('上传异常:', error)
    ElMessage.error('封面上传失败，请稍后重试')
  } finally {
    uploading.value = false // 隐藏加载遮罩
  }
}

/**
 * 二次确认移除封面
 */
const confirmRemoveCover = () => {
  ElMessageBox.confirm('确定要移除当前封面图片吗？', '操作确认', {
    confirmButtonText: '确定移除',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    form.coverImage = ''
    ElMessage.success('封面图已移除')
  }).catch(() => {})
}

/**
 * 提交表单：发布或更新文章
 */
const handleSubmit = async () => {
  if (!formRef.value) return
  
  // 触发 Element Plus 表单校验
  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true
      try {
        // 数据适配：将标签数组转为逗号分隔字符串，符合后端 JSON 字段要求
        const submitData = {
          title: form.title,
          categoryId: form.categoryId || undefined,
          summary: form.summary || undefined,
          tags: form.tags.join(','),
          coverImage: form.coverImage || undefined,
          content: form.content
        }
        
        if (form.id) {
          // 编辑模式下调用更新接口
          await articleUpdate({ id: form.id, ...submitData })
          ElMessage.success('文章已更新')
        } else {
          // 新增模式下调用发布接口
          await articleAdd(submitData)
          ElMessage.success('文章发布成功')
        }
        
        visible.value = false // 成功后关闭弹窗
        emit('refresh')       // 通知父组件刷新列表
      } catch (error) {
        ElMessage.error(form.id ? '更新失败' : '发布失败')
      } finally {
        submitting.value = false
      }
    } else {
      ElMessage.warning('请完善表单内容后再提交')
    }
  })
}

// 向父组件暴露方法
defineExpose({ open })
</script>

<style lang="scss" scoped>
.article-form {
  padding-right: 20px;
}

.upload-wrapper {
  width: 100%;
}

.cover-uploader {
  :deep(.el-upload-dragger) {
    padding: 20px;
    height: 180px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
}

.cover-preview {
  position: relative;
  width: 320px;
  height: 180px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #dcdfe6;

  .preview-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .cover-actions {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: rgba(0, 0, 0, 0.5);
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.3s;
  }

  &:hover .cover-actions {
    opacity: 1;
  }
}

.editor-wrapper {
  border: 1px solid #ccc;
  width: 100%;
  z-index: 100;
}

.dialog-footer {
  padding-top: 10px;
}
</style>
