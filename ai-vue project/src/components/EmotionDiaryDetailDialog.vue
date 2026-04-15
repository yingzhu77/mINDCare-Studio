<template>
  <el-dialog
    :model-value="modelValue"
    title="情绪日记详情"
    width="880px"
    class="emotion-detail-dialog"
    destroy-on-close
    @close="emit('update:modelValue', false)"
  >
    <div class="detail-content">
      <section class="detail-section">
        <h3 class="section-title">用户信息</h3>
        <div class="grid-table four-cols">
          <div class="label-cell">用户名</div>
          <div class="value-cell">{{ detail.userName || '-' }}</div>
          <div class="label-cell">昵称</div>
          <div class="value-cell">{{ detail.nickname || '-' }}</div>

          <div class="label-cell">用户ID</div>
          <div class="value-cell">{{ detail.userId || '-' }}</div>
          <div class="label-cell">记录日期</div>
          <div class="value-cell">{{ formatDate(detail.diaryDate) }}</div>
        </div>
      </section>

      <section class="detail-section">
        <h3 class="section-title">情绪状态</h3>
        <div class="grid-table four-cols">
          <div class="label-cell">情绪评分</div>
          <div class="value-cell" style="grid-column: span 3">
            <el-rate :model-value="Number(detail.moodScore) || 0" disabled :max="10" />
          </div>

          <div class="label-cell">睡眠质量</div>
          <div class="value-cell">{{ displayFraction(detail.sleepQuality) }}</div>
          <div class="label-cell">主要情绪</div>
          <div class="value-cell">
            <el-tag type="info" effect="plain">{{ detail.dominantEmotion || '-' }}</el-tag>
          </div>

          <div class="label-cell">压力水平</div>
          <div class="value-cell">{{ displayFraction(detail.stressLevel) }}</div>
          <div class="label-cell">时间信息</div>
          <div class="value-cell">{{ formatDateTime(detail.updateTime || detail.createdAt || detail.createTime) }}</div>
        </div>
      </section>

      <section class="detail-section">
        <h3 class="section-title">日记内容</h3>
        <div class="grid-table two-cols">
          <div class="label-cell">情绪触发因素</div>
          <div class="value-cell">{{ detail.emotionTriggers || '-' }}</div>

          <div class="label-cell">日记内容</div>
          <div class="value-cell">{{ detail.diaryContent || '-' }}</div>
        </div>
      </section>

      <section class="detail-section">
        <h3 class="section-title">AI情绪分析结果</h3>
        <div class="grid-table four-cols">
          <div class="label-cell">主要情绪</div>
          <div class="value-cell">
            <el-tag type="info" effect="plain">{{ analysis.mainEmotion || '-' }}</el-tag>
          </div>
          <div class="label-cell">情绪强度</div>
          <div class="value-cell">
            <div class="progress-wrap">
              <el-progress :percentage="analysis.intensityPercent" :show-text="true" :stroke-width="10" />
            </div>
          </div>

          <div class="label-cell">风险等级</div>
          <div class="value-cell">
            <el-tag type="warning" effect="plain">{{ analysis.riskLevel ?? '-' }}</el-tag>
          </div>
          <div class="label-cell">情绪性质</div>
          <div class="value-cell">
            <el-tag :type="analysis.natureTagType" effect="light">{{ analysis.emotionNature || '-' }}</el-tag>
          </div>
        </div>

        <div class="advice-card">
          <div class="advice-title">专业建议</div>
          <div class="advice-content">{{ analysis.professionalAdvice || '-' }}</div>
        </div>

        <div class="advice-card">
          <div class="advice-title">风险描述</div>
          <div class="advice-content">{{ analysis.riskDescription || '-' }}</div>
        </div>

        <div class="advice-card">
          <div class="advice-title">改善建议</div>
          <div class="advice-content multiline">{{ analysis.improvementSuggestions || '-' }}</div>
        </div>
      </section>
    </div>
  </el-dialog>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  detail: {
    type: Object,
    default: () => ({}),
  },
  overviewAnalysis: {
    type: Object,
    default: () => ({}),
  },
})

