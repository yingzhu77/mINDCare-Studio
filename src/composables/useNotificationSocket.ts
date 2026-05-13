import { ref, onUnmounted } from 'vue'
import { io, Socket } from 'socket.io-client'
import { useAuthStore } from '@/store/useAuthStore'

/**
 * WebSocket 通知推送 composable
 * - 连接 /ws/notifications 命名空间，携带 JWT token 认证
 * - 接收 unread_count 事件，触发回调
 * - 断线自动重连（间隔 3s，最多 10 次）
 * - 超出重连次数后标记为 fallback 模式，由调用方降级到轮询
 */
export function useNotificationSocket() {
  const connected = ref(false)
  const isFallback = ref(false)
  let socket: Socket | null = null
  let reconnectAttempts = 0
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null
  const MAX_RECONNECT_ATTEMPTS = 10
  const RECONNECT_INTERVAL = 3000

  const unreadCountListeners: Array<() => void> = []

  /**
   * 注册未读计数变更回调
   */
  function onUnreadCount(cb: () => void) {
    unreadCountListeners.push(cb)
  }

  /**
   * 建立 WebSocket 连接
   */
  function connect() {
    const authStore = useAuthStore()
    if (!authStore.token) return
    if (socket?.connected) return

    // 开发环境直连后端端口，生产环境同源
    const wsUrl = import.meta.env.DEV
      ? 'http://127.0.0.1:8000'
      : window.location.origin

    socket = io(`${wsUrl}/ws/notifications`, {
      auth: { token: authStore.token },
      transports: ['websocket', 'polling'],
      reconnection: false, // 手动管理重连
      forceNew: true,
    })

    socket.on('connect', () => {
      connected.value = true
      isFallback.value = false
      reconnectAttempts = 0
    })

    socket.on('unread_count', () => {
      unreadCountListeners.forEach((cb) => cb())
    })

    socket.on('disconnect', () => {
      connected.value = false
      attemptReconnect()
    })

    socket.on('connect_error', () => {
      connected.value = false
      attemptReconnect()
    })
  }

  /**
   * 尝试重连
   */
  function attemptReconnect() {
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      isFallback.value = true
      cleanupSocket()
      return
    }
    reconnectAttempts++
    reconnectTimer = setTimeout(() => {
      socket?.connect()
    }, RECONNECT_INTERVAL)
  }

  /**
   * 断开 WebSocket 连接
   */
  function disconnect() {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }
    cleanupSocket()
    connected.value = false
    isFallback.value = false
    reconnectAttempts = 0
  }

  function cleanupSocket() {
    if (socket) {
      socket.removeAllListeners()
      socket.disconnect()
      socket = null
    }
  }

  onUnmounted(() => {
    disconnect()
  })

  return { connected, isFallback, connect, disconnect, onUnreadCount }
}
