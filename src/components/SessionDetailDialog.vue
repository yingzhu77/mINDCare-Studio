<template>
  <el-dialog
    v-model="visible"
    title="咨询会话详情"
    width="800px"
    class="session-detail-dialog"
    destroy-on-close
  >
    <div v-if="loading" v-loading="loading" class="loading-state">
      正在获取会话详情...
    </div>

    <div v-else-if="error" class="error-state">
      <el-empty :image-size="200" description="获取详情失败">
        <el-button type="primary" @click="fetchDetail">重新尝试</el-button>
      </el-empty>
    </div>

    <div v-else class="detail-content">
      <div class="info-card-container">
        <div class="info-card-grey">
          <div class="info-item">
            <span class="label">用户:</span>
            <span class="value">{{ detail.userName || '-' }}</span>
          </div>
          <div class="info-item">
            <span class="label">开始时间:</span>
            <span class="value">{{ formatDateTime(resolveStartTime(detail)) }}</span>
          </div>
          <div class="info-item">
            <span class="label">消息数:</span>
            <span class="value"
              >{{ detail.messageCount || messages.length }} 条</span
            >
          </div>
        </div>
      </div>

      <div class="dialogue-section">
        <h3 class="section-title">对话记录</h3>
        <div class="message-list" ref="timelineRef">
          <div
            v-for="msg in messages"
            :key="msg.id"
            :class="[
              'message-card',
              msg.role === 'assistant' ? 'ai-card' : 'user-card',
            ]"
          >
            <div class="card-header">
              <span class="role-name">{{
                msg.role === 'assistant' ? 'AI助手' : '用户'
              }}</span>
              <span class="timestamp">{{ formatDateTime(msg.time) }}</span>
            </div>

            <div class="card-content" v-html="filterXSS(msg.content)"></div>
          </div>

          <div v-if="messages.length === 0" class="empty-messages">
            暂无对话记录
          </div>
        </div>
      </div>

      <div class="analysis-section">
        <div class="section-header">
          <h3 class="section-title">AI会话分析</h3>
          <el-button
            v-if="!sessionAnalysisData && !sessionAnalysisLoading"
            type="primary"
            size="small"
            @click="handleTriggerSessionAnalysis"
          >
            生成分析
          </el-button>
          <el-button
            v-else
            type="primary"
            size="small"
            plain
            :loading="sessionAnalysisLoading"
            @click="handleTriggerSessionAnalysis"
          >
            重新分析
          </el-button>
        </div>

        <div v-if="sessionAnalysisLoading && !sessionAnalysisData" class="analysis-loading">
          <el-skeleton :rows="4" animated />
        </div>

        <el-empty
          v-if="!sessionAnalysisData && !sessionAnalysisLoading && !sessionAnalysisError"
          description="暂无分析结果"
        />

        <div v-if="sessionAnalysisError" class="analysis-error">
          <el-alert :title="sessionAnalysisError" type="error" show-icon :closable="false" />
        </div>

        <template v-if="sessionAnalysisData">
          <div class="analysis-grid">
            <div class="analysis-item">
              <span class="analysis-label">情绪标签</span>
              <div class="analysis-tags">
                <el-tag
                  v-for="(tag, i) in sessionAnalysisData.emotionTagList"
                  :key="i"
                  size="small"
                  class="emotion-tag"
                >
                  {{ tag }}
                </el-tag>
                <span v-if="!sessionAnalysisData.emotionTagList?.length" class="analysis-value">-</span>
              </div>
            </div>
            <div class="analysis-item">
              <span class="analysis-label">风险等级</span>
              <el-tag :type="sessionAnalysisRiskTagType" effect="plain">
                {{ sessionAnalysisData.riskLevel || '-' }}
              </el-tag>
            </div>
          </div>

          <div class="analysis-card">
            <div class="analysis-card-title">会话摘要</div>
            <div class="analysis-card-content">{{ sessionAnalysisData.summary || '-' }}</div>
          </div>
          <div class="analysis-card">
            <div class="analysis-card-title">风险描述</div>
            <div class="analysis-card-content">{{ sessionAnalysisData.riskDescription || '-' }}</div>
          </div>
          <div class="analysis-card">
            <div class="analysis-card-title">专业建议</div>
            <div class="analysis-card-content">{{ sessionAnalysisData.professionalAdvice || '-' }}</div>
          </div>
          <div class="analysis-card">
            <div class="analysis-card-title">改善建议</div>
            <div class="analysis-card-content multiline">{{ sessionAnalysisData.improvementSuggestions || '-' }}</div>
          </div>
        </template>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="visible = false">关闭</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import DOMPurify from 'dompurify'
import { sessionDetail, sessionMessages, getChatSessionAnalysis, triggerChatSessionAnalysis } from '@/api/admin'
import {
  getFirstUserMessageTime,
  normalizeMessages,
  resolveMessagesTotal,
} from '@/utils/sessionMessage'
import { logger } from '@/utils/logger'