const emit = defineEmits(['update:modelValue'])

// 统一计算 AI 分析字段，优先使用日志记录中的字段，其次使用综合分析接口的映射字段。
const analysis = computed(() => {
  const source = {
    ...props.overviewAnalysis,
    ...props.detail,
  }

  const rawIntensity = Number(
    source.emotionIntensity ?? source.intensity ?? source.emotionStrength ?? source.score
  )

  const intensityPercent = Number.isNaN(rawIntensity)
    ? 0
    : rawIntensity <= 1
      ? Math.max(0, Math.min(100, Math.round(rawIntensity * 100)))
      : Math.max(0, Math.min(100, Math.round(rawIntensity)))

  const nature = source.emotionNature || source.nature || source.sentimentType || ''

  return {
    mainEmotion: source.aiMainEmotion || source.mainEmotion || source.dominantEmotion || '',
    intensityPercent,
    riskLevel: source.riskLevel ?? source.aiRiskLevel,
    emotionNature: nature,
    natureTagType: String(nature).includes('负') ? 'danger' : 'success',
    professionalAdvice: source.professionalAdvice || source.advice || source.aiAdvice || '',
    riskDescription: source.riskDescription || source.riskDesc || '',
    improvementSuggestions: source.improvementSuggestions || source.improveSuggestions || '',
  }
})

const formatDate = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const formatDateTime = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const hh = String(date.getHours()).padStart(2, '0')
  const mm = String(date.getMinutes()).padStart(2, '0')
  const ss = String(date.getSeconds()).padStart(2, '0')
  return `${y}-${m}-${d} ${hh}:${mm}:${ss}`
}

const displayFraction = (value) => {
  const num = Number(value)
  return Number.isNaN(num) ? '-' : `${num}/5`
}
</script>

<style lang="scss" scoped>
.emotion-detail-dialog {
  :deep(.el-dialog__body) {
    padding-top: 16px;
    background: #f7f8fa;
  }

  .detail-content {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .detail-section {
    .section-title {
      font-size: 30px;
      transform: scale(0.5);
      transform-origin: left center;
      margin: 0 0 -8px;
      font-weight: 700;
      color: #303133;
    }
  }

  .grid-table {
    display: grid;
    border: 1px solid #ebeef5;
    border-bottom: none;

    .label-cell,
    .value-cell {
      min-height: 54px;
      padding: 12px 14px;
      border-bottom: 1px solid #ebeef5;
      display: flex;
      align-items: center;
      color: #303133;
      line-height: 1.6;
    }

    .label-cell {
      background: #f0f3f6;
      color: #50545c;
      font-weight: 600;
    }

    .value-cell {
      background: #fff;
      word-break: break-all;
      white-space: pre-wrap;
    }

    &.four-cols {
      grid-template-columns: 170px 1fr 170px 1fr;
    }

    &.two-cols {
      grid-template-columns: 170px 1fr;
    }
  }

  .progress-wrap {
    width: 100%;
  }

  .advice-card {
    margin-top: 12px;
    border: 1px solid #ebeef5;

    .advice-title {
      background: #f0f3f6;
      font-weight: 600;
      color: #50545c;
      padding: 10px 14px;
    }

    .advice-content {
      background: #fff;
      padding: 12px 14px;
      line-height: 1.7;
      color: #303133;
      min-height: 52px;
    }

    .multiline {
      white-space: pre-wrap;
    }
  }
}

@media (max-width: 768px) {
  .emotion-detail-dialog {
    :deep(.el-dialog) {
      width: 95% !important;
      margin-top: 5vh !important;
    }

    .grid-table {
      &.four-cols,
      &.two-cols {
        grid-template-columns: 120px 1fr;
      }
    }
  }
}
</style>
