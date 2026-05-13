<template>
  <div class="login-view">
    <h2 class="title">登录您的账户</h2>
    <p class="subtitle">请输入您的登录信息</p>

    <el-form
      :model="loginForm"
      :rules="rules"
      ref="loginFormRef"
      label-position="top"
      autocomplete="on"
      @submit.prevent="handleLogin"
    >
      <el-form-item label="用户名或邮箱" prop="username">
        <el-input
          v-model="loginForm.username"
          name="username"
          autocomplete="username"
          placeholder="请输入用户名或邮箱"
          size="large"
        />
      </el-form-item>

      <el-form-item label="密码" prop="password">
        <el-input
          v-model="loginForm.password"
          type="password"
          name="password"
          autocomplete="current-password"
          placeholder="请输入密码"
          size="large"
        />
      </el-form-item>

      <el-button
        type="primary"
        size="large"
        class="login-btn"
        :loading="loading"
        native-type="submit"
      >
        登录账户
      </el-button>
    </el-form>

    <div class="footer">
      还没有账户？<el-link type="primary" @click="$router.push('/auth/register')">去注册</el-link>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { login } from '@/api/admin'
import { useAuthStore } from '@/store/useAuthStore'
import { logger } from '@/utils/logger'

const router = useRouter()
const authStore = useAuthStore()
const loginFormRef = ref(null)
const loading = ref(false)

const loginForm = reactive({
  username: '',
  password: '',
})

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
}

const handleLogin = async () => {
  if (loading.value) return
  if (!loginFormRef.value) return
  await loginFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        const res = await login({
          username: loginForm.username,
          password: loginForm.password,
        })

        if (res && res.token) {
          authStore.setToken(res.token)
          if (res.user) {
            authStore.setUser(res.user)
          }
          ElMessage.success('登录成功')
          const role = res.user?.role || ''
          if (role === 'admin') {
            await router.replace('/back/dashboard')
          } else {
            await router.replace('/client/chat')
          }
        } else {
          ElMessage.warning('登录成功但未获取到有效 Token，请联系管理员')
        }
      } catch (error) {
        logger.error('Login Error:', error)
        const msg = error?.response?.data?.message || error?.message || '登录失败，请检查用户名和密码'
        ElMessage.error(msg)
      } finally {
        loading.value = false
      }
    }
  })
}
</script>

<style lang="scss" scoped>
.login-view {
  .title {
    font-size: 28px;
    font-weight: 700;
    margin-bottom: 8px;
    color: var(--text-color);
    text-align: center;
    letter-spacing: 1px;
  }

  .subtitle {
    font-size: 14px;
    color: var(--text-secondary);
    margin-bottom: 32px;
    text-align: center;
  }

  .login-btn {
    width: 100%;
    margin-top: 12px;
    height: 48px;
    font-size: 16px;
    font-weight: 500;
    border-radius: 10px;
    letter-spacing: 0.5px;
  }

  .footer {
    margin-top: 24px;
    text-align: center;
    font-size: 14px;
    color: var(--text-secondary);
  }
}
</style>
