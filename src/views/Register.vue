<template>
  <div class="register-view">
    <h2 class="title">{{ $t('auth.register.title') }}</h2>
    <p class="subtitle">{{ $t('auth.register.subtitle') }}</p>

    <el-form :model="registerForm" :rules="rules" ref="registerFormRef" label-position="top">
      <el-form-item :label="$t('auth.register.usernameLabel')" prop="username">
        <el-input v-model="registerForm.username" :placeholder="$t('auth.register.usernamePlaceholder')" size="large" />
      </el-form-item>

      <el-form-item :label="$t('auth.register.emailLabel')" prop="email">
        <el-input v-model="registerForm.email" :placeholder="$t('auth.register.emailPlaceholder')" size="large" />
      </el-form-item>

      <el-form-item :label="$t('auth.register.passwordLabel')" prop="password">
        <el-input
          v-model="registerForm.password"
          type="password"
          :placeholder="$t('auth.register.passwordPlaceholder')"
          size="large"
          show-password
        />
      </el-form-item>

      <el-form-item :label="$t('auth.register.confirmLabel')" prop="confirmPassword">
        <el-input
          v-model="registerForm.confirmPassword"
          type="password"
          :placeholder="$t('auth.register.confirmPlaceholder')"
          size="large"
          show-password
        />
      </el-form-item>

      <el-button
        type="primary"
        size="large"
        class="register-btn"
        :loading="loading"
        @click="handleRegister"
      >
        {{ $t('auth.register.registerBtn') }}
      </el-button>
    </el-form>

    <div class="footer">
      {{ $t('auth.register.hasAccount') }}<el-link type="primary" @click="$router.push('/auth/login')">{{ $t('auth.register.goLogin') }}</el-link>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { register } from '@/api/admin'
import { logger } from '@/utils/logger'

const { t } = useI18n()
const router = useRouter()
const registerFormRef = ref(null)
const loading = ref(false)

const registerForm = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
})

const validatePass2 = (rule, value, callback) => {
  if (value === '') {
    callback(new Error(t('auth.register.confirmPlaceholder')))
  } else if (value !== registerForm.password) {
    callback(new Error(t('auth.register.passwordMismatch')))
  } else {
    callback()
  }
}

const rules = computed(() => ({
  username: [{ required: true, message: t('auth.register.usernamePlaceholder'), trigger: 'blur' }],
  email: [
    { required: true, message: t('auth.register.emailPlaceholder'), trigger: 'blur' },
    { type: 'email', message: t('auth.register.emailPlaceholder'), trigger: ['blur', 'change'] },
  ],
  password: [
    { required: true, message: t('auth.register.passwordPlaceholder'), trigger: 'blur' },
    { min: 6, message: t('auth.register.passwordMismatch'), trigger: 'blur' },
  ],
  confirmPassword: [{ validator: validatePass2, trigger: 'blur' }],
}))

const handleRegister = async () => {
  if (!registerFormRef.value) return
  await registerFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        await register({
          username: registerForm.username,
          email: registerForm.email,
          password: registerForm.password,
        })
        ElMessage.success(t('auth.register.success'))
        router.push('/auth/login')
      } catch (error) {
        logger.error(error)
      } finally {
        loading.value = false
      }
    }
  })
}
</script>

<style lang="scss" scoped>
.register-view {
  .title {
    font-size: 28px;
    font-weight: 700;
    margin-bottom: 8px;
    color: var(--text-color);
    text-align: center;
  }

  .subtitle {
    font-size: 14px;
    color: var(--text-secondary);
    margin-bottom: 32px;
    text-align: center;
  }

  .register-btn {
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
