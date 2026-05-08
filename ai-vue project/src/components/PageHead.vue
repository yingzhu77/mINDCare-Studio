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
      <h2 class="page-title">{{ title || currentRouteTitle }}</h2>
    </div>

    <div class="right-section">
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
              <el-dropdown-item>个人中心</el-dropdown-item>
              <el-dropdown-item divided @click="handleLogout">退出登录</el-dropdown-item>
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
import { useMenuStore } from '@/store/useMenuStore'
import { useAuthStore } from '@/store/useAuthStore'
import { Expand, Fold, ArrowDown } from '@element-plus/icons-vue'

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
  /* 桌面端边距由变量控制 */
  padding: 0 var(--layout-padding);
  background-color: var(--card-bg);
  border-bottom: 1px solid var(--border-color);
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
  z-index: 100;
  overflow: hidden;

  /* 背景层实现 */
  .head-bg-layer {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: -1;
    /* 使用渐变色模拟图片效果，体积极小且兼容深色模式 */
    background: linear-gradient(
      90deg,
      rgba(255, 255, 255, 1) 0%,
      rgba(240, 247, 255, 0.5) 50%,
      rgba(255, 255, 255, 1) 100%
    );
    background-attachment: fixed; /* 视差效果模拟 */
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
      border-radius: 4px;
      transition: all 0.3s;
      color: #606266;

      &:hover {
        background-color: rgba(64, 158, 255, 0.1);
        color: #409eff;
      }
    }

    .page-title {
      font-size: 18px;
      font-weight: 600;
      color: #303133;
      margin: 0;
    }
  }

  .right-section {
    .user-info {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 4px;
      transition: background-color 0.3s;

      &:hover {
        background-color: rgba(0, 0, 0, 0.02);
      }

      .username {
        font-size: 14px;
        color: #606266;
        font-weight: 500;
      }
    }
  }
}

/* 深色模式兼容性预设 */
@media (prefers-color-scheme: dark) {
  .page-head {
    background-color: #1a1a1a;
    border-bottom-color: #333;

    .head-bg-layer {
      background: linear-gradient(
        90deg,
        #1a1a1a 0%,
        rgba(64, 158, 255, 0.05) 50%,
        #1a1a1a 100%
      );
    }

    .page-title,
    .username {
      color: #e5eaf3;
    }

    .toggle-icon {
      color: #a3a6ad;
    }
  }
}
</style>
