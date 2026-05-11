<template>
  <div class="editor-wrapper">
    <Toolbar
      style="border-bottom: 1px solid #ccc"
      :editor="editorRef"
      :defaultConfig="toolbarConfig"
      mode="default"
    />
    <Editor
      style="height: 320px; overflow-y: hidden;"
      :modelValue="modelValue"
      :defaultConfig="editorConfig"
      mode="default"
      @update:modelValue="emitValue"
      @onCreated="handleCreated"
    />
  </div>
</template>

<script setup>
/**
 * 富文本编辑器组件（异步加载）
 *
 * 封装 wangEditor v5，该组件被动态 import，Vite 自动将其拆分为独立 chunk，
 * 避免 wangEditor（~500kB）打包进主页面 bundle。
 */
import { shallowRef, onBeforeUnmount, defineAsyncComponent } from 'vue'
import '@wangeditor/editor/dist/css/style.css'

// wangEditor 组件和国际化均动态导入，减小 ArticleEditor 主 chunk 体积
const Editor = defineAsyncComponent(() =>
  import('@wangeditor/editor-for-vue').then((m) => m.Editor)
)
const Toolbar = defineAsyncComponent(() =>
  import('@wangeditor/editor-for-vue').then((m) => m.Toolbar)
)
import('@wangeditor/editor').then((m) => m.i18nChangeLanguage('zh-CN'))

const props = defineProps({
  modelValue: { type: String, default: '' }
})
const emit = defineEmits(['update:modelValue'])

const editorRef = shallowRef()

const toolbarConfig = {
  toolbarKeys: [
    'headerSelect', 'bold', 'italic', 'underline', 'through', '|',
    'color', 'bgColor', '|',
    'fontSize', 'fontFamily', '|',
    'lineHeight', '|',
    'bulletedList', 'numberedList', 'todo', '|',
    'justifyLeft', 'justifyCenter', 'justifyRight', '|',
    'insertLink', 'insertImage', 'insertTable', 'codeBlock', 'blockquote', '|',
    'undo', 'redo',
  ],
}

const editorConfig = {
  placeholder: '请输入文章内容，支持富文本格式',
  MENU_CONF: {
    uploadImage: {
      async customUpload(file, insertFn) {
        try {
          const { fileUpload } = await import('@/api/admin')
          const formData = new FormData()
          formData.append('file', file)
          const uploadResult = await fileUpload(formData)
          insertFn(uploadResult.url, '文章图片', uploadResult.url)
        } catch {
          // 静默失败
        }
      },
    },
  },
}

const handleCreated = (editor) => {
  editorRef.value = editor
}

const emitValue = (val) => {
  emit('update:modelValue', val)
}

onBeforeUnmount(() => {
  const editor = editorRef.value
  if (editor == null) return
  editor.destroy()
})
</script>