const visible = ref(false)
const loading = ref(false)
const error = ref(false)
const currentId = ref(null)

const detail = ref({})
const messages = ref([])
const timelineRef = ref(null)

// AI 会话分析状态
const sessionAnalysisData = ref(null)
const sessionAnalysisLoading = ref(false)
const sessionAnalysisError = ref('')

const resolveStartTime = (session) => (
  session?.startTime ||
  session?.sessionStartTime ||
  session?.beginTime ||
  session?.createdAt ||
  session?.createTime ||
  ''
)

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

// 解析情绪标签（支持字符串数组或JSON字符串）
const resolveEmotionTagList = (data) => {
  if (!data) return []
  const raw = data.emotionTags || data.emotionTag || '[]'
  if (Array.isArray(raw)) return raw
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return String(raw).split(/[;,，、|/]+/).map(t => t.trim()).filter(Boolean)
  }
}

// 风险等级标签样式
const sessionAnalysisRiskTagType = computed(() => {
  const level = sessionAnalysisData.value?.riskLevel || ''
  if (level === 'critical' || level === 'high') return 'danger'
  if (level === 'medium') return 'warning'
  return 'info'
})

const fetchDetail = async () => {
  if (!currentId.value) return

  loading.value = true
  error.value = false

  try {
    const [detailRes, messagesRes] = await Promise.all([
      sessionDetail(currentId.value).catch(() => null),
      sessionMessages(currentId.value),
    ])

    detail.value = detailRes || {}
    const normalized = normalizeMessages(messagesRes)
    messages.value = normalized
    // 详情页开始时间以”第一条用户提问时间”为准，更符合会话开始语义
    detail.value.startTime = getFirstUserMessageTime(normalized) || resolveStartTime(detail.value)
    detail.value.messageCount =
      resolveMessagesTotal(messagesRes) ||
      normalized.length ||
      detail.value.messageCount ||
      0

    nextTick(() => {
      if (timelineRef.value) {
        timelineRef.value.scrollTop = timelineRef.value.scrollHeight
      }
    })

    // 拉取已有会话分析结果
    fetchExistingSessionAnalysis()
  } catch (err) {
    logger.error('拉取会话详情失败:', err)
    error.value = true
  } finally {
    loading.value = false
  }
}

const fetchExistingSessionAnalysis = async () => {
  if (!currentId.value) return
  try {
    const res = await getChatSessionAnalysis(currentId.value)
    if (res?.id && res?.status === 'success') {
      sessionAnalysisData.value = {
        ...res,
        emotionTagList: resolveEmotionTagList(res),
      }
    }
  } catch {
    // 无已有分析结果，保持空状态
  }
}

const handleTriggerSessionAnalysis = async () => {
  if (!currentId.value) return
  sessionAnalysisLoading.value = true
  sessionAnalysisError.value = ''
  try {
    const res = await triggerChatSessionAnalysis(currentId.value)
    if (res?.id) {
      if (res.status === 'success') {
        sessionAnalysisData.value = {
          ...res,
          emotionTagList: resolveEmotionTagList(res),
        }
        ElMessage.success('会话分析完成')
      } else {
        sessionAnalysisData.value = null
        sessionAnalysisError.value = res.errorMessage || '分析失败，请稍后重试'
      }
    }
  } catch (err) {
    sessionAnalysisError.value = err.message || '分析请求失败'
    sessionAnalysisData.value = null
  } finally {
    sessionAnalysisLoading.value = false
  }
}

const filterXSS = (html) => {
  if (!html) return ''
  return DOMPurify.sanitize(html)
}

const open = (id) => {
  currentId.value = id
  // 重置分析状态，避免打开新会话时闪现旧数据
  sessionAnalysisData.value = null
  sessionAnalysisLoading.value = false
  sessionAnalysisError.value = ''
  visible.value = true
  fetchDetail()
}

defineExpose({ open })
</script>

