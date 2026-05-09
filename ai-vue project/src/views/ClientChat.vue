<template>
  <div class="chat-view">
    <el-card class="chat-card" shadow="never">
      <div class="chat-messages" ref="messagesRef">
        <div v-if="messages.length === 0" class="welcome-section">
          <div class="welcome-icon">
            <el-icon :size="48"><ChatLineSquare /></el-icon>
          </div>
          <h2 class="welcome-title">你好，{{ authStore.username }}</h2>
          <p class="welcome-desc">我是你的 AI 心理健康助手。有什么想聊的吗？</p>
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
    </el-card>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { ChatLineSquare } from '@element-plus/icons-vue'
import { useAuthStore } from '@/store/useAuthStore'
import { mySessionPage } from '@/api/client'

const authStore = useAuthStore()
const messagesRef = ref(null)
const inputText = ref('')
const messages = ref([])
const streaming = ref(false)
const currentSessionId = ref(null)

const suggestions = [
  '最近总是感到焦虑，怎么办？',
  '如何改善睡眠质量？',
  '工作压力大，如何调节情绪？',
  '怎样建立自信心？',
]

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesRef.value) {
      messagesRef.value.scrollTop = messagesRef.value.scrollHeight
    }
  })
}

// 简易 markdown 渲染（仅处理基本格式）
const renderMarkdown = (text) => {
  if (!text) return ''
  let html = String(text)
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/### (.+)/g, '<h3>$1</h3>')
    .replace(/## (.+)/g, '<h2>$1</h2>')
    .replace(/# (.+)/g, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br>')
  return html
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
    console.error('Chat error:', error)
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
  // 尝试恢复最近一次会话
  try {
    const res = await mySessionPage({ currentPage: 1, size: 1 })
    if (res?.records?.length) {
      currentSessionId.value = res.records[0].sessionId
    }
  } catch {
    // 静默处理
  }
})
</script>

<style lang="scss" scoped>
.chat-view {
  height: calc(100vh - 108px);
  display: flex;

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
        margin-bottom: 32px;
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
    display: flex;
    gap: 12px;
    padding: 16px 24px;
    border-top: 1px solid #f0f0f0;
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

@keyframes blink {
  50% { opacity: 0; }
}
</style>
