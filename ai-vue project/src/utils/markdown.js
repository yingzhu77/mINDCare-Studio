import { marked } from 'marked'
import DOMPurify from 'dompurify'

// 配置 marked：禁用不安全的扩展
marked.setOptions({
  breaks: true,
  gfm: true,
})

/**
 * 将 markdown 文本渲染为安全的 HTML，用于 v-html 渲染。
 * 使用 marked 解析 + DOMPurify 过滤，防止 XSS。
 */
export function renderMarkdown(text) {
  if (!text) return ''
  const raw = marked.parse(text, { async: false })
  return DOMPurify.sanitize(raw)
}
