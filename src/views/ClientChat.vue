<template>
  <div class="chat-view">
    <div class="chat-sidebar">
      <div class="sidebar-header">
        <el-button type="primary" size="small" @click="startNewChat" class="new-chat-btn">
          {{ $t('client.chat.newChat') }}
        </el-button>
      </div>
      <div class="sidebar-list" v-loading="loadingSessions">
        <div
          v-for="session in sessions"
          :key="session.sessionId"
          class="session-item"
          :class="{ active: session.sessionId === currentSessionId }"
          @click="switchSession(session.sessionId)"
        >
          <div class="session-info">
            <div class="session-preview">{{ session.lastMessage || $t('client.chat.newChat') }}</div>
            <div class="session-time">{{ formatTime(session.lastTime) }}</div>
          </div>
          <div class="session-actions">
            <el-tooltip :content="$t('client.chat.export')">
              <el-button text size="small" class="action-btn" @click.stop="handleExport(session.sessionId)">
                <el-icon><Download /></el-icon>
              </el-button>
            </el-tooltip>
            <el-tooltip :content="$t('client.chat.delete')">
              <el-button text size="small" type="danger" class="action-btn" @click.stop="handleDelete(session.sessionId)">
                <el-icon><Delete /></el-icon>
              </el-button>
            </el-tooltip>
          </div>
        </div>
        <div v-if="sessions.length === 0 && !loadingSessions" class="empty-sessions">
          <el-icon :size="48" color="#c0c4cc"><ChatLineSquare /></el-icon>
          <p class="empty-text">{{ $t('client.chat.noRecords') }}</p>
        </div>
      </div>
    </div>

    <el-card class="chat-card" shadow="never">
      <div class="chat-messages" ref="messagesRef">
        <div v-if="messages.length === 0" class="welcome-section">
          <div class="welcome-icon">
            <el-icon :size="48"><ChatLineSquare /></el-icon>
          </div>
          <h2 class="welcome-title">{{ $t('client.chat.welcomeTitle', { username: authStore.username }) }}</h2>
          <p class="welcome-desc">{{ $t('client.chat.welcomeDesc') }}</p>
          <p class="welcome-disclaimer">{{ $t('client.chat.welcomeDisclaimer') }}</p>
          <div class="suggestion-chips">
            <el-tag
              v-for="(s, i) in suggestions"
              :key="i"
              effect="plain"
              class="suggestion-chip"
              @click="sendMessage(s)"
            >{{ s }}</el-tag>
          </div>
        </div>

        <div v-for="(msg, idx) in messages" :key="idx" class="message-row" :class="msg.role">
          <div class="message-avatar">
            <el-avatar :size="36" v-if="msg.role === 'assistant'" :src="aiAvatar" class="ai-avatar" />
            <el-avatar :size="36" v-else class="user-avatar">{{ authStore.username?.[0] || 'U' }}</el-avatar>
          </div>
          <div class="message-content">
            <div class="message-bubble">
              <div class="message-text" v-html="renderMarkdown(msg.content)"></div>
              <div v-if="msg.role === 'assistant' && idx === messages.length - 1 && streaming" class="typing-cursor">▌</div>
            </div>
          </div>
        </div>
      </div>

      <div class="chat-input-bar">
        <div class="input-hint">{{ $t('client.chat.inputHint') }}</div>
        <div class="input-row">
          <el-input
            v-model="inputText"
            type="textarea"
            :rows="2"
            :disabled="streaming"
            :placeholder="$t('client.chat.placeholder')"
            @keyup.ctrl.enter="handleSend"
            resize="none"
          />
          <el-button
            type="primary"
            :loading="streaming"
            :disabled="!inputText.trim()"
            @click="handleSend"
            class="send-btn"
          >
            {{ streaming ? $t('client.chat.thinking') : $t('client.chat.send') }}
          </el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { ChatLineSquare, Delete, Download } from '@element-plus/icons-vue'
import { useAuthStore } from '@/store/useAuthStore'
import { mySessionPage, sessionMessages, deleteSession, exportSession } from '@/api/client'
import { renderMarkdown } from '@/utils/markdown'
import { logger } from '@/utils/logger'
import aiAvatar from '@/assets/logo.png'

const { t, locale } = useI18n()
const authStore = useAuthStore()
const messagesRef = ref(null)
const inputText = ref('')
const messages = ref([])
const streaming = ref(false)
const currentSessionId = ref(null)

// 会话侧边栏
const sessions = ref([])
const loadingSessions = ref(false)

