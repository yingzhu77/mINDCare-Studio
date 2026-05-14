<template>
  <el-card class="search-card" shadow="never">
    <el-form :inline="true" :model="form" class="search-form" @submit.prevent>
      <!-- 动态渲染表单项 -->
      <el-form-item v-for="item in config" :key="item.prop" :label="item.label">
        <!-- 输入框 -->
        <el-input
          v-if="item.comp === 'input'"
          v-model="form[item.prop]"
          :placeholder="item.placeholder || `请输入${item.label}`"
          clearable
        />
        <!-- 选择器 -->
        <el-select
          v-else-if="item.comp === 'select'"
          v-model="form[item.prop]"
          :placeholder="item.placeholder || `请选择${item.label}`"
          clearable
          filterable
        >
          <el-option
            v-for="opt in item.options"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </el-select>
      </el-form-item>

      <!-- 操作按钮 -->
      <el-form-item>
        <el-button type="primary" @click="$emit('search')">查询</el-button>
        <el-button @click="$emit('reset')">重置</el-button>
      </el-form-item>
    </el-form>
  </el-card>
</template>

<script setup>
/**
 * TableSearch 组件：通用表格搜索表单
 * @props {Object} form - 绑定的表单数据对象
 * @props {Array} config - 表单项配置数组，包含 type, label, prop, options 等
 * @emits search - 点击查询按钮时触发
 * @emits reset - 点击重置按钮时触发
 */
defineProps({
  form: {
    type: Object,
    required: true,
  },
  config: {
    type: Array,
    required: true,
  },
})

defineEmits(['search', 'reset'])
</script>

<style lang="scss" scoped>
.search-card {
  border: none;
  border-radius: 8px;
  background-color: var(--card-bg);
  margin-bottom: var(--layout-padding);
  overflow: visible;

  .search-form {
    display: flex;
    flex-wrap: wrap;

    :deep(.el-form-item) {
      margin-bottom: 18px;
      margin-right: 18px;
      min-width: 160px;

      &:last-child {
        margin-right: 0;
        min-width: auto;
      }

      .el-select,
      .el-input {
        width: 100%;
        min-width: 140px;
      }
    }
  }
}

@media screen and (max-width: 768px) {
  .search-form {
    display: flex;
    flex-direction: column;
    gap: 16px;

    :deep(.el-form-item) {
      margin-right: 0;
      width: 100%;

      .el-form-item__content {
        width: 100%;
      }

      .el-input,
      .el-select {
        width: 100%;
      }
    }
  }
}
</style>
