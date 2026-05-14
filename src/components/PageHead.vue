<template>
  <div class="page-head">
    <!-- 背景层：用于渲染渐变或背景图，不影响文字可读性 -->
    <div class="head-bg-layer"></div>

    <div class="left-section">
      <!-- 菜单切换图标 -->
      <div
        v-if="showMenuIcon"
        class="toggle-icon"
        @click="menuStore.toggleMenu"
      >
        <el-icon :size="20">
          <Expand v-if="menuStore.isCollapsed" />
          <Fold v-else />
        </el-icon>
      </div>
      <h2 class="page-title">{{ title || ($t(route.meta.i18n) || currentRouteTitle) }}</h2>
    </div>

    <div class="right-section">
      <el-dropdown trigger="click" @command="switchLang">
        <span class="lang-switch">
          <el-icon><Global /></el-icon>
          <span class="lang-label">{{ currentLangLabel }}</span>
        </span>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="zh">中文</el-dropdown-item>
            <el-dropdown-item command="zh-TW">繁體中文</el-dropdown-item>
            <el-dropdown-item command="en">English</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
      <slot>
        <el-dropdown trigger="click">
          <div class="user-info">
            <el-avatar
              :size="32"
              src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png"
            />
            <span class="username">{{ authStore.username || '用户' }}</span>
            <el-icon><ArrowDown /></el-icon>
          </div>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="handleLogout">{{ $t('admin.pageHead.logout') }}</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </slot>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useMenuStore } from '@/store/useMenuStore'
import { useAuthStore } from '@/store/useAuthStore'
import { Expand, Fold, ArrowDown } from '@element-plus/icons-vue'

const { locale } = useI18n()

const props = defineProps({
  title: {
    type: String,
    default: '',
  },
  showMenuIcon: {
    type: Boolean,
    default: true,
  },
})

const route = useRoute()
const router = useRouter()
const menuStore = useMenuStore()
const authStore = useAuthStore()

const currentLangLabel = computed(() => {
  const labels = { zh: '中文', 'zh-TW': '繁體中文', en: 'EN' }
  return labels[locale.value] || '中文'
})

const switchLang = (lang) => {
  locale.value = lang
}

const currentRouteTitle = computed(() => route.meta.title || '管理后台')

const handleLogout = () => {
  authStore.logout()
  router.push('/auth/login')
}
</script>

<style lang="scss" scoped>
.page-head {
  position: relative;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--layout-padding);
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border-color);
  box-shadow: 0 1px 4px rgba(167, 139, 250, 0.06);
  z-index: 100;
  overflow: hidden;

  .head-bg-layer {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: -1;
    background: linear-gradient(
      90deg,
      rgba(255, 255, 255, 1) 0%,
      rgba(167, 139, 250, 0.06) 50%,
      rgba(255, 255, 255, 1) 100%
    );
    background-attachment: fixed;
    opacity: 0.8;
  }

  .left-section,
  .right-section {
    position: relative;
    z-index: 1;
  }

  .left-section {
    display: flex;
    align-items: center;
    gap: 16px;

    .toggle-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      padding: 8px;
      border-radius: 8px;
      transition: all 0.3s;
      color: var(--text-secondary);

      &:hover {
        background-color: var(--el-color-primary-light-9);
        color: var(--primary-color);
      }
    }

    .page-title {
      font-size: 18px;
      font-weight: 600;
      color: var(--text-color);
      margin: 0;
    }
  }

  .right-section {
    display: flex;
    align-items: center;
    gap: 12px;

    .lang-switch {
      display: flex;
      align-items: center;
      gap: 4px;
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 8px;
      font-size: 13px;
      color: var(--text-secondary);
      transition: all 0.2s;

      &:hover {
        background-color: var(--el-color-primary-light-9);
        color: var(--primary-color);
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
      transition: background-color 0.3s;

      &:hover {
        background-color: var(--el-color-primary-light-9);
      }

      .username {
        font-size: 14px;
        color: var(--text-secondary);
        font-weight: 500;
      }
    }
  }
}

// 移动端头部紧凑
@media screen and (max-width: 768px) {
  .page-head {
    padding: 0 12px;

    .page-title {
      font-size: 15px;
    }

    .username {
      display: none;
    }
  }
}

/* 深色模式 */
html.dark .page-head {
  background-color: var(--card-bg);
  border-bottom-color: var(--border-color);

  .head-bg-layer {
    background: linear-gradient(
      90deg,
      var(--card-bg) 0%,
      rgba(167, 139, 250, 0.04) 50%,
      var(--card-bg) 100%
    );
  }

  .page-title,
  .username {
    color: var(--text-color);
  }

  .toggle-icon {
    color: var(--text-secondary);

    &:hover {
      background-color: rgba(167, 139, 250, 0.1);
      color: var(--text-warm);
    }
  }

  .lang-switch {
    color: var(--text-secondary);

    &:hover {
      background-color: rgba(167, 139, 250, 0.1);
      color: var(--text-warm);
    }
  }
}
</style>