const suggestions = t('client.chat.suggestions')

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesRef.value) {
      messagesRef.value.scrollTop = messagesRef.value.scrollHeight
    }
  })
}

const formatTime = (time) => {
  if (!time) return ''
  const d = new Date(time)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  const lang = locale.value === 'en' ? 'en-US' : 'zh-CN'
  if (isToday) return d.toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString(lang, { month: '2-digit', day: '2-digit' })
}

// 加载会话列表
const loadSessions = async () => {
  loadingSessions.value = true
  try {
    const res = await mySessionPage({ currentPage: 1, size: 50 })
    sessions.value = res?.records || []
  } catch (e) {
    console.warn('加载会话列表失败:', e)
  } finally {
    loadingSessions.value = false
  }
}

// 加载指定会话的消息
const loadMessages = async (sessionId) => {
  try {
    const res = await sessionMessages(sessionId)
    messages.value = res || []
    scrollToBottom()
  } catch {
    ElMessage.error(t('client.chat.loadingFailed'))
    messages.value = []
  }
}

// 切换会话
const switchSession = async (sessionId) => {
  if (sessionId === currentSessionId.value) return
  currentSessionId.value = sessionId
  messages.value = []
  await loadMessages(sessionId)
}

// 新对话
const startNewChat = () => {
  currentSessionId.value = null
  messages.value = []
  nextTick(scrollToBottom)
}

// 删除会话
const handleDelete = async (sessionId) => {
  try {
    await ElMessageBox.confirm(t('client.chat.deleteConfirm'), t('client.chat.deleteTitle'), {
      confirmButtonText: t('client.chat.deleteBtn'),
      cancelButtonText: t('client.chat.cancelBtn'),
      type: 'warning',
    })
  } catch {
    return // 取消删除
  }

  try {
    await deleteSession(sessionId)
    ElMessage.success(t('client.chat.deleted'))
    // 如果删除的是当前会话，清空聊天区域
    if (currentSessionId.value === sessionId) {
      currentSessionId.value = null
      messages.value = []
    }
    await loadSessions()
  } catch {
    ElMessage.error(t('client.chat.deleteFailed'))
  }
}

