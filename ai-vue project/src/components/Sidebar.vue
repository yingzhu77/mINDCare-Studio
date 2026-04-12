<template>
  <!-- 侧边栏容器，宽度随 store 中的折叠状态动态变化 -->
  <el-aside :width="menuStore.isCollapsed ? '64px' : '240px'" class="sidebar">
    <div class="logo-container">
      <div class="logo">
        <img src="@/assets/anno.jpg" alt="logo" class="logo-img" />
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
          <span>{{ item.meta.title }}</span>
        </template>
      </el-menu-item>
    </el-menu>
  </el-aside>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMenuStore } from '@/store/useMenuStore'

/**
 * Sidebar 组件：实现响应式侧边菜单
 * 逻辑：
 * 1. 响应式：监听 Pinia store 中的 isCollapsed 状态，动态修改 el-aside 宽度
 * 2. 菜单生成：从 Vue Router 路由表中自动提取菜单项，实现配置驱动 UI
 */
const route = useRoute()
const router = useRouter()
const menuStore = useMenuStore()

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
      background: #f0f7ff;
      border-radius: 8px;
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
        color: #303133;
        line-height: 1.2;
      }
      .sub-title {
        font-size: 11px;
        color: #909399;
        margin-top: 4px;
      }
    }
  }

  .side-menu {
    border-right: none;
    flex: 1;

    // 修改 Element Plus 内部样式，确保菜单项折叠时美观
    :deep(.el-menu-item) {
      height: 50px;
      line-height: 50px;
      margin: 4px 10px;
      border-radius: 8px;
      color: #606266;
      transition: all 0.2s ease-in-out;

      &:hover {
        background-color: #f5f7fa;
        color: #409eff;
      }

      &.is-active {
        background-color: #ecf5ff;
        color: #409eff;
        font-weight: 500;
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

// 文字溢出隐藏辅助类
.text-ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
