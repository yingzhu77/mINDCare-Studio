<template>
  <div class="register-view">
    <h2 class="title">创建您的账户</h2>
    <p class="subtitle">填写以下信息开始使用心理AI助手</p>

    <el-form :model="registerForm" :rules="rules" ref="registerFormRef" label-position="top">
      <el-form-item label="用户名" prop="username">
        <el-input v-model="registerForm.username" placeholder="请输入用户名" size="large" />
      </el-form-item>

      <el-form-item label="邮箱" prop="email">
        <el-input v-model="registerForm.email" placeholder="请输入常用邮箱" size="large" />
      </el-form-item>

      <el-form-item label="密码" prop="password">
        <el-input
          v-model="registerForm.password"
          type="password"
          placeholder="请输入密码"
          size="large"
          show-password
        />
      </el-form-item>

      <el-form-item label="确认密码" prop="confirmPassword">
        <el-input
          v-model="registerForm.confirmPassword"
          type="password"
          placeholder="请再次输入密码"
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
        注册账户
      </el-button>
    </el-form>

    <div class="footer">
      已有账户？<el-link type="primary" @click="$router.push('/auth/login')">立即登录</el-link>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { register } from '@/api/admin'
import { logger } from '@/utils/logger'

/**
 * 注册页面逻辑
 * 1. 表单验证，包括密码一致性检查。
 * 2. 注册成功后跳转到登录页面。
 */

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
    callback(new Error('请再次输入密码'))
  } else if (value !== registerForm.password) {
    callback(new Error('两次输入密码不一致!'))
  } else {
    callback()
  }
}

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: ['blur', 'change'] },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于 6 位', trigger: 'blur' },
  ],
  confirmPassword: [{ validator: validatePass2, trigger: 'blur' }],
}

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
        ElMessage.success('注册成功，请登录')
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
    color: #909399;
    margin-bottom: 32px;
    text-align: center;
  }

  .register-btn {
    width: 100%;
    margin-top: 12px;
    height: 48px;
    font-size: 16px;
    font-weight: 500;
  }

  .footer {
    margin-top: 24px;
    text-align: center;
    font-size: 14px;
    color: #606266;
  }
}
</style>
