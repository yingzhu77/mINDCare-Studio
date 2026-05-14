<template>
  <div class="home-page">
    <!-- 全屏背景层 -->
    <div class="bg-layer">
      <div class="bg-image"></div>
      <div class="bg-overlay"></div>
    </div>

    <!-- 导航栏 -->
    <header class="home-header">
      <div class="header-inner">
        <div class="brand-text">心晴</div>
        <nav class="header-nav">
          <a href="#features" class="nav-link">功能</a>
          <a href="#about" class="nav-link">关于</a>
        </nav>
        <el-button round class="btn-login" @click="goLogin">进入平台</el-button>
      </div>
    </header>

    <!-- Hero 区域 -->
    <section class="hero-section">
      <div class="hero-content">
        <div class="hero-badge">AI 心理健康管理平台</div>
        <h1 class="hero-title">
          <span class="title-line">踏上心灵之旅，</span>
          <span class="title-line title-highlight">让每一颗心都被温柔以待</span>
        </h1>
        <p class="hero-desc">
          与 AI 对话倾诉 · 记录情绪日记 · 探索心理知识
        </p>
        <div class="hero-actions">
          <el-button size="large" round class="btn-primary-action" @click="goLogin">
            开始使用
            <el-icon class="action-icon"><ArrowRight /></el-icon>
          </el-button>
          <el-button size="large" round class="btn-secondary-action" @click="scrollToFeatures">
            了解更多
          </el-button>
        </div>
      </div>
      <div class="hero-wave">
        <svg viewBox="0 0 1440 120" preserveAspectRatio="none">
          <path d="M0,60 C360,120 1080,0 1440,60 L1440,120 L0,120 Z" fill="var(--bg-color)" opacity="0.95"/>
        </svg>
      </div>
    </section>

    <!-- 功能区域 -->
    <section id="features" class="features-section">
      <div class="section-header">
        <h2 class="section-title">核心功能</h2>
        <p class="section-desc">用科技温暖心灵，让每个人都获得专业的心理支持</p>
      </div>
      <div class="features-grid">
        <div class="feature-card" v-for="(item, index) in features" :key="index">
          <div class="feature-icon" :style="{ background: item.iconBg }">
            <el-icon :size="28"><component :is="item.icon" /></el-icon>
          </div>
          <h3 class="feature-title">{{ item.title }}</h3>
          <p class="feature-desc">{{ item.desc }}</p>
        </div>
      </div>
    </section>

    <!-- 关于区域 -->
    <section id="about" class="about-section">
      <div class="section-header">
        <h2 class="section-title">关于项目</h2>
        <p class="section-desc">一个开源的心理健康管理平台，致力于让心理支持触手可及</p>
      </div>
      <div class="about-grid">
        <div class="about-item" v-for="(item, i) in aboutList" :key="i">
          <el-icon :size="22" class="about-icon"><component :is="item.icon" /></el-icon>
          <span>{{ item.text }}</span>
        </div>
      </div>
    </section>

    <!-- 底部 -->
    <footer class="home-footer">
      <div class="footer-inner">
        <p class="footer-text">心晴 AI 心理健康助手 — 让温暖触手可及</p>
        <div class="footer-repo">
          <el-icon :size="16"><Link /></el-icon>
          <a href="https://github.com/yingzhu77/MindCare-AI" target="_blank" rel="noopener noreferrer" class="footer-link">GitHub 开源仓库</a>
        </div>
        <p class="footer-copy">MIT License · 开源共建</p>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ArrowRight, Link } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const features = [
  {
    icon: 'ChatLineSquare',
    title: 'AI 对话倾诉',
    desc: '在安全私密的空间中与 AI 对话，倾诉烦恼，获得专业心理引导。',
    iconBg: 'linear-gradient(135deg, #8B5CF6, #A78BFA)',
  },
  {
    icon: 'Notebook',
    title: '情绪日记',
    desc: '记录每日心情，AI 自动分析情绪模式，助你更了解自己的内心。',
    iconBg: 'linear-gradient(135deg, #A78BFA, #C084FC)',
  },
  {
    icon: 'Document',
    title: '知识文章',
    desc: '浏览专业心理健康知识，学习管理情绪与压力的实用方法。',
    iconBg: 'linear-gradient(135deg, #C084FC, #F472B6)',
  },
  {
    icon: 'Edit',
    title: '投稿分享',
    desc: '分享你的心理成长故事，帮助他人，也让自己的经历更有价值。',
    iconBg: 'linear-gradient(135deg, #8B5CF6, #A78BFA)',
  },
  {
    icon: 'DataAnalysis',
    title: '数据洞察',
    desc: '可视化情绪趋势与行为分析，直观看到自己的变化与成长。',
    iconBg: 'linear-gradient(135deg, #A78BFA, #C084FC)',
  },
  {
    icon: 'CircleCheck',
    title: '科学可靠',
    desc: '基于心理学理论框架，结合 AI 提供安全可靠的心理支持服务。',
    iconBg: 'linear-gradient(135deg, #C084FC, #F472B6)',
  },
]

