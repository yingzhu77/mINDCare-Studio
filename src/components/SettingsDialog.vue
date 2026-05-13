<template>
  <div v-if="isElectron" class="settings-trigger" @click="visible = true" title="设置">
    <el-icon :size="20"><Setting /></el-icon>
  </div>

  <el-dialog v-model="visible" title="设置" width="480px" :close-on-click-modal="false" :append-to-body="true">
    <el-form label-position="top">
      <!-- API Key 设置 -->
      <el-form-item label="DeepSeek API Key（可选）">
        <el-input
          v-model="apiKey"
          :type="showKey ? 'text' : 'password'"
          placeholder="填入你的 DeepSeek API Key"
          show-password
        >
          <template #append>
            <el-button @click="showKey = !showKey">
              {{ showKey ? '隐藏' : '显示' }}
            </el-button>
          </template>
        </el-input>
        <p class="form-hint">
          用于体验真实 AI 回复。Key 仅保存在你的电脑上，不会上传到任何地方。
          <a href="https://platform.deepseek.com/api_keys" target="_blank">获取地址 &rarr;</a>
        </p>
      </el-form-item>

      <el-form-item>
        <el-button type="primary" @click="saveApiKey" :loading="saving">
          保存 Key 并重启后端
        </el-button>
      </el-form-item>

      <el-divider />

      <!-- 重置演示数据 -->
      <el-form-item label="重置演示数据">
        <p class="form-hint">将数据库恢复到初始状态，所有修改将被清除。</p>
        <el-button type="danger" plain @click="confirmReset">
          重置演示数据
        </el-button>
      </el-form-item>
    </el-form>
  </el-dialog>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Setting } from '@element-plus/icons-vue'

const isElectron = ref(false)
const visible = ref(false)
const apiKey = ref('')
const showKey = ref(false)
const saving = ref(false)

onMounted(async () => {
  if (window.electronAPI?.isElectron) {
    isElectron.value = true
    const config = await window.electronAPI.getConfig()
    apiKey.value = config.deepseekApiKey || ''
  }
})

async function saveApiKey() {
  saving.value = true
  try {
    await window.electronAPI.saveConfig('deepseekApiKey', apiKey.value)
    ElMessage.success('API Key 已保存，后端正在重启...')
    visible.value = false
    // 等待后端重启完成后刷新页面
    setTimeout(() => location.reload(), 3000)
  } catch (e) {
    ElMessage.error('保存失败: ' + e.message)
  } finally {
    saving.value = false
  }
}

async function confirmReset() {
  try {
    await ElMessageBox.confirm(
      '重置将删除所有演示数据并恢复为初始状态，此操作不可撤销。确定继续？',
      '确认重置',
      { confirmButtonText: '确定重置', cancelButtonText: '取消', type: 'warning' }
    )
    const result = await window.electronAPI.resetDemoData()
    if (result.success) {
      ElMessage.success('演示数据已重置，即将刷新页面...')
      visible.value = false
      setTimeout(() => location.reload(), 3000)
    } else {
      ElMessage.error(result.message || '重置失败')
    }
  } catch { /* 用户取消 */ }
}
</script>

<style scoped>
.settings-trigger {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 9999;
  cursor: pointer;
  opacity: 0.85;
  transition: opacity 0.2s, transform 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: rgba(139, 92, 246, 0.9);
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  color: #fff;
}
.settings-trigger:hover {
  opacity: 1;
  transform: scale(1.1);
}
.form-hint {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
  line-height: 1.6;
}
.form-hint a { color: #8B5CF6; }
</style>