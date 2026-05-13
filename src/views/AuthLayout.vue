<template>
  <div class="auth-layout">
    <!-- 左侧展示区 -->
    <div class="auth-left">
      <div class="auth-content">
        <div class="brand-badge">{{ $t('auth.layout.brand') }}</div>
        <h1 class="auth-title">{{ $t('auth.layout.title') }}</h1>
        <div class="auth-desc">
          <p class="desc-line" v-for="(line, idx) in layoutDesc" :key="idx">{{ line }}</p>
        </div>
        <div class="logo-wrapper">
          <img src="@/assets/logo.png" alt="心晴AI" class="auth-logo" />
        </div>
      </div>
    </div>

    <!-- 右侧表单区 -->
    <div class="auth-right">
      <div class="form-container">
        <div class="back-home" @click="$router.push('/')">
          <el-icon><ArrowLeft /></el-icon>
          {{ $t('auth.layout.backHome') }}
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
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { ArrowLeft } from '@element-plus/icons-vue'

const { t, tm, rt } = useI18n()

const layoutDesc = computed(() => {
  const lines = tm('auth.layout.desc')
  if (Array.isArray(lines)) {
    return lines.map((line) => (typeof line === 'string' ? line : rt(line)))
  }
  return [t('auth.layout.desc')]
})
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
    background: linear-gradient(135deg, #8B5CF6 0%, #A78BFA 30%, #C084FC 70%, #F472B6 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    padding: 40px;
    position: relative;
    overflow: hidden;

    &::before {
      content: '';
      position: absolute;
      width: 500px;
      height: 500px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.05);
      top: -120px;
      right: -120px;
    }

    &::after {
      content: '';
      position: absolute;
      width: 350px;
      height: 350px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.04);
      bottom: -100px;
      left: -100px;
    }

    .auth-content {
      text-align: center;
      max-width: 500px;
      position: relative;
      z-index: 1;

      .brand-badge {
        display: inline-block;
        padding: 6px 20px;
        border-radius: 20px;
        background: rgba(255, 255, 255, 0.15);
        backdrop-filter: blur(4px);
        font-size: 13px;
        letter-spacing: 2px;
        margin-bottom: 32px;
        border: 1px solid rgba(255, 255, 255, 0.2);
      }

      .auth-title {
        font-size: 48px;
        font-weight: 800;
        margin-bottom: 32px;
        color: #fff;
        letter-spacing: 4px;
        text-shadow: 0 2px 16px rgba(0, 0, 0, 0.12);
      }

      .auth-desc {
        margin-bottom: 40px;

        .desc-line {
          font-size: 18px;
          line-height: 2;
          opacity: 0.9;
          text-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
          font-weight: 400;
          letter-spacing: 1px;
        }
      }

      .logo-wrapper {
        width: 120px;
        height: 120px;
        background: rgba(255, 255, 255, 0.15);
        backdrop-filter: blur(4px);
        border-radius: 50%;
        margin: 0 auto;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        box-shadow: 0 8px 32px rgba(139, 92, 246, 0.25);
        border: 2px solid rgba(255, 255, 255, 0.2);

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