const aboutList = [
  { icon: 'Link', text: '开源项目 · 持续建设中' },
  { icon: 'Connection', text: '前后端分离 · Vue3 + NestJS' },
  { icon: 'Aim', text: 'AI 驱动 · DeepSeek 情绪分析' },
]

const goLogin = () => router.push('/auth/login')

const scrollToFeatures = () => {
  document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })
}
</script>

<style scoped>
.home-page {
  width: 100vw;
  min-height: 100vh;
  overflow-x: hidden;
  position: relative;
  background-color: var(--bg-color);
}

/* ===== 背景层 ===== */
.bg-layer {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  z-index: 0;
  pointer-events: none;
}

.bg-image {
  width: 100%;
  height: 100%;
  background-image: url('@/assets/home-bg.jpg');
  background-size: cover;
  background-position: center 30%;
  background-repeat: no-repeat;
}

.bg-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    135deg,
    rgba(108, 70, 180, 0.55) 0%,
    rgba(139, 92, 246, 0.40) 35%,
    rgba(167, 139, 250, 0.25) 65%,
    rgba(196, 132, 252, 0.15) 100%
  );
}

/* ===== 导航栏 ===== */
.home-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  padding: 14px 40px;
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid rgba(243, 232, 255, 0.5);
}

html.dark .home-header {
  background: rgba(30, 25, 51, 0.8);
  border-bottom-color: rgba(61, 50, 94, 0.5);
}

.header-inner {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.brand-text {
  font-size: 22px;
  font-weight: 800;
  letter-spacing: 4px;
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.header-nav {
  display: flex;
  gap: 32px;
}

.nav-link {
  font-size: 14px;
  color: var(--text-secondary);
  text-decoration: none;
  transition: color 0.2s;
  font-weight: 500;
}
.nav-link:hover {
  color: var(--primary-color);
}

.btn-login {
  padding: 22px 28px;
  font-weight: 600;
  font-size: 14px;
  letter-spacing: 1px;
  background: var(--gradient-primary);
  border: none;
  color: #fff;
  transition: all 0.3s ease;
}
.btn-login:hover {
  background: var(--gradient-warm);
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(139, 92, 246, 0.3);
}

/* ===== Hero ===== */
.hero-section {
  position: relative;
  z-index: 1;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 120px 40px 80px;
}

.hero-content {
  text-align: center;
  max-width: 720px;
  animation: heroFadeIn 1s ease-out;
}

@keyframes heroFadeIn {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}

.hero-badge {
  display: inline-block;
  padding: 8px 24px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  font-size: 13px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
  letter-spacing: 2px;
  margin-bottom: 36px;
}

.hero-title {
  margin-bottom: 28px;
}

.title-line {
  display: block;
  font-size: 52px;
  font-weight: 800;
  color: #fff;
  line-height: 1.3;
  letter-spacing: 2px;
  text-shadow: 0 4px 24px rgba(0, 0, 0, 0.18);
}

.title-highlight {
  background: linear-gradient(135deg, #C084FC, #F472B6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-desc {
  font-size: 18px;
  color: rgba(255, 255, 255, 0.85);
  line-height: 1.6;
  margin-bottom: 44px;
  letter-spacing: 1px;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.hero-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
}

.btn-primary-action {
  padding: 24px 40px;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 1px;
  background: linear-gradient(135deg, #8B5CF6, #A78BFA);
  border: none;
  color: #fff;
  transition: all 0.3s ease;
  box-shadow: 0 8px 24px rgba(139, 92, 246, 0.3);
}
.btn-primary-action:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 36px rgba(139, 92, 246, 0.4);
  background: linear-gradient(135deg, #7C3AED, #8B5CF6);
}
html.dark .btn-primary-action {
  box-shadow: 0 8px 24px rgba(139, 92, 246, 0.2);
}

.action-icon {
  margin-left: 6px;
  transition: transform 0.2s;
}
.btn-primary-action:hover .action-icon {
  transform: translateX(4px);
}

.btn-secondary-action {
  padding: 24px 32px;
  font-size: 16px;
  font-weight: 500;
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.25);
  color: #fff;
  transition: all 0.3s ease;
}
.btn-secondary-action:hover {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  border-color: rgba(255, 255, 255, 0.4);
}

/* 波浪 */
.hero-wave {
  position: absolute;
  bottom: -1px;
  left: 0;
  width: 100%;
  height: 120px;
  overflow: hidden;
}
.hero-wave svg {
  width: 100%;
  height: 100%;
  display: block;
}

/* ===== 功能 ===== */
.features-section {
  position: relative;
  z-index: 1;
  padding: 100px 40px;
  background-color: var(--bg-color);
}

.section-header {
  text-align: center;
  margin-bottom: 60px;
}

.section-title {
  font-size: 34px;
  font-weight: 700;
  color: var(--text-color);
  margin-bottom: 14px;
  letter-spacing: 1px;
}

.section-desc {
  font-size: 16px;
  color: var(--text-secondary);
  line-height: 1.6;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  max-width: 1100px;
  margin: 0 auto;
}

.feature-card {
  background: var(--card-bg);
  border-radius: 16px;
  padding: 32px 28px;
  transition: all 0.3s ease;
  border: 1px solid var(--border-color);
  text-align: center;
}
.feature-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 12px 40px rgba(139, 92, 246, 0.08);
  border-color: var(--el-color-primary-light-5);
}
html.dark .feature-card:hover {
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3);
}

.feature-icon {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 18px;
  color: #fff;
}

.feature-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 10px;
}

