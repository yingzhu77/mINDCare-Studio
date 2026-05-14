<template>
  <div class="login-view">
    <h2 class="title">{{ $t('auth.login.title') }}</h2>
    <p class="subtitle">{{ $t('auth.login.subtitle') }}</p>

    <el-form
      :model="loginForm"
      :rules="rules"
      ref="loginFormRef"
      label-position="top"
      autocomplete="on"
      @submit.prevent="handleLogin"
    >
      <el-form-item :label="$t('auth.login.usernameLabel')" prop="username">
        <el-input
          v-model="loginForm.username"
          name="username"
          autocomplete="username"
          :placeholder="$t('auth.login.usernamePlaceholder')"
          size="large"
        />
      </el-form-item>

      <el-form-item :label="$t('auth.login.passwordLabel')" prop="password">
        <el-input
          v-model="loginForm.password"
          type="password"
          name="password"
          autocomplete="current-password"
          :placeholder="$t('auth.login.passwordPlaceholder')"
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
        {{ $t('auth.login.loginBtn') }}
      </el-button>
    </el-form>

    <div class="footer">
      {{ $t('auth.login.noAccount') }}<el-link type="primary" @click="$router.push('/auth/register')">{{ $t('auth.login.goRegister') }}</el-link>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { login } from '@/api/admin'
import { useAuthStore } from '@/store/useAuthStore'
import { logger } from '@/utils/logger'

const { t } = useI18n()
const router = useRouter()
const authStore = useAuthStore()
const loginFormRef = ref(null)
const loading = ref(false)

const loginForm = reactive({
  username: '',
  password: '',
})

const rules = computed(() => ({
  username: [{ required: true, message: t('auth.login.usernamePlaceholder'), trigger: 'blur' }],
  password: [{ required: true, message: t('auth.login.passwordPlaceholder'), trigger: 'blur' }],
}))

const handleLogin = async () => {
  if (loading.value) return
  if (!loginFormRef.value) return
  try {
    await loginFormRef.value.validate()
    loading.value = true
    const res = await login({
      username: loginForm.username,
      password: loginForm.password,
    })

    if (res && res.token) {
      authStore.setToken(res.token)
      if (res.user) {
        authStore.setUser(res.user)
      }
      ElMessage.success(t('auth.login.success'))
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
    // validate 失败时 error 为 false，API 报错时为 AxiosError
    if (error) {
      logger.error('Login Error:', error)
      const msg = error?.response?.data?.message || error?.message || t('auth.login.failed')
      ElMessage.error(msg)
    }
  } finally {
    loading.value = false
  }
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
