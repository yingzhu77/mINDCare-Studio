<template>
  <div class="chat-view">
    <div class="chat-sidebar">
      <div class="sidebar-header">
        <el-button type="primary" size="small" @click="startNewChat" class="new-chat-btn">
          + 新对话
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
            <div class="session-preview">{{ session.lastMessage || '新对话' }}</div>
            <div class="session-time">{{ formatTime(session.lastTime) }}</div>
          </div>
          <div class="session-actions">
            <el-tooltip content="导出">
              <el-button text size="small" class="action-btn" @click.stop="handleExport(session.sessionId)">
                <el-icon><Download /></el-icon>
              </el-button>
            </el-tooltip>
            <el-tooltip content="删除">
              <el-button text size="small" type="danger" class="action-btn" @click.stop="handleDelete(session.sessionId)">
                <el-icon><Delete /></el-icon>
              </el-button>
            </el-tooltip>
          </div>
        </div>
        <div v-if="sessions.length === 0 && !loadingSessions" class="empty-sessions">
          暂无对话记录
        </div>
      </div>
    </div>

    <el-card class="chat-card" shadow="never">
      <div class="chat-messages" ref="messagesRef">
        <div v-if="messages.length === 0" class="welcome-section">
          <div class="welcome-icon">
            <el-icon :size="48"><ChatLineSquare /></el-icon>
          </div>
          <h2 class="welcome-title">你好，{{ authStore.username }}</h2>
          <p class="welcome-desc">我是你的 AI 心理健康助手。有什么想聊的吗？</p>
          <p class="welcome-disclaimer">本助手为 AI 技术支持，不提供医疗诊断、处方或心理治疗。如有紧急情况，请拨打心理援助热线。</p>
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
            <el-avatar :size="36" v-if="msg.role === 'assistant'" icon="ChatLineSquare" class="ai-avatar" />
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
        <div class="input-hint">AI 回复仅供参考，不能替代专业心理咨询</div>
        <div class="input-row">
          <el-input
            v-model="inputText"
            type="textarea"
            :rows="2"
            :disabled="streaming"
            placeholder="输入你想聊的话题..."
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
            {{ streaming ? '思考中...' : '发送' }}
          </el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ChatLineSquare, Delete, Download } from '@element-plus/icons-vue'
import { useAuthStore } from '@/store/useAuthStore'
import { mySessionPage, sessionMessages, deleteSession, exportSession } from '@/api/client'
import { renderMarkdown } from '@/utils/markdown'
import { logger } from '@/utils/logger'

const authStore = useAuthStore()
const messagesRef = ref(null)
const inputText = ref('')
const messages = ref([])
const streaming = ref(false)
const currentSessionId = ref(null)

// 会话侧边栏
const sessions = ref([])
const loadingSessions = ref(false)

const suggestions = [
  '最近总是感到焦虑，怎么办？',
  '如何改善睡眠质量？',
  '工作压力大，如何调节情绪？',
  '怎样建立自信心？',
  '我需要心理援助热线',
]

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesRef.value) {
      messagesRef.value.scrollTop = messagesRef.value.scrollHeight
    }
  })
}

// markdown 渲染（使用 marked + DOMPurify，见 src/utils/markdown.js）