.feature-desc {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.7;
}

/* ===== 关于 ===== */
.about-section {
  position: relative;
  z-index: 1;
  padding: 80px 40px;
  background-color: var(--surface-warm);
  border-top: 1px solid var(--border-color);
}
html.dark .about-section {
  background-color: var(--card-bg);
}

.about-grid {
  display: flex;
  justify-content: center;
  gap: 20px;
  max-width: 800px;
  margin: 0 auto;
  flex-wrap: wrap;
}

.about-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 24px;
  background: var(--card-bg);
  border-radius: 12px;
  border: 1px solid var(--border-color);
  color: var(--text-color);
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}
.about-item .about-icon {
  color: var(--primary-color);
}
.about-item:hover {
  border-color: var(--el-color-primary-light-5);
  box-shadow: 0 4px 16px rgba(139, 92, 246, 0.06);
}

/* ===== 底部 ===== */
.home-footer {
  position: relative;
  z-index: 1;
  padding: 36px 40px;
  background-color: var(--bg-color);
  border-top: 1px solid var(--border-color);
}

.footer-inner {
  max-width: 1100px;
  margin: 0 auto;
  text-align: center;
}

.footer-text {
  font-size: 14px;
  color: var(--text-color);
  font-weight: 500;
  margin-bottom: 10px;
}

.footer-repo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-bottom: 6px;
  color: var(--text-secondary);
  font-size: 13px;
}

.footer-link {
  color: var(--primary-color);
  text-decoration: none;
  font-size: 13px;
  transition: opacity 0.2s;
}
.footer-link:hover {
  opacity: 0.8;
  text-decoration: underline;
}

.footer-copy {
  font-size: 12px;
  color: var(--text-muted);
}

/* ===== 响应式 ===== */
@media screen and (max-width: 992px) {
  .features-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .title-line {
    font-size: 40px;
  }
}

@media screen and (max-width: 768px) {
  .home-header {
    padding: 12px 16px;
  }
  .header-nav {
    display: none;
  }
  .hero-section {
    padding: 100px 20px 60px;
  }
  .title-line {
    font-size: 30px;
  }
  .hero-desc {
    font-size: 15px;
  }
  .hero-actions {
    flex-direction: column;
    align-items: center;
  }
  .features-section {
    padding: 60px 20px;
  }
  .features-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  .about-section {
    padding: 50px 20px;
  }
  .about-grid {
    flex-direction: column;
    align-items: center;
  }
  .section-title {
    font-size: 26px;
  }
}
</style>
