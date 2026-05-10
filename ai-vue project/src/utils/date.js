/**
 * 日期格式化工具函数
 * 将 ISO 时间字符串格式化为常用格式
 */

/**
 * 格式化日期
 * @param {string|Date} dateStr 日期字符串或 Date 对象
 * @param {string} type 格式类型
 *   - 'datetime' (默认): 2026-05-09 10:47:45
 *   - 'date': 2026-05-09
 *   - 'time': 10:47:45
 *   - 'slash': 2026/5/9 10:47:45
 * @returns {string} 格式化后的日期字符串
 */
export function formatDate(dateStr, type = 'datetime') {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return String(dateStr)

  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const hh = String(date.getHours()).padStart(2, '0')
  const mm = String(date.getMinutes()).padStart(2, '0')
  const ss = String(date.getSeconds()).padStart(2, '0')

  if (type === 'date') return `${y}-${m}-${d}`
  if (type === 'time') return `${hh}:${mm}:${ss}`
  if (type === 'slash') return `${y}/${Number(m)}/${Number(d)} ${hh}:${mm}:${ss}`
  return `${y}-${m}-${d} ${hh}:${mm}:${ss}`
}