const formatTime = (time) => {
  if (!time) return ''
  const d = new Date(time)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  if (isToday) return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })
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
    ElMessage.error('加载消息失败')
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
    await ElMessageBox.confirm('确定要删除此对话吗？删除后不可恢复。', '删除确认', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    })
  } catch {
    return // 取消删除
  }

  try {
    await deleteSession(sessionId)
    ElMessage.success('对话已删除')
    // 如果删除的是当前会话，清空聊天区域
    if (currentSessionId.value === sessionId) {
      currentSessionId.value = null
      messages.value = []
    }
    await loadSessions()
  } catch {
    ElMessage.error('删除失败')
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
    ElMessage.success('对话已导出')
  } catch {
    ElMessage.error('导出失败')
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
  const assistantMsg = { role: 'assistant', content: '' }
  messages.value.push(assistantMsg)

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 60000)

  try {
    // 开发环境直连后端绕开 Vite 代理缓冲，确保 SSE 流式输出逐字到达
    const apiBase = import.meta.env.DEV ? 'http://127.0.0.1:8000' : ''
    const token = localStorage.getItem('token')
    const response = await fetch(`${apiBase}/api/chat/send`, {
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
            assistantMsg.content = parsed.message || 'AI 服务暂时不可用，请稍后再试。'
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
      assistantMsg.content = '请求超时，请稍后重试。'
      ElMessage.warning('连接超时')
    } else {
      assistantMsg.content = '网络连接失败，请检查后端服务是否运行。'
      ElMessage.error('连接失败')
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
    background: #fff;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    overflow: hidden;

    .sidebar-header {
      padding: 12px;
      border-bottom: 1px solid #f0f0f0;
      flex-shrink: 0;

      .new-chat-btn {
        width: 100%;
      }
    }

    .sidebar-list {
      flex: 1;
      overflow-y: auto;
      padding: 4px 0;

      .session-item {
        display: flex;
        align-items: center;
        padding: 10px 12px;
        cursor: pointer;
        border-bottom: 1px solid #f5f5f5;
        transition: background 0.2s;
        gap: 8px;

        &:hover {
          background: #f5f7fa;

          .session-actions {
            opacity: 1;
          }
        }

        &.active {
          background: #ecf5ff;
        }

        .session-info {
          flex: 1;
          min-width: 0;

          .session-preview {
            font-size: 13px;
            color: #303133;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            line-height: 1.4;
          }

          .session-time {
            font-size: 11px;
            color: #c0c4cc;
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
        text-align: center;
        padding: 40px 16px;
        color: #c0c4cc;
        font-size: 13px;
      }
    }
  }

  .chat-card {
    flex: 1;
    display: flex;
    flex-direction: column;
    border: none;
    border-radius: 8px;
    background: #fff;

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

    .welcome-section {
      text-align: center;
      padding: 60px 20px 40px;

      .welcome-icon {
        margin-bottom: 16px;
        color: #409eff;
      }

      .welcome-title {
        font-size: 22px;
        font-weight: 700;
        color: #303133;
        margin-bottom: 8px;
      }

      .welcome-desc {
        font-size: 15px;
        color: #909399;
        margin-bottom: 8px;
      }

      .welcome-disclaimer {
        font-size: 12px;
        color: #c0c4cc;
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
        gap: 12px;
        max-width: 600px;
        margin: 0 auto;

        .suggestion-chip {
          padding: 8px 16px;
          font-size: 14px;
          border-radius: 20px;
          cursor: pointer;
          border: 1px solid #d9e8ff;
          color: #409eff;
          background: #f0f7ff;
          transition: all 0.2s;

          &:hover {
            background: #409eff;
            color: #fff;
            border-color: #409eff;
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
          background: #409eff;
          color: #fff;
          border-radius: 12px 4px 12px 12px;
        }
      }

      &.assistant {
        align-self: flex-start;

        .message-bubble {
          background: #f5f7fa;
          color: #303133;
          border-radius: 4px 12px 12px 12px;
        }
      }

      .message-avatar {
        flex-shrink: 0;

        .ai-avatar {
          background: #e6f1ff;
          color: #409eff;
        }

        .user-avatar {
          background: #409eff;
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
          }
        }
      }
    }
  }

  .chat-input-bar {
    flex-direction: column;
    gap: 6px;
    padding: 12px 24px 16px;
    border-top: 1px solid #f0f0f0;

    .input-hint {
      font-size: 12px;
      color: #c0c4cc;
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
      }
    }
  }
}

@keyframes blink {
  50% { opacity: 0; }
}
</style>