<style lang="scss" scoped>
.session-detail-dialog {
  :deep(.el-dialog__body) {
    padding: 20px 24px;
    background-color: #f8f9fb;
  }

  .loading-state {
    height: 400px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #909399;
  }

  .error-state {
    padding: 60px 0;
  }

  .detail-content {
    display: flex;
    flex-direction: column;
    gap: 24px;

    .info-card-container {
      padding: 0;
    }

    .info-card-grey {
      background-color: #f4f4f5;
      padding: 24px 32px;
      border-radius: 12px;
      display: flex;
      justify-content: flex-start;
      gap: 60px;
      border: 1px solid #e4e7ed;

      .info-item {
        display: flex;
        align-items: center;
        font-size: 15px;

        .label {
          color: #909399;
          font-weight: 500;
        }

        .value {
          color: #303133;
          font-weight: 600;
          margin-left: 8px;
        }
      }
    }

    .dialogue-section {
      .section-title {
        font-size: 18px;
        font-weight: 700;
        margin-bottom: 20px;
        color: #303133;
      }

      .message-list {
        height: 550px;
        overflow-y: auto;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 16px;

        &::-webkit-scrollbar {
          width: 6px;
        }

        &::-webkit-scrollbar-thumb {
          background: #e4e7ed;
          border-radius: 10px;
        }

        .message-card {
          border-radius: 8px;
          padding: 16px 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          transition: all 0.2s;

          .card-header {
            display: flex;
            justify-content: space-between;
            align-items: center;

            .role-name {
              font-size: 14px;
              font-weight: 700;
              color: #606266;
            }

            .timestamp {
              font-size: 13px;
              color: #909399;
            }
          }

          .card-content {
            font-size: 14px;
            line-height: 1.7;
            color: #303133;
            word-break: break-all;

            :deep(p) {
              margin-bottom: 8px;

              &:last-child {
                margin-bottom: 0;
              }
            }

            :deep(img) {
              display: block;
              max-width: 100%;
              border-radius: 8px;
              margin: 12px 0;
            }
          }

          &.user-card {
            background-color: #f4f4f5;
            border: 1px solid #e4e7ed;

            .role-name {
              color: #a78bfa;
            }
          }

          &.ai-card {
            background-color: #f0f9eb;
            border: 1px solid #e1f3d8;

            .role-name {
              color: #67c23a;
            }
          }
        }

        .empty-messages {
          text-align: center;
          color: #909399;
          padding-top: 150px;
        }
      }
    }

    .analysis-section {
      .section-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 16px;
      }

      .section-title {
        font-size: 18px;
        font-weight: 700;
        color: #303133;
        margin: 0;
      }

      .analysis-loading {
        padding: 20px 0;
      }

      .analysis-error {
        margin-top: 12px;
      }

      .analysis-grid {
        display: flex;
        gap: 24px;
        margin-bottom: 16px;

        .analysis-item {
          display: flex;
          align-items: center;
          gap: 10px;

          .analysis-label {
            font-size: 14px;
            font-weight: 600;
            color: #606266;
          }

          .analysis-tags {
            display: flex;
            gap: 6px;
            flex-wrap: wrap;

            .emotion-tag {
              border-radius: 10px;
              font-size: 12px;
              background: #f5f3ff;
              border-color: #ede9fe;
              color: #7c3aed;
            }
          }

          .analysis-value {
            color: #303133;
          }
        }
      }

      .analysis-card {
        border: 1px solid #ebeef5;
        margin-top: 12px;
        border-radius: 4px;

        .analysis-card-title {
          background: #f0f3f6;
          font-weight: 600;
          color: #50545c;
          padding: 10px 14px;
          font-size: 14px;
        }

        .analysis-card-content {
          background: #fff;
          padding: 12px 14px;
          line-height: 1.7;
          color: #303133;
          min-height: 52px;
          font-size: 14px;
        }

        .multiline {
          white-space: pre-wrap;
        }
      }
    }
  }
}

@media screen and (max-width: 768px) {
  .session-detail-dialog {
    :deep(.el-dialog) {
      width: 95% !important;
      margin-top: 5vh !important;
    }

    .info-card-grey {
      flex-direction: column;
      gap: 12px;
      padding: 16px;

      .info-item {
        font-size: 14px;
      }
    }

    .message-list {
      height: 450px !important;

      .message-card {
        padding: 12px 16px !important;

        .card-content {
          font-size: 13px !important;
        }
      }
    }
  }
}

/* ===== 深色模式 ===== */
html.dark .session-detail-dialog {
  :deep(.el-dialog__body) {
    background-color: var(--el-bg-color-page);
  }

  .loading-state {
    color: var(--text-secondary);
  }

  .detail-content {
    .info-card-grey {
      background-color: var(--surface-warm);
      border-color: var(--border-color);

      .info-item {
        .label { color: var(--text-secondary); }
        .value { color: var(--text-color); }
      }
    }

    .dialogue-section {
      .section-title { color: var(--text-color); }

      .message-list {
        &::-webkit-scrollbar-thumb {
          background: #3d325e;
        }

        .message-card {
          &.user-card {
            background-color: rgba(167, 139, 250, 0.06);
            border-color: var(--border-color);
          }
          &.ai-card {
            background-color: rgba(52, 211, 153, 0.06);
            border-color: rgba(52, 211, 153, 0.15);
            .role-name { color: #34d399; }
          }
          .card-header {
            .role-name { color: var(--text-color); }
            .timestamp { color: var(--text-secondary); }
          }
          .card-content {
            color: var(--text-color);
          }
        }

        .empty-messages { color: var(--text-muted); }
      }
    }

    .analysis-section {
      .section-title { color: var(--text-color); }

      .analysis-grid .analysis-item {
        .analysis-label { color: var(--text-secondary); }
        .analysis-value { color: var(--text-color); }
      }

      .analysis-card {
        border-color: var(--border-color);
        .analysis-card-title {
          background: var(--surface-warm);
          color: var(--text-color);
        }
        .analysis-card-content {
          background: var(--card-bg);
          color: var(--text-color);
        }
      }
    }
  }
}
</style>
