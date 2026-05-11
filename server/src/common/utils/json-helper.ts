/**
 * 将可能为 JSON 字符串的字段解析为数组。
 * emotionTags 在 DB 中存储为 JSON 字符串，各服务统一解析后返回前端。
 */
export function parseJsonArray(value: string | any[] | null | undefined): any[] {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
