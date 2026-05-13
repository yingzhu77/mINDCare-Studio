<template>
  <div class="diary-view">
    <div class="header-section">
      <h2 class="section-title">{{ $t('client.diary.title') }}</h2>
      <el-button type="primary" @click="handleAdd">
        <el-icon><Plus /></el-icon>{{ $t('client.diary.addBtn') }}
      </el-button>
    </div>

    <!-- 空状态 -->
    <div v-if="!loading && pagination.total === 0" class="empty-state">
      <div class="empty-illustration">
        <el-icon :size="64"><EditPen /></el-icon>
      </div>
      <h3 class="empty-title">{{ $t('client.diary.emptyTitle') }}</h3>
      <p class="empty-desc">{{ $t('client.diary.emptyDesc') }}</p>
      <el-button type="primary" @click="handleAdd">
        <el-icon><Plus /></el-icon>{{ $t('client.diary.emptyAction') }}
      </el-button>
    </div>

    <!-- 日记列表 -->
    <template v-else>
      <el-card class="table-card" shadow="never">
      <el-table
        v-loading="loading"
        :data="tableData"
        style="width: 100%"
        class="custom-table"
      >
        <el-table-column :label="$t('client.diary.colDate')" width="120">
          <template #default="{ row }">
            {{ row.diaryDate || '-' }}
          </template>
        </el-table-column>

        <el-table-column :label="$t('client.diary.colMood')" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getMoodType(row.moodScore)" effect="light" round>
              {{ row.moodScore || '-' }}/10
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column :label="$t('client.diary.colSleep')" width="100" align="center">
          <template #default="{ row }">
            {{ row.sleepQuality != null ? row.sleepQuality + '/10' : '-' }}
          </template>
        </el-table-column>

        <el-table-column :label="$t('client.diary.colStress')" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStressType(row.stressLevel)" effect="light" round>
              {{ row.stressLevel != null ? row.stressLevel + '/10' : '-' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column :label="$t('client.diary.colEmotion')" width="120">
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

        <el-table-column :label="$t('client.diary.colContent')" min-width="200">
          <template #default="{ row }">
            <div class="content-preview text-ellipsis">
              {{ row.diaryContent || '-' }}
            </div>
          </template>
        </el-table-column>

        <el-table-column :label="$t('client.diary.colActions')" width="140" align="center" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleEdit(row)">{{ $t('client.diary.edit') }}</el-button>
            <el-button link type="danger" @click="handleDelete(row)">{{ $t('client.diary.delete') }}</el-button>
          </template>
        </el-table-column>

        <template #empty>
          <el-empty :description="$t('client.diary.noData')" />
        </template>
      </el-table>

      <div class="pagination-wrapper">
        <div class="total-info">{{ $t('client.diary.total', { count: pagination.total }) }}</div>
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
    </template>

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
        <el-form-item :label="$t('client.diary.dateLabel')" prop="diaryDate">
          <el-date-picker
            v-model="form.diaryDate"
            type="date"
            :placeholder="$t('client.diary.datePlaceholder')"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>

        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item :label="$t('client.diary.moodLabel')" prop="moodScore">
              <el-slider
                v-model="form.moodScore"
                :min="1"
                :max="10"
                :marks="{ 1: '1', 5: '5', 10: '10' }"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item :label="$t('client.diary.sleepLabel')" prop="sleepQuality">
              <el-slider
                v-model="form.sleepQuality"
                :min="1"
                :max="10"
                :marks="{ 1: '1', 5: '5', 10: '10' }"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item :label="$t('client.diary.stressLabel')" prop="stressLevel">
              <el-slider
                v-model="form.stressLevel"
                :min="1"
                :max="10"
                :marks="{ 1: '1', 5: '5', 10: '10' }"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item :label="$t('client.diary.emotionLabel')" prop="dominantEmotion">
          <el-select v-model="form.dominantEmotion" :placeholder="$t('client.diary.emotionPlaceholder')" style="width: 100%">
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

        <el-form-item :label="$t('client.diary.triggerLabel')" prop="emotionTriggers">
          <el-select
            v-model="form.emotionTriggers"
            multiple
            filterable
            allow-create
            default-first-option
            :placeholder="$t('client.diary.triggerPlaceholder')"
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

        <el-form-item :label="$t('client.diary.contentLabel')" prop="diaryContent">
          <el-input
            v-model="form.diaryContent"
            type="textarea"
            :rows="5"
            :placeholder="$t('client.diary.contentPlaceholder')"
            maxlength="2000"
            show-word-limit
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">{{ $t('client.diary.cancel') }}</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">{{ $t('client.diary.save') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { Plus, EditPen } from '@element-plus/icons-vue'
import { myDiaryPage, diaryAdd, diaryUpdate, diaryDelete } from '@/api/client'
import { logger } from '@/utils/logger'

const { t } = useI18n()

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

const rules = computed(() => ({
  diaryDate: [{ required: true, message: t('client.diary.datePlaceholder'), trigger: 'change' }],
  moodScore: [{ required: true, message: t('client.diary.moodLabel'), trigger: 'blur' }],
  diaryContent: [{ required: true, message: t('client.diary.contentPlaceholder'), trigger: 'blur' }],
}))

const dialogTitle = computed(() => isEdit.value ? t('client.diary.dialogEdit') : t('client.diary.dialogAdd'))

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
    logger.error('获取情绪日记失败:', error)
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
    await ElMessageBox.confirm(t('client.diary.deleteConfirm'), t('client.diary.deleteTitle'), {
      type: 'warning',
    })
    await diaryDelete(row.id)
    ElMessage.success(t('client.diary.deleted'))
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
        emotionTriggers: Array.isArray(form.emotionTriggers) ? form.emotionTriggers.join(',') : form.emotionTriggers,
        diaryContent: form.diaryContent,
      }

      if (isEdit.value && editId.value) {
        await diaryUpdate(editId.value, payload)
        ElMessage.success(t('client.diary.updated'))
      } else {
        await diaryAdd(payload)
        ElMessage.success(t('client.diary.saved'))
      }

      dialogVisible.value = false
      fetchTableData()
    } catch (error) {
      logger.error('保存日记失败:', error)
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

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 80px 20px;
    text-align: center;

    .empty-illustration {
      margin-bottom: 20px;
      color: #c0c4cc;
    }

    .empty-title {
      font-size: 18px;
      font-weight: 600;
      color: #606266;
      margin: 0 0 8px;
    }

    .empty-desc {
      font-size: 14px;
      color: #c0c4cc;
      margin: 0 0 24px;
    }
  }

// 移动端适配
@media screen and (max-width: 768px) {
  .diary-view {
    .table-card {
      overflow-x: auto;

      .pagination-wrapper {
        flex-wrap: wrap;
        justify-content: center;
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
