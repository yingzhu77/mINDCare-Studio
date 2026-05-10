/**
 * 统一日志工具。当前层仅包装 console 方法以保留调用栈可见性，
 * 同时提供未来接入监控通道（Sentry 等）的单一注入点。
 */
export const logger = {
  info: (msg, ...args) => {
    console.info(`[AI-Vue] ${msg}`, ...args)
  },
  warn: (msg, ...args) => {
    console.warn(`[AI-Vue] ${msg}`, ...args)
  },
  error: (msg, ...args) => {
    console.error(`[AI-Vue] ${msg}`, ...args)
  },
}
