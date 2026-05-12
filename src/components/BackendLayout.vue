<template>
  <el-container class="layout-container">
    <!-- 侧边栏组件 -->
    <Sidebar />

    <el-container class="right-container">
      <el-header height="60px">
        <!-- 封装好的 PageHead 组件，内部处理了折叠按钮、标题和用户信息 -->
        <PageHead>
          <!-- 这里可以根据需要使用插槽自定义右侧内容，不使用则显示默认的用户信息 -->
        </PageHead>
      </el-header>

      <el-main class="main-content">
        <!-- 二级路由出口：渲染数据分析、咨询记录等具体页面 -->
        <router-view v-slot="{ Component }">
          <transition name="fade-transform" mode="out-in">
            <component :is="Component" :key="$route.fullPath" />
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import Sidebar from './Sidebar.vue'
import PageHead from './PageHead.vue'

/**
 * BackendLayout 后台基础布局组件
 * 采用典型的“左侧菜单 + 右侧主体”结构
 */
</script>

<style lang="scss" scoped>
.layout-container {
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  background-color: var(--bg-color);

  .right-container {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    transition: all 0.3s cubic-bezier(0.2, 0, 0, 1);
    background-color: var(--bg-color);
  }

  .el-header {
    padding: 0;
    background-color: var(--card-bg);
    z-index: 10;
  }

  .main-content {
    padding: var(--layout-padding);
    overflow-y: auto;
    background-color: var(--bg-color);
    flex: 1;
  }
}

// 移动端主体区域紧凑
@media screen and (max-width: 768px) {
  .main-content {
    padding: 12px;
  }
}

/* 页面切换动画：淡入并带有轻微的位移效果 */
.fade-transform-enter-active,
.fade-transform-leave-active {
  transition: all 0.3s;
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
