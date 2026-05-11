<template>
  <el-container class="client-layout">
    <el-header height="60px" class="client-header">
      <div class="header-left">
        <router-link to="/client/chat" class="logo-link">
          <span class="logo-text">心理健康AI助手</span>
        </router-link>
        <el-menu
          :default-active="activeMenu"
          mode="horizontal"
          router
          class="client-menu"
        >
          <el-menu-item index="/client/chat">AI 咨询</el-menu-item>
          <el-menu-item index="/client/diary">情绪日记</el-menu-item>
          <el-menu-item index="/client/articles">文章投稿</el-menu-item>
        </el-menu>
      </div>
      <div class="header-right">
        <NotificationBell />
        <el-dropdown trigger="click">
          <div class="user-info">
            <el-avatar :size="32" class="user-avatar">{{ authStore.username?.[0] || 'U' }}</el-avatar>
            <span class="username">{{ authStore.username || '用户' }}</span>
          </div>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item divided @click="handleLogout">退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </el-header>

    <el-main class="client-main">
      <router-view v-slot="{ Component }">
        <transition name="fade-transform" mode="out-in">
          <component :is="Component" :key="$route.fullPath" />
        </transition>
      </router-view>
    </el-main>

    <div class="client-footer">
      <span>本平台为 AI 技术支持，不提供医疗诊断、处方或心理治疗。如有紧急情况请拨打 110 或心理援助热线 400-161-9995。</span>
    </div>
  </el-container>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/store/useAuthStore'
import NotificationBell from '@/components/NotificationBell.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const activeMenu = computed(() => route.path)

const handleLogout = () => {
  authStore.logout()
  router.push('/auth/login')
}
</script>

<style lang="scss" scoped>
.client-layout {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f7fa;

  .client-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: #fff;
    border-bottom: 1px solid #e4e7ed;
    padding: 0 24px;
    height: 60px;
    flex-shrink: 0;

    .header-left {
      display: flex;
      align-items: center;
      gap: 32px;

      .logo-link {
        text-decoration: none;

        .logo-text {
          font-size: 18px;
          font-weight: 700;
          color: #409eff;
          white-space: nowrap;
        }
      }

      .client-menu {
        border-bottom: none;

        :deep(.el-menu-item) {
          height: 60px;
          line-height: 60px;
          font-size: 15px;
          color: #606266;

          &.is-active {
            color: #409eff;
            border-bottom-color: #409eff;
            font-weight: 600;
          }

          &:hover {
            color: #409eff;
          }
        }
      }
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 16px;
      .user-info {
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
        padding: 4px 8px;
        border-radius: 4px;

        &:hover {
          background-color: #f5f7fa;
        }

        .user-avatar {
          background-color: #409eff;
          color: #fff;
          font-size: 14px;
        }

        .username {
          font-size: 14px;
          color: #606266;
          font-weight: 500;
        }
      }
    }
  }

  .client-main {
    flex: 1;
    padding: 24px;
    overflow-y: auto;
    max-width: 1200px;
    width: 100%;
    margin: 0 auto;
    box-sizing: border-box;
  }

  .client-footer {
    flex-shrink: 0;
    text-align: center;
    padding: 10px 24px;
    font-size: 11px;
    color: #c0c4cc;
    background: #fff;
    border-top: 1px solid #f0f0f0;
    line-height: 1.5;
  }
}

.fade-transform-enter-active,
.fade-transform-leave-active {
  transition: all 0.15s ease;
}

.fade-transform-enter-from {
  opacity: 0;
  transform: translateX(-10px);
}

.fade-transform-leave-to {
  opacity: 0;
  transform: translateX(10px);
}
</style>
