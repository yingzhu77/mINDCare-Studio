<template>
  <el-card class="table-card" shadow="never">
    <el-table v-loading="loading" :data="data" class="diary-table" style="width: 100%">
      <el-table-column label="用户ID" min-width="80" prop="userId" />

      <el-table-column label="会话ID" min-width="110">
        <template #default="{ row }">
          <div class="session-avatar-wrap">
            <el-avatar :size="40" class="session-avatar">{{ formatAvatarText(row) }}</el-avatar>
            <span v-if="row.sessionId" class="session-id-text">{{ row.sessionId }}</span>
          </div>
        </template>
      </el-table-column>

      <el-table-column label="记录日期" min-width="120">
        <template #default="{ row }">
          {{ formatDate(row.diaryDate) }}
        </template>
      </el-table-column>

      <el-table-column label="情绪评分" min-width="180">
        <template #default="{ row }">
          <el-rate :model-value="Number(row.moodScore) || 0" disabled :max="10" show-score score-template="{value}" />
        </template>
      </el-table-column>

      <el-table-column label="生活指标" min-width="140">
        <template #default="{ row }">
          <div class="indicator-wrap">
            <div>睡眠：{{ displayFraction(row.sleepQuality) }}</div>
            <div>压力：{{ displayFraction(row.stressLevel) }}</div>
          </div>
        </template>
      </el-table-column>

      <el-table-column label="情绪触发因素" min-width="140" show-overflow-tooltip>
        <template #default="{ row }">
          {{ row.emotionTriggers || '-' }}
        </template>
      </el-table-column>

      <el-table-column label="日记内容" min-width="180" show-overflow-tooltip>
        <template #default="{ row }">
          {{ row.diaryContent || '-' }}
        </template>
      </el-table-column>

      <el-table-column label="操作" width="120" fixed="right" align="center">
        <template #default="{ row }">
          <el-button link type="primary" @click="$emit('detail', row)">详情</el-button>
          <el-button link type="danger" @click="$emit('delete', row)">删除</el-button>
        </template>
      </el-table-column>

      <template #empty>
        <el-empty description="暂无情绪日志" />
      </template>
    </el-table>

    <div class="pagination-wrapper">
      <div class="total-info">共 {{ total }} 条</div>
      <el-pagination
        :current-page="currentPage"
        :page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 30, 50]"
        layout="sizes, prev, pager, next, jumper"
        @size-change="$emit('size-change', $event)"
        @current-change="$emit('page-change', $event)"
      />
    </div>
  </el-card>
</template>

<script setup>
const props = defineProps({
  loading: {
    type: Boolean,
    default: false,
  },
  data: {
    type: Array,
    default: () => [],
  },
  currentPage: {
    type: Number,
    default: 1,
  },
  pageSize: {
    type: Number,
    default: 10,
  },
  total: {
    type: Number,
    default: 0,
  },
})

defineEmits(['detail', 'delete', 'size-change', 'page-change'])

const formatDate = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const displayFraction = (value) => {
  const num = Number(value)
  return Number.isNaN(num) ? '-' : `${num}/5`
}

const formatAvatarText = (row) => {
  const name = row.userName || row.nickname || ''
  if (name) return String(name).slice(0, 4)
  return row.sessionId ? String(row.sessionId).slice(0, 4) : '日志'
}
</script>

<style lang="scss" scoped>
.table-card {
  border: none;
  border-radius: 8px;

  .diary-table {
    :deep(.el-table__header-wrapper th) {
      background: #fff;
      color: #606266;
      font-weight: 600;
      border-bottom: 1px solid #ebeef5;
    }

    :deep(.el-table__row td) {
      border-bottom: 1px solid #f2f3f5;
      vertical-align: top;
      padding: 10px 0;
    }

    :deep(.el-rate) {
      height: 24px;
      line-height: 24px;
    }

    :deep(.el-rate__icon) {
      margin-right: 2px;
      font-size: 16px;
    }

    :deep(.el-rate__text) {
      color: #909399;
      font-size: 12px;
      margin-left: 6px;
    }
  }

  .session-avatar-wrap {
    display: flex;
    align-items: center;
    gap: 8px;

    .session-avatar {
      background: #c0c4cc;
      color: #fff;
      font-size: 12px;
      text-transform: lowercase;
    }

    .session-id-text {
      color: #909399;
      font-size: 12px;
    }
  }

  .indicator-wrap {
    line-height: 1.6;
    color: #606266;
    white-space: nowrap;
  }

  .pagination-wrapper {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 16px;

    .total-info {
      color: #909399;
      font-size: 14px;
    }
  }
}

@media (max-width: 768px) {
  .table-card {
    .pagination-wrapper {
      flex-direction: column;
      align-items: flex-start;
    }
  }
}

/* ===== 深色模式 ===== */
html.dark .table-card {
  background-color: var(--card-bg);

  .diary-table {
    :deep(.el-table__header-wrapper th) {
      background: var(--card-bg);
      color: var(--text-secondary);
      border-bottom-color: var(--border-color);
    }
    :deep(.el-table__row td) {
      border-bottom-color: var(--border-color);
    }
    :deep(.el-rate__text) {
      color: var(--text-secondary);
    }
  }

  .session-avatar-wrap {
    .session-avatar { background: #3d325e; }
    .session-id-text { color: var(--text-muted); }
  }

  .indicator-wrap { color: var(--text-secondary); }

  .pagination-wrapper .total-info { color: var(--text-secondary); }
}
</style>
