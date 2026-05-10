import service from '@/utils/request'
import type {
  PageResult, PageParams,
  ChatSession, ChatMessage,
  EmotionDiary, CreateDiaryDto,
  NotificationItem, UnreadCountResult,
  ClientArticle,
} from './types'

// ==================== AI 聊天 ====================

export function chatSend(data: { content: string; sessionId?: string }): Promise<any> {
  return service.post('/chat/send', data)
}

// ==================== 会话管理（用户端） ====================

export function mySessionPage(params: PageParams): Promise<PageResult<ChatSession>> {
  return service.get('/chat/sessions/my', { params })
}

export function deleteSession(sessionId: string): Promise<void> {
  return service.delete(`/chat/session/${sessionId}`)
}

export function exportSession(sessionId: string): Promise<{
  session: { sessionId: string; startTime: string; endTime: string | null; messageCount: number }
  messages: Array<{ role: string; content: string; messageTime: string }>
  exportedAt: string
}> {
  return service.get(`/chat/session/${sessionId}/export`)
}

export function sessionMessages(sessionId: string): Promise<ChatMessage[]> {
  return service.get(`/psychological-chat/sessions/${sessionId}/messages`)
}

// ==================== 情绪日记（用户端） ====================

export function myDiaryPage(params: PageParams & { diaryDate?: string }): Promise<PageResult<EmotionDiary>> {
  return service.get('/emotion-diary/my/page', { params })
}

export function diaryAdd(data: CreateDiaryDto): Promise<void> {
  return service.post('/emotion-diary', data)
}

export function diaryUpdate(id: number, data: Partial<CreateDiaryDto>): Promise<void> {
  return service.put(`/emotion-diary/${id}`, data)
}

export function diaryDetail(id: number): Promise<EmotionDiary> {
  return service.get(`/emotion-diary/${id}`)
}

export function diaryDelete(id: number): Promise<void> {
  return service.delete(`/emotion-diary/${id}`)
}

// ==================== 文章投稿（用户端） ====================

export function myArticlePage(params: PageParams): Promise<PageResult<ClientArticle>> {
  return service.get('/client/article/page', { params })
}

export function myArticleDetail(id: number): Promise<ClientArticle> {
  return service.get(`/client/article/${id}`)
}

export function myArticleAdd(data: { title: string; content?: string; categoryId?: number; summary?: string }): Promise<void> {
  return service.post('/client/article', data)
}

export function myArticleUpdate(id: number, data: { title?: string; content?: string; categoryId?: number; summary?: string }): Promise<void> {
  return service.put(`/client/article/${id}`, data)
}

export function myArticleSubmit(id: number): Promise<void> {
  return service.put(`/client/article/${id}/submit`)
}

// ==================== 通知 ====================

export function notificationPage(params: PageParams): Promise<PageResult<NotificationItem>> {
  return service.get('/notification/page', { params })
}

export function unreadNotificationCount(): Promise<UnreadCountResult> {
  return service.get('/notification/unread-count')
}

export function notificationRead(id: number): Promise<void> {
  return service.put(`/notification/read/${id}`)
}

export function notificationReadAll(): Promise<void> {
  return service.put('/notification/read-all')
}
