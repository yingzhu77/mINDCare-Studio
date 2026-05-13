<template>
  <!-- 侧边栏容器，宽度随 store 中的折叠状态动态变化 -->
  <el-aside :width="menuStore.isCollapsed ? '64px' : '240px'" class="sidebar">
    <div class="logo-container">
      <div class="logo">
        <img src="@/assets/logo.png" alt="心晴AI" class="logo-img" />
      </div>
      <!-- 使用 Vue 3 的内置组件 <Transition> 实现 Logo 标题的平滑隐藏动画 -->
      <transition name="fade">
        <div v-if="!menuStore.isCollapsed" class="title-wrapper">
          <div class="main-title text-ellipsis">心理健康AI助手</div>
          <div class="sub-title text-ellipsis">管理后台</div>
        </div>
      </transition>
    </div>

    <!-- 侧边菜单组件，绑定路由跳转和折叠状态 -->
    <el-menu
      :default-active="activeMenu"
      class="side-menu"
      router
      :collapse="menuStore.isCollapsed"
      :collapse-transition="true"
    >
      <el-menu-item
        v-for="item in menuList"
        :key="item.path"
        :index="'/back/' + item.path"
      >
        <el-icon><component :is="item.meta.icon" /></el-icon>
        <template #title>
          <el-badge
            v-if="item.path === 'article-review'"
            :hidden="pendingCount === 0"
            :value="pendingCount"
            :max="99"
            class="review-badge"
          >
            <span>{{ item.meta.title }}</span>
          </el-badge>
          <span v-else>{{ item.meta.title }}</span>
        </template>
      </el-menu-item>
    </el-menu>

    <!-- 侧边栏底部：风景装饰图 -->
    <div class="sidebar-footer" v-if="!menuStore.isCollapsed">
      <img src="@/assets/sidebar-scene.jpg" alt="山水相伴" class="footer-img" />
    </div>
  </el-aside>
</template>

<script setup>
import { computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMenuStore } from '@/store/useMenuStore'
import { useReviewStore } from '@/store/useReviewStore'

const route = useRoute()
const router = useRouter()
const menuStore = useMenuStore()
const reviewStore = useReviewStore()

const pendingCount = computed(() => reviewStore.pendingCount)
let pollTimer = null

onMounted(() => {
  reviewStore.refreshPendingCount()
  pollTimer = setInterval(reviewStore.refreshPendingCount, 60000)
})

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
})

// 过滤出 /back 路由下的所有子路由作为菜单项列表
const menuList = computed(() => {
  const backRoute = router.options.routes.find((r) => r.path === '/back')
  return backRoute ? backRoute.children : []
})

// 当前激活的菜单项，根据当前路由路径自动匹配
const activeMenu = computed(() => route.path)
</script>

<style lang="scss" scoped>
.sidebar {
  background-color: var(--card-bg);
  border-right: 1px solid var(--border-color);
  height: 100vh;
  display: flex;
  flex-direction: column;
  transition: width 0.3s cubic-bezier(0.2, 0, 0, 1); // 侧边栏整体宽度变化过渡效果
  overflow: hidden; // 确保折叠时内容不会溢出

  .logo-container {
    padding: 24px 12px;
    display: flex;
    align-items: center;
    gap: 12px;
    height: 88px; // 固定高度，防止折叠时抖动

    .logo {
      min-width: 40px;
      width: 40px;
      height: 40px;
      background: #f5f3ff;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      flex-shrink: 0;

      .logo-img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }

    .title-wrapper {
      flex: 1;
      overflow: hidden;
      white-space: nowrap;

      .main-title {
        font-size: 16px;
        font-weight: 600;
        color: var(--text-color);
        line-height: 1.2;
      }
      .sub-title {
        font-size: 11px;
        color: var(--text-secondary);
        margin-top: 4px;
      }
    }
  }

  .side-menu {
    border-right: none;
    flex: 1;

    :deep(.el-menu-item) {
      height: 50px;
      line-height: 50px;
      margin: 4px 10px;
      padding-left: 20px !important;
      border-radius: 0 10px 10px 0;
      color: var(--el-text-color-regular);
      transition: all 0.2s ease-in-out;
      position: relative;

      &::before {
        content: '';
        position: absolute;
        left: 0;
        top: 50%;
        transform: translateY(-50%) scaleY(0);
        width: 3px;
        height: 20px;
        background: linear-gradient(180deg, #A78BFA, #C084FC);
        border-radius: 0 3px 3px 0;
        transition: transform 0.25s ease;
      }

      &:hover {
        background-color: var(--el-color-primary-light-9);
        color: var(--primary-color);

        &::before {
          transform: translateY(-50%) scaleY(0.6);
        }
      }

      &.is-active {
        background: linear-gradient(90deg, var(--el-color-primary-light-9) 0%, transparent 100%);
        color: var(--primary-color);
        font-weight: 600;

        &::before {
          transform: translateY(-50%) scaleY(1);
        }
      }

      .el-icon {
        font-size: 18px;
        margin-right: 12px;
        transition: margin 0.3s;
      }
    }

    // 当菜单处于折叠状态时的图标边距优化
    &.el-menu--collapsed {
      :deep(.el-menu-item) {
        margin: 4px 8px;
        padding: 0 !important;
        display: flex;
        justify-content: center;

        .el-icon {
          margin-right: 0;
        }
      }
    }
  }

  // 侧边栏底部装饰图
  .sidebar-footer {
    padding: 12px 16px 16px;
    flex-shrink: 0;
    border-top: 1px solid var(--border-color);

    .footer-img {
      width: 100%;
      height: 100px;
      object-fit: cover;
      border-radius: 10px;
      opacity: 0.75;
      transition: opacity 0.3s ease;
      filter: saturate(0.9);

      &:hover {
        opacity: 1;
      }
    }
  }
}

// 标题淡入淡出动画配置
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

// 移动端：侧边栏浮动为覆盖层
@media screen and (max-width: 768px) {
  .sidebar {
    position: fixed;
    z-index: 1001;
  }
}

// 审核红点 badge 样式
.review-badge {
  :deep(.el-badge__content) {
    top: 8px;
    right: -4px;
  }
}

// 文字溢出隐藏辅助类
.text-ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ===== 深色模式 ===== */
html.dark .sidebar {
  .side-menu :deep(.el-menu-item) {
    color: var(--text-secondary);

    &:hover {
      background-color: rgba(167, 139, 250, 0.08);
      color: var(--text-warm);
    }

    &.is-active {
      background: linear-gradient(90deg, rgba(167, 139, 250, 0.12) 0%, transparent 100%);
      color: var(--text-warm);

      &::before {
        background: linear-gradient(180deg, #A78BFA, #C084FC);
      }
    }
  }

  .sidebar-footer {
    border-top-color: var(--border-color);

    .footer-img {
      opacity: 0.5;
    }
  }
}
</style>
