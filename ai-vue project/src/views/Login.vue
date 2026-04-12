<template>
  <div class="login-view">
    <h2 class="title">登录您的账户</h2>
    <p class="subtitle">请输入您的登录信息</p>

    <el-form :model="loginForm" :rules="rules" ref="loginFormRef" label-position="top">
      <el-form-item label="用户名或邮箱" prop="username">
        <el-input v-model="loginForm.username" placeholder="请输入用户名或邮箱" size="large" />
      </el-form-item>

      <el-form-item label="密码" prop="password">
        <el-input
          v-model="loginForm.password"
          type="password"
          placeholder="请输入密码"
          size="large"
          show-password
          @keyup.enter="handleLogin"
        />
      </el-form-item>

      <el-button
        type="primary"
        size="large"
        class="login-btn"
        :loading="loading"
        @click="handleLogin"
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

/**
 * 登录页面逻辑
 * 1. 验证表单输入。
 * 2. 模拟登录成功，保存 Token 到本地存储。
 * 3. 登录成功后跳转到 /back/dashboard。
 */

const router = useRouter()
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
  if (!loginFormRef.value) return
  await loginFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        // 模拟 API 请求延迟
        await new Promise((resolve) => setTimeout(resolve, 800))
        // 模拟保存 Token
        localStorage.setItem('token', 'mock_token_12345')
        ElMessage.success('登录成功')
        // 跳转到控制台页面
        router.push('/back/dashboard')
      } catch (error) {
        console.error(error)
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
  }

  .subtitle {
    font-size: 14px;
    color: #909399;
    margin-bottom: 32px;
    text-align: center;
  }

  .login-btn {
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
