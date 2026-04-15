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
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="visible = false">关闭</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import { sessionDetail, sessionMessages } from '@/api/admin'
import { normalizeMessages, resolveMessagesTotal } from '@/utils/sessionMessage'

const visible = ref(false)
const loading = ref(false)
const error = ref(false)
const currentId = ref(null)

const detail = ref({})
const messages = ref([])
const timelineRef = ref(null)

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
  } catch (err) {
    console.error('拉取会话详情失败:', err)
    error.value = true
  } finally {
    loading.value = false
  }
}

const filterXSS = (html) => {
  if (!html) return ''

  let clean = String(html)
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/javascript:/gi, '')

  clean = clean.replace(/<img\s+([^>]*)>/gi, (match, attrs) => {
    if (attrs.includes('javascript:')) return ''
    return `<img ${attrs} style="max-width: 100%; height: auto; border-radius: 4px; margin: 8px 0;" />`
  })

  return clean
}

const open = (id) => {
  currentId.value = id
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
              color: #409eff;
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
</style>