// 导出会话
const handleExport = async (sessionId) => {
  try {
    const data = await exportSession(sessionId)
    const json = JSON.stringify(data, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `chat-${sessionId.slice(0, 8)}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    ElMessage.success(t('client.chat.exported'))
  } catch {
    ElMessage.error(t('client.chat.exportFailed'))
  }
}

// 发送消息后更新侧边栏中的最新会话
const updateSessionInList = (sessionId) => {
  const idx = sessions.value.findIndex((s) => s.sessionId === sessionId)
  if (idx === -1) {
    // 新会话，重新加载列表
    loadSessions()
  }
}

const handleSend = async () => {
  const content = inputText.value.trim()
  if (!content || streaming.value) return

  inputText.value = ''
  messages.value.push({ role: 'user', content })
  scrollToBottom()

  streaming.value = true
  messages.value.push({ role: 'assistant', content: '' })
  // 通过响应式数组获取 Vue reactive proxy，确保后续 content 修改触发模板更新
  const assistantMsg = messages.value[messages.value.length - 1]

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 60000)

  try {
    // 通过 Vite 代理访问（vite.config.js 已为 SSE 端点做代理缓冲优化）
    const token = localStorage.getItem('token')
    const response = await fetch('/api/chat/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        token: token || '',
      },
      body: JSON.stringify({
        sessionId: currentSessionId.value,
        content,
      }),
      signal: controller.signal,
    })

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || !trimmed.startsWith('data: ')) continue

        try {
          const parsed = JSON.parse(trimmed.slice(6))

          if (parsed.type === 'token') {
            assistantMsg.content += parsed.content
            scrollToBottom()
          } else if (parsed.type === 'done') {
            currentSessionId.value = parsed.sessionId
            updateSessionInList(parsed.sessionId)
            streaming.value = false
            scrollToBottom()
          } else if (parsed.type === 'error') {
            streaming.value = false
            assistantMsg.content = t('client.chat.serviceUnavailable')
            scrollToBottom()
          }
        } catch {
          // 跳过解析失败的行
        }
      }
    }
  } catch (error) {
    clearTimeout(timeoutId)
    logger.error('Chat error:', error)
    if (error.name === 'AbortError') {
      assistantMsg.content = t('client.chat.requestTimeout')
      ElMessage.warning(t('client.chat.timeout'))
    } else {
      assistantMsg.content = t('client.chat.networkError')
      ElMessage.error(t('client.chat.connectionFailed'))
    }
  } finally {
    clearTimeout(timeoutId)
    streaming.value = false
  }
}

const sendMessage = (text) => {
  inputText.value = text
  handleSend()
}

onMounted(async () => {
  await loadSessions()
  // 自动选中最近一次会话
  if (sessions.value.length > 0) {
    const last = sessions.value[0]
    currentSessionId.value = last.sessionId
    await loadMessages(last.sessionId)
  }
})
</script>

<style lang="scss" scoped>
.chat-view {
  height: calc(100vh - 108px);
  display: flex;
  gap: 16px;

  .chat-sidebar {
    width: 280px;
    flex-shrink: 0;
    background: linear-gradient(180deg, #faf5ff 0%, #fff7f5 100%);
    border-radius: 14px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border: 1px solid #f3e8ff;

    .sidebar-header {
      padding: 14px 14px 12px;
      border-bottom: 1px solid #f3e8ff;
      flex-shrink: 0;

      .new-chat-btn {
        width: 100%;
        border-radius: 10px;
        font-weight: 500;
        background: linear-gradient(135deg, #a78bfa 0%, #c084fc 100%);
        border: none;
        letter-spacing: 0.3px;

        &:hover {
          background: linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%);
        }
      }
    }

    .sidebar-list {
      flex: 1;
      overflow-y: auto;
      padding: 6px 8px;

      .session-item {
        display: flex;
        align-items: center;
        padding: 10px 12px;
        cursor: pointer;
        border-radius: 10px;
        transition: all 0.2s ease;
        gap: 8px;
        margin-bottom: 2px;

        &:hover {
          background: rgba(167, 139, 250, 0.08);

          .session-actions {
            opacity: 1;
          }
        }

        &.active {
          background: rgba(167, 139, 250, 0.15);
          box-shadow: inset 3px 0 0 #a78bfa;
        }

        .session-info {
          flex: 1;
          min-width: 0;

          .session-preview {
            font-size: 13px;
            color: var(--text-color);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            line-height: 1.4;
          }

          .session-time {
            font-size: 11px;
            color: var(--text-secondary);
            margin-top: 2px;
          }
        }

        .session-actions {
          display: flex;
          gap: 2px;
          opacity: 0;
          transition: opacity 0.2s;
          flex-shrink: 0;

          .action-btn {
            font-size: 14px;
            padding: 2px;
          }
        }
      }

      .empty-sessions {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
        padding: 60px 16px;
        color: var(--text-secondary);

        .empty-text {
          font-size: 14px;
          margin: 0;
        }
      }
    }
  }

  .chat-card {
    flex: 1;
    display: flex;
    flex-direction: column;
    border: none;
    border-radius: 14px;
    background: #fff;
    box-shadow: 0 1px 6px rgba(167, 139, 250, 0.06);

    :deep(.el-card__body) {
      flex: 1;
      display: flex;
      flex-direction: column;
      padding: 0;
      overflow: hidden;
    }
  }

  .chat-messages {
    flex: 1;
    overflow-y: auto;
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    background:
      radial-gradient(ellipse at 20% 20%, rgba(244, 114, 182, 0.04) 0%, transparent 50%),
      radial-gradient(ellipse at 80% 80%, rgba(167, 139, 250, 0.03) 0%, transparent 50%),
      #fffbf5;

    .welcome-section {
      text-align: center;
      padding: 56px 20px 36px;

      .welcome-icon {
        margin-bottom: 16px;
        color: #a78bfa;
      }

      .welcome-title {
        font-size: 22px;
        font-weight: 700;
        color: var(--text-color);
        margin-bottom: 8px;
      }

      .welcome-desc {
        font-size: 15px;
        color: var(--text-secondary);
        margin-bottom: 8px;
      }

      .welcome-disclaimer {
        font-size: 12px;
        color: #c4b5fd;
        margin-bottom: 24px;
        line-height: 1.5;
        max-width: 500px;
        margin-left: auto;
        margin-right: auto;
      }

      .suggestion-chips {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 10px;
        max-width: 600px;
        margin: 0 auto;

        .suggestion-chip {
          padding: 8px 18px;
          font-size: 14px;
          border-radius: 20px;
          cursor: pointer;
          border: 1px solid #ede9fe;
          color: #8b5cf6;
          background: #faf5ff;
          transition: all 0.25s ease;

          &:hover {
            background: linear-gradient(135deg, #a78bfa, #c084fc);
            color: #fff;
            border-color: #a78bfa;
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(167, 139, 250, 0.25);
          }
        }
      }
    }

    .message-row {
      display: flex;
      gap: 12px;
      max-width: 85%;

      &.user {
        align-self: flex-end;
        flex-direction: row-reverse;

        .message-bubble {
          background: linear-gradient(135deg, #a78bfa 0%, #c084fc 100%);
          color: #fff;
          border-radius: 16px 4px 16px 16px;
          box-shadow: 0 2px 8px rgba(167, 139, 250, 0.2);
        }
      }

      &.assistant {
        align-self: flex-start;

        .message-bubble {
          background: #faf5ff;
          color: #1f1b2e;
          border-radius: 4px 16px 16px 16px;
          border: 1px solid #f3e8ff;
          box-shadow: 0 1px 4px rgba(167, 139, 250, 0.06);
        }
      }

      .message-avatar {
        flex-shrink: 0;

        .ai-avatar {
          border: 2px solid #c084fc;
          box-sizing: content-box;
        }

        .user-avatar {
          background: linear-gradient(135deg, #f472b6, #fb7185);
          color: #fff;
          font-size: 14px;
        }
      }

      .message-content {
        .message-bubble {
          padding: 12px 16px;
          line-height: 1.6;
          font-size: 14px;
          max-width: 600px;

          .message-text {
            word-break: break-word;

            :deep(h1),
            :deep(h2),
            :deep(h3) {
              font-size: 15px;
              margin: 8px 0 4px;
              font-weight: 600;
            }

            :deep(strong) {
              font-weight: 600;
            }

            :deep(br) {
              content: '';
              display: block;
              margin: 4px 0;
            }
          }

          .typing-cursor {
            display: inline;
            animation: blink 1s step-end infinite;
            color: #a78bfa;
          }
        }
      }
    }
  }

  .chat-input-bar {
    flex-direction: column;
    gap: 6px;
    padding: 12px 24px 16px;
    border-top: 1px solid #f3e8ff;
    background: linear-gradient(0deg, #faf5ff 0%, transparent 100%);

    .input-hint {
      font-size: 12px;
      color: #c4b5fd;
      text-align: center;
      line-height: 1.4;
    }

    .input-row {
      display: flex;
      gap: 12px;
      align-items: flex-end;

      .el-textarea {
        flex: 1;
      }

      .send-btn {
        height: 60px;
        width: 100px;
        font-size: 15px;
        border-radius: 10px;
        background: linear-gradient(135deg, #a78bfa, #c084fc);
        border: none;
        font-weight: 500;

        &:hover {
          background: linear-gradient(135deg, #8b5cf6, #a78bfa);
        }
      }
    }
  }
}

// 移动端适配
@media screen and (max-width: 768px) {
  .chat-view {
    gap: 8px;
    height: calc(100vh - 84px);

    .chat-sidebar {
      width: 160px;

      .sidebar-list .session-item {
        padding: 8px 10px;
        border-radius: 8px;

        .session-info .session-preview {
          font-size: 12px;
        }

        .session-actions {
          opacity: 1;
        }
      }
    }

    .chat-messages {
      padding: 16px;

      .message-row {
        max-width: 98%;
      }
    }

    .chat-input-bar {
      padding: 8px 16px;

      .input-row .send-btn {
        width: 80px;
        height: 48px;
      }
    }
  }
}

@keyframes blink {
  50% { opacity: 0; }
}

/* ===== 深色模式 ===== */
html.dark .chat-view {
  .chat-sidebar {
    background: linear-gradient(180deg, #1e1933 0%, #16122a 100%);
    border-color: var(--border-color);

    .sidebar-header {
      border-bottom-color: var(--border-color);
    }

    .sidebar-list {
      .session-item {
        &.active {
          background: rgba(167, 139, 250, 0.12);
          box-shadow: inset 3px 0 0 #a78bfa;
        }

        &:hover {
          background: rgba(167, 139, 250, 0.06);
        }
      }
    }
  }

  .chat-card {
    background: var(--card-bg);
    box-shadow: var(--shadow-card);
  }

  .chat-messages {
    background:
      radial-gradient(ellipse at 20% 20%, rgba(244, 114, 182, 0.07) 0%, transparent 50%),
      radial-gradient(ellipse at 80% 80%, rgba(167, 139, 250, 0.06) 0%, transparent 50%),
      linear-gradient(180deg, #1a1533 0%, #16122a 50%, #141028 100%);

    .message-row {
      &.assistant .message-bubble {
        background: #1e1933;
        color: #e5e7eb;
        border-color: #3d325e;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
      }
    }
  }

  .chat-input-bar {
    border-top-color: var(--border-color);
    background: linear-gradient(0deg, #1e1933 0%, transparent 100%);
  }
}
</style>
