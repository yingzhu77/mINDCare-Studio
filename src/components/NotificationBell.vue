<template>
  <el-popover
    placement="bottom-end"
    :width="360"
    trigger="click"
    :visible="popoverVisible"
    @show="fetchNotifications"
  >
    <template #reference>
      <el-badge :value="unreadCount" :hidden="unreadCount === 0" class="notification-badge">
        <el-icon :size="22" class="bell-icon" @click="popoverVisible = !popoverVisible">
          <Bell />
        </el-icon>
      </el-badge>
    </template>

    <div class="notification-panel">
      <div class="panel-header">
        <span class="panel-title">通知</span>
        <el-button
          v-if="unreadCount > 0"
          text
          type="primary"
          size="small"
          @click="handleReadAll"
        >
          全部已读
        </el-button>
      </div>

      <div v-if="loading" class="panel-loading">
        <el-skeleton :rows="3" animated />
      </div>

      <div v-else-if="list.length === 0" class="panel-empty">
        <el-empty description="暂无通知" :image-size="60" />
      </div>

      <div v-else class="panel-list">
        <div
          v-for="item in list"
          :key="item.id"
          class="notification-item"
          :class="{ unread: item.isRead === 0 }"
          @click="handleRead(item)"
        >
          <div class="item-dot" v-if="item.isRead === 0" />
          <div class="item-content">
            <div class="item-title">{{ item.title }}</div>
            <div class="item-desc" v-if="item.content">{{ item.content }}</div>
            <div class="item-time">{{ formatTime(item.createdAt) }}</div>
          </div>
        </div>
      </div>
    </div>
  </el-popover>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { Bell } from '@element-plus/icons-vue'
import { notificationPage, unreadNotificationCount, notificationRead, notificationReadAll } from '@/api/client'
import { formatDate } from '@/utils/date'

const popoverVisible = ref(false)
const unreadCount = ref(0)
const list = ref([])
const loading = ref(false)
let pollTimer = null

const formatTime = (t) => {
  if (!t) return ''
  const d = new Date(t)
  const now = new Date()
  const diff = now - d
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`
  return formatDate(t, 'datetime')
}

const fetchUnreadCount = async () => {
  try {
    const res = await unreadNotificationCount()
    unreadCount.value = res.count ?? 0
  } catch {
    // 静默失败
  }
}

const fetchNotifications = async () => {
  loading.value = true
  try {
    const res = await notificationPage({ page: 1, size: 20 })
    list.value = res.records ?? []
  } finally {
    loading.value = false
  }
}

const handleRead = async (item) => {
  if (item.isRead === 0) {
    await notificationRead(item.id)
    item.isRead = 1
    unreadCount.value = Math.max(0, unreadCount.value - 1)
  }
}

const handleReadAll = async () => {
  await notificationReadAll()
  list.value.forEach((item) => (item.isRead = 1))
  unreadCount.value = 0
}

// 每 30 秒轮询未读数量
onMounted(() => {
  fetchUnreadCount()
  pollTimer = setInterval(fetchUnreadCount, 30000)
})

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
})
</script>

<style scoped>
.notification-badge {
  cursor: pointer;
  line-height: 1;
}

.bell-icon {
  color: #606266;
  vertical-align: middle;
}

.bell-icon:hover {
  color: #a78bfa;
}

.notification-panel {
  max-height: 400px;
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 8px;
  border-bottom: 1px solid #ebeef5;
  margin-bottom: 4px;
}

.panel-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

.panel-loading {
  padding: 16px;
}

.panel-empty {
  padding: 24px 0;
}

.panel-list {
  overflow-y: auto;
  max-height: 320px;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 4px;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.notification-item:hover {
  background-color: #f5f7fa;
}

.notification-item.unread {
  background-color: #f5f3ff;
}

.notification-item.unread:hover {
  background-color: #d9ecff;
}

.item-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: linear-gradient(135deg, #a78bfa, #c084fc);
  flex-shrink: 0;
  margin-top: 6px;
}

.item-content {
  flex: 1;
  min-width: 0;
}

.item-title {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  line-height: 1.4;
}

.item-desc {
  font-size: 13px;
  color: #909399;
  margin-top: 2px;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.item-time {
  font-size: 12px;
  color: #c0c4cc;
  margin-top: 4px;
}
</style>
