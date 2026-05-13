<template>
  <el-container class="client-layout">
    <el-header height="60px" class="client-header">
      <div class="header-left">
        <router-link to="/client/chat" class="logo-link">
          <span class="logo-text">{{ $t('client.layout.logo') }}</span>
        </router-link>
        <el-menu
          :default-active="activeMenu"
          mode="horizontal"
          router
          class="client-menu"
        >
          <el-menu-item index="/client/chat">{{ $t('client.chat.newChat') }}</el-menu-item>
          <el-menu-item index="/client/diary">{{ $t('client.diary.title') }}</el-menu-item>
          <el-menu-item index="/client/insights">{{ $t('menu.insights') }}</el-menu-item>
          <el-menu-item index="/client/knowledge">{{ $t('menu.knowledgeReading') }}</el-menu-item>
          <el-menu-item index="/client/articles">{{ $t('menu.articles') }}</el-menu-item>
        </el-menu>
      </div>
      <div class="header-right">
        <el-dropdown trigger="click" @command="switchLang">
          <span class="lang-switch">
            <el-icon><Global /></el-icon>
            <span class="lang-label">{{ currentLangLabel }}</span>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="zh" :class="{ active: locale === 'zh' }">中文</el-dropdown-item>
              <el-dropdown-item command="en" :class="{ active: locale === 'en' }">English</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <NotificationBell />
        <el-dropdown trigger="click">
          <div class="user-info">
            <el-avatar :size="32" class="user-avatar">{{ authStore.username?.[0] || 'U' }}</el-avatar>
            <span class="username">{{ authStore.username || $t('common.noData') }}</span>
          </div>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item divided @click="handleLogout">{{ $t('client.layout.logout') }}</el-dropdown-item>
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
      <span>{{ $t('client.layout.footer') }}</span>
    </div>
  </el-container>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/store/useAuthStore'
import NotificationBell from '@/components/NotificationBell.vue'

const { locale } = useI18n()
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const activeMenu = computed(() => route.path)

const currentLangLabel = computed(() => locale.value === 'zh' ? '中文' : 'EN')

const switchLang = (lang) => {
  locale.value = lang
}

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
  background: linear-gradient(180deg, #faf5ff 0%, #fff7f5 50%, #fdf7f5 100%);

  .client-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-bottom: 1px solid #f3e8ff;
    padding: 0 24px;
    height: 60px;
    flex-shrink: 0;

    .header-left {
      display: flex;
      align-items: center;
      gap: 32px;
      min-width: 0;

      .logo-link {
        text-decoration: none;

        .logo-text {
          font-size: 18px;
          font-weight: 700;
          background: linear-gradient(135deg, #a78bfa, #f472b6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          white-space: nowrap;
        }
      }

      .client-menu {
        border-bottom: none;
        overflow: hidden;

        :deep(.el-menu-item) {
          height: 60px;
          line-height: 60px;
          font-size: 15px;
          color: #6b7280;

          &.is-active {
            color: #a78bfa;
            border-bottom-color: #a78bfa;
            font-weight: 600;
          }

          &:hover {
            color: #a78bfa;
          }
        }
      }
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 16px;

      .lang-switch {
        display: flex;
        align-items: center;
        gap: 4px;
        cursor: pointer;
        padding: 4px 8px;
        border-radius: 8px;
        font-size: 13px;
        color: #6b7280;
        transition: all 0.2s;

        &:hover {
          background-color: #faf5ff;
          color: #a78bfa;
        }

        .lang-label {
          font-weight: 500;
        }
      }

      .user-info {
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
        padding: 4px 8px;
        border-radius: 8px;
        transition: background 0.2s;

        &:hover {
          background-color: #faf5ff;
        }

        .user-avatar {
          background: linear-gradient(135deg, #f472b6, #fb7185);
          color: #fff;
          font-size: 14px;
        }

        .username {
          font-size: 14px;
          color: #6b7280;
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
    color: #c4b5fd;
    background: rgba(255, 255, 255, 0.6);
    border-top: 1px solid #f3e8ff;
    line-height: 1.5;
  }
}

// 全局客户端布局移动端适配
@media screen and (max-width: 768px) {
  .client-layout {
    .client-header {
      padding: 0 12px;

      .header-left {
        gap: 8px;

        .logo-text {
          font-size: 16px;
        }

        .client-menu {
          overflow-x: auto;
          flex-shrink: 1;
          white-space: nowrap;
          -webkit-overflow-scrolling: touch;

          &::-webkit-scrollbar {
            display: none;
          }

          :deep(.el-menu-item) {
            padding: 0 10px;
            font-size: 13px;
          }
        }
      }

      .header-right .username {
        display: none;
      }
    }

    .client-main {
      padding: 12px;
    }
  }
}

.fade-transform-enter-active,
.fade-transform-leave-active {
  transition: all 0.2s ease;
}

.fade-transform-enter-from {
  opacity: 0;
  transform: translateX(-10px);
}

.fade-transform-leave-to {
  opacity: 0;
  transform: translateX(10px);
}

/* ===== 深色模式 ===== */
html.dark .client-layout {
  background: var(--gradient-subtle);

  .client-header {
    background: var(--overlay-bg);
    border-bottom-color: var(--border-color);

    .header-left .client-menu {
      :deep(.el-menu-item) {
        color: var(--text-secondary);

        &.is-active {
          color: #a78bfa;
          border-bottom-color: #a78bfa;
        }
        &:hover {
          color: #a78bfa;
        }
      }
    }

    .header-right {
      .lang-switch {
        color: var(--text-secondary);

        &:hover {
          background-color: rgba(167, 139, 250, 0.08);
          color: #a78bfa;
        }
      }

      .user-info {
        &:hover {
          background-color: rgba(167, 139, 250, 0.08);
        }
        .username {
          color: var(--text-secondary);
        }
      }
    }
  }

  .client-footer {
    color: var(--text-muted);
    background: rgba(30, 25, 51, 0.6);
    border-top-color: var(--border-color);
  }
}
</style>
