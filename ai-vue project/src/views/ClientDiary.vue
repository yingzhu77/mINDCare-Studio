<template>
  <div class="diary-view">
    <div class="header-section">
      <h2 class="section-title">我的情绪日记</h2>
      <el-button type="primary" @click="handleAdd">
        <el-icon><Plus /></el-icon>写日记
      </el-button>
    </div>

    <!-- 日记列表 -->
    <el-card class="table-card" shadow="never">
      <el-table
        v-loading="loading"
        :data="tableData"
        style="width: 100%"
        class="custom-table"
      >
        <el-table-column label="日期" width="120">
          <template #default="{ row }">
            {{ row.diaryDate || '-' }}
          </template>
        </el-table-column>

        <el-table-column label="心情评分" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getMoodType(row.moodScore)" effect="light" round>
              {{ row.moodScore || '-' }}/10
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="睡眠质量" width="100" align="center">
          <template #default="{ row }">
            {{ row.sleepQuality != null ? row.sleepQuality + '/10' : '-' }}
          </template>
        </el-table-column>

        <el-table-column label="压力等级" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStressType(row.stressLevel)" effect="light" round>
              {{ row.stressLevel != null ? row.stressLevel + '/10' : '-' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="主导情绪" width="120">
          <template #default="{ row }">
            <el-tag
              v-if="row.dominantEmotion"
              size="small"
              effect="light"
              class="emotion-tag"
            >
              {{ row.dominantEmotion }}
            </el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>

        <el-table-column label="日记内容" min-width="200">
          <template #default="{ row }">
            <div class="content-preview text-ellipsis">
              {{ row.diaryContent || '-' }}
            </div>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="140" align="center" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>

        <template #empty>
          <el-empty description="暂无情绪日记" />
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

    <!-- 新增/编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="90px"
        label-position="top"
      >
        <el-form-item label="日期" prop="diaryDate">
          <el-date-picker
            v-model="form.diaryDate"
            type="date"
            placeholder="选择日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>

        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="心情评分 (1-10)" prop="moodScore">
              <el-slider
                v-model="form.moodScore"
                :min="1"
                :max="10"
                :marks="{ 1: '1', 5: '5', 10: '10' }"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="睡眠质量 (1-10)" prop="sleepQuality">
              <el-slider
                v-model="form.sleepQuality"
                :min="1"
                :max="10"
                :marks="{ 1: '1', 5: '5', 10: '10' }"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="压力等级 (1-10)" prop="stressLevel">
              <el-slider
                v-model="form.stressLevel"
                :min="1"
                :max="10"
                :marks="{ 1: '1', 5: '5', 10: '10' }"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="主导情绪" prop="dominantEmotion">
          <el-select v-model="form.dominantEmotion" placeholder="选择情绪" style="width: 100%">
            <el-option label="开心" value="开心" />
            <el-option label="平静" value="平静" />
            <el-option label="焦虑" value="焦虑" />
            <el-option label="悲伤" value="悲伤" />
            <el-option label="愤怒" value="愤怒" />
            <el-option label="恐惧" value="恐惧" />
            <el-option label="困惑" value="困惑" />
            <el-option label="疲惫" value="疲惫" />
            <el-option label="孤单" value="孤单" />
            <el-option label="感恩" value="感恩" />
          </el-select>
        </el-form-item>

        <el-form-item label="情绪触发因素" prop="emotionTriggers">
          <el-select
            v-model="form.emotionTriggers"
            multiple
            filterable
            allow-create
            default-first-option
            placeholder="选择或输入触发因素"
            style="width: 100%"
          >
            <el-option label="工作" value="工作" />
            <el-option label="学习" value="学习" />
            <el-option label="家庭" value="家庭" />
            <el-option label="人际交往" value="人际交往" />
            <el-option label="健康" value="健康" />
            <el-option label="经济" value="经济" />
            <el-option label="感情" value="感情" />
            <el-option label="其他" value="其他" />
          </el-select>
        </el-form-item>

        <el-form-item label="日记内容" prop="diaryContent">
          <el-input
            v-model="form.diaryContent"
            type="textarea"
            :rows="5"
            placeholder="记录今天的情绪和想法..."
            maxlength="2000"
            show-word-limit
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { myDiaryPage, diaryAdd, diaryUpdate } from '@/api/client'

const pagination = reactive({
  pageNum: 1,
  pageSize: 10,
  total: 0,
})

const tableData = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const submitting = ref(false)
const formRef = ref(null)
const isEdit = ref(false)
const editId = ref(null)

const form = reactive({
  diaryDate: '',
  moodScore: 5,
  sleepQuality: 5,
  stressLevel: 5,
  dominantEmotion: '',
  emotionTriggers: [],
  diaryContent: '',
})

const rules = {
  diaryDate: [{ required: true, message: '请选择日期', trigger: 'change' }],
  moodScore: [{ required: true, message: '请评分', trigger: 'blur' }],
  diaryContent: [{ required: true, message: '请输入日记内容', trigger: 'blur' }],
}

const dialogTitle = computed(() => (isEdit.value ? '编辑日记' : '写日记'))

const getMoodType = (score) => {
  if (score >= 7) return 'success'
  if (score >= 4) return 'warning'
  return 'danger'
}

const getStressType = (level) => {
  if (level >= 7) return 'danger'
  if (level >= 4) return 'warning'
  return 'success'
}

const fetchTableData = async () => {
  loading.value = true
  try {
    const params = {
      currentPage: pagination.pageNum,
      size: pagination.pageSize,
    }
    const res = await myDiaryPage(params)
    tableData.value = res?.records || []
    pagination.total = res?.total || 0
  } catch (error) {
    console.error('获取情绪日记失败:', error)
    tableData.value = []
    pagination.total = 0
  } finally {
    loading.value = false
  }
}

const handleSizeChange = (val) => {
  pagination.pageSize = val
  pagination.pageNum = 1
  fetchTableData()
}

const handleCurrentChange = (val) => {
  pagination.pageNum = val
  fetchTableData()
}

const resetForm = () => {
  form.diaryDate = ''
  form.moodScore = 5
  form.sleepQuality = 5
  form.stressLevel = 5
  form.dominantEmotion = ''
  form.emotionTriggers = []
  form.diaryContent = ''
  isEdit.value = false
  editId.value = null
}

const handleAdd = () => {
  resetForm()
  dialogVisible.value = true
}

const handleEdit = (row) => {
  isEdit.value = true
  editId.value = row.id
  form.diaryDate = row.diaryDate || ''
  form.moodScore = row.moodScore || 5
  form.sleepQuality = row.sleepQuality ?? 5
  form.stressLevel = row.stressLevel ?? 5
  form.dominantEmotion = row.dominantEmotion || ''
  form.emotionTriggers = Array.isArray(row.emotionTriggers)
    ? row.emotionTriggers
    : row.emotionTriggers
      ? String(row.emotionTriggers).split(/[,，、]/).map((s) => s.trim()).filter(Boolean)
      : []
  form.diaryContent = row.diaryContent || ''
  dialogVisible.value = true
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定删除这条日记吗？', '确认删除', {
      type: 'warning',
    })
    // 使用管理端删除接口（用户端暂无独立删除接口）
    const { emotionDiaryDelete } = await import('@/api/admin')
    await emotionDiaryDelete(row.id)
    ElMessage.success('已删除')
    fetchTableData()
  } catch {
    // 取消删除
  }
}

const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return

    submitting.value = true
    try {
      const payload = {
        diaryDate: form.diaryDate,
        moodScore: form.moodScore,
        sleepQuality: form.sleepQuality,
        stressLevel: form.stressLevel,
        dominantEmotion: form.dominantEmotion,
        emotionTriggers: form.emotionTriggers,
        diaryContent: form.diaryContent,
      }

      if (isEdit.value && editId.value) {
        await diaryUpdate(editId.value, payload)
        ElMessage.success('已更新')
      } else {
        await diaryAdd(payload)
        ElMessage.success('已保存')
      }

      dialogVisible.value = false
      fetchTableData()
    } catch (error) {
      console.error('保存日记失败:', error)
    } finally {
      submitting.value = false
    }
  })
}

onMounted(() => {
  fetchTableData()
})
</script>

<style lang="scss" scoped>
.diary-view {
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

    .custom-table {
      :deep(.el-table__row) {
        td.el-table__cell {
          padding: 12px 0;
        }
      }
    }

    .content-preview {
      max-width: 260px;
    }

    .emotion-tag {
      border-radius: 10px;
      font-size: 12px;
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

.text-ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
