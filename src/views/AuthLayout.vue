<template>
  <div class="auth-layout">
    <!-- 左侧展示区 -->
    <div class="auth-left">
      <div class="auth-content">
        <h1 class="auth-title">心理AI助手</h1>
        <p class="auth-desc">
          每个深夜，每个焦虑的时刻，我们都在这里。不必独自承受，让心与心的连接温暖您的每一天
        </p>
        <div class="logo-wrapper">
          <!-- 引入指定的资产图片 -->
          <img src="@/assets/咕咕嘎嘎.jpg" alt="logo" class="auth-logo" />
        </div>
      </div>
    </div>

    <!-- 右侧表单区 -->
    <div class="auth-right">
      <div class="form-container">
        <div class="back-home" @click="$router.push('/')">
          <el-icon><ArrowLeft /></el-icon>
          返回首页
        </div>
        <router-view v-slot="{ Component }">
          <transition name="fade-transform" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ArrowLeft } from '@element-plus/icons-vue'
</script>

<style lang="scss" scoped>
.auth-layout {
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  background-color: var(--card-bg);

  .auth-left {
    flex: 1;
    background-color: #5b8c7a; // 墨绿色背景
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    padding: 40px;

    .auth-content {
      text-align: center;
      max-width: 500px;

      .auth-title {
        font-size: 42px;
        font-weight: 700;
        margin-bottom: 24px;
        color: #fff;
      }

      .auth-desc {
        font-size: 18px;
        line-height: 1.6;
        margin-bottom: 40px;
        opacity: 0.9;
      }

      .logo-wrapper {
        width: 160px;
        height: 160px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 50%;
        margin: 0 auto;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;

        .auth-logo {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 50%;
        }
      }
    }
  }

  .auth-right {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;

    .form-container {
      width: 100%;
      max-width: 400px;
      padding: 20px;

      .back-home {
        position: absolute;
        top: 40px;
        left: 40px;
        cursor: pointer;
        color: #606266;
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 14px;
        transition: color 0.3s;

        &:hover {
          color: var(--primary-color);
        }
      }
    }
  }
}

@media screen and (max-width: 992px) {
  .auth-left {
    display: none !important;
  }
}

@media screen and (max-width: 768px) {
  .auth-layout .auth-right {
    .form-container {
      max-width: 100%;

      .back-home {
        position: static;
        margin-bottom: 16px;
        top: auto;
        left: auto;
      }
    }
  }
}

.fade-transform-enter-active,
.fade-transform-leave-active {
  transition: all 0.3s;
}

.fade-transform-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}

.fade-transform-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>
